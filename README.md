# interactive-fiction-svelte

Standalone interactive fiction runtime built with Svelte and a strict StoryDriver boundary.

## Install

```bash
npm install interactive-fiction-svelte
```

```js
import { createDriver, graph, node, choice, choices, body } from "interactive-fiction-svelte";
import { defaultStoryGraph, terminalDossierGraph } from "interactive-fiction-svelte/examples";
```

## Public API Surface

This package exposes a stable runtime/library surface from the package root export `interactive-fiction-svelte`.

Public-by-convention exports include:
- Driver/runtime entry points (`createDriver`, `StoryDriver`, `replay`)
- DSL + graph validation helpers
- Runtime constants (`ACTION_TYPES`, `EFFECT_TYPES`, `CONDITION_TYPES`, `EVENT_KINDS`, `STATE_VERSION`)
- Port assertions and default local adapters
- Canonicalization/checkpoint helpers for attestation-ready artifacts
- Identity artifact helpers for portable proof-of-work seeds
- Example graphs via `interactive-fiction-svelte/examples`

The package is runtime-first. The in-repo app shell, browser entrypoints, workflows, and tests are not part of the semver-stable package surface.

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

Checkpoint commitment payload:
- Default (`includeReceipts: false`): commits to `intentLog` + `ratifiedLog` only.
- Optional (`includeReceipts: true`): also commits `receiptLog`.
- Rationale: default checkpoints stay portable across differing witness/receipt sets.

Determinism note:
- For deterministic exports, pass `createdAt` explicitly or rely on `checkpoint.at`.
- `createIdentityArtifact` no longer falls back to wall-clock time implicitly.

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

Boundary note:
- This repo owns the mesh-agnostic runtime seams, not the product-specific concern-surface bridge.
- Mesh concern-surface doctrine and bridge design should live in the adjacent `../interactive-fiction-concern-surface` repo.
- If future integration work starts introducing mesh deployment vocabulary or product-specific bridge semantics here, that work likely belongs in the adjacent repo instead.

## Scripts

- Package consumers normally only use the root exports and example exports; these scripts are for working in this repo.
- `npm run dev` starts rollup watch + serves `dist/` on `http://localhost:4173` with Dev helpers.
- `npm run build` builds the Svelte bundle and prepares Play-mode dist shell.
- `npm run start` prepares and serves `dist/` on `http://localhost:4173` in Play mode.
- `npm run validate-graph` validates the default graph shape.
- `npm run validate-graph:all` validates default + in-repo example graphs.
- `npm run validate-assets` validates `/assets/...` references in known graphs and reports missing/unused files.
- `npm run test` runs brittle tests for non-UI story logic.
- `npm run test:smoke` runs the Playwright smoke test against the built `dist/` app (Chromium locally; Chromium + Firefox in CI).
- `npm run test:browser` runs the deeper Playwright browser-flow suite against the built `dist/` app (Chromium only).
- `npm run test:ci` runs the full local CI sequence, including browser smoke coverage.
- `npm run test:full` runs the CI sequence plus the deeper browser-flow suite.
- GitHub Actions keeps the browser-flow suite in a separate `Browser Flows` workflow so the main PR gate stays fast; run it manually or let the nightly schedule cover it.

## Runtime URL Controls

- Story selection:
  - `?story=default`
  - `?story=terminal-dossier`
- Mode selection:
  - `?mode=dev` (or `?dev=1`) for Dev Mode
  - `?mode=play` for Play Mode

## Compatibility / Versioning Policy

- Semver intent:
  - Changes to the root package export and `interactive-fiction-svelte/examples` follow semver compatibility.
  - Deep internal paths are not semver-stable.
- Port contract changes:
  - Adding optional fields is preferred.
  - Removing/renaming existing fields requires a major-version change.
