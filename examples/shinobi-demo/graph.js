import { graph } from "../../src/lib/story/dsl/index.js";
import { shinobiDemoAuthorGraph } from "./graph.author.js";

export const storyGraph = graph({
  start: shinobiDemoAuthorGraph.start,
  nodes: shinobiDemoAuthorGraph.nodes
});
