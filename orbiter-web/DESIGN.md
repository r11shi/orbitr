# Orbitr Frontend Design System: "Digital Overseer"

## 1. Design Philosophy: "The Transparent Machine"
**Aesthetic:** Vercel-meets-Cyberpunk. 
The interface is not just a dashboard; it is a **HUD (Heads-Up Display)** for the system's brain.
It combines the whitespace and clean lines of *Vercel's* design system with the high-density information architecture of a *StrikeOps* mission control.

### Core Visual Pillars:
1.  **Metric-First Hierarchy:** The most important pixels are the numbers. Everything else is scaffolding.
2.  **The Grid is God:** The layout is strictly defined by visible, subtle 1px borders (`zinc-800`). No floating cards. Everything snaps to the grid.
3.  **Monospace Dominance:** We use Monospace fonts not just for code, but for *values, IDs, and states*. This enforces the "Machine" aesthetic.
4.  **"Alive" Indicators:** The UI breathes. Status lights pulse. Scan lines drift. It must feel like a live connection to the backend.

---

## 2. Typography Strategy

### Primary Font (UI Structure)
*   **Font:** `Geist Sans` (or `Inter`).
*   **Usage:** Navigation, Settings, Long-form text.
*   **Characteristics:** Clean, invisible, functional.

### Data Font (The "Vertically Long" Mono)
*   **Font:** `Geist Mono` or `JetBrains Mono`.
*   **Usage:** **IDs, timestamps, status labels, logs, metrics, charts.**
*   **Styling Rule:** condensed width, slightly taller line-height.
*   **Classes:** `font-mono tracking-tight` (for density) or `tracking-widest` (for headers).

---

## 3. Color Palette (Strict Dark Mode)

We do not use solid blacks for everything. We use layers of "Void".

```css
:root {
  /* Depths */
  --bg-void: #050505;        /* Main background */
  --bg-panel: #0A0A0A;       /* Secondary panels */
  --bg-active: #151515;      /* Hover states */

  /* The Grid */
  --border-subtle: #1F1F1F;  /* The defining grid lines */
  --border-strong: #333333;  /* Active borders */

  /* Status Colors (The "Neon" accents) */
  --status-active: #00FF94;  /* Emerald Neon (Success/Active) */
  --status-alert: #FF3333;   /* Signal Red (Critical) */
  --status-warn: #FFB300;    /* Amber (Warning) */
  --status-idle: #444444;    /* Dimmed (Inactive) */

  /* Text layers */
  --text-bright: #EDEDED;
  --text-dim: #888888;
  --text-dark: #444444;
}
```

---

## 4. UI Components & "Prompts" for Creation

### A. The "Mission Grid" (Main Dashboard)
*Concept:* A tight grid of distinct cells. No gaps.
*   **Top Nav:** A single border-bottom strip. Breadcrumbs on the left (Mono). User/Orbitr indicator on the right.
*   **Agent Status Rail:** A side or top bar showing all agents as "Chips".
    *   *Active:* Glowing green dot + Name in white.
    *   *Idle:* Grey dot + Name in grey.
    *   *Processing:* Pulsing yellow dot.
*   **Main Stage:**
    *   **Live Feed:** A waterfall of events. New events flash white then fade to grey.
    *   **Metric Cards:** Not boxes with shadows. **Framed areas** defined by borders. Big numbers (4xl), small labels (xs mono).

### B. The "StrikeOps" Table
*Reference:* The dark, dense table in your StrikeOps image.
*   **Header:** Ultra-small, uppercase, tracking-wide. `text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]`.
*   **Rows:** Tall (48px). 1px border bottom.
*   **Hover Effect:** The *entire* row lights up slightly (`bg-zinc-900`).
*   **Cell Styling:**
    *   *ID:* `text-zinc-600 font-mono`.
    *   *Status:* A "pill" containing a dot and text. `border border-zinc-800 rounded-full px-2 py-0.5 text-xs`.
    *   *Agent:* Brackets style: `[SECURITY_WATCHDOG]`.

### C. Visualizations (The "Sphere" and Charts)
*Reference:* The wireframe sphere and line charts.
*   **The "Brain" Visualization:** A 3D wireframe sphere (using three.js or simple CSS animations on SVGs) that rotates.
    *   *State:* Spins faster when events are processing. Turns red when critical events occur.
*   **Charts (Recharts Customization):**
    *   **Grid:** Dotted vertical lines (`strokeDasharray="3 3"`), solid baseline.
    *   **Lines:** Thin, sharp lines. No curvature (or very slight).
    *   **Micro-interactions:** Crosshair cursor follower.

### D. Icons (The "Unique" Set)
Do not use generic generic icons. Use **abstract geometric shapes** or **Radix UI Icons**.
*   *Dashboard:* A square divided into 4 smaller squares.
*   *Agents:* A hexagon with a dot in the center.
*   *Logs:* A terminal prompt symbol `>_`.
*   *Settings:* A slider control icon.

---

## 5. Implementation Plan (Next.js + Tailwind)

### Phase 1: The Foundation
1.  **Setup Shadcn/UI:** Initialize variables, clean up strict mode.
2.  **Theme Config:** Define the `tailwind.config.ts` with our custom "Void" colors and "Geist" font family.
3.  **Layout Shell:** Create the `layout.tsx` with the **Grid Background** pattern (a subtle SVG pattern of dots).

### Phase 2: Core Atoms
1.  **`StatusBadge`**: A highly reusable component for those neon pills.
2.  **`MonoCard`**: A card component with exposed borders and no shadow.
3.  **`TerminalText`**: A typography component for logs.

### Phase 3: The Dashboard (Page)
1.  **Sidebar:** Collapsible, icon-only mode.
2.  **EventStream:** A scrollable area with `framer-motion` for incoming items.
3.  **AgentOverview:** The high-level stats.

---

## 6. Prompting for UI Generation
*Use these prompts when asking AI to generate specific components:*

**For a Table:**
> "Create a React data table component using Tailwind. Design style: 'Cyber-Industrial'. Dark mode only. font-mono for all data cells. Use distinct 1px border-b-zinc-800 for rows. columns: ID (dimmed), Event Type (white), Status (badge with neon dot), Agent (bracketed). Hover state should be a subtle zinc-900 wash. No rounded corners on the table container."

**For a Metric Card:**
> "Create a 'StatCard' component. It should look like a HUD element. Border: 1px solid zinc-800. Background: Black. Content: A label at the top-left (text-xs text-zinc-500 uppercase tracking-widest), a large value in the center (text-4xl font-mono text-white), and a sparkline chart at the bottom using Recharts. Add a subtle 'scanline' overlay CSS effect."

**For the Log Terminal:**
> "Build a 'LiveLog' component. Looks like a terminal window. Black background. Green monospace text (JetBrains Mono). Each log entry has a timestamp [HH:MM:SS] in grey, followed by the message. New logs should animate in from the bottom. clear button in top right."
