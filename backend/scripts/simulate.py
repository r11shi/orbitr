import asyncio
import httpx
from src.simulation.entities import WorldState
from src.simulation.generator import ScenarioGenerator
import argparse
from rich.console import Console
from rich.table import Table
from rich.live import Live
from rich.panel import Panel
import json

console = Console()
BASE_URL = "http://localhost:8000"

async def send_event(client: httpx.AsyncClient, event: dict) -> dict:
    """Send event and return response."""
    response = await client.post(f"{BASE_URL}/events", json=event)
    return response.json()

def display_result(event: dict, result: dict):
    """Pretty print the analysis result."""
    analysis = result.get("analysis", {})
    
    # Severity colors
    sev_colors = {"Critical": "red", "High": "yellow", "Medium": "blue", "Low": "green"}
    severity = analysis.get("highest_severity", "Low")
    color = sev_colors.get(severity, "white")
    
    console.print(f"\n[bold {color}]{'='*60}[/bold {color}]")
    console.print(f"[bold]Event:[/bold] {event['event_type']} from {event['source_system']}")
    console.print(f"[bold]Severity:[/bold] [{color}]{severity}[/{color}]")
    console.print(f"[bold]Risk Score:[/bold] {analysis.get('risk_score', 0):.2f}")
    console.print(f"[bold]Processing:[/bold] {result.get('processing_time_ms', 0):.1f}ms")
    
    # Agents invoked
    agents = result.get("agents_invoked", [])
    console.print(f"[bold]Agents:[/bold] {', '.join(agents)}")
    
    # Findings
    findings = analysis.get("findings", [])
    if findings:
        console.print(f"\n[bold]Findings ({len(findings)}):[/bold]")
        for f in findings[:3]:  # Show top 3
            f_color = sev_colors.get(f.get("severity", "Low"), "white")
            console.print(f"  [{f_color}]• {f.get('title')}[/{f_color}] (conf: {f.get('confidence', 0):.0%})")
    
    # Summary
    if analysis.get("summary"):
        console.print(f"\n[bold]Summary:[/bold] {analysis['summary'][:200]}...")
    
    # Actions
    actions = analysis.get("recommended_actions", [])
    if actions:
        console.print(f"\n[bold]Recommended Actions:[/bold]")
        for a in actions[:3]:
            console.print(f"  → {a}")

async def main(continuous: bool, rate: float, count: int):
    console.print(Panel.fit("🌍 [bold]Orbitr Enterprise Simulation[/bold]", style="blue"))
    
    world = WorldState(num_users=30, num_services=15)
    generator = ScenarioGenerator(world)
    
    console.print(f"✅ World: {len(world.users)} users, {len(world.services)} services")
    console.print(f"🚀 Mode: {'Continuous' if continuous else f'{count} events'}, Rate: {rate}/sec\n")

    async with httpx.AsyncClient(timeout=30.0) as client:
        events_sent = 0
        while True:
            event = generator.generate_random_event()
            
            try:
                result = await send_event(client, event)
                display_result(event, result)
                events_sent += 1
            except Exception as e:
                console.print(f"[red]Error:[/red] {e}")

            if not continuous and events_sent >= count:
                break
            
            await asyncio.sleep(1.0 / rate)
    
    console.print(f"\n[green]✓ Simulation complete. {events_sent} events processed.[/green]")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Orbitr Event Simulator")
    parser.add_argument("--continuous", action="store_true", help="Run indefinitely")
    parser.add_argument("--rate", type=float, default=0.5, help="Events per second")
    parser.add_argument("--count", type=int, default=5, help="Number of events (if not continuous)")
    args = parser.parse_args()
    
    try:
        asyncio.run(main(args.continuous, args.rate, args.count))
    except KeyboardInterrupt:
        console.print("\n[yellow]Simulation stopped.[/yellow]")
