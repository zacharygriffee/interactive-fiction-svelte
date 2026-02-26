import { EFFECT_TYPES } from "../types.js";

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
    default:
      throw new Error(`Unknown effect type: ${effect?.type}`);
  }
}

export function applyEffects(effects = [], state, clock) {
  for (const effect of effects) {
    applyEffect(effect, state, clock);
  }
}
