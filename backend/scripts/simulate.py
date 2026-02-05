"""
Orbitr SDLC Event Simulator

Simulates realistic CI/CD pipeline events from:
- GitHub (PRs, commits, secrets)
- Vercel (deployments, builds)
- Jira (tickets, workflows)
- CI/CD (pipelines, tests)
"""
import asyncio
import httpx
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.simulation.entities import WorldState
from src.simulation.generator import ScenarioGenerator
import argparse
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from datetime import datetime

console = Console()
BASE_URL = "http://localhost:8000"


async def send_event(client: httpx.AsyncClient, event: dict) -> dict:
    """Send event to API and return response."""
    try:
        response = await client.post(f"{BASE_URL}/events", json=event)
        return response.json()
    except httpx.ReadTimeout:
        return {"error": "Timeout - LLM call exceeded limit", "analysis": {}}
    except Exception as e:
        return {"error": str(e), "analysis": {}}


def display_result(event: dict, result: dict, event_num: int):
    """Display event analysis results."""
    if result.get("error"):
        console.print(f"[red]ERROR: {result['error']}[/red]")
        return
    
    analysis = result.get("analysis", {})
    observability = result.get("observability", {})
    
    # Severity styling
    sev_colors = {"Critical": "red", "High": "yellow", "Medium": "blue", "Low": "green"}
    severity = analysis.get("highest_severity", "Low")
    color = sev_colors.get(severity, "white")
    
    # Header
    console.print(f"\n[bold {color}]{'─'*80}[/bold {color}]")
    console.print(f"[bold]Event #{event_num}:[/bold] {event['event_type']} [dim]from {event['source_system']}[/dim]")
    
    # Metrics row
    risk = analysis.get('risk_score', 0)
    proc_time = result.get('processing_time_ms', 0)
    llm_used = "LLM" if observability.get("llm_used") else "Rules"
    
    console.print(f"  Severity: [{color}]{severity}[/{color}]  |  Risk: {risk:.2f}  |  Time: {proc_time:.0f}ms  |  Mode: {llm_used}")
    
    # Agents
    agents = result.get("agents_invoked", [])
    if agents:
        console.print(f"  [dim]Agents: {' → '.join(agents)}[/dim]")
    
    # Findings
    findings = analysis.get("findings", [])
    if findings:
        console.print(f"\n  [bold]Findings:[/bold]")
        for f in findings[:3]:
            f_color = sev_colors.get(f.get("severity", "Low"), "white")
            console.print(f"    [{f_color}]• {f.get('title', 'Finding')}[/{f_color}]")
    
    # Summary
    summary = analysis.get("summary", "")
    if summary:
        # Truncate long summaries
        if len(summary) > 200:
            summary = summary[:197] + "..."
        console.print(f"\n  [bold]Analysis:[/bold] {summary}")
    
    # Actions
    actions = analysis.get("recommended_actions", [])
    if actions:
        console.print(f"\n  [bold]Recommended Actions:[/bold]")
        for a in actions[:3]:
            console.print(f"    → {a}")


async def main(continuous: bool, rate: float, count: int):
    """Run the simulation."""
    console.print(Panel.fit("[bold]Orbitr v3.0 - SDLC Monitoring Simulation[/bold]", style="cyan"))
    
    world = WorldState(num_users=30, num_services=15)
    generator = ScenarioGenerator(world)
    
    console.print(f"World initialized: {len(world.users)} users, {len(world.services)} services")
    console.print(f"Mode: {'Continuous' if continuous else f'{count} events'}, Rate: {rate}/sec")
    console.print(f"Started: {datetime.now().strftime('%H:%M:%S')}\n")

    async with httpx.AsyncClient(timeout=60.0) as client:
        events_sent = 0
        while True:
            event = generator.generate_random_event()
            events_sent += 1
            
            result = await send_event(client, event)
            display_result(event, result, events_sent)

            if not continuous and events_sent >= count:
                break
            
            await asyncio.sleep(1.0 / rate)
    
    console.print(f"\n[green]Simulation complete. {events_sent} events processed.[/green]")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Orbitr SDLC Event Simulator")
    parser.add_argument("--continuous", action="store_true", help="Run indefinitely")
    parser.add_argument("--rate", type=float, default=0.5, help="Events per second")
    parser.add_argument("--count", type=int, default=5, help="Number of events (if not continuous)")
    args = parser.parse_args()
    
    try:
        asyncio.run(main(args.continuous, args.rate, args.count))
    except KeyboardInterrupt:
        console.print("\n[yellow]Simulation stopped.[/yellow]")
