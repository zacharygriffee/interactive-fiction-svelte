import test from "brittle";
import * as examples from "../examples/index.js";

test("public examples: expected example graphs exist", (t) => {
  t.ok(examples.defaultStoryGraph);
  t.ok(examples.terminalDossierGraph);
  t.ok(examples.shinobiDemoGraph);
  t.is(examples.defaultStoryGraph.startNodeId, "start");
  t.is(examples.terminalDossierGraph.startNodeId, "terminal_boot");
  t.is(examples.shinobiDemoGraph.startNodeId, "roofline");
});
