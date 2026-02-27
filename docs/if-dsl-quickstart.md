# IF DSL Quickstart

## Export shape

- Author in: `src/lib/story/graph.author.js`
- Runtime import stays: `src/lib/story/graph.js`
- Required compiled shape:

```js
{
  startNodeId: "start",
  nodesById: {
    start: { id: "start", body: "...", choices: [] }
  }
}
```

## DSL building blocks

```js
import {
  graph,
  node,
  body,
  tags,
  choices,
  choice,
  storylets,
  storylet,
  requires,
  fx
} from "./dsl/index.js";
```

## Condition helpers

- `requires.flag("key")`
- `requires.eq("key", value)`
- `requires.cap("cap.name")`

## Effect helpers

- `fx.set("key", value)`
- `fx.inc("key", 1)`
- `fx.pushLog("info", "text")`

## Media (HTTP-served)

`body(...)` and `storylet(..., body, ...)` can include HTML for media when served over HTTP.

Examples:

- image: `<img src="/assets/demo.png" alt="demo" />`
- video: `<video src="/assets/demo.mp4" controls playsinline></video>`
- audio: `<audio src="/assets/demo.mp3" controls></audio>`
- external link: `<a href="https://example.com" target="_blank" rel="noreferrer noopener">Open link</a>`

Use `/assets/...` paths and serve through `npm run dev` or `npm run start`. `file://` is not supported.

## Media Snippets

Copy/paste snippets:

- Image with alt + width:
  - `<img src="/assets/demo.png" alt="Signal still frame" width="320" />`
- Video with poster + controls:
  - `<video src="/assets/demo.mp4" poster="/assets/demo-poster.jpg" controls playsinline></video>`
- Looping muted inline video:
  - `<video src="/assets/demo-loop.mp4" autoplay muted loop playsinline></video>`
- GIF recommendation:
  - Use `<img src="/assets/demo.gif" alt="Looping signal glitch" />` for GIF files.
- Audio with controls:
  - `<audio src="/assets/demo.mp3" controls></audio>`
- External link (safe attrs):
  - `<a href="https://example.com" target="_blank" rel="noreferrer noopener">Open external reference</a>`

Safety note:
- Authored HTML is treated as trusted content in this repo. Do not load untrusted remote story bundles without sanitization.

## Hard rules

- Arrays only for `choices([...])`, `storylets([...])`, `requires: []`, `effects: []`, `effectsOnReveal: []`
- `choice(..., to)` is optional: if `to` is `undefined`, runtime stays on current node
- `requires` semantics are AND
- Storylets sort by `priority` desc, then `id` asc
- `once: true` storylets reveal once and can apply `effectsOnReveal` once

## Canonical example

```js
const g = graph({
  start: "start",
  nodes: [
    node("start", [
      body("You arrive at the archive."),
      storylets([
        storylet("teaser", "A red folder is visible."),
        storylet("deep", "Encrypted memo unlocked.", {
          requires: [requires.cap("cap.deepDossier")],
          priority: 2
        }),
        storylet("first-look", "You skim a page and mark a clue.", {
          once: true,
          effectsOnReveal: [fx.inc("curiosity", 1)]
        })
      ]),
      choices([
        choice("inspect", "Inspect desk", undefined, {
          effects: [fx.set("inspected", true), fx.pushLog("info", "Desk inspected")]
        }),
        choice("to-hall", "Go to hall", "hall")
      ])
    ]),
    node("hall", [body("A long corridor."), choices([])])
  ]
});
```

## Validation

- Validator: `src/lib/story/dsl/validate.js`
- Runtime calls validation during startup in `src/entry.js`
- Dedicated CLI validator: `npm run validate-graph`
- Run checks with test suite:

```bash
npm run validate-graph
npm test
```

## Authoring Rules

- Edit story content in `src/lib/story/graph.author.js`.
- Keep `src/lib/story/graph.js` as a re-export only.
- Avoid changing runtime drivers unless you are changing engine semantics.
