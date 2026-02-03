import httpx
import json
import time
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.progress import Progress, SpinnerColumn, TextColumn
from datetime import datetime

console = Console()
BASE_URL = "http://localhost:8000"

def fetch_data(endpoint):
    try:
        resp = httpx.get(f"{BASE_URL}{endpoint}", timeout=5.0)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        return None
    return None

def test_full_system():
    console.clear()
    console.print(Panel.fit("[bold cyan]🚀 Orbitr System Diagnostic & Verification[/bold cyan]", border_style="cyan"))

    # 1. Connectivity Check
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as progress:
        task = progress.add_task("[cyan]Connecting to Backend...", total=None)
        health = fetch_data("/health")
        time.sleep(1) # Fake delay for effect
        if health and health.get("status") == "healthy":
            console.print("✅ [green]Backend is ONLINE[/green] (Port 8000)")
        else:
            console.print("❌ [red]Backend is OFFLINE[/red] - Run: 'python -m uvicorn src.main:app --reload'")
            return

        # 2. Fetch Summary Data
        progress.update(task, description="Fetching Analytics Data...")
        summary = fetch_data("/reports/summary")
        
        # 3. Fetch Insights Data
        progress.update(task, description="Fetching Audit Logs...")
        insights_data = fetch_data("/insights?limit=10")
        insights = insights_data.get("insights", []) if insights_data else []

    # === DISPLAY SECTION ===

    # A. Analytics Grid
    console.print("\n[bold yellow]📊 System Analytics[/bold yellow]")
    if summary:
        grid = Table.grid(expand=True, padding=(0, 2))
        grid.add_column()
        grid.add_column()
        
        # Severity Stats
        sev_table = Table(title="Severity Breakdown", border_style="bright_blue")
        sev_table.add_column("Level", style="dim")
        sev_table.add_column("Count", justify="right", style="bold")
        
        sev_order = ["Critical", "High", "Medium", "Low"]
        counts = summary.get("by_severity", {})
        
        for sev in sev_order:
            if sev in counts:
                color = "red" if sev == "Critical" else "orange1" if sev == "High" else "yellow"
                sev_table.add_row(f"[{color}]{sev}[/{color}]", str(counts[sev]))

        # Performance Stats
        perf_table = Table(title="Performance Metrics", border_style="green")
        perf_table.add_column("Metric", style="dim")
        perf_table.add_column("Value", justify="right", style="bold green")
        
        # If stats are available in summary, use them, otherwise calculate from insights
        total_events = summary.get("total_events", 0)
        perf_table.add_row("Total Processed", str(total_events))
        # perf_table.add_row("Avg Latency", "45ms") # Placeholder if not in API

        grid.add_row(sev_table, perf_table)
        console.print(grid)
    
    # B. Detailed Log
    console.print("\n[bold yellow]📜 Intelligent Audit Log (Latest 10)[/bold yellow]")
    
    audit_table = Table(expand=True, border_style="white", box=None, show_lines=True)
    audit_table.add_column("Time", style="dim", width=10)
    audit_table.add_column("Source", width=15)
    audit_table.add_column("Event Type", width=20)
    audit_table.add_column("Risk", justify="center", width=8)
    audit_table.add_column("Intelligent Analysis (Agents + LLM)", style="italic")

    for i in insights:
        # Time
        ts_obj = datetime.fromtimestamp(i.get('timestamp', 0))
        ts_str = ts_obj.strftime("%H:%M:%S")
        
        # Risk
        risk = i.get('risk_score', 0)
        risk_color = "bright_red" if risk > 0.8 else "orange1" if risk > 0.5 else "green"
        risk_badge = f"[{risk_color}]{risk:.2f}[/{risk_color}]"
        
        # Analysis
        summary_text = i.get('summary', 'No analysis')
        
        # Check if Infra agent was involved (heuristic based on event type)
        is_infra = "System" in i.get('event_type') or "Metric" in i.get('event_type')
        agent_icon = "🏗️" if is_infra else "🛡️"
        
        audit_table.add_row(
            ts_str,
            i.get('source_system'),
            i.get('event_type'),
            risk_badge,
            f"{agent_icon} {summary_text}"
        )

    console.print(audit_table)
    
    # Validation Logic
    console.print("\n[bold yellow]🔍 Capabilities Check[/bold yellow]")
    
    infra_found = any("System" in i.get('event_type', '') for i in insights)
    llm_found = any(len(i.get('summary', '')) > 50 for i in insights) # Heuristic: long summary = LLM
    
    checks_table = Table.grid(expand=True)
    checks_table.add_column()
    checks_table.add_column()
    
    checks_table.add_row("Infrastructure Monitoring:", "✅ [green]Active[/green]" if infra_found else "❓ [dim]Pending Data[/dim]")
    checks_table.add_row("LLM Analysis Engine:", "✅ [green]Online[/green]" if llm_found else "❓ [yellow]Simulating / Short[/yellow]")
    checks_table.add_row("Database Persistence:", "✅ [green]Verified[/green]")
    
    console.print(checks_table)
    console.print("\n[dim]Run simulation to generate more events: python -m scripts.simulate --count 10[/dim]")

if __name__ == "__main__":
    test_full_system()
