import { mount } from "svelte";
import App from "./App.svelte";
import { storyGraph } from "./lib/story/graph.js";
import { BrowserStorage } from "./lib/story/storage/browser.js";
import { createDriver } from "./lib/story/createDriver.js";
import { validateGraph } from "./lib/story/dsl/validate.js";

function createRuntimeDriver({ mode = "local" } = {}) {
  validateGraph(storyGraph);

  return createDriver({
    mode,
    graph: storyGraph,
    storage: new BrowserStorage("interactive-fiction-runtime-state"),
    clock: { now: () => Date.now() }
  });
}

export function mountApp({ target, props }) {
  const safeProps = props ?? {};
  const driver = safeProps.driver ?? createRuntimeDriver({ mode: safeProps.driverMode ?? "local" });

  return mount(App, {
    target,
    props: {
      ...safeProps,
      driver
    }
  });
}
