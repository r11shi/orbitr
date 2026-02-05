# Orbitr "Digital Overseer" Frontend

A high-performance compliance monitoring dashboard built with Next.js 14 and Tailwind CSS v4.

## Design Philosophy
- **Aesthetic:** Cyberpunk Mission Control / Vercel-inspired.
- **Components:** Custom "Void" theme, strict grid layout, monospace-first data display.
- **Tech:** React 19, Tailwind v4, Geist Fonts.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Backend Integration
This frontend expects the Orbitr Backend to be running on `http://localhost:8000`.

**To start the full system:**
1. **Terminal 1 (Backend):** 
   `uvicorn src.main:app --reload`
2. **Terminal 2 (Frontend):** 
   `npm run dev`
3. **Terminal 3 (Simulation):** 
   `python scripts/simulate.py --continuous`

## Components
- **Stats HUD:** Real-time metrics with scanline effects.
- **Mission Feed:** "StrikeOps" style dense event log.
- **Agent Rail:** Live status indicators for AI agents.
