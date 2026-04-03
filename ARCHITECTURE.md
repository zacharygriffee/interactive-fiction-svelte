# Architecture

## What This Project Is

`interactive-fiction-svelte` is a deterministic interactive-fiction runtime with:
- story graph + storylets
- local authoritative execution
- explicit seams for ecology integration
- event logs, receipts, and replay for audit/debug

The Svelte UI is a thin consumer over `StoryDriver` snapshots.

## Public Boundary

Stable public-by-convention API is exported from `src/lib/index.js`.

Internal app wiring (`src/entry.js`, `src/App.svelte`, `src/lib/components/*`, `src/lib/app/*`) is not API-stable.

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
- `AuthorityPort`: ratifies intent into authoritative `ratifiedEvent` and optional linked receipts.
- `ProvisionalPort`: delivers non-authoritative message stream.
- `GraphResolverPort`: resolves graph source for driver concerns/stories.
- `ProofPort`: identity/signing seam for checkpoint artifacts.

Adapters live in `src/lib/adapters/` and implement these ports.
Mesh/ecology transport is intentionally outside core and should integrate by supplying custom adapters.

### Deterministic logs + replay

Core records:
- `intentLog`
- `ratifiedLog`
- `receiptLog`

Replay rebuilds authoritative state from logs in deterministic order.

### Canonicalization + checkpoints

Core provides deterministic helpers in `src/lib/story/events/`:
- canonical event stream serialization
- checkpoint hash chain generation
- optional proof-backed artifact signing

Checkpoint commitment payload policy:
- default commits `intentLog` + `ratifiedLog` only
- `includeReceipts: true` additionally commits `receiptLog`
- hash algorithm is `sha256`

These helpers are additive seams for future attestation work and do not add real transport/crypto dependencies.

### Identity artifact portability

Core provides portable identity artifacts in `src/lib/identity/artifact.js`:
- export/import compact, versioned commitment objects
- bind identity to deterministic checkpoint hashes
- summarize receipts without exporting raw logs by default

These artifacts are intended as portable proof-of-work seeds for future ecology witness/ratification layers.

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
   - `npm run validate-graph:all`
4. Run deterministic test suite:
   - `npm test`
5. Build app bundle:
   - `npm run build`

## Extending Toward Ecology

When adding ecology integration, implement new adapters for:
- authority ratification + receipts
- provisional organism streams
- graph selection/routing by concern/story
- optional proof identity/signing

Keep driver/runtime semantics stable; wire integrations through ports instead of embedding transport logic in core.

## Boundary Note

This repo owns the deterministic runtime and the extension seams.
It does not own the product-specific concern-surface bridge for mesh ecology.

Use this repo for:
- stable runtime contracts
- deterministic local adapters
- replay, receipts, checkpoints, and identity artifacts

Do not use this repo for:
- concern-surface doctrine
- packs-facing deployment posture
- product-specific mesh translation semantics

That bridge work should live in the adjacent `../interactive-fiction-concern-surface` repo so core remains mesh-agnostic.
