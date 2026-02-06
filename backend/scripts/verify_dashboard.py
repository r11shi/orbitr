import httpx
import json
import time
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.progress import Progress, SpinnerColumn, TextColumn
from datetime import datetime
import os

console = Console()
BASE_URL = "http://localhost:8000"

def fetch_data(endpoint):
    try:
        resp = httpx.get(f"{BASE_URL}{endpoint}", timeout=5.0)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        return None
    return None

def test_full_system():
    console.clear()
    console.print(Panel.fit("[bold cyan]🚀 Orbitr v3.0 System Diagnostic & Verification[/bold cyan]", border_style="cyan"))

    # 1. Connectivity Check
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as progress:
        task = progress.add_task("[cyan]Connecting to Backend...", total=None)
        
        # Check Health
        health = fetch_data("/health")
        time.sleep(0.5)
        
        # Check Context Providers
        providers = fetch_data("/system/context-providers")
        
        # Fetch Summary
        progress.update(task, description="Fetching Analytics...")
        summary = fetch_data("/reports/summary?hours=24")
        
        # Fetch Latest Insights
        progress.update(task, description="Fetching Audit Logs...")
        insights_data = fetch_data("/insights?limit=10")
        insights = insights_data.get("insights", []) if insights_data else []
        
        time.sleep(0.5)

    if not health or health.get("status") != "healthy":
        console.print("❌ [red]Backend is OFFLINE[/red] - Run: 'python -m uvicorn src.main:app --reload'")
        return

    console.print(f"✅ [green]Backend ONLINE[/green] (v{health.get('version', 'Unknown')})")

    # === DISPLAY SECTION ===

    # A. System Configuration Check
    console.print("\n[bold yellow]🔧 Configuration Status[/bold yellow]")
    if providers:
        config_grid = Table.grid(expand=True, padding=(0, 2))
        config_grid.add_column("Feature", style="bold white")
        config_grid.add_column("Status")
        
        # UltraContext
        uc = providers.get("ultracontext", {})
        uc_status = "✅ [green]Active[/green]" if uc.get("enabled") else "⚠️ [yellow]Fallback Mode[/yellow]"
        config_grid.add_row("Context Injection", uc_status)
        
        # GLM API
        glm = providers.get("glm_api", {})
        glm_status = "✅ [green]Ready[/green]" if glm.get("enabled") else "❌ [red]Key Missing[/red]"
        config_grid.add_row("AI Engine (GLM-4.7)", glm_status)
        
        # Observability
        ls = providers.get("langsmith", {})
        ls_status = f"✅ [green]Active ({ls.get('project')})[/green]" if ls.get("enabled") else "📋 [blue]Local Only[/blue]"
        config_grid.add_row("Observability", ls_status)
        
        console.print(config_grid)

    # B. Analytics Grid
    console.print("\n[bold yellow]📊 Analytics (Last 24h)[/bold yellow]")
    if summary:
        grid = Table.grid(expand=True, padding=(0, 2))
        grid.add_column()
        grid.add_column()
        
        # Severity Stats
        sev_table = Table(title="Severity Breakdown", border_style="bright_blue")
        sev_table.add_column("Level")
        sev_table.add_column("Count", justify="right")
        
        sev_order = ["Critical", "High", "Medium", "Low"]
        counts = summary.get("by_severity", {})
        
        for sev in sev_order:
            if sev in counts:
                color = "red" if sev == "Critical" else "orange1" if sev == "High" else "yellow"
                sev_table.add_row(f"[{color}]{sev}[/{color}]", str(counts[sev]))

        # Performance Stats
        perf_table = Table(title="Performance Metrics", border_style="green")
        perf_table.add_column("Metric")
        perf_table.add_column("Value", justify="right")
        
        perf_table.add_row("Total Processed", str(summary.get("total_events", 0)))
        perf_table.add_row("Avg Process Time", f"{summary.get('avg_processing_time_ms', 0):.1f}ms")
        perf_table.add_row("Avg Risk Score", f"{summary.get('avg_risk_score', 0.0):.2f}")
        perf_table.add_row("LLM Usage", f"{summary.get('llm_usage_rate', 0):.1f}%")

        grid.add_row(sev_table, perf_table)
        console.print(grid)
    
    # C. Intelligent Audit Log
    console.print("\n[bold yellow]📜 Intelligent Audit Log (Latest 10)[/bold yellow]")
    
    audit_table = Table(expand=True, border_style="white", box=None, show_lines=True)
    audit_table.add_column("Time", style="dim", width=8)
    audit_table.add_column("Type", width=18)
    audit_table.add_column("Risk", justify="center", width=6)
    audit_table.add_column("Context", justify="center", width=8)
    audit_table.add_column("Guard", justify="center", width=6)
    audit_table.add_column("AI Analysis", style="italic")

    for i in insights:
        # Time
        ts_obj = datetime.fromtimestamp(i.get('timestamp', 0))
        ts_str = ts_obj.strftime("%H:%M:%S")
        
        # Risk Badge
        risk = i.get('risk_score', 0)
        risk_color = "red" if risk > 0.8 else "yellow" if risk > 0.5 else "green"
        risk_badge = f"[{risk_color}]{risk:.2f}[/{risk_color}]"
        
        # Context Score
        ctx_score = i.get('context_score', 0)
        ctx_icon = "🟢" if ctx_score > 80 else "🟡" if ctx_score > 50 else "⚪"
        
        # Guardrails
        guard = i.get('guardrails_passed', True)
        guard_icon = "✅" if guard else "⚠️"
        
        # Summary
        insight_summary = i.get('summary') or "No analysis available"
        if len(insight_summary) > 60:
            insight_summary = insight_summary[:57] + "..."
            
        # Agent Icon
        is_llm = i.get('llm_used', False)
        agent_icon = "🤖" if is_llm else "⚙️"
        
        audit_table.add_row(
            ts_str,
            f"[bold]{i.get('event_type')}[/bold]",
            risk_badge,
            f"{ctx_icon} {ctx_score}",
            guard_icon,
            f"{agent_icon} {insight_summary}"
        )

    console.print(audit_table)
    
    # Legend
    console.print("[dim]Legend: 🟢 High Context  ✅ Guardrails Passed  🤖 LLM Used  ⚙️ RegEx/Rules Only[/dim]\n")
    console.print("[dim]Testing: Run 'python -m scripts.simulate --count 5' to generate events[/dim]")

if __name__ == "__main__":
    test_full_system()
