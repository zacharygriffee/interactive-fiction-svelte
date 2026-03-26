# Shinobi Demo Story

Small investigation-focused example used to exercise the core runtime rather than define a standalone game.

## What It Demonstrates

- Knowledge gating
- Inventory-based routes
- Relationship thresholds
- Pressure timers
- Scene-state unlocks
- History-aware content (`visitedNode`, `choseChoice`)
- Reconverging branches with success and failure endings

## Run

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open:
   - `http://localhost:4173/?story=shinobi-demo`
   - `http://localhost:4173/?mode=dev&story=shinobi-demo`

## Intended Golden Route

1. Pocket the sniffer chip
2. Ping Zephyr
3. Drop into service access
4. Decode the chip
5. Enter archive shell
6. Pull mirror trace
7. Download ledger fragment
8. Seal the trace and exfiltrate clean
