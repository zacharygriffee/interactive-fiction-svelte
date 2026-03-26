import { mount } from "svelte";
import App from "./App.svelte";
import { storyGraph as defaultStoryGraph } from "./lib/story/graph.js";
import { BrowserStorage } from "./lib/story/storage/browser.js";
import { createDriver } from "./lib/story/createDriver.js";
import { validateGraph } from "./lib/story/dsl/validate.js";
import { GraphResolverSelector } from "./lib/adapters/graph_resolver_selector.js";
import { storyGraph as terminalDossierGraph } from "../examples/terminal-dossier/graph.js";
import { storyGraph as shinobiDemoGraph } from "../examples/shinobi-demo/graph.js";

const STORY_ID_TERMINAL_DOSSIER = "terminal-dossier";
const STORY_ID_SHINOBI_DEMO = "shinobi-demo";
const STORY_ID_DEFAULT = "default";
const DEFAULT_STORAGE_KEY = "interactive-fiction-runtime-state";

function createRuntimeDriver({ mode = "local", graphResolver } = {}) {
  const resolvedGraphResolver = graphResolver ?? new GraphResolverSelector({
    defaultGraph: defaultStoryGraph,
    storyGraphsById: {
      [STORY_ID_DEFAULT]: defaultStoryGraph,
      [STORY_ID_TERMINAL_DOSSIER]: terminalDossierGraph,
      [STORY_ID_SHINOBI_DEMO]: shinobiDemoGraph
    }
  });
  const selectedGraph = resolvedGraphResolver.getGraph({});
  validateGraph(selectedGraph);

  const selectedStoryId = typeof resolvedGraphResolver.getSelectedStoryId === "function"
    ? resolvedGraphResolver.getSelectedStoryId()
    : null;
  const storageKey = selectedStoryId
    ? `${DEFAULT_STORAGE_KEY}:${selectedStoryId}`
    : DEFAULT_STORAGE_KEY;

  return createDriver({
    mode,
    graphResolver: resolvedGraphResolver,
    storage: new BrowserStorage(storageKey),
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
