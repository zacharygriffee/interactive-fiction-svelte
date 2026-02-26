import test from "brittle";
import { evaluateCondition, evaluateConditions } from "../src/lib/story/eval/conditions.js";

test("conditions: flagTruthy", (t) => {
  const state = { flags: { lit: true, dark: 0 }, capabilities: {} };
  t.is(evaluateCondition({ type: "flagTruthy", key: "lit" }, state), true);
  t.is(evaluateCondition({ type: "flagTruthy", key: "dark" }, state), false);
});

test("conditions: flagEquals", (t) => {
  const state = { flags: { stage: 2 }, capabilities: {} };
  t.is(evaluateCondition({ type: "flagEquals", key: "stage", value: 2 }, state), true);
  t.is(evaluateCondition({ type: "flagEquals", key: "stage", value: 3 }, state), false);
});

test("conditions: capability uses map semantics", (t) => {
  const state = {
    flags: {},
    capabilities: {
      admin: true,
      preview: false
    }
  };

  t.is(evaluateCondition({ type: "capability", name: "admin" }, state), true);
  t.is(evaluateCondition({ type: "capability", name: "preview" }, state), false);
  t.is(evaluateCondition({ type: "capability", name: "missing" }, state), false);
});

test("conditions: AND semantics", (t) => {
  const state = { flags: { a: true, mode: "open" }, capabilities: { beta: true } };
  t.is(
    evaluateConditions(
      [
        { type: "flagTruthy", key: "a" },
        { type: "flagEquals", key: "mode", value: "open" },
        { type: "capability", name: "beta" }
      ],
      state
    ),
    true
  );
  t.is(
    evaluateConditions(
      [
        { type: "flagTruthy", key: "a" },
        { type: "flagEquals", key: "mode", value: "closed" }
      ],
      state
    ),
    false
  );
});

test("conditions: unknown condition throws", async (t) => {
  await t.exception(() => {
    evaluateCondition({ type: "unknown-type" }, { flags: {}, capabilities: {} });
  });
});
