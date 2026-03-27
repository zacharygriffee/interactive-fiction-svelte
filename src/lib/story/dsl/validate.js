import { CHOICE_KINDS, CONDITION_TYPES, EFFECT_TYPES } from "../types.js";

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function nearest(value, candidates) {
  if (typeof value !== "string" || value.length === 0 || candidates.length === 0) {
    return null;
  }

  let best = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshtein(value, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return bestDistance <= 4 ? best : null;
}

function createValidationError({ code, path, message, hint }) {
  const error = new Error(`${path}: ${message}`);
  error.code = code;
  error.path = path;
  if (hint) {
    error.hint = hint;
  }
  return error;
}

function fail(details) {
  throw createValidationError(details);
}

function assertRecord(value, path, code) {
  if (!isRecord(value)) {
    fail({ code, path, message: "must be an object" });
  }
}

function assertArray(value, path, code) {
  if (!Array.isArray(value)) {
    fail({ code, path, message: "must be an array" });
  }
}

function assertString(value, path, code) {
  if (typeof value !== "string" || value.length === 0) {
    fail({ code, path, message: "must be a non-empty string" });
  }
}

function assertOptionalString(value, path, code) {
  if (value !== undefined) {
    assertString(value, path, code);
  }
}

function assertOptionalArray(value, path, code) {
  if (value !== undefined) {
    assertArray(value, path, code);
  }
}

function validateCondition(condition, path) {
  assertRecord(condition, path, "E_CONDITION_NOT_OBJECT");
  assertString(condition.type, `${path}.type`, "E_CONDITION_TYPE_INVALID");

  switch (condition.type) {
    case CONDITION_TYPES.NOT:
      assertRecord(condition.condition, `${path}.condition`, "E_CONDITION_NOT_CHILD_INVALID");
      validateCondition(condition.condition, `${path}.condition`);
      return;
    case CONDITION_TYPES.FLAG_TRUTHY:
      assertString(condition.key, `${path}.key`, "E_CONDITION_KEY_INVALID");
      return;
    case CONDITION_TYPES.FLAG_EQUALS:
      assertString(condition.key, `${path}.key`, "E_CONDITION_KEY_INVALID");
      return;
    case CONDITION_TYPES.FLAG_GTE:
    case CONDITION_TYPES.FLAG_LTE:
      assertString(condition.key, `${path}.key`, "E_CONDITION_KEY_INVALID");
      if (!Number.isFinite(condition.value)) {
        fail({
          code: "E_CONDITION_VALUE_INVALID",
          path: `${path}.value`,
          message: "must be a finite number"
        });
      }
      return;
    case CONDITION_TYPES.CAPABILITY:
      assertString(condition.name, `${path}.name`, "E_CONDITION_NAME_INVALID");
      return;
    case CONDITION_TYPES.KNOWLEDGE:
    case CONDITION_TYPES.INVENTORY_HAS:
      assertString(condition.key, `${path}.key`, "E_CONDITION_KEY_INVALID");
      return;
    case CONDITION_TYPES.INVENTORY_GTE:
      assertString(condition.key, `${path}.key`, "E_CONDITION_KEY_INVALID");
      if (!Number.isFinite(condition.value)) {
        fail({
          code: "E_CONDITION_VALUE_INVALID",
          path: `${path}.value`,
          message: "must be a finite number"
        });
      }
      return;
    case CONDITION_TYPES.RELATIONSHIP_GTE:
      assertString(condition.name, `${path}.name`, "E_CONDITION_NAME_INVALID");
      if (!Number.isFinite(condition.value)) {
        fail({
          code: "E_CONDITION_VALUE_INVALID",
          path: `${path}.value`,
          message: "must be a finite number"
        });
      }
      return;
    case CONDITION_TYPES.TIMER_GTE:
    case CONDITION_TYPES.TIMER_LTE:
      assertString(condition.key, `${path}.key`, "E_CONDITION_KEY_INVALID");
      if (!Number.isFinite(condition.value)) {
        fail({
          code: "E_CONDITION_VALUE_INVALID",
          path: `${path}.value`,
          message: "must be a finite number"
        });
      }
      return;
    case CONDITION_TYPES.SCENE_FLAG_EQUALS:
      assertString(condition.scene, `${path}.scene`, "E_CONDITION_SCENE_INVALID");
      assertString(condition.key, `${path}.key`, "E_CONDITION_KEY_INVALID");
      return;
    case CONDITION_TYPES.VISITED_NODE:
      assertString(condition.nodeId, `${path}.nodeId`, "E_CONDITION_NODE_ID_INVALID");
      return;
    case CONDITION_TYPES.CHOSE_CHOICE:
      assertString(condition.choiceId, `${path}.choiceId`, "E_CONDITION_CHOICE_ID_INVALID");
      return;
    default: {
      const candidates = Object.values(CONDITION_TYPES);
      const suggestion = nearest(condition.type, candidates);
      fail({
        code: "E_CONDITION_UNKNOWN",
        path: `${path}.type`,
        message: `unknown condition type \"${condition.type}\"`,
        hint: suggestion
          ? `Did you mean \"${suggestion}\"? Expected one of: ${candidates.join(", ")}`
          : `Expected one of: ${candidates.join(", ")}`
      });
    }
  }
}

function validateEffect(effect, path) {
  assertRecord(effect, path, "E_EFFECT_NOT_OBJECT");
  assertString(effect.type, `${path}.type`, "E_EFFECT_TYPE_INVALID");

  switch (effect.type) {
    case EFFECT_TYPES.SET_FLAG:
      assertString(effect.key, `${path}.key`, "E_EFFECT_KEY_INVALID");
      return;
    case EFFECT_TYPES.INC:
      assertString(effect.key, `${path}.key`, "E_EFFECT_KEY_INVALID");
      if (!Number.isFinite(effect.by)) {
        fail({
          code: "E_EFFECT_BY_INVALID",
          path: `${path}.by`,
          message: "must be a finite number"
        });
      }
      return;
    case EFFECT_TYPES.PUSH_LOG:
      assertString(effect.level, `${path}.level`, "E_EFFECT_LEVEL_INVALID");
      assertString(effect.text, `${path}.text`, "E_EFFECT_TEXT_INVALID");
      return;
    case EFFECT_TYPES.ADD_KNOWLEDGE:
    case EFFECT_TYPES.REMOVE_KNOWLEDGE:
      assertString(effect.key, `${path}.key`, "E_EFFECT_KEY_INVALID");
      return;
    case EFFECT_TYPES.ADD_ITEM:
    case EFFECT_TYPES.REMOVE_ITEM:
      assertString(effect.key, `${path}.key`, "E_EFFECT_KEY_INVALID");
      if (!Number.isFinite(effect.amount)) {
        fail({
          code: "E_EFFECT_AMOUNT_INVALID",
          path: `${path}.amount`,
          message: "must be a finite number"
        });
      }
      return;
    case EFFECT_TYPES.ADJUST_RELATIONSHIP:
      assertString(effect.name, `${path}.name`, "E_EFFECT_NAME_INVALID");
      if (!Number.isFinite(effect.by)) {
        fail({
          code: "E_EFFECT_BY_INVALID",
          path: `${path}.by`,
          message: "must be a finite number"
        });
      }
      return;
    case EFFECT_TYPES.SET_TIMER:
      assertString(effect.key, `${path}.key`, "E_EFFECT_KEY_INVALID");
      if (!Number.isFinite(effect.value)) {
        fail({
          code: "E_EFFECT_VALUE_INVALID",
          path: `${path}.value`,
          message: "must be a finite number"
        });
      }
      return;
    case EFFECT_TYPES.ADVANCE_TIMER:
      assertString(effect.key, `${path}.key`, "E_EFFECT_KEY_INVALID");
      if (!Number.isFinite(effect.by)) {
        fail({
          code: "E_EFFECT_BY_INVALID",
          path: `${path}.by`,
          message: "must be a finite number"
        });
      }
      return;
    case EFFECT_TYPES.SET_SCENE_FLAG:
      assertString(effect.scene, `${path}.scene`, "E_EFFECT_SCENE_INVALID");
      assertString(effect.key, `${path}.key`, "E_EFFECT_KEY_INVALID");
      return;
    default: {
      const candidates = Object.values(EFFECT_TYPES);
      const suggestion = nearest(effect.type, candidates);
      fail({
        code: "E_EFFECT_UNKNOWN",
        path: `${path}.type`,
        message: `unknown effect type \"${effect.type}\"`,
        hint: suggestion
          ? `Did you mean \"${suggestion}\"? Expected one of: ${candidates.join(", ")}`
          : `Expected one of: ${candidates.join(", ")}`
      });
    }
  }
}

function validateChoice(choice, nodeId, index, nodesById) {
  const path = `nodesById.${nodeId}.choices[${index}]`;

  assertRecord(choice, path, "E_CHOICE_NOT_OBJECT");
  assertString(choice.id, `${path}.id`, "E_CHOICE_ID_INVALID");
  assertString(choice.label, `${path}.label`, "E_CHOICE_LABEL_INVALID");
  assertOptionalString(choice.to, `${path}.to`, "E_CHOICE_TO_INVALID");
  assertOptionalString(choice.kind, `${path}.kind`, "E_CHOICE_KIND_INVALID");

  if (choice.kind !== undefined && !Object.values(CHOICE_KINDS).includes(choice.kind)) {
    fail({
      code: "E_CHOICE_KIND_UNKNOWN",
      path: `${path}.kind`,
      message: `unknown choice kind "${choice.kind}"`
    });
  }

  if (choice.to !== undefined && !nodesById[choice.to]) {
    fail({
      code: "E_CHOICE_TO_MISSING",
      path: `${path}.to`,
      message: `missing target node \"${choice.to}\"`
    });
  }

  assertOptionalArray(choice.requires, `${path}.requires`, "E_CHOICE_REQUIRES_INVALID");
  if (choice.requires) {
    for (let conditionIndex = 0; conditionIndex < choice.requires.length; conditionIndex += 1) {
      validateCondition(choice.requires[conditionIndex], `${path}.requires[${conditionIndex}]`);
    }
  }

  assertOptionalArray(choice.effects, `${path}.effects`, "E_CHOICE_EFFECTS_INVALID");
  if (choice.effects) {
    for (let effectIndex = 0; effectIndex < choice.effects.length; effectIndex += 1) {
      validateEffect(choice.effects[effectIndex], `${path}.effects[${effectIndex}]`);
    }
  }
}

function validateStorylet(storylet, nodeId, index) {
  const path = `nodesById.${nodeId}.storylets[${index}]`;

  assertRecord(storylet, path, "E_STORYLET_NOT_OBJECT");
  assertString(storylet.id, `${path}.id`, "E_STORYLET_ID_INVALID");
  assertString(storylet.body, `${path}.body`, "E_STORYLET_BODY_INVALID");

  assertOptionalArray(storylet.requires, `${path}.requires`, "E_STORYLET_REQUIRES_INVALID");
  if (storylet.requires) {
    for (let conditionIndex = 0; conditionIndex < storylet.requires.length; conditionIndex += 1) {
      validateCondition(storylet.requires[conditionIndex], `${path}.requires[${conditionIndex}]`);
    }
  }

  if (storylet.priority !== undefined && !Number.isFinite(storylet.priority)) {
    fail({
      code: "E_STORYLET_PRIORITY_INVALID",
      path: `${path}.priority`,
      message: "must be a finite number"
    });
  }

  if (storylet.once !== undefined && typeof storylet.once !== "boolean") {
    fail({
      code: "E_STORYLET_ONCE_INVALID",
      path: `${path}.once`,
      message: "must be a boolean"
    });
  }

  assertOptionalArray(
    storylet.effectsOnReveal,
    `${path}.effectsOnReveal`,
    "E_STORYLET_EFFECTS_REVEAL_INVALID"
  );
  if (storylet.effectsOnReveal) {
    for (let effectIndex = 0; effectIndex < storylet.effectsOnReveal.length; effectIndex += 1) {
      validateEffect(storylet.effectsOnReveal[effectIndex], `${path}.effectsOnReveal[${effectIndex}]`);
    }
  }
}

export function validateGraph(storyGraph) {
  assertRecord(storyGraph, "storyGraph", "E_GRAPH_NOT_OBJECT");

  const { startNodeId, nodesById } = storyGraph;

  assertString(startNodeId, "storyGraph.startNodeId", "E_GRAPH_START_INVALID");
  assertRecord(nodesById, "storyGraph.nodesById", "E_GRAPH_NODES_INVALID");

  if (!nodesById[startNodeId]) {
    fail({
      code: "E_GRAPH_START_MISSING",
      path: "storyGraph.startNodeId",
      message: `missing target node \"${startNodeId}\"`,
      hint: "Ensure startNodeId matches a key in nodesById"
    });
  }

  for (const [nodeId, node] of Object.entries(nodesById)) {
    const path = `nodesById.${nodeId}`;

    assertRecord(node, path, "E_NODE_NOT_OBJECT");
    assertString(node.id, `${path}.id`, "E_NODE_ID_INVALID");

    if (node.id !== nodeId) {
      fail({
        code: "E_NODE_ID_MISMATCH",
        path: `${path}.id`,
        message: `must match node key \"${nodeId}\"`
      });
    }

    if (!Array.isArray(node.choices)) {
      fail({
        code: "E_NODE_CHOICES_INVALID",
        path: `${path}.choices`,
        message: "must be an array"
      });
    }

    const choiceIds = new Set();
    for (let choiceIndex = 0; choiceIndex < node.choices.length; choiceIndex += 1) {
      const choice = node.choices[choiceIndex];
      validateChoice(choice, nodeId, choiceIndex, nodesById);
      if (choiceIds.has(choice.id)) {
        fail({
          code: "E_CHOICE_DUPLICATE_ID",
          path: `${path}.choices[${choiceIndex}].id`,
          message: `duplicate choice id \"${choice.id}\"`
        });
      }
      choiceIds.add(choice.id);
    }

    if (node.storylets !== undefined) {
      if (!Array.isArray(node.storylets)) {
        fail({
          code: "E_NODE_STORYLETS_INVALID",
          path: `${path}.storylets`,
          message: "must be an array when provided"
        });
      }

      const storyletIds = new Set();
      for (let storyletIndex = 0; storyletIndex < node.storylets.length; storyletIndex += 1) {
        const storylet = node.storylets[storyletIndex];
        validateStorylet(storylet, nodeId, storyletIndex);
        if (storyletIds.has(storylet.id)) {
          fail({
            code: "E_STORYLET_DUPLICATE_ID",
            path: `${path}.storylets[${storyletIndex}].id`,
            message: `duplicate storylet id \"${storylet.id}\"`
          });
        }
        storyletIds.add(storylet.id);
      }
    }
  }
}
