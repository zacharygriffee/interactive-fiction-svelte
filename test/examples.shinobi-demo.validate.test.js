import test from "brittle";
import { storyGraph } from "../examples/shinobi-demo/graph.js";
import { validateGraph } from "../src/lib/story/dsl/validate.js";

function listStorylets(graph) {
  return Object.values(graph.nodesById).flatMap((node) => (Array.isArray(node.storylets) ? node.storylets : []));
}

function listChoices(graph) {
  return Object.values(graph.nodesById).flatMap((node) => (Array.isArray(node.choices) ? node.choices : []));
}

test("shinobi demo example: graph validates", (t) => {
  validateGraph(storyGraph);

  t.is(typeof storyGraph.startNodeId, "string");
  t.ok(Boolean(storyGraph.nodesById[storyGraph.startNodeId]));
});

test("shinobi demo example: extended investigation mechanics are present", (t) => {
  const storylets = listStorylets(storyGraph);
  const choices = listChoices(storyGraph);

  t.ok(
    storylets.some((storylet) =>
      (storylet.requires ?? []).some((condition) => condition?.type === "visitedNode")
    )
  );
  t.ok(
    storylets.some((storylet) =>
      (storylet.requires ?? []).some((condition) => condition?.type === "choseChoice")
    )
  );
  t.ok(
    choices.some((choice) =>
      (choice.effects ?? []).some((effect) => effect?.type === "addKnowledge")
    )
  );
  t.ok(
    choices.some((choice) =>
      (choice.effects ?? []).some((effect) => effect?.type === "adjustRelationship")
    )
  );
  t.ok(
    choices.some((choice) =>
      (choice.effects ?? []).some((effect) => effect?.type === "setSceneFlag")
    )
  );
});
