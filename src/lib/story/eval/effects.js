import { EFFECT_TYPES } from "../types.js";

function ensureFiniteNumber(value, message) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(message);
  }
}

function ensureRecord(target, key) {
  if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
    target[key] = {};
  }
  return target[key];
}

export function applyEffect(effect, state, clock) {
  switch (effect?.type) {
    case EFFECT_TYPES.SET_FLAG: {
      state.flags[effect.key] = effect.value;
      return;
    }
    case EFFECT_TYPES.INC: {
      const hasKey = Object.prototype.hasOwnProperty.call(state.flags, effect.key);
      if (!hasKey) {
        state.flags[effect.key] = 0;
      }
      const current = state.flags[effect.key];
      if (typeof current !== "number" || Number.isNaN(current)) {
        throw new Error(`Cannot increment non-numeric flag: ${effect.key}`);
      }
      state.flags[effect.key] = current + effect.by;
      return;
    }
    case EFFECT_TYPES.PUSH_LOG: {
      state.log.push({
        level: effect.level,
        text: effect.text,
        at: clock.now()
      });
      return;
    }
    case EFFECT_TYPES.ADD_KNOWLEDGE: {
      ensureRecord(state, "knowledge");
      state.knowledge[effect.key] = true;
      return;
    }
    case EFFECT_TYPES.REMOVE_KNOWLEDGE: {
      ensureRecord(state, "knowledge");
      delete state.knowledge[effect.key];
      return;
    }
    case EFFECT_TYPES.ADD_ITEM: {
      ensureRecord(state, "inventory");
      const current = state.inventory[effect.key] ?? 0;
      ensureFiniteNumber(current, `Cannot add item to non-numeric inventory slot: ${effect.key}`);
      state.inventory[effect.key] = current + effect.amount;
      return;
    }
    case EFFECT_TYPES.REMOVE_ITEM: {
      ensureRecord(state, "inventory");
      const current = state.inventory[effect.key] ?? 0;
      ensureFiniteNumber(current, `Cannot remove item from non-numeric inventory slot: ${effect.key}`);
      state.inventory[effect.key] = Math.max(0, current - effect.amount);
      if (state.inventory[effect.key] === 0) {
        delete state.inventory[effect.key];
      }
      return;
    }
    case EFFECT_TYPES.ADJUST_RELATIONSHIP: {
      ensureRecord(state, "relationships");
      const current = state.relationships[effect.name] ?? 0;
      ensureFiniteNumber(current, `Cannot adjust non-numeric relationship: ${effect.name}`);
      state.relationships[effect.name] = current + effect.by;
      return;
    }
    case EFFECT_TYPES.SET_TIMER: {
      ensureRecord(state, "timers");
      state.timers[effect.key] = effect.value;
      return;
    }
    case EFFECT_TYPES.ADVANCE_TIMER: {
      ensureRecord(state, "timers");
      const current = state.timers[effect.key] ?? 0;
      ensureFiniteNumber(current, `Cannot advance non-numeric timer: ${effect.key}`);
      state.timers[effect.key] = current + effect.by;
      return;
    }
    case EFFECT_TYPES.SET_SCENE_FLAG: {
      ensureRecord(state, "sceneState");
      const scene = ensureRecord(state.sceneState, effect.scene);
      scene[effect.key] = effect.value;
      return;
    }
    default:
      throw new Error(`Unknown effect type: ${effect?.type}`);
  }
}

export function applyEffects(effects = [], state, clock) {
  for (const effect of effects) {
    applyEffect(effect, state, clock);
  }
}
