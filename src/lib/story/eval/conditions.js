import { CONDITION_TYPES } from "../types.js";

function countInventory(state, key) {
  const value = state.inventory?.[key];
  return Number.isFinite(value) ? value : 0;
}

function readRelationship(state, name) {
  const value = state.relationships?.[name];
  return Number.isFinite(value) ? value : 0;
}

function readTimer(state, key) {
  const value = state.timers?.[key];
  return Number.isFinite(value) ? value : 0;
}

function readSceneValue(state, scene, key) {
  const sceneState = state.sceneState?.[scene];
  if (!sceneState || typeof sceneState !== "object" || Array.isArray(sceneState)) {
    return undefined;
  }
  return sceneState[key];
}

function hasVisitedNode(state, nodeId) {
  return Array.isArray(state.history) && state.history.some((entry) => entry?.nodeId === nodeId);
}

function hasChosenChoice(state, choiceId) {
  return Array.isArray(state.intentLog) && state.intentLog.some((event) => {
    return event?.type === "CHOOSE" && event?.payload?.choiceId === choiceId;
  });
}

function describeFailure(condition) {
  switch (condition?.type) {
    case CONDITION_TYPES.NOT: {
      const nested = describeFailure(condition.condition);
      const nestedMessage = nested?.message ?? "condition";
      const normalized = nestedMessage.startsWith("Requires ")
        ? nestedMessage.slice("Requires ".length)
        : nestedMessage;
      return { code: "negated-condition-failed", message: `Must not satisfy: ${normalized}` };
    }
    case CONDITION_TYPES.FLAG_TRUTHY:
      return { code: "flag-falsy", message: `Requires flag "${condition.key}"` };
    case CONDITION_TYPES.FLAG_EQUALS:
      return { code: "flag-not-equal", message: `Requires ${condition.key} = ${String(condition.value)}` };
    case CONDITION_TYPES.FLAG_GTE:
      return { code: "flag-too-low", message: `Requires ${condition.key} >= ${condition.value}` };
    case CONDITION_TYPES.FLAG_LTE:
      return { code: "flag-too-high", message: `Requires ${condition.key} <= ${condition.value}` };
    case CONDITION_TYPES.CAPABILITY:
      return { code: "capability-missing", message: `Requires capability "${condition.name}"` };
    case CONDITION_TYPES.KNOWLEDGE:
      return { code: "knowledge-missing", message: `Requires knowledge "${condition.key}"` };
    case CONDITION_TYPES.INVENTORY_HAS:
      return { code: "item-missing", message: `Requires item "${condition.key}"` };
    case CONDITION_TYPES.INVENTORY_GTE:
      return { code: "item-count-low", message: `Requires ${condition.key} x${condition.value}` };
    case CONDITION_TYPES.RELATIONSHIP_GTE:
      return { code: "relationship-low", message: `Requires ${condition.name} >= ${condition.value}` };
    case CONDITION_TYPES.TIMER_GTE:
      return { code: "timer-too-low", message: `Requires ${condition.key} >= ${condition.value}` };
    case CONDITION_TYPES.TIMER_LTE:
      return { code: "timer-too-high", message: `Requires ${condition.key} <= ${condition.value}` };
    case CONDITION_TYPES.SCENE_FLAG_EQUALS:
      return { code: "scene-flag-mismatch", message: `Requires ${condition.scene}.${condition.key} = ${String(condition.value)}` };
    case CONDITION_TYPES.VISITED_NODE:
      return { code: "node-not-visited", message: `Requires visiting "${condition.nodeId}"` };
    case CONDITION_TYPES.CHOSE_CHOICE:
      return { code: "choice-not-chosen", message: `Requires choosing "${condition.choiceId}" earlier` };
    default:
      return { code: "condition-failed", message: `Requirement failed: ${condition?.type}` };
  }
}

export function evaluateCondition(condition, state) {
  switch (condition?.type) {
    case CONDITION_TYPES.NOT:
      return !evaluateCondition(condition.condition, state);
    case CONDITION_TYPES.FLAG_TRUTHY:
      return Boolean(state.flags[condition.key]);
    case CONDITION_TYPES.FLAG_EQUALS:
      return state.flags[condition.key] === condition.value;
    case CONDITION_TYPES.FLAG_GTE:
      return Number(state.flags[condition.key] ?? 0) >= condition.value;
    case CONDITION_TYPES.FLAG_LTE:
      return Number(state.flags[condition.key] ?? 0) <= condition.value;
    case CONDITION_TYPES.CAPABILITY:
      return state.capabilities[condition.name] === true;
    case CONDITION_TYPES.KNOWLEDGE:
      return state.knowledge?.[condition.key] === true;
    case CONDITION_TYPES.INVENTORY_HAS:
      return countInventory(state, condition.key) > 0;
    case CONDITION_TYPES.INVENTORY_GTE:
      return countInventory(state, condition.key) >= condition.value;
    case CONDITION_TYPES.RELATIONSHIP_GTE:
      return readRelationship(state, condition.name) >= condition.value;
    case CONDITION_TYPES.TIMER_GTE:
      return readTimer(state, condition.key) >= condition.value;
    case CONDITION_TYPES.TIMER_LTE:
      return readTimer(state, condition.key) <= condition.value;
    case CONDITION_TYPES.SCENE_FLAG_EQUALS:
      return readSceneValue(state, condition.scene, condition.key) === condition.value;
    case CONDITION_TYPES.VISITED_NODE:
      return hasVisitedNode(state, condition.nodeId);
    case CONDITION_TYPES.CHOSE_CHOICE:
      return hasChosenChoice(state, condition.choiceId);
    default:
      throw new Error(`Unknown condition type: ${condition?.type}`);
  }
}

export function evaluateConditionDetail(condition, state) {
  const ok = evaluateCondition(condition, state);
  return ok
    ? { ok: true, condition }
    : { ok: false, condition, reason: describeFailure(condition) };
}

export function evaluateConditions(conditions = [], state) {
  for (const condition of conditions) {
    if (!evaluateCondition(condition, state)) {
      return false;
    }
  }
  return true;
}

export function evaluateConditionsDetailed(conditions = [], state) {
  const details = conditions.map((condition) => evaluateConditionDetail(condition, state));
  return {
    ok: details.every((detail) => detail.ok),
    details
  };
}
