import test from "brittle";
import { createRatifierSim } from "../src/lib/story/policy/ratifier_sim.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { createStoryGraph } from "./fixtures/story.fixture.js";

function baseState(overrides = {}) {
  return {
    history: [{ nodeId: "start", at: 1 }],
    flags: {},
    capabilities: {},
    ...overrides
  };
}

test("ratifier sim: probe by id increments curiosity", (t) => {
  const ratifier = createRatifierSim({ graph: createStoryGraph(), clock: { now: () => 1 } });

  const result = ratifier.ratifyIntent({
    state: baseState(),
    intentEvent: {
      type: ACTION_TYPES.CHOOSE,
      payload: {
        choiceId: "probe-signal",
        choiceLabel: "Inspect",
        effects: []
      }
    }
  });

  t.alike(result.effects, [{ type: "inc", key: "curiosity", by: 1 }]);
  t.alike(result.grants, []);
});

test("ratifier sim: probe by label increments curiosity", (t) => {
  const ratifier = createRatifierSim({ graph: createStoryGraph(), clock: { now: () => 1 } });

  const result = ratifier.ratifyIntent({
    state: baseState(),
    intentEvent: {
      type: ACTION_TYPES.CHOOSE,
      payload: {
        choiceId: "inspect",
        choiceLabel: "Probe artifact",
        effects: []
      }
    }
  });

  t.is(result.effects.length, 1);
  t.is(result.effects[0].key, "curiosity");
});

test("ratifier sim: grants askAgent after second choice", (t) => {
  const ratifier = createRatifierSim({ graph: createStoryGraph(), clock: { now: () => 1 } });

  const state = baseState({
    history: [
      { nodeId: "start", at: 1 },
      { nodeId: "start", viaChoiceId: "reflect", at: 2 }
    ]
  });

  const result = ratifier.ratifyIntent({
    state,
    intentEvent: {
      type: ACTION_TYPES.CHOOSE,
      payload: {
        choiceId: "to-grove",
        choiceLabel: "Go to grove",
        effects: []
      }
    }
  });

  t.ok(result.grants.includes("cap.askAgent"));
});

test("ratifier sim: grants deepDossier when curiosity reaches threshold", (t) => {
  const ratifier = createRatifierSim({ graph: createStoryGraph(), clock: { now: () => 1 } });

  const result = ratifier.ratifyIntent({
    state: baseState({
      flags: {
        curiosity: 1
      }
    }),
    intentEvent: {
      type: ACTION_TYPES.CHOOSE,
      payload: {
        choiceId: "probe-signal",
        choiceLabel: "Probe signal",
        effects: []
      }
    }
  });

  t.ok(result.grants.includes("cap.deepDossier"));
});

test("ratifier sim: deterministic output for same input", (t) => {
  const ratifier = createRatifierSim({ graph: createStoryGraph(), clock: { now: () => 1 } });

  const inputState = baseState({
    flags: { curiosity: 1 },
    history: [
      { nodeId: "start", at: 1 },
      { nodeId: "start", viaChoiceId: "reflect", at: 2 }
    ]
  });
  const inputIntent = {
    type: ACTION_TYPES.CHOOSE,
    payload: {
      choiceId: "probe-signal",
      choiceLabel: "Probe signal",
      effects: []
    }
  };

  const first = ratifier.ratifyIntent({
    state: inputState,
    intentEvent: inputIntent
  });
  const second = ratifier.ratifyIntent({
    state: inputState,
    intentEvent: inputIntent
  });

  t.alike(first, second);
});
