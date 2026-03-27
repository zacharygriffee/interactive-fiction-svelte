function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertString(value, path) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function assertArray(value, path) {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
}

function assertRecord(value, path) {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }
}

function copyArray(value) {
  return value.map((item) => item);
}

export function body(text) {
  assertString(text, "body(text)");
  return { body: text };
}

export function tags(...names) {
  if (names.length === 0) {
    throw new Error("tags(...names) requires at least one tag");
  }

  for (let index = 0; index < names.length; index += 1) {
    assertString(names[index], `tags(...names)[${index}]`);
  }

  return { tags: [...names] };
}

export function choices(arrayOfChoices) {
  assertArray(arrayOfChoices, "choices(arrayOfChoices)");
  return { choices: copyArray(arrayOfChoices) };
}

export function storylets(arrayOfStorylets) {
  assertArray(arrayOfStorylets, "storylets(arrayOfStorylets)");
  return { storylets: copyArray(arrayOfStorylets) };
}

const CHOICE_ALLOWED_OPTS = new Set(["requires", "effects", "kind"]);

export function choice(id, label, to, opts = {}) {
  assertString(id, "choice(id, label, to, opts): id");
  assertString(label, "choice(id, label, to, opts): label");

  if (to !== undefined) {
    assertString(to, "choice(id, label, to, opts): to");
  }

  assertRecord(opts, "choice(id, label, to, opts): opts");

  for (const key of Object.keys(opts)) {
    if (!CHOICE_ALLOWED_OPTS.has(key)) {
      throw new Error(`choice(..., opts) received unsupported option "${key}"`);
    }
  }

  if (opts.requires !== undefined) {
    assertArray(opts.requires, "choice(...).opts.requires");
  }
  if (opts.effects !== undefined) {
    assertArray(opts.effects, "choice(...).opts.effects");
  }
  if (opts.kind !== undefined) {
    assertString(opts.kind, "choice(...).opts.kind");
  }

  const result = {
    id,
    label
  };

  if (to !== undefined) {
    result.to = to;
  }
  if (opts.requires !== undefined) {
    result.requires = copyArray(opts.requires);
  }
  if (opts.effects !== undefined) {
    result.effects = copyArray(opts.effects);
  }
  if (opts.kind !== undefined) {
    result.kind = opts.kind;
  }

  return result;
}

const STORYLET_ALLOWED_OPTS = new Set(["requires", "priority", "once", "effectsOnReveal"]);

export function storylet(id, textBody, opts = {}) {
  assertString(id, "storylet(id, body, opts): id");
  assertString(textBody, "storylet(id, body, opts): body");
  assertRecord(opts, "storylet(id, body, opts): opts");

  for (const key of Object.keys(opts)) {
    if (!STORYLET_ALLOWED_OPTS.has(key)) {
      throw new Error(`storylet(..., opts) received unsupported option "${key}"`);
    }
  }

  if (opts.requires !== undefined) {
    assertArray(opts.requires, "storylet(...).opts.requires");
  }
  if (opts.priority !== undefined && !Number.isFinite(opts.priority)) {
    throw new Error("storylet(...).opts.priority must be a finite number");
  }
  if (opts.once !== undefined && typeof opts.once !== "boolean") {
    throw new Error("storylet(...).opts.once must be a boolean");
  }
  if (opts.effectsOnReveal !== undefined) {
    assertArray(opts.effectsOnReveal, "storylet(...).opts.effectsOnReveal");
  }

  const result = {
    id,
    body: textBody
  };

  if (opts.requires !== undefined) {
    result.requires = copyArray(opts.requires);
  }
  if (opts.priority !== undefined) {
    result.priority = opts.priority;
  }
  if (opts.once !== undefined) {
    result.once = opts.once;
  }
  if (opts.effectsOnReveal !== undefined) {
    result.effectsOnReveal = copyArray(opts.effectsOnReveal);
  }

  return result;
}

export function node(id, partsArray) {
  assertString(id, "node(id, partsArray): id");
  assertArray(partsArray, "node(id, partsArray): partsArray");

  const compiled = {
    id,
    choices: []
  };

  for (let index = 0; index < partsArray.length; index += 1) {
    const part = partsArray[index];
    assertRecord(part, `node(${id}) parts[${index}]`);

    for (const [key, value] of Object.entries(part)) {
      if (key === "choices") {
        assertArray(value, `node(${id}).choices`);
        compiled.choices = copyArray(value);
        continue;
      }

      if (key === "storylets") {
        assertArray(value, `node(${id}).storylets`);
        compiled.storylets = copyArray(value);
        continue;
      }

      if (key === "tags") {
        assertArray(value, `node(${id}).tags`);
        compiled.tags = copyArray(value);
        continue;
      }

      compiled[key] = value;
    }
  }

  return compiled;
}

export function graph({ start, nodes }) {
  assertString(start, "graph({ start, nodes }).start");
  assertArray(nodes, "graph({ start, nodes }).nodes");

  const nodesById = {};

  for (let index = 0; index < nodes.length; index += 1) {
    const item = nodes[index];
    assertRecord(item, `graph nodes[${index}]`);
    assertString(item.id, `graph nodes[${index}].id`);

    if (nodesById[item.id]) {
      throw new Error(`graph(...) received duplicate node id "${item.id}"`);
    }

    nodesById[item.id] = {
      ...item,
      id: item.id,
      choices: Array.isArray(item.choices) ? copyArray(item.choices) : []
    };
  }

  return {
    startNodeId: start,
    nodesById
  };
}

