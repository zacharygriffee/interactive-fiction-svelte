import test from "brittle";
import { DefaultGraphResolver } from "../src/lib/adapters/graph_resolver_default.js";
import { validateGraph } from "../src/lib/story/dsl/validate.js";
import { createStoryGraph } from "./fixtures/story.fixture.js";

test("graph resolver contract: returns valid graph shape", (t) => {
  const resolver = new DefaultGraphResolver({ graph: createStoryGraph() });
  const graph = resolver.getGraph({ concernId: "test" });

  validateGraph(graph);

  t.is(typeof graph.startNodeId, "string");
  t.ok(Boolean(graph.nodesById[graph.startNodeId]));
});
