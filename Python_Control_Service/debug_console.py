"""
Debug Console - Real-time terminal dashboard for the Python Control Service.

Displays Arduino connection, room states, commands, latency, and reconnection info.
Uses the `rich` library for a beautiful live-updating terminal UI.

Usage:
    python app.py --console              Start Flask + Debug Console
    python app.py --console-only         Debug Console only (no Flask)
"""
from __future__ import annotations

import threading
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Optional

from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align


@dataclass
class ConsoleEvent:
    """A single event captured for display in the console."""
    timestamp: float
    category: str
    message: str
    color: str = "white"


@dataclass
class DebugState:
    """Mutable state shared between the service and the debug console."""

    # Connection
    connected: bool = False
    port: str = "COM3"
    baud_rate: int = 9600
    connected_at: Optional[float] = None
    last_error: Optional[str] = None

    # Rooms
    room_states: dict[int, str] = field(default_factory=lambda: {1: "UNKNOWN", 2: "UNKNOWN", 3: "UNKNOWN", 4: "UNKNOWN"})
    room_brightness: dict[int, int] = field(default_factory=lambda: {1: 0, 2: 0, 3: 0, 4: 0})

    # Last command from website
    last_web_command: str = "None"
    last_web_command_time: Optional[float] = None

    # Last command sent to Arduino
    last_arduino_cmd: str = "None"
    last_arduino_response: str = "None"
    last_arduino_time: Optional[float] = None

    # Latency
    last_latency_ms: float = 0.0
    avg_latency_ms: float = 0.0
    _latency_samples: list = field(default_factory=list)

    # Status monitor
    last_status_poll: Optional[float] = None
    status_poll_failures: int = 0
    monitor_running: bool = False

    # Reconnect
    reconnect_attempts: int = 0
    last_reconnect: Optional[float] = None

    # Events log
    events: deque = field(default_factory=lambda: deque(maxlen=30))

    # Uptime
    start_time: float = field(default_factory=time.time)

    def add_event(self, category: str, message: str, color: str = "white") -> None:
        self.events.append(ConsoleEvent(time.time(), category, message, color))

    def record_latency(self, ms: float) -> None:
        self.last_latency_ms = ms
        self._latency_samples.append(ms)
        if len(self._latency_samples) > 50:
            self._latency_samples = self._latency_samples[-50:]
        self.avg_latency_ms = sum(self._latency_samples) / len(self._latency_samples)


# Global debug state — imported by other modules
debug_state = DebugState()


def _ts(t: Optional[float]) -> str:
    """Format a timestamp to HH:MM:SS."""
    if t is None:
        return "--:--:--"
    return time.strftime("%H:%M:%S", time.localtime(t))


