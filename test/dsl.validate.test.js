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
