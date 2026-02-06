#!/usr/bin/env python3
"""
Orbiter CLI - Command Center for Multi-Agent Monitoring
Run: python cli.py
"""

import asyncio
import httpx
import sys
from datetime import datetime
from typing import Optional

try:
    from rich.console import Console
    from rich.live import Live
    from rich.table import Table
    from rich.panel import Panel
    from rich.text import Text
    from rich.layout import Layout
    from rich.prompt import Prompt
    from rich import box
except ImportError:
    print("Installing rich library...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "rich", "httpx"])
    from rich.console import Console
    from rich.live import Live
    from rich.table import Table
    from rich.panel import Panel
    from rich.text import Text
    from rich.layout import Layout
    from rich.prompt import Prompt
    from rich import box

# Configuration
API_BASE = "http://localhost:8000"
console = Console()

# State
logs = []
sim_running = False
last_poll = None


def severity_color(sev: str) -> str:
    """Map severity to color."""
    return {
        "Critical": "bold red",
        "High": "red",
        "Medium": "yellow",
        "Low": "green",
        "Normal": "cyan"
    }.get(sev, "white")


def format_log(log: dict) -> Text:
    """Format a single log entry with colors."""
    ts = log.get("timestamp", "")
    agent = log.get("source", "System")
    msg = log.get("message", "")
    sev = log.get("severity", "Low")
    
    text = Text()
    text.append(f"[{ts}] ", style="dim")
    text.append(f"[{agent}] ", style="bold cyan")
    text.append(msg, style=severity_color(sev))
    return text


def build_header() -> Panel:
    """Build the header panel."""
    global sim_running
    status = "[green]● OPERATIONAL[/]" if not sim_running else "[yellow]● SIMULATING[/]"
    header = Text()
    header.append("ORBITER COMMAND CENTER", style="bold white")
    header.append("  ")
    header.append(status)
    return Panel(header, box=box.DOUBLE, style="blue")


def build_logs_panel() -> Panel:
    """Build the logs display panel."""
    if not logs:
        content = Text("Waiting for events... Run 'demo' or 'simulate' to start.", style="dim")
    else:
        content = Text()
        for log in logs[-20:]:  # Show last 20
            content.append_text(format_log(log))
            content.append("\n")
    return Panel(content, title="[bold]Live Activity Feed[/]", box=box.ROUNDED, height=22)


def build_help_panel() -> Panel:
    """Build the help/commands panel."""
    help_text = """[bold cyan]Commands:[/]
  [green]demo[/]      - Run quick demo scenario
  [green]simulate[/]  - Start/stop simulation
  [green]clear[/]     - Clear all data
  [green]logs[/]      - Refresh logs
  [green]workflows[/] - List workflows
  [green]agents[/]    - Show agent status
  [green]status[/]    - System health
  [green]exit[/]      - Quit"""
    return Panel(help_text, title="[bold]Help[/]", box=box.ROUNDED)


async def fetch_logs():
    """Fetch recent insights/logs from API."""
    global logs, last_poll
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{API_BASE}/insights", params={"limit": 50})
            if resp.status_code == 200:
                data = resp.json()
                raw_logs = data.get("insights", [])
                logs = []
                for log in raw_logs:
                    # Extract agent name from source or default
                    source = log.get("source", "System")
                    # If source contains agent info, format it nicely
                    if "agent" in source.lower() or "_" in source:
                        agent_name = source.replace("_", " ").title()
                    else:
                        agent_name = source
                    
                    logs.append({
                        "id": log.get("correlation_id", log.get("id", "")),
                        "timestamp": datetime.fromtimestamp(log.get("timestamp", 0)).strftime("%H:%M:%S"),
                        "source": agent_name,
                        "message": log.get("summary", log.get("message", "")),
                        "severity": log.get("severity", "Low")
                    })
                last_poll = datetime.now()
    except httpx.TimeoutException:
        pass  # Silent timeout, will retry
    except Exception:
        pass  # Silent error, will retry


async def fetch_workflows():
    """Fetch and display workflows."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{API_BASE}/workflows")
            if resp.status_code == 200:
                data = resp.json()
                workflows = data.get("workflows", [])
                
                table = Table(title="Active Workflows", box=box.ROUNDED)
                table.add_column("ID", style="cyan", max_width=20)
                table.add_column("Type", style="green")
                table.add_column("Status", style="yellow")
                table.add_column("Step")
                
                for wf in workflows[:10]:
                    table.add_row(
                        wf.get("workflow_id", "")[:18] + "...",
                        wf.get("workflow_type", ""),
                        wf.get("status", ""),
                        wf.get("current_step", "")
                    )
                console.print(table)
    except Exception as e:
        console.print(f"[red]Error: {e}[/]")


async def fetch_agents():
    """Fetch and display agent status."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{API_BASE}/agents/status")
            if resp.status_code == 200:
                data = resp.json()
                agents = data.get("agents", [])
                
                table = Table(title="Agent Status", box=box.ROUNDED)
                table.add_column("Agent", style="cyan")
                table.add_column("Status")
                table.add_column("Last Active", style="dim")
                
                for agent in agents:
                    status_style = "green" if agent.get("status") == "active" else "dim"
                    table.add_row(
                        agent.get("name", ""),
                        f"[{status_style}]{agent.get('status', '')}[/]",
                        agent.get("lastActive", "")
                    )
                console.print(table)
    except Exception as e:
        console.print(f"[red]Error: {e}[/]")


