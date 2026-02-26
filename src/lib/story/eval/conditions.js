import { CONDITION_TYPES } from "../types.js";

export function evaluateCondition(condition, state) {
  switch (condition?.type) {
    case CONDITION_TYPES.FLAG_TRUTHY:
      return Boolean(state.flags[condition.key]);
    case CONDITION_TYPES.FLAG_EQUALS:
      return state.flags[condition.key] === condition.value;
    case CONDITION_TYPES.CAPABILITY:
      return state.capabilities[condition.name] === true;
    default:
      throw new Error(`Unknown condition type: ${condition?.type}`);
  }
}

export function evaluateConditions(conditions = [], state) {
  for (const condition of conditions) {
    if (!evaluateCondition(condition, state)) {
      return false;
    }
  }
  return true;
}