def _uptime_str(start: float) -> str:
    """Format uptime as a human-readable string."""
    elapsed = time.time() - start
    h = int(elapsed // 3600)
    m = int((elapsed % 3600) // 60)
    s = int(elapsed % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _state_color(state: str) -> str:
    """Map room state to color name."""
    return {"ON": "green", "DIM": "yellow", "OFF": "red"}.get(state, "dim")


def _make_header(layout: Layout) -> None:
    """Render the top header."""
    uptime = _uptime_str(debug_state.start_time)
    txt = Text()
    txt.append("  MADAR ", style="bold white on blue")
    txt.append("  Debug Console  ", style="bold cyan")
    txt.append(f"  Uptime: {uptime}  ", style="dim white")
    txt.append(f"  {_ts(None).replace('--:--:--', time.strftime('%H:%M:%S'))}  ", style="dim")
    layout["header"].update(Panel(Align.center(txt), style="blue", height=3))


def _make_connection_panel() -> Panel:
    """Render connection status panel."""
    ds = debug_state
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("Key", style="dim", width=20)
    table.add_column("Value")

    status_text = Text("CONNECTED" if ds.connected else "DISCONNECTED")
    status_text.style = "bold green" if ds.connected else "bold red"

    table.add_row("Status", status_text)
    table.add_row("COM Port", Text(ds.port, style="cyan"))
    table.add_row("Baud Rate", Text(str(ds.baud_rate), style="cyan"))
    table.add_row("Connected At", Text(_ts(ds.connected_at), style="white"))

    if ds.last_error:
        table.add_row("Last Error", Text(ds.last_error[:50], style="red"))

    if ds.reconnect_attempts > 0:
        table.add_row("Reconnects", Text(str(ds.reconnect_attempts), style="yellow"))
        table.add_row("Last Reconnect", Text(_ts(ds.last_reconnect), style="yellow"))

    return Panel(table, title="[bold blue]Arduino Connection[/bold blue]", border_style="blue")


def _make_rooms_panel() -> Panel:
    """Render room states panel."""
    ds = debug_state
    table = Table(show_header=True, header_style="bold cyan", box=None, padding=(0, 1))
    table.add_column("Room", width=12)
    table.add_column("State", width=8, justify="center")
    table.add_column("LED", width=8, justify="center")
    table.add_column("Brightness", width=12, justify="center")

    room_names = {1: "Living Room", 2: "Bedroom", 3: "Kitchen", 4: "Bathroom"}
    room_icons = {"ON": "[green]LED ON[/green]", "DIM": "[yellow]LED DIM[/yellow]", "OFF": "[red]LED OFF[/red]", "UNKNOWN": "[dim]---[/dim]"}

    for room_id in [1, 2, 3, 4]:
        state = ds.room_states.get(room_id, "UNKNOWN")
        brightness = ds.room_brightness.get(room_id, 0)
        sc = _state_color(state)
        icon = room_icons.get(state, "[dim]---[/dim]")

        bar_len = 10
        filled = int(brightness / 100 * bar_len) if state != "UNKNOWN" else 0
        bar = f"{'█' * filled}{'░' * (bar_len - filled)}"

        table.add_row(
            Text(room_names.get(room_id, f"Room {room_id}"), style="white"),
            Text(state, style=f"bold {sc}"),
            Text(icon),
            Text(f"{bar} {brightness}%", style=sc),
        )

    return Panel(table, title="[bold green]Room States[/bold green]", border_style="green")


def _make_last_command_panel() -> Panel:
    """Render last command info panel."""
    ds = debug_state
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("Key", style="dim", width=22)
    table.add_column("Value")

    table.add_row("From Website", Text(ds.last_web_command, style="cyan"))
    table.add_row("  Time", Text(_ts(ds.last_web_command_time), style="dim"))

    table.add_row("To Arduino", Text(ds.last_arduino_cmd, style="yellow"))
    table.add_row("  Response", Text(ds.last_arduino_response, style="green" if "OK" in ds.last_arduino_response else "red"))
    table.add_row("  Time", Text(_ts(ds.last_arduino_time), style="dim"))

    lat_color = "green" if ds.last_latency_ms < 50 else "yellow" if ds.last_latency_ms < 200 else "red"
    table.add_row("Latency", Text(f"{ds.last_latency_ms:.0f}ms (avg: {ds.avg_latency_ms:.0f}ms)", style=lat_color))

    return Panel(table, title="[bold yellow]Last Command[/bold yellow]", border_style="yellow")


def _make_monitor_panel() -> Panel:
    """Render status monitor panel."""
    ds = debug_state
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("Key", style="dim", width=22)
    table.add_column("Value")

    mon_status = Text("RUNNING" if ds.monitor_running else "STOPPED")
    mon_status.style = "bold green" if ds.monitor_running else "bold red"
    table.add_row("Monitor", mon_status)
    table.add_row("Last Poll", Text(_ts(ds.last_status_poll), style="white"))

    fail_color = "green" if ds.status_poll_failures == 0 else "red"
    table.add_row("Poll Failures", Text(str(ds.status_poll_failures), style=f"bold {fail_color}"))
    table.add_row("Poll Interval", Text("1.0s", style="dim"))

    return Panel(table, title="[bold magenta]Status Monitor[/bold magenta]", border_style="magenta")


def _make_events_panel() -> Panel:
    """Render recent events log."""
    ds = debug_state
    lines = []
    for event in reversed(list(ds.events)):
        ts = time.strftime("%H:%M:%S", time.localtime(event.timestamp))
        lines.append(f"[dim]{ts}[/dim] [{event.color}]{event.category}[/]: {event.message}")

    if not lines:
        content = Text("Waiting for events...", style="dim")
    else:
        content = Text.from_markup("\n".join(lines[-18:]))

    return Panel(content, title="[bold white]Event Log[/bold white]", border_style="white")


def _make_layout() -> Layout:
    """Build the full console layout."""
    layout = Layout()

    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="body"),
    )

    layout["body"].split_column(
        Layout(name="top_row", size=9),
        Layout(name="middle_row", size=9),
        Layout(name="bottom_row"),
    )

    layout["top_row"].split_row(
        Layout(name="connection", ratio=2),
        Layout(name="rooms", ratio=3),
    )

    layout["middle_row"].split_row(
        Layout(name="last_command", ratio=1),
        Layout(name="monitor", ratio=1),
    )

    layout["bottom_row"].update(Layout(name="events"))

    return layout


def _render_loop(layout: Layout, stop_event: threading.Event) -> None:
    """Main render loop — refreshes the display."""
    console = Console()

    with Live(layout, console=console, refresh_per_second=4, screen=True) as live:
        while not stop_event.is_set():
            try:
                _make_header(layout)
                layout["connection"].update(_make_connection_panel())
                layout["rooms"].update(_make_rooms_panel())
                layout["last_command"].update(_make_last_command_panel())
                layout["monitor"].update(_make_monitor_panel())
                layout["events"].update(_make_events_panel())
                live.refresh()
            except Exception:
                pass
            stop_event.wait(timeout=0.25)


def start_debug_console() -> threading.Event:
    """
    Start the debug console in a background thread.

    Returns:
        A threading.Event that can be set() to stop the console.
    """
    stop_event = threading.Event()
    layout = _make_layout()

    thread = threading.Thread(
        target=_render_loop,
        args=(layout, stop_event),
        name="DebugConsole",
        daemon=True,
    )
    thread.start()
    return stop_event
