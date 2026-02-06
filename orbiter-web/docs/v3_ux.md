# Orbiter Frontend v3.0 — UX & UI BEHAVIOR PROMPT
> Experience-First Agentic System Interface  
> Companion Prompt to: “Orbiter Frontend v3.0 — AI Implementation Prompt & PRD”

---

## 0. WHY THIS DOCUMENT EXISTS

This document defines **HOW the UI SHOULD FEEL AND BEHAVE**, not just what pages exist.

The goal is to prevent:
- flat pages with too much information
- overuse of charts
- dumping backend data directly into screens
- breaking the illusion of an “intelligent system”

This UI should feel like:
> “A calm control room for an autonomous system that explains itself only when needed.”

---

## 1. CORE UX PRINCIPLES (NON-NEGOTIABLE)

### 1.1 Progressive Disclosure
- Never show everything at once
- Every page has:
  - **Primary layer** (overview)
  - **Secondary layer** (details via modal/drawer)
  - **Deep layer** (full page or trace view)

Users should *pull* information, not be forced to read it.

---

### 1.2 Explainability Over Density
- Textual explanation > graphs
- Charts only exist to:
  - confirm a point
  - show a trend
- Every chart must have:
  - a label explaining *why it matters*
  - a short textual summary below it

---

### 1.3 Agents Are Present, Not Loud
- Agents should be:
  - referenced
  - credited
  - contextual
- Agents should NOT:
  - constantly speak
  - require user management
  - expose internal reasoning unless asked

---

## 2. MODALS, DRAWERS & MICRO-INTERACTIONS

### 2.1 When to Use a Modal (MANDATORY RULES)

Use a **modal** when:
- the user wants *more detail*, not a new workflow
- context must be preserved
- the action is reversible

Examples:
- Viewing “Why this policy was triggered”
- Inspecting “Evidence used”
- Seeing “Agent contribution summary”

Modal size rules:
- Small modal → explanation
- Medium modal → breakdown + evidence
- Full-screen modal → trace / deep reasoning

---

### 2.2 When to Use a Side Drawer

Use a **side drawer** when:
- the user is exploring context
- they might jump between multiple items
- the content is reference-like

Examples:
- Event metadata
- Actor history snapshot
- Resource usage snapshot

Side drawers should feel like:
> “Let me quickly peek without losing my place.”

---

### 2.3 Full Page Navigation

Only use full page navigation for:
- Workflow detail pages
- Event deep dives
- Reports

Never navigate away for:
- explanations
- evidence
- policy descriptions

---

## 3. PAGE-LEVEL UX BEHAVIOR

---

### 3.1 Dashboard UX

**Primary Layer**
- High-level status
- Calm, readable
- No alerts shouting at the user

**Secondary Layer (via modals)**
- Clicking a metric opens:
  - why it changed
  - which workflows contributed

**Micro-interaction**
- Subtle pulse on updated items
- No blinking or aggressive animations

---

### 3.2 Workflows UX (Most Important)

#### Workflow List
- Hover shows:
  - quick reason for status
- Click opens **workflow detail page**

#### Workflow Timeline (Detail Page)
- Timeline is always visible
- Clicking a step opens:
  - step metadata (modal)
  - agents involved
  - related events

#### Deviations
- Deviations are:
  - visually subtle
  - explained in text
- No red overload

This page should feel like:
> “I can *see* the workflow think.”

---

### 3.3 Compliance & Policy UX

#### Policy List
- Clean, document-like layout
- Feels like a rulebook, not settings

#### Policy Triggered State
- Clicking violation opens modal:
  - policy rule
  - evidence
  - confidence
  - impact

Never auto-open violations.  
User curiosity should drive exploration.

---

### 3.4 Events UX

#### Events List
- Scannable
- Severity is visible but not scary

#### Event Deep Dive
- Long-form, readable layout
- Sections expand/collapse
- Decision trace is collapsed by default

Clicking “View decision trace” opens:
- full-screen modal
- step-by-step reasoning

---

### 3.5 Agents UX

Agents are **characters in the story**, not controls.

Each agent page shows:
- what it watches
- what it contributed recently
- where its findings appear

No buttons. No toggles.

---

### 3.6 Chat with Orbiter UX

This is **not a chatbot**.  
This is a **system intelligence console**.

#### Interaction rules
- One response at a time
- Calm tone
- References agents subtly:
  > “Based on findings from the Compliance Sentinel…”

#### UI behavior
- Chat stays in a side panel
- Clicking a referenced item opens it in context
- Chat never blocks the main UI

---

## 4. CHARTS & VISUALS (VERY IMPORTANT)

### 4.1 Chart Rules
- Max 1 chart per section
- Never full-width unless it’s a trend
- Always paired with text

### 4.2 Chart Purpose Labels
Every chart must answer:
- What am I looking at?
- Why does this matter now?

If it doesn’t answer both → remove it.

---

## 5. EMPTY STATES & LOADING STATES

### Empty States
- Explain what *would* appear here
- Suggest next action

### Loading States
- Never generic spinners
- Use:
  - “Analyzing workflows…”
  - “Synthesizing insights…”

---

## 6. CONSISTENCY & REUSE

All:
- modals
- drawers
- explanation blocks
- insight cards

Must be built as **reusable components**.

This system should scale to:
- more agents
- more workflows
- more policies

Without changing UX patterns.

---

## 7. FINAL UX CHECKLIST (BEFORE SHIPPING)

Ask:
- Can a non-technical user explain what happened?
- Can a judge find reasoning in under 2 clicks?
- Does anything feel like raw backend data?

If yes → simplify.

---

## FINAL NOTE TO THE IMPLEMENTING AI

You are designing **trust**, not screens.

If the UI feels:
- rushed → slow it down
- loud → quiet it
- impressive but confusing → remove it

The best compliment this UI can get is:
> “This system feels like it knows what it’s doing.”
