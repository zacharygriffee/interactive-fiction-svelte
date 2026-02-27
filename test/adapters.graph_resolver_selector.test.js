import test from "brittle";
import { GraphResolverSelector } from "../src/lib/adapters/graph_resolver_selector.js";
import { createStoryGraph } from "./fixtures/story.fixture.js";

test("graph resolver selector: storyId input overrides search", (t) => {
  const defaultGraph = createStoryGraph();
  const alternateGraph = {
    startNodeId: "alt",
    nodesById: {
      alt: {
        id: "alt",
        body: "alternate",
        choices: []
      }
    }
  };

  const resolver = new GraphResolverSelector({
    defaultGraph,
    storyGraphsById: {
      alternate: alternateGraph
    },
    search: "?story=missing"
  });

  const graph = resolver.getGraph({ storyId: "alternate" });
  t.is(graph, alternateGraph);
});

test("graph resolver selector: unknown story falls back to default", (t) => {
  const defaultGraph = createStoryGraph();
  const resolver = new GraphResolverSelector({
    defaultGraph,
    storyGraphsById: {},
    search: "?story=unknown"
  });

  const graph = resolver.getGraph({});
  t.is(graph, defaultGraph);
});
