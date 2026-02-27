# interactive-fiction-svelte

Standalone interactive fiction runtime built with Svelte and a strict StoryDriver boundary.

## Public API Surface

This package now exposes a stable public surface at `src/lib/index.js` (also package export `.`).

Public-by-convention exports include:
- Driver/runtime entry points (`createDriver`, `StoryDriver`, `replay`)
- DSL + graph validation helpers
- Runtime constants (`ACTION_TYPES`, `EFFECT_TYPES`, `CONDITION_TYPES`, `EVENT_KINDS`, `STATE_VERSION`)
- Port assertions and default local adapters
- Canonicalization/checkpoint helpers for attestation-ready artifacts
- Identity artifact helpers for portable proof-of-work seeds

## Identity Artifacts

Identity artifacts are portable, versioned commitments for progress + identity that are designed for future ecology witnessing.

What they are:
- compact `{ identity, checkpoint, signature?, receipts?, meta? }` payloads
- deterministic canonical encoding/verification
- privacy-friendly by default (receipt summaries only, no raw event logs)
- encoded as canonical JSON strings (`encodeIdentityArtifact` / `decodeIdentityArtifact`)

What they are not:
- not KYC/real-world identity
- not full history export
- not transport/network protocol

Programmatic flow:
1. `computeCheckpoint({ intentLog, ratifiedLog, receiptLog })`
2. `createIdentityArtifact({ proof, checkpoint, receipts, meta })`
3. `encodeIdentityArtifact(artifact)` for copy/export
4. `decodeIdentityArtifact(str)` + `verifyIdentityArtifact({ artifact, proof })` on import

## Internal Modules

The following remain internal and may change without notice:
- App wiring and UI (`src/entry.js`, `src/App.svelte`, `src/lib/components/*`, `src/lib/app/*`)
- Local scripts and bundling internals (`scripts/*`, `rollup.config.js`)
- Deep imports under `src/lib/story/drivers/*` unless re-exported from `src/lib/index.js`

## Authoring

- Story graph authoring DSL file: `src/lib/story/graph.author.js`
- Runtime graph export stays stable: `src/lib/story/graph.js` (`storyGraph = { startNodeId, nodesById }`)
- Graph validation runs at startup via `src/lib/story/dsl/validate.js`
- Quickstart doc: `docs/if-dsl-quickstart.md`
- Media in passages/storylets is HTTP-served via `/assets/...` (for example `<img src="/assets/demo.png" alt="demo" />`); `file://` loading is not supported.
- Media embed snippets live in `docs/if-dsl-quickstart.md` under “Media Snippets”.

Authoring rules:
- Edit `src/lib/story/graph.author.js` for story content changes.
- Do not edit `src/lib/story/graph.js` directly (it re-exports authored graph).
- Do not edit runtime drivers unless you are intentionally changing engine behavior.
- Run `npm run validate-graph` and `npm test` before handoff.

## Ports / Adapters

- `AuthorityPort` (`src/lib/ports/authority.js`): ratifies intent into `ratifiedEvent` and optional linked receipts.
- `ProvisionalPort` (`src/lib/ports/provisional.js`): streams non-authoritative provisional messages.
- `GraphResolverPort` (`src/lib/ports/graph_resolver.js`): resolves graph source (`concernId`/`storyId` selectors).
- `ProofPort` (`src/lib/ports/proof.js`): identity/signing seam for checkpoint artifacts.

Default local adapters live in `src/lib/adapters/` and keep behavior deterministic without mesh transport.
Future ecology integration should plug in via custom Authority + Provisional adapters.

## Scripts

- `npm run dev` starts rollup watch + serves `dist/` on `http://localhost:4173` with Dev helpers.
- `npm run build` builds the Svelte bundle and prepares Play-mode dist shell.
- `npm run start` prepares and serves `dist/` on `http://localhost:4173` in Play mode.
- `npm run validate-graph` validates the default graph shape.
- `npm run validate-graph:all` validates default + in-repo example graphs.
- `npm run validate-assets` validates `/assets/...` references in known graphs and reports missing/unused files.
- `npm run test` runs brittle tests for non-UI story logic.

## Runtime URL Controls

- Story selection:
  - `?story=default`
  - `?story=terminal-dossier`
- Mode selection:
  - `?mode=dev` (or `?dev=1`) for Dev Mode
  - `?mode=play` for Play Mode

## Compatibility / Versioning Policy

- Semver intent:
  - Changes to exports from `src/lib/index.js` follow semver compatibility.
  - Deep internal paths are not semver-stable.
- Port contract changes:
  - Adding optional fields is preferred.
  - Removing/renaming existing fields requires a major-version change.
