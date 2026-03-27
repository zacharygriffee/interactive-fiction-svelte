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
    history: [],
    intentLog: [],
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
  const state = { flags: { a: true, mode: "open" }, capabilities: { beta: true }, history: [], intentLog: [] };
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

test("conditions: negation wrapper inverts nested conditions", (t) => {
  const state = {
    flags: { a: true },
    capabilities: {},
    knowledge: { seen: true },
    inventory: { chip: 1 },
    history: [],
    intentLog: []
  };

  t.is(
    evaluateCondition(
      { type: "not", condition: { type: "flagTruthy", key: "missing" } },
      state
    ),
    true
  );
  t.is(
    evaluateCondition(
      { type: "not", condition: { type: "knowledge", key: "seen" } },
      state
    ),
    false
  );
  t.is(
    evaluateConditions(
      [
        { type: "inventoryHas", key: "chip" },
        { type: "not", condition: { type: "flagTruthy", key: "used" } }
      ],
      state
    ),
    true
  );
});

test("conditions: unknown condition throws", async (t) => {
  await t.exception(() => {
    evaluateCondition({ type: "unknown-type" }, { flags: {}, capabilities: {}, history: [], intentLog: [] });
  });
});

test("conditions: investigation-oriented state domains", (t) => {
  const state = {
    flags: { heat: 3 },
    capabilities: {},
    knowledge: { nexusPattern: true },
    inventory: { signalChip: 2 },
    relationships: { zephyr: 4 },
    timers: { pursuit: 2 },
    sceneState: {
      archive: {
        terminalOpen: true
      }
    },
    history: [
      { nodeId: "start", at: 1 },
      { nodeId: "archive", viaChoiceId: "to-archive", at: 2 }
    ],
    intentLog: [
      { type: "CHOOSE", payload: { choiceId: "to-archive" } },
      { type: "CHOOSE", payload: { choiceId: "probe-signal" } }
    ]
  };

  t.is(evaluateCondition({ type: "flagGte", key: "heat", value: 2 }, state), true);
  t.is(evaluateCondition({ type: "flagLte", key: "heat", value: 2 }, state), false);
  t.is(evaluateCondition({ type: "knowledge", key: "nexusPattern" }, state), true);
  t.is(evaluateCondition({ type: "inventoryHas", key: "signalChip" }, state), true);
  t.is(evaluateCondition({ type: "inventoryGte", key: "signalChip", value: 2 }, state), true);
  t.is(evaluateCondition({ type: "relationshipGte", name: "zephyr", value: 3 }, state), true);
  t.is(evaluateCondition({ type: "timerGte", key: "pursuit", value: 2 }, state), true);
  t.is(evaluateCondition({ type: "timerLte", key: "pursuit", value: 1 }, state), false);
  t.is(evaluateCondition({ type: "sceneFlagEquals", scene: "archive", key: "terminalOpen", value: true }, state), true);
  t.is(evaluateCondition({ type: "visitedNode", nodeId: "archive" }, state), true);
  t.is(evaluateCondition({ type: "choseChoice", choiceId: "probe-signal" }, state), true);
});
