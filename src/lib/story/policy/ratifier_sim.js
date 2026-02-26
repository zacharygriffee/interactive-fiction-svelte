import { ACTION_TYPES, EFFECT_TYPES, INTERNAL_ACTION_TYPES } from "../types.js";

function cloneEffects(effects = []) {
  return effects.map((effect) => ({ ...effect }));
}

function hasCapability(state, name) {
  return state.capabilities[name] === true;
}

function countChoicesIncludingCurrent(state, intentEvent) {
  let count = 0;

  for (const entry of state.history) {
    if (entry.viaChoiceId) {
      count += 1;
    }
  }

  if (intentEvent.type === ACTION_TYPES.CHOOSE) {
    count += 1;
  }

  return count;
}

function countCuriosityDelta(intentEvent) {
  if (intentEvent.type !== ACTION_TYPES.CHOOSE) {
    return 0;
  }

  const choiceId = String(intentEvent.payload?.choiceId ?? "");
  const choiceLabel = String(intentEvent.payload?.choiceLabel ?? "");

  if (choiceId.toLowerCase().includes("probe") || /probe/i.test(choiceLabel)) {
    return 1;
  }

  return 0;
}

function projectedCuriosity(state, effects, curiosityDelta) {
  let value = typeof state.flags.curiosity === "number" ? state.flags.curiosity : 0;

  for (const effect of effects) {
    if (effect.type === EFFECT_TYPES.INC && effect.key === "curiosity") {
      value += effect.by;
    }
  }

  return value + curiosityDelta;
}

export function createRatifierSim({ graph, clock, config = {} } = {}) {
  void graph;
  void clock;
  void config;

  return {
    ratifyIntent({ state, intentEvent }) {
      const baseEffects = cloneEffects(intentEvent?.payload?.effects ?? []);
      const effects = [...baseEffects];
      const grants = [];
      let reason;

      const curiosityDelta = countCuriosityDelta(intentEvent);
      if (curiosityDelta > 0) {
        effects.push({
          type: EFFECT_TYPES.INC,
          key: "curiosity",
          by: curiosityDelta
        });
      }

      if (
        intentEvent.type === INTERNAL_ACTION_TYPES.REVEAL_STORYLETS &&
        Array.isArray(intentEvent.payload?.storyletIds) &&
        intentEvent.payload.storyletIds.length > 0
      ) {
        reason = "storylet-reveal";
      }

      const choicesMade = countChoicesIncludingCurrent(state, intentEvent);
      if (choicesMade >= 2 && !hasCapability(state, "cap.askAgent")) {
        grants.push("cap.askAgent");
      }

      const curiosity = projectedCuriosity(state, effects, 0);
      if (curiosity >= 2 && !hasCapability(state, "cap.deepDossier")) {
        grants.push("cap.deepDossier");
      }

      return {
        effects,
        grants,
        reason
      };
    }
  };
}