async def fetch_status():
    """Fetch system health."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{API_BASE}/health")
            if resp.status_code == 200:
                data = resp.json()
                status = data.get("status", "unknown")
                style = "green" if status == "healthy" else "red"
                console.print(Panel(f"[{style} bold]{status.upper()}[/]", title="System Status"))
    except Exception as e:
        console.print(f"[red]Error: {e}[/]")


async def run_demo():
    """Trigger the demo scenario."""
    console.print("[yellow]Running demo scenario...[/]")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(f"{API_BASE}/simulation/quick-demo")
            await client.post(f"{API_BASE}/simulation/scenario/rogue_hotfix")
        console.print("[green]Demo complete! Refreshing logs...[/]")
        await fetch_logs()
    except Exception as e:
        console.print(f"[red]Demo failed: {e}[/]")


async def toggle_simulation():
    """Start or stop simulation."""
    global sim_running
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if sim_running:
                await client.post(f"{API_BASE}/simulation/stop")
                sim_running = False
                console.print("[yellow]Simulation stopped.[/]")
            else:
                await client.post(f"{API_BASE}/simulation/start")
                sim_running = True
                console.print("[green]Simulation started![/]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/]")


async def clear_data():
    """Clear all simulated data."""
    console.print("[yellow]Clearing data...[/]")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(f"{API_BASE}/simulation/reset")
        console.print("[green]Data cleared.[/]")
        logs.clear()
    except Exception as e:
        console.print(f"[red]Error: {e}[/]")


async def poll_loop():
    """Background polling for logs - prints new insights in real-time."""
    global logs
    seen_ids = set()
    
    # Initialize seen_ids with current logs
    for log in logs:
        seen_ids.add(log.get("id", ""))
    
    while True:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{API_BASE}/insights", params={"limit": 20})
                if resp.status_code == 200:
                    data = resp.json()
                    raw_logs = data.get("insights", [])
                    
                    for log in reversed(raw_logs):  # Process oldest first
                        log_id = log.get("id", log.get("correlation_id", ""))
                        if log_id and log_id not in seen_ids:
                            seen_ids.add(log_id)
                            
                            # Format and print immediately
                            source = log.get("source", "System")
                            if "_" in source:
                                agent_name = source.replace("_", " ").title()
                            else:
                                agent_name = source
                            
                            ts = datetime.fromtimestamp(log.get("timestamp", 0)).strftime("%H:%M:%S")
                            sev = log.get("severity", "Low")
                            summary = log.get("summary", "")[:100]
                            
                            # Print with rich formatting
                            color = severity_color(sev)
                            console.print(f"\n[dim][{ts}][/] [bold cyan][{agent_name}][/] [{color}]{sev}[/]: {summary}")
                            
                            # Update logs list
                            logs.append({
                                "id": log_id,
                                "timestamp": ts,
                                "source": agent_name,
                                "message": summary,
                                "severity": sev
                            })
        except:
            pass
        
        await asyncio.sleep(2)  # Poll every 2 seconds


async def main():
    """Main CLI loop."""
    global sim_running
    
    console.clear()
    console.print(build_header())
    console.print("[dim]Type 'help' for commands. Logs refresh every 3 seconds.[/]\n")
    
    # Check initial simulation status
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{API_BASE}/simulation/status")
            if resp.status_code == 200:
                sim_running = resp.json().get("running", False)
    except:
        pass
    
    # Start background polling
    poll_task = asyncio.create_task(poll_loop())
    
    try:
        while True:
            # Show current logs
            console.print(build_logs_panel())
            
            # Get command
            try:
                cmd = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: Prompt.ask("[bold green]>[/]")
                )
            except EOFError:
                break
            
            cmd = cmd.strip().lower()
            
            if cmd == "exit" or cmd == "quit":
                break
            elif cmd == "help":
                console.print(build_help_panel())
            elif cmd == "demo":
                await run_demo()
            elif cmd == "simulate":
                await toggle_simulation()
            elif cmd == "clear":
                await clear_data()
            elif cmd == "logs":
                await fetch_logs()
                console.print("[green]Logs refreshed.[/]")
            elif cmd == "workflows":
                await fetch_workflows()
            elif cmd == "agents":
                await fetch_agents()
            elif cmd == "status":
                await fetch_status()
            elif cmd:
                console.print(f"[red]Unknown command: {cmd}[/]")
            
            console.clear()
            console.print(build_header())
            
    finally:
        poll_task.cancel()
        console.print("[dim]Goodbye![/]")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[dim]Interrupted. Goodbye![/]")
