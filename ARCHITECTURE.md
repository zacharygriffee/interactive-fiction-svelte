# Architecture

## What This Project Is

`interactive-fiction-svelte` is a deterministic interactive-fiction runtime with:
- story graph + storylets
- local authoritative execution
- explicit seams for ecology integration
- event logs + replay for audit/debug

The Svelte UI is a thin consumer over `StoryDriver` snapshots.

## Core Invariants

### StoryDriver boundary

UI talks only to the StoryDriver contract:
- `init()`
- `getSnapshot()`
- `dispatch(action)`
- `subscribe(cb)`

UI does not mutate engine state directly.

### Ports (public extension seams)

Ports live in `src/lib/ports/`:
- `AuthorityPort`: ratifies intent into authoritative `ratifiedEvent` (+ optional receipt)
- `ProvisionalPort`: delivers non-authoritative message stream
- `GraphResolverPort`: resolves the graph source for the driver
- `ProofPort`: optional identity/signing seam

Adapters live in `src/lib/adapters/` and implement these ports.
Mesh/ecology transport is intentionally outside core and should integrate by supplying custom Authority/Provisional adapters.

### Deterministic logs + replay

Core records:
- `intentLog`
- `ratifiedLog`

Replay rebuilds authoritative state from logs in deterministic order.

### Provisional isolation

`provisionalTail` is UI-only:
- may appear in snapshots
- is not persisted
- must not mutate authoritative state

## Authoring Workflow

1. Edit story content in `src/lib/story/graph.author.js`.
2. Keep `src/lib/story/graph.js` as a re-export.
3. Validate graph shape:
   - `npm run validate-graph`
4. Run deterministic test suite:
   - `npm test`
5. Build app bundle:
   - `npm run build`

## Extending Toward Ecology

When adding ecology integration, implement new adapters for:
- authority ratification and receipts
- provisional organism stream
- optional proof identity/signing

Keep driver and runtime semantics stable; wire integrations through ports instead of embedding transport logic in core.
