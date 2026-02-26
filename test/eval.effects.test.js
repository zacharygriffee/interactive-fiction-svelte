import test from "brittle";
import { applyEffect, applyEffects } from "../src/lib/story/eval/effects.js";

test("effects: setFlag", (t) => {
  const state = { flags: {}, log: [], capabilities: {} };
  applyEffect({ type: "setFlag", key: "door", value: "open" }, state, { now: () => 1 });
  t.is(state.flags.door, "open");
});

test("effects: inc initializes and increments", (t) => {
  const state = { flags: {}, log: [], capabilities: {} };
  applyEffect({ type: "inc", key: "steps", by: 2 }, state, { now: () => 1 });
  t.is(state.flags.steps, 2);
  applyEffect({ type: "inc", key: "steps", by: 3 }, state, { now: () => 2 });
  t.is(state.flags.steps, 5);
});

test("effects: inc rejects non numeric", async (t) => {
  const state = { flags: { steps: "a lot" }, log: [], capabilities: {} };
  await t.exception(() => {
    applyEffect({ type: "inc", key: "steps", by: 1 }, state, { now: () => 3 });
  });
});

test("effects: pushLog uses injected clock", (t) => {
  const state = { flags: {}, log: [], capabilities: {} };
  applyEffect({ type: "pushLog", level: "info", text: "hello" }, state, { now: () => 42 });

  t.is(state.log.length, 1);
  t.alike(state.log[0], { level: "info", text: "hello", at: 42 });
});

test("effects: applyEffects sequence", (t) => {
  const state = { flags: {}, log: [], capabilities: {} };
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
  const state = { flags: {}, log: [], capabilities: {} };
  await t.exception(() => {
    applyEffect({ type: "unknown" }, state, { now: () => 1 });
  });
});

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
