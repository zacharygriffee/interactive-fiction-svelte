# Terminal Dossier Example Story

Twine-like branching example for the core runtime. This story is fully DSL-authored and runs in the existing app without adding any viewer/runtime dependency.

## Run

1. Install dependencies: `npm install`
2. Build bundle: `npm run build`
3. Serve repo root with a simple HTTP server, for example: `python3 -m http.server 4173`
4. Open:
   - Default story: `http://localhost:4173/`
   - Terminal Dossier story: `http://localhost:4173/?story=terminal-dossier`

## Mechanics Demonstrated

- Storylets with deterministic priority order
- Storylets with multi-condition AND requirements
- `once: true` storylet reveal effects (`effectsOnReveal`)
- Capability-gated content (`cap.deepDossier`, `cap.askAgent`)
- Choices that stay on the same node (`to: undefined`) with side effects
- Reconverging branches (not a pure tree)
- System trace logging through `fx.pushLog(...)`

## Extend

- Edit `examples/terminal-dossier/graph.author.js`
- Runtime export is `examples/terminal-dossier/graph.js`
