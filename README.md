# interactive-fiction-svelte

Standalone interactive fiction runtime built with Svelte and a strict StoryDriver boundary.

## Authoring

- Story graph authoring DSL file: `src/lib/story/graph.author.js`
- Runtime graph export stays stable: `src/lib/story/graph.js` (`storyGraph = { startNodeId, nodesById }`)
- Graph validation runs at startup via `src/lib/story/dsl/validate.js`
- Quickstart doc: `docs/if-dsl-quickstart.md`

### Authoring Rules

- Edit `src/lib/story/graph.author.js` for story content changes.
- Do not edit `src/lib/story/graph.js` directly (it re-exports authored graph).
- Do not edit runtime drivers unless you are intentionally changing engine behavior.
- Run `npm run validate-graph` and `npm test` before handing off changes.

## Ports / Adapters

- `AuthorityPort` (`src/lib/ports/authority.js`): ratifies intent into `ratifiedEvent` (and optional receipt).
- `ProvisionalPort` (`src/lib/ports/provisional.js`): streams non-authoritative provisional messages.
- `GraphResolverPort` (`src/lib/ports/graph_resolver.js`): resolves graph source for the driver.
- `ProofPort` (`src/lib/ports/proof.js`): optional identity/signing seam.

Default local adapters live in `src/lib/adapters/` and keep behavior deterministic without mesh transport.
Future ecology integration should plug in via custom Authority + Provisional adapters.

## Scripts

- `npm run dev` watches and rebuilds with rollup.
- `npm run build` builds the Svelte bundle.
- `npm run validate-graph` validates graph shape and prints an authoring report on failure.
- `npm run test` runs brittle tests for non-UI story logic.
