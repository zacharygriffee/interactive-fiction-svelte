import test from "brittle";
import { storyGraph } from "../examples/terminal-dossier/graph.js";
import { validateGraph } from "../src/lib/story/dsl/validate.js";

function listStorylets(graph) {
  return Object.values(graph.nodesById).flatMap((node) => (Array.isArray(node.storylets) ? node.storylets : []));
}

function listChoices(graph) {
  return Object.values(graph.nodesById).flatMap((node) => (Array.isArray(node.choices) ? node.choices : []));
}

test("terminal dossier example: graph validates", (t) => {
  validateGraph(storyGraph);

  t.is(typeof storyGraph.startNodeId, "string");
  t.ok(Boolean(storyGraph.nodesById[storyGraph.startNodeId]));
});

test("terminal dossier example: required mechanics are present", (t) => {
  const storylets = listStorylets(storyGraph);
  const choices = listChoices(storyGraph);

  t.ok(storylets.some((storylet) => storylet.once === true));
  t.ok(
    storylets.some((storylet) =>
      (storylet.requires ?? []).some(
        (condition) => condition?.type === "capability" && condition?.name === "cap.deepDossier"
      )
    )
  );
  t.ok(
    choices.some(
      (choice) => choice.to === undefined && Array.isArray(choice.effects) && choice.effects.length > 0
    )
  );
});
