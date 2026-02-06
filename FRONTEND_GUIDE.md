## Orbiter Frontend MVP - Visual Guide

This document provides a walkthrough of each page and what you should see in the preview.

---

### 1. **Dashboard / Overview** (`/`)
**What You'll See:**
- Dark background with subtle gradient (void → panel)
- Sidebar on left with navigation menu
- Top header: "System Overview" with description
- **Key Metrics Section (4 cards):**
  - System Status (Operational/Degraded)
  - Active Incidents (count, with trend indicator)
  - Mean Latency (in ms with ↓ Good or ↑ Increasing)
  - Processed Events (total count)
- **Split Layout Below:**
  - Left column: "Active Deviations" card showing incidents
  - Right column: "Recent Activity" timeline showing event feed with timestamps
- Real-time updates every 5 seconds (auto-refresh)

**Design Elements:**
- Emerald green for active status
- Amber/orange for warnings
- Red for critical alerts
- Monospace font for all metric values
- Loading spinner while fetching data

---

### 2. **Workflows** (`/workflows`)
**What You'll See:**
- Header: "Workflows" with description
- Responsive table with columns:
  - Workflow name (left-aligned)
  - Status (● active, ◐ processing, ○ idle)
  - Agent assigned (badge style)
  - Event count (centered)
  - Error count (colored based on severity)
  - Last run time
  - Chevron for details
- Hover effects on rows (background color change)
- Mock data showing 3 workflows

**Design Elements:**
- Clean table layout with subtle borders
- Status indicators with animated dots
- Color-coded error counts (green for 0, amber for errors)

---

### 3. **Incidents** (`/incidents`)
**What You'll See:**
- Split panel layout:
  - **Left panel (280px):** 
    - "Active Incidents" header with count
    - Scrollable list of incidents
    - Each showing: ID, severity (colored), title, status, time
  - **Right panel:** 
    - Full incident details when selected
    - Incident title, ID, timestamp, severity
    - Analysis narrative (readable text)
    - Response description
    - Sidebar with:
      - Agent involved (badge)
      - Status indicator
      - Affected service name
- Click incidents to toggle details

**Design Elements:**
- Red for critical incidents
- Amber for high severity
- Narrative-focused, human-readable descriptions
- Grid layout for details section

---

### 4. **Agents** (`/agents`)
**What You'll See:**
- Header: "Agent Swarm" with description
- Grid layout (2 columns on desktop, responsive)
- Agent cards showing:
  - Agent name (top-left)
  - Status badge (● active, ○ idle)
  - **Stats grid (2x2):**
    - Tasks Processed: large number
    - Success Rate: percentage in green
  - Last Action: narrative description
- Hover effects on cards (border highlight, color change)
- Mock data showing 3 agents

**Design Elements:**
- Card-based layout with subtle borders
- Status indicators
- Large numeric display for key metrics
- Hover state with color transition to brand accent

---

### 5. **Compliance Reports** (`/simulation`)
**What You'll See:**
- Header: "Compliance Reports" with description
- List of compliance reports, each showing:
  - Title and framework (e.g., "ISO 27001")
  - Compliance score (95%, 98%, etc.) - colored based on value
  - Status (✓ completed, ⧗ in-progress)
  - Issued date
  - Download button (icon)
- Click to expand details showing:
  - Key findings summary
  - Last verified time
  - View Details and Share Report buttons

**Design Elements:**
- Green for high scores (95+%)
- Amber for medium scores (90-94%)
- Red for low scores (<90%)
- Expandable rows with smooth transitions
- Action buttons for each report

---

### 6. **Settings** (`/settings`)
**What You'll See:**
- Header: "Settings & Configuration"
- Four collapsible sections:
  - **Notifications:** Toggle switches for email alerts, incident alerts, daily digest
  - **Automation:** Controls for auto-remediation, incident escalation
  - **Data Retention:** Dropdown for retention period
  - **System Information:** Display of version, API endpoint, status
- Toggle switches for boolean settings
- Dropdown selects for options
- Status indicators showing current system state

**Design Elements:**
- Clean form layout
- Toggle switches with smooth animation
- Organized into logical sections
- Monospace for technical details (API endpoint, version)

---

### 7. **Sidebar Navigation**
**Visible on All Pages:**
- Left sidebar (collapsible)
- Logo/Branding at top (white box with black square)
- Navigation items:
  - Overview (home icon)
  - Workflows (activity log icon)
  - Incidents (warning triangle icon)
  - Agents (person icon)
  - Compliance (play icon)
  - Settings (gear icon)
- Active page highlighted with background color
- Bottom status section:
  - System status (● ONLINE in green)
  - Version number (v4.0.0)

**Design Elements:**
- Persistent navigation
- Icon-based (with labels)
- Active state highlighting
- Real-time status indicator

---

## Color Palette Used

| Name | Hex | Usage |
|------|-----|-------|
| BG Void | #09090b | Main background |
| BG Panel | #18181b | Cards/panels |
| BG Active | #27272a | Hover/active states |
| Border Subtle | #27272a | Separators |
| Border Strong | #3f3f46 | Stronger borders |
| Text Bright | #fafafa | Headings |
| Text Primary | #e4e4e7 | Body text |
| Text Secondary | #a1a1aa | Labels |
| Text Dim | #71717a | Hints |
| Status Active | #10b981 | Green - Success |
| Status Alert | #ef4444 | Red - Critical |
| Status Warn | #f59e0b | Orange - Warning |
| Accent Brand | #fafafa | Highlight |

---

## Interactive Features

1. **Real-time Updates:** Dashboard refreshes every 5 seconds
2. **Expandable Rows:** Compliance reports expand on click
3. **Hover States:** All interactive elements have hover feedback
4. **Animations:** Fade-in animations on page load and incoming events
5. **Responsive:** Grid layouts adapt from mobile to desktop
6. **Status Indicators:** Visual feedback for system health

---

## Browser Preview

The app should load on the Preview pane with:
- Dark theme immediately visible
- Sidebar on left with all 6 navigation items
- Dashboard (home page) displaying by default
- Smooth scrolling and transitions
- No console errors
- All mock data populated

Click the sidebar navigation to switch between pages.
