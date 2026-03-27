import test from "brittle";
import { validateGraph } from "../src/lib/story/dsl/validate.js";
import { storyGraph } from "../src/lib/story/graph.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function captureValidationError(run) {
  try {
    run();
    return null;
  } catch (error) {
    return error;
  }
}

test("dsl validate: valid graph passes", (t) => {
  validateGraph(storyGraph);
  t.pass();
});

test("dsl validate: missing start node throws with code/path", (t) => {
  const broken = clone(storyGraph);
  broken.startNodeId = "missing-node";

  const error = captureValidationError(() => validateGraph(broken));

  t.ok(error instanceof Error);
  t.is(error.code, "E_GRAPH_START_MISSING");
  t.is(error.path, "storyGraph.startNodeId");
  t.ok(/missing target node/.test(error.message));
});

test("dsl validate: choice target missing node throws with code/path", (t) => {
  const broken = clone(storyGraph);
  broken.nodesById.start.choices[0].to = "not-a-node";

  const error = captureValidationError(() => validateGraph(broken));

  t.ok(error instanceof Error);
  t.is(error.code, "E_CHOICE_TO_MISSING");
  t.is(error.path, "nodesById.start.choices[0].to");
  t.ok(/missing target node/.test(error.message));
});

test("dsl validate: unknown condition type throws with code/path", (t) => {
  const broken = clone(storyGraph);
  broken.nodesById.start.choices[0].requires = [{ type: "nope", key: "x" }];

  const error = captureValidationError(() => validateGraph(broken));

  t.ok(error instanceof Error);
  t.is(error.code, "E_CONDITION_UNKNOWN");
  t.is(error.path, "nodesById.start.choices[0].requires[0].type");
  t.ok(/unknown condition type/.test(error.message));
});

test("dsl validate: unknown effect type throws with code/path", (t) => {
  const broken = clone(storyGraph);
  broken.nodesById.start.choices[0].effects = [{ type: "explode", key: "x" }];

  const error = captureValidationError(() => validateGraph(broken));

  t.ok(error instanceof Error);
  t.is(error.code, "E_EFFECT_UNKNOWN");
  t.is(error.path, "nodesById.start.choices[0].effects[0].type");
  t.ok(/unknown effect type/.test(error.message));
});

test("dsl validate: duplicate choice ids within node throws", async (t) => {
  const broken = clone(storyGraph);
  const firstChoice = broken.nodesById.start.choices[0];
  broken.nodesById.start.choices.push({ ...firstChoice });

  await t.exception(() => {
    validateGraph(broken);
  }, /duplicate choice id/);
});

test("dsl validate: duplicate storylet ids within node throws", async (t) => {
  const broken = clone(storyGraph);
  const firstStorylet = broken.nodesById.start.storylets[0];
  broken.nodesById.start.storylets.push({ ...firstStorylet });

  await t.exception(() => {
    validateGraph(broken);
  }, /duplicate storylet id/);
});

test("dsl validate: requires and effects must be arrays", async (t) => {
  const brokenRequires = clone(storyGraph);
  brokenRequires.nodesById.start.choices[0].requires = { type: "flagTruthy", key: "a" };

  await t.exception(() => {
    validateGraph(brokenRequires);
  }, /requires.*array/);

  const brokenEffects = clone(storyGraph);
  brokenEffects.nodesById.start.choices[0].effects = { type: "inc", key: "x", by: 1 };

  await t.exception(() => {
    validateGraph(brokenEffects);
  }, /effects.*array/);
});

test("dsl validate: extended investigation conditions and effects validate", (t) => {
  const graph = clone(storyGraph);
  graph.nodesById.start.choices[0].requires = [
    { type: "not", condition: { type: "flagTruthy", key: "alreadyUsed" } },
    { type: "knowledge", key: "nexusPattern" },
    { type: "inventoryGte", key: "signalChip", value: 1 },
    { type: "relationshipGte", name: "zephyr", value: 2 },
    { type: "timerLte", key: "pursuit", value: 3 },
    { type: "sceneFlagEquals", scene: "archive", key: "terminalOpen", value: true },
    { type: "visitedNode", nodeId: "start" },
    { type: "choseChoice", choiceId: "inspect" }
  ];
  graph.nodesById.start.choices[0].effects = [
    { type: "addKnowledge", key: "nexusPattern" },
    { type: "addItem", key: "signalChip", amount: 1 },
    { type: "adjustRelationship", name: "zephyr", by: 1 },
    { type: "setTimer", key: "pursuit", value: 2 },
    { type: "advanceTimer", key: "pursuit", by: 1 },
    { type: "setSceneFlag", scene: "archive", key: "terminalOpen", value: true }
  ];

  validateGraph(graph);
  t.pass();
});

test("dsl validate: negated condition requires nested condition payload", (t) => {
  const graph = clone(storyGraph);
  graph.nodesById.start.choices[0].requires = [{ type: "not", condition: null }];

  const error = captureValidationError(() => validateGraph(graph));
  t.is(error?.code, "E_CONDITION_NOT_CHILD_INVALID");
});

test("dsl validate: extended conditions and effects require numeric payloads where expected", (t) => {
  const brokenCondition = clone(storyGraph);
  brokenCondition.nodesById.start.choices[0].requires = [{ type: "inventoryGte", key: "signalChip", value: "many" }];
  const conditionError = captureValidationError(() => validateGraph(brokenCondition));
  t.is(conditionError?.code, "E_CONDITION_VALUE_INVALID");

  const brokenEffect = clone(storyGraph);
  brokenEffect.nodesById.start.choices[0].effects = [{ type: "addItem", key: "signalChip", amount: "many" }];
  const effectError = captureValidationError(() => validateGraph(brokenEffect));
  t.is(effectError?.code, "E_EFFECT_AMOUNT_INVALID");
});

test("dsl validate: choice kind must be known", (t) => {
  const graph = clone(storyGraph);
  graph.nodesById.start.choices[0].kind = "teleport";

  const error = captureValidationError(() => validateGraph(graph));
  t.is(error?.code, "E_CHOICE_KIND_UNKNOWN");
});
