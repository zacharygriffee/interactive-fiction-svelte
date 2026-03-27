import test from "brittle";
import { storyGraph } from "../examples/terminal-dossier/graph.js";
import { validateGraph } from "../src/lib/story/dsl/validate.js";

function listStorylets(graph) {
  return Object.values(graph.nodesById).flatMap((node) => (Array.isArray(node.storylets) ? node.storylets : []));
}

function listChoices(graph) {
  return Object.values(graph.nodesById).flatMap((node) => (Array.isArray(node.choices) ? node.choices : []));
}

function hasConditionType(condition, type) {
  if (!condition || typeof condition !== "object") {
    return false;
  }
  if (condition.type === type) {
    return true;
  }
  return hasConditionType(condition.condition, type);
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
  t.ok(
    storylets.some((storylet) =>
      (storylet.requires ?? []).some((condition) => condition?.type === "knowledge")
    )
  );
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
    storylets.some((storylet) =>
      (storylet.requires ?? []).some((condition) => condition?.type === "relationshipGte")
    )
  );
  t.ok(
    choices.some((choice) =>
      (choice.effects ?? []).some((effect) => effect?.type === "addItem")
    )
  );
  t.ok(
    choices.some((choice) =>
      (choice.effects ?? []).some((effect) => effect?.type === "setSceneFlag")
    )
  );
  t.ok(
    choices.some((choice) =>
      (choice.effects ?? []).some((effect) => effect?.type === "adjustRelationship")
    )
  );
  t.ok(
    choices.some((choice) =>
      (choice.requires ?? []).some((condition) => hasConditionType(condition, "not"))
    )
  );
});
