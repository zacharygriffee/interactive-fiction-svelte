import test from "brittle";
import { applyEffect, applyEffects } from "../src/lib/story/eval/effects.js";

test("effects: setFlag", (t) => {
  const state = createState();
  applyEffect({ type: "setFlag", key: "door", value: "open" }, state, { now: () => 1 });
  t.is(state.flags.door, "open");
});

test("effects: inc initializes and increments", (t) => {
  const state = createState();
  applyEffect({ type: "inc", key: "steps", by: 2 }, state, { now: () => 1 });
  t.is(state.flags.steps, 2);
  applyEffect({ type: "inc", key: "steps", by: 3 }, state, { now: () => 2 });
  t.is(state.flags.steps, 5);
});

test("effects: inc rejects non numeric", async (t) => {
  const state = createState({ flags: { steps: "a lot" } });
  await t.exception(() => {
    applyEffect({ type: "inc", key: "steps", by: 1 }, state, { now: () => 3 });
  });
});

test("effects: pushLog uses injected clock", (t) => {
  const state = createState();
  applyEffect({ type: "pushLog", level: "info", text: "hello" }, state, { now: () => 42 });

  t.is(state.log.length, 1);
  t.alike(state.log[0], { level: "info", text: "hello", at: 42 });
});

test("effects: applyEffects sequence", (t) => {
  const state = createState();
  const clock = createSequenceClock([7, 8]);

  applyEffects(
    [
      { type: "setFlag", key: "a", value: 1 },
      { type: "inc", key: "a", by: 2 },
      { type: "pushLog", level: "debug", text: "done" }
    ],
    state,
    clock
  );

  t.is(state.flags.a, 3);
  t.is(state.log[0].at, 7);
  t.is(state.log[0].text, "done");
});

test("effects: unknown effect throws", async (t) => {
  const state = createState();
  await t.exception(() => {
    applyEffect({ type: "unknown" }, state, { now: () => 1 });
  });
});

test("effects: extended state domains mutate deterministically", (t) => {
  const state = createState({
    inventory: { signalChip: 1 },
    relationships: { zephyr: 2 },
    timers: { pursuit: 3 }
  });

  applyEffects(
    [
      { type: "addKnowledge", key: "nexusPattern" },
      { type: "addItem", key: "signalChip", amount: 2 },
      { type: "removeItem", key: "signalChip", amount: 1 },
      { type: "adjustRelationship", name: "zephyr", by: 3 },
      { type: "setTimer", key: "window", value: 4 },
      { type: "advanceTimer", key: "pursuit", by: 2 },
      { type: "setSceneFlag", scene: "archive", key: "terminalOpen", value: true },
      { type: "removeKnowledge", key: "nexusPattern" }
    ],
    state,
    { now: () => 10 }
  );

  t.absent(state.knowledge.nexusPattern);
  t.is(state.inventory.signalChip, 2);
  t.is(state.relationships.zephyr, 5);
  t.is(state.timers.window, 4);
  t.is(state.timers.pursuit, 5);
  t.alike(state.sceneState.archive, { terminalOpen: true });
});

function createState(overrides = {}) {
  return {
    flags: {},
    log: [],
    capabilities: {},
    knowledge: {},
    inventory: {},
    relationships: {},
    timers: {},
    sceneState: {},
    ...overrides
  };
}

function createSequenceClock(values) {
  let index = 0;
  return {
    now() {
      const value = values[index] ?? values[values.length - 1];
      index += 1;
      return value;
    }
  };
}