export const requires = {
  not(condition) {
    assertRecord(condition, "requires.not(condition)");
    assertString(condition.type, "requires.not(condition): condition.type");
    return {
      type: "not",
      condition
    };
  },
  flag(key) {
    assertString(key, "requires.flag(key)");
    return {
      type: "flagTruthy",
      key
    };
  },
  eq(key, value) {
    assertString(key, "requires.eq(key, value): key");
    return {
      type: "flagEquals",
      key,
      value
    };
  },
  gte(key, value) {
    assertString(key, "requires.gte(key, value): key");
    if (!Number.isFinite(value)) {
      throw new Error("requires.gte(key, value): value must be a finite number");
    }
    return {
      type: "flagGte",
      key,
      value
    };
  },
  lte(key, value) {
    assertString(key, "requires.lte(key, value): key");
    if (!Number.isFinite(value)) {
      throw new Error("requires.lte(key, value): value must be a finite number");
    }
    return {
      type: "flagLte",
      key,
      value
    };
  },
  cap(name) {
    assertString(name, "requires.cap(name)");
    return {
      type: "capability",
      name
    };
  },
  knowledge(key) {
    assertString(key, "requires.knowledge(key)");
    return {
      type: "knowledge",
      key
    };
  },
  item(key) {
    assertString(key, "requires.item(key)");
    return {
      type: "inventoryHas",
      key
    };
  },
  itemCount(key, count) {
    assertString(key, "requires.itemCount(key, count): key");
    if (!Number.isFinite(count)) {
      throw new Error("requires.itemCount(key, count): count must be a finite number");
    }
    return {
      type: "inventoryGte",
      key,
      value: count
    };
  },
  relationship(name, value) {
    assertString(name, "requires.relationship(name, value): name");
    if (!Number.isFinite(value)) {
      throw new Error("requires.relationship(name, value): value must be a finite number");
    }
    return {
      type: "relationshipGte",
      name,
      value
    };
  },
  timerAtLeast(key, value) {
    assertString(key, "requires.timerAtLeast(key, value): key");
    if (!Number.isFinite(value)) {
      throw new Error("requires.timerAtLeast(key, value): value must be a finite number");
    }
    return {
      type: "timerGte",
      key,
      value
    };
  },
  timerAtMost(key, value) {
    assertString(key, "requires.timerAtMost(key, value): key");
    if (!Number.isFinite(value)) {
      throw new Error("requires.timerAtMost(key, value): value must be a finite number");
    }
    return {
      type: "timerLte",
      key,
      value
    };
  },
  scene(scene, key, value) {
    assertString(scene, "requires.scene(scene, key, value): scene");
    assertString(key, "requires.scene(scene, key, value): key");
    return {
      type: "sceneFlagEquals",
      scene,
      key,
      value
    };
  },
  visitedNode(nodeId) {
    assertString(nodeId, "requires.visitedNode(nodeId)");
    return {
      type: "visitedNode",
      nodeId
    };
  },
  chose(choiceId) {
    assertString(choiceId, "requires.chose(choiceId)");
    return {
      type: "choseChoice",
      choiceId
    };
  }
};

export const fx = {
  set(key, value) {
    assertString(key, "fx.set(key, value): key");
    return {
      type: "setFlag",
      key,
      value
    };
  },
  inc(key, by) {
    assertString(key, "fx.inc(key, by): key");
    if (!Number.isFinite(by)) {
      throw new Error("fx.inc(key, by): by must be a finite number");
    }
    return {
      type: "inc",
      key,
      by
    };
  },
  pushLog(level, text) {
    assertString(level, "fx.pushLog(level, text): level");
    assertString(text, "fx.pushLog(level, text): text");
    return {
      type: "pushLog",
      level,
      text
    };
  },
  learn(key) {
    assertString(key, "fx.learn(key)");
    return {
      type: "addKnowledge",
      key
    };
  },
  forget(key) {
    assertString(key, "fx.forget(key)");
    return {
      type: "removeKnowledge",
      key
    };
  },
  addItem(key, amount = 1) {
    assertString(key, "fx.addItem(key, amount): key");
    if (!Number.isFinite(amount)) {
      throw new Error("fx.addItem(key, amount): amount must be a finite number");
    }
    return {
      type: "addItem",
      key,
      amount
    };
  },
  removeItem(key, amount = 1) {
    assertString(key, "fx.removeItem(key, amount): key");
    if (!Number.isFinite(amount)) {
      throw new Error("fx.removeItem(key, amount): amount must be a finite number");
    }
    return {
      type: "removeItem",
      key,
      amount
    };
  },
  adjustRelationship(name, by) {
    assertString(name, "fx.adjustRelationship(name, by): name");
    if (!Number.isFinite(by)) {
      throw new Error("fx.adjustRelationship(name, by): by must be a finite number");
    }
    return {
      type: "adjustRelationship",
      name,
      by
    };
  },
  setTimer(key, value) {
    assertString(key, "fx.setTimer(key, value): key");
    if (!Number.isFinite(value)) {
      throw new Error("fx.setTimer(key, value): value must be a finite number");
    }
    return {
      type: "setTimer",
      key,
      value
    };
  },
  advanceTimer(key, by = 1) {
    assertString(key, "fx.advanceTimer(key, by): key");
    if (!Number.isFinite(by)) {
      throw new Error("fx.advanceTimer(key, by): by must be a finite number");
    }
    return {
      type: "advanceTimer",
      key,
      by
    };
  },
  setSceneFlag(scene, key, value) {
    assertString(scene, "fx.setSceneFlag(scene, key, value): scene");
    assertString(key, "fx.setSceneFlag(scene, key, value): key");
    return {
      type: "setSceneFlag",
      scene,
      key,
      value
    };
  }
};
