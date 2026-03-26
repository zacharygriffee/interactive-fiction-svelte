import { StoryDriver } from "../driver.js";
import { ACTION_TYPES, INTERNAL_ACTION_TYPES, STATE_VERSION } from "../types.js";
import { evaluateConditions } from "../eval/conditions.js";
import { applyEffects } from "../eval/effects.js";
import { createIntentEvent, createRatifiedEvent } from "../events/types.js";
import { validateGraph as validateGraphSchema } from "../dsl/validate.js";
import { LocalAuthorityAdapter } from "../../adapters/authority_local.js";
import { NullProvisionalAdapter } from "../../adapters/provisional_null.js";
import { DefaultGraphResolver } from "../../adapters/graph_resolver_default.js";
import { assertAuthorityPort } from "../../ports/authority.js";
import { assertProvisionalPort } from "../../ports/provisional.js";
import { assertGraphResolverPort } from "../../ports/graph_resolver.js";

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneHistory(history) {
  return history.map((entry) => ({ ...entry }));
}

function cloneLog(log) {
  return log.map((entry) => ({ ...entry }));
}

function cloneEffectsList(effects = []) {
  return effects.map((effect) => ({ ...effect }));
}

function cloneNumericMap(map = {}) {
  return { ...map };
}

function cloneTruthMap(map = {}) {
  return { ...map };
}

function cloneSceneState(sceneState = {}) {
  return Object.fromEntries(
    Object.entries(sceneState).map(([sceneId, values]) => [sceneId, isRecord(values) ? { ...values } : {}])
  );
}

function cloneIntentLog(intentLog) {
  return intentLog.map((event) => ({
    kind: event.kind,
    id: event.id,
    type: event.type,
    payload: { ...(event.payload ?? {}) },
    at: event.at
  }));
}

function cloneRatifiedLog(ratifiedLog) {
  return ratifiedLog.map((event) => ({
    kind: event.kind,
    id: event.id,
    intentId: event.intentId,
    effects: cloneEffectsList(event.effects ?? []),
    grants: [...(event.grants ?? [])],
    at: event.at,
    reason: event.reason
  }));
}

function cloneReceiptLog(receiptLog) {
  return receiptLog.map((receipt) => ({
    version: receipt.version,
    kind: receipt.kind,
    authority: receipt.authority,
    at: receipt.at,
    intentId: receipt.intentId,
    ratifiedId: receipt.ratifiedId,
    ref: receipt.ref,
    sig: receipt.sig,
    meta: isRecord(receipt.meta) ? { ...receipt.meta } : undefined
  }));
}

function cloneIntentEvent(event) {
  return {
    kind: event.kind,
    id: event.id,
    type: event.type,
    payload: { ...(event.payload ?? {}) },
    at: event.at
  };
}

function cloneRatifiedEvent(event) {
  return {
    kind: event.kind,
    id: event.id,
    intentId: event.intentId,
    effects: cloneEffectsList(event.effects ?? []),
    grants: [...(event.grants ?? [])],
    at: event.at,
    reason: event.reason
  };
}

function cloneReceiptEvent(receipt) {
  return {
    version: receipt.version,
    kind: receipt.kind,
    authority: receipt.authority,
    at: receipt.at,
    intentId: receipt.intentId,
    ratifiedId: receipt.ratifiedId,
    ref: receipt.ref,
    sig: receipt.sig,
    meta: isRecord(receipt.meta) ? { ...receipt.meta } : undefined
  };
}

function normalizeCapabilities(capabilities) {
  if (Array.isArray(capabilities)) {
    return capabilities.reduce((acc, name) => {
      acc[name] = true;
      return acc;
    }, {});
  }

  if (isRecord(capabilities)) {
    const normalized = {};
    for (const [key, value] of Object.entries(capabilities)) {
      if (value === true) {
        normalized[key] = true;
      }
    }
    return normalized;
  }

  return {};
}

function isFiniteNumberRecord(value) {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((item) => Number.isFinite(item));
}

function isStrictTruthRecord(value) {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((item) => item === true);
}

function isValidSceneState(value) {
  if (!isRecord(value)) {
    return false;
  }

  for (const sceneValue of Object.values(value)) {
    if (!isRecord(sceneValue)) {
      return false;
    }
  }

  return true;
}

function storyletPriority(storylet) {
  return Number.isFinite(storylet.priority) ? storylet.priority : 0;
}

function isValidLogEntry(entry) {
  return (
    isRecord(entry) &&
    typeof entry.level === "string" &&
    typeof entry.text === "string" &&
    typeof entry.at === "number"
  );
}

function isValidHistoryEntry(entry, nodesById) {
  if (!isRecord(entry)) {
    return false;
  }
  if (typeof entry.nodeId !== "string" || !nodesById[entry.nodeId]) {
    return false;
  }
  if (entry.viaChoiceId !== undefined && typeof entry.viaChoiceId !== "string") {
    return false;
  }
  if (typeof entry.at !== "number") {
    return false;
  }
  return true;
}

function isValidIntentEvent(event) {
  return (
    isRecord(event) &&
    event.kind === "intent" &&
    (event.id === undefined || typeof event.id === "string") &&
    typeof event.type === "string" &&
    isRecord(event.payload) &&
    typeof event.at === "number"
  );
}

function isValidRatifiedEvent(event) {
  if (!isRecord(event) || event.kind !== "ratified" || typeof event.at !== "number") {
    return false;
  }
  if (!Array.isArray(event.effects) || !Array.isArray(event.grants)) {
    return false;
  }
  for (const grant of event.grants) {
    if (typeof grant !== "string") {
      return false;
    }
  }
  if (event.id !== undefined && typeof event.id !== "string") {
    return false;
  }
  if (event.intentId !== undefined && typeof event.intentId !== "string") {
    return false;
  }
  return true;
}

function isValidReceiptEvent(receipt) {
  if (!isRecord(receipt) || receipt.kind !== "receipt") {
    return false;
  }
  if (receipt.version !== 1) {
    return false;
  }
  if (typeof receipt.authority !== "string" || receipt.authority.length === 0) {
    return false;
  }
  if (typeof receipt.at !== "number") {
    return false;
  }
  if (typeof receipt.intentId !== "string" || receipt.intentId.length === 0) {
    return false;
  }
  if (typeof receipt.ratifiedId !== "string" || receipt.ratifiedId.length === 0) {
    return false;
  }
  if (receipt.ref !== undefined && typeof receipt.ref !== "string") {
    return false;
  }
  if (receipt.sig !== undefined && typeof receipt.sig !== "string") {
    return false;
  }
  if (receipt.meta !== undefined && !isRecord(receipt.meta)) {
    return false;
  }
  return true;
}

function isValidLoadedState(value, graph) {
  if (!isRecord(value)) {
    return false;
  }
  if (value.version !== STATE_VERSION) {
    return false;
  }
  if (typeof value.currentNodeId !== "string" || !graph.nodesById[value.currentNodeId]) {
    return false;
  }
  if (!isRecord(value.flags)) {
    return false;
  }
  if (!isRecord(value.capabilities)) {
    return false;
  }
  if (!isStrictTruthRecord(value.capabilities)) {
    return false;
  }
  if (!isStrictTruthRecord(value.knowledge ?? {})) {
    return false;
  }
  if (!isFiniteNumberRecord(value.inventory ?? {})) {
    return false;
  }
  if (!isFiniteNumberRecord(value.relationships ?? {})) {
    return false;
  }
  if (!isFiniteNumberRecord(value.timers ?? {})) {
    return false;
  }
  if (!isValidSceneState(value.sceneState ?? {})) {
    return false;
  }
  if (!Array.isArray(value.log) || !value.log.every(isValidLogEntry)) {
    return false;
  }
  if (!Array.isArray(value.history) || value.history.length === 0) {
    return false;
  }
  if (!value.history.every((entry) => isValidHistoryEntry(entry, graph.nodesById))) {
    return false;
  }
  if (!isRecord(value.revealedStorylets)) {
    return false;
  }
  for (const revealedValue of Object.values(value.revealedStorylets)) {
    if (revealedValue !== true) {
      return false;
    }
  }
  if (!Array.isArray(value.intentLog) || !value.intentLog.every(isValidIntentEvent)) {
    return false;
  }
  if (!Array.isArray(value.ratifiedLog) || !value.ratifiedLog.every(isValidRatifiedEvent)) {
    return false;
  }
  if (value.intentLog.length !== value.ratifiedLog.length) {
    return false;
  }
  if (value.receiptLog !== undefined) {
    if (!Array.isArray(value.receiptLog) || !value.receiptLog.every(isValidReceiptEvent)) {
      return false;
    }
  }

  const last = value.history[value.history.length - 1];
  if (last.nodeId !== value.currentNodeId) {
    return false;
  }

  return true;
}

function cloneState(state) {
  return {
    version: state.version,
    currentNodeId: state.currentNodeId,
    history: cloneHistory(state.history),
    flags: { ...state.flags },
    capabilities: { ...state.capabilities },
    knowledge: cloneTruthMap(state.knowledge),
    inventory: cloneNumericMap(state.inventory),
    relationships: cloneNumericMap(state.relationships),
    timers: cloneNumericMap(state.timers),
    sceneState: cloneSceneState(state.sceneState),
    log: cloneLog(state.log),
    revealedStorylets: { ...state.revealedStorylets },
    intentLog: cloneIntentLog(state.intentLog),
    ratifiedLog: cloneRatifiedLog(state.ratifiedLog),
    receiptLog: cloneReceiptLog(state.receiptLog ?? [])
  };
}

function createFreshState({ startNodeId, startAt, capabilities }) {
  return {
    version: STATE_VERSION,
    currentNodeId: startNodeId,
    history: [
      {
        nodeId: startNodeId,
        at: startAt
      }
    ],
    flags: {},
    capabilities: { ...capabilities },
    knowledge: {},
    inventory: {},
    relationships: {},
    timers: {},
    sceneState: {},
    log: [],
    revealedStorylets: {},
    intentLog: [],
    ratifiedLog: [],
    receiptLog: []
  };
}

function normalizeProvisionalMessage(message, clock) {
  const at = Number.isFinite(message?.at) ? message.at : clock.now();
  const source = typeof message?.source === "string" ? message.source : "provisional";

  let text;
  if (typeof message?.text === "string") {
    text = message.text;
  } else if (message?.text === undefined) {
    text = "";
  } else {
    text = String(message.text);
  }

  const normalized = {
    at,
    source,
    text
  };

  if (isRecord(message?.meta)) {
    normalized.meta = { ...message.meta };
  }

  return normalized;
}

class StaticGraphResolver {
  constructor(graph) {
    this._graph = graph;
  }

  getGraph() {
    return this._graph;
  }
}

class NoopAuthority {
  constructor(clock) {
    this._clock = clock;
  }

  ratifyIntent({ intentEvent }) {
    return {
      ratifiedEvent: createRatifiedEvent({
        intentId: intentEvent?.id,
        effects: cloneEffectsList(intentEvent?.payload?.effects ?? []),
        grants: [],
        at: this._clock.now()
      })
    };
  }
}

const validateGraph = validateGraphSchema;

export class LocalDriver extends StoryDriver {
  constructor({
    graph,
    storage,
    clock,
    capabilities = {},
    tailLimit = Infinity,
    ratifier,
    authority,
    provisional,
    graphResolver,
    proof
  } = {}) {
    super();

    if (!storage || typeof storage.load !== "function" || typeof storage.save !== "function") {
      throw new Error("Invalid storage adapter");
    }
    if (!clock || typeof clock.now !== "function") {
      throw new Error("Invalid clock dependency");
    }

    const resolvedGraphResolver = graphResolver ??
      (graph ? new StaticGraphResolver(graph) : new DefaultGraphResolver());
    assertGraphResolverPort(resolvedGraphResolver);

    const resolvedGraph = resolvedGraphResolver.getGraph({});
    validateGraph(resolvedGraph);

    const resolvedAuthority = authority ??
      new LocalAuthorityAdapter({
        graph: resolvedGraph,
        clock,
        ratifier
      });
    assertAuthorityPort(resolvedAuthority);

    const resolvedProvisional = provisional ?? new NullProvisionalAdapter();
    assertProvisionalPort(resolvedProvisional);

    this._graphResolver = resolvedGraphResolver;
    this._graph = resolvedGraph;
    this._storage = storage;
    this._clock = clock;
    this._authority = resolvedAuthority;
    this._provisional = resolvedProvisional;
    this._proof = proof ?? null;
    this._listeners = new Set();
    this._state = null;
    this._initialized = false;
    this._initialCapabilities = normalizeCapabilities(capabilities);
    this._tailLimit = Number.isFinite(tailLimit) && tailLimit > 0 ? tailLimit : Infinity;
    this._newlyRevealedStorylets = {};
    this._provisionalTail = [];
    this._provisionalUnsubscribe = null;
  }

  async init() {
    if (typeof this._provisionalUnsubscribe === "function") {
      this._provisionalUnsubscribe();
      this._provisionalUnsubscribe = null;
    }
    this._provisionalTail = [];

    const loaded = await Promise.resolve(this._storage.load());

    if (isValidLoadedState(loaded, this._graph)) {
      this._state = cloneState(loaded);
    } else {
      this._state = createFreshState({
        startNodeId: this._graph.startNodeId,
        startAt: this._clock.now(),
        capabilities: this._initialCapabilities
      });
    }

    this._initialized = true;
    this._bindProvisional();

    const revealsChangedState = await this._processStoryletReveals();
    if (revealsChangedState) {
      await this._persist();
    }

    this._emit();
  }

  getSnapshot() {
    this._assertInitialized();
    return this._buildSnapshot({ consumeNewlyRevealed: true });
  }

  async dispatch(action) {
    this._assertInitialized();

    const context = this._buildActionContext(action);

    const intentEvent = createIntentEvent({
      id: this._nextIntentId(),
      type: action.type,
      payload: context.payload,
      at: this._clock.now()
    });

    this._state.intentLog.push(cloneIntentEvent(intentEvent));
    await this._ratifyAndApply(intentEvent, {
      defaultEffects: context.baseEffects
    });

    context.navigate(intentEvent);
    await this._processStoryletReveals();

    await this._persist();
    this._emit();
  }

  async applyEffects(effects = []) {
    this._assertInitialized();

    if (!effects.length) {
      return;
    }

    const intentEvent = createIntentEvent({
      id: this._nextIntentId(),
      type: INTERNAL_ACTION_TYPES.APPLY_RATIFIED,
      payload: {
        effects: cloneEffectsList(effects)
      },
      at: this._clock.now()
    });

    this._state.intentLog.push(cloneIntentEvent(intentEvent));
    await this._ratifyAndApply(intentEvent, {
      defaultEffects: effects,
      defaultReason: "external-ratified"
    });

    await this._processStoryletReveals();

    await this._persist();
    this._emit();
  }

  subscribe(cb) {
    this._listeners.add(cb);
    return () => {
      this._listeners.delete(cb);
    };
  }

  _bindProvisional() {
    const unsubscribe = this._provisional.subscribe((message) => {
      const normalized = normalizeProvisionalMessage(message, this._clock);
      this._provisionalTail.push(normalized);
      if (Number.isFinite(this._tailLimit) && this._provisionalTail.length > this._tailLimit) {
        this._provisionalTail = this._provisionalTail.slice(-this._tailLimit);
      }
      this._emit();
    });

    this._provisionalUnsubscribe = typeof unsubscribe === "function" ? unsubscribe : null;
  }

  _assertInitialized() {
    if (!this._initialized || !this._state) {
      throw new Error("Driver not initialized");
    }
  }

  _nextIntentId() {
    return `intent-${this._state.intentLog.length + 1}`;
  }

  _nextRatifiedId() {
    return `ratified-${this._state.ratifiedLog.length + 1}`;
  }

  _normalizeReceipt(receipt, { intentEvent, ratifiedEvent }) {
    const hasProvidedReceipt = isRecord(receipt);
    const normalized = {
      version: hasProvidedReceipt ? receipt.version : 1,
      kind: "receipt",
      authority: typeof receipt?.authority === "string" && receipt.authority.length > 0
        ? receipt.authority
        : "unknown",
      at: Number.isFinite(receipt?.at) ? receipt.at : ratifiedEvent.at,
      intentId: hasProvidedReceipt ? receipt.intentId : intentEvent?.id,
      ratifiedId: hasProvidedReceipt ? receipt.ratifiedId : ratifiedEvent?.id
    };

    if (typeof receipt?.ref === "string") {
      normalized.ref = receipt.ref;
    }
    if (typeof receipt?.sig === "string") {
      normalized.sig = receipt.sig;
    }
    if (isRecord(receipt?.meta)) {
      normalized.meta = { ...receipt.meta };
    }

    if (!isValidReceiptEvent(normalized)) {
      throw new Error("Invalid receipt from authority: version, intentId, and ratifiedId are required");
    }

    return normalized;
  }

  _getNode(nodeId) {
    const node = this._graph.nodesById[nodeId];
    if (!node) {
      throw new Error(`Unknown node id: ${nodeId}`);
    }
    return node;
  }

  _getCurrentNode() {
    return this._getNode(this._state.currentNodeId);
  }

  _buildActionContext(action) {
    switch (action?.type) {
      case ACTION_TYPES.ENTER_NODE: {
        this._getNode(action.nodeId);

        const payload = {
          nodeId: action.nodeId,
          effects: []
        };

        return {
          payload,
          baseEffects: [],
          navigate: (intentEvent) => {
            this._state.currentNodeId = action.nodeId;
            const historyEntry = {
              nodeId: action.nodeId,
              viaChoiceId: undefined,
              at: this._clock.now()
            };
            this._state.history.push(historyEntry);
            intentEvent.payload.historyEntry = { ...historyEntry };
            this._syncIntentPayload(intentEvent);
            return true;
          }
        };
      }

      case ACTION_TYPES.CHOOSE: {
        const node = this._getCurrentNode();
        const choice = node.choices.find((candidate) => candidate.id === action.choiceId);

        if (!choice) {
          throw new Error(`Invalid choice id: ${action.choiceId}`);
        }

        if (choice.to !== undefined) {
          this._getNode(choice.to);
        }

        const targetNodeId = choice.to === undefined ? node.id : choice.to;
        const baseEffects = cloneEffectsList(choice.effects ?? []);

        const payload = {
          nodeId: node.id,
          choiceId: choice.id,
          choiceLabel: choice.label,
          to: targetNodeId,
          effects: baseEffects
        };

        return {
          payload,
          baseEffects,
          navigate: (intentEvent) => {
            this._state.currentNodeId = targetNodeId;
            const historyEntry = {
              nodeId: targetNodeId,
              viaChoiceId: choice.id,
              at: this._clock.now()
            };
            this._state.history.push(historyEntry);
            intentEvent.payload.historyEntry = { ...historyEntry };
            this._syncIntentPayload(intentEvent);
            return true;
          }
        };
      }

      case ACTION_TYPES.GO_BACK: {
        const payload = {
          nodeId: this._state.currentNodeId,
          effects: []
        };

        return {
          payload,
          baseEffects: [],
          navigate: (intentEvent) => {
            if (this._state.history.length <= 1) {
              intentEvent.payload.noop = true;
              this._syncIntentPayload(intentEvent);
              return false;
            }

            this._state.history.pop();
            const latest = this._state.history[this._state.history.length - 1];
            this._state.currentNodeId = latest.nodeId;
            intentEvent.payload.noop = false;
            this._syncIntentPayload(intentEvent);
            return true;
          }
        };
      }

      default:
        throw new Error(`Unknown action type: ${action?.type}`);
    }
  }

  async _ratifyAndApply(intentEvent, { defaultEffects = [], defaultReason } = {}) {
    const authority = this._authority ?? new NoopAuthority(this._clock);

    const result = await Promise.resolve(
      authority.ratifyIntent({
        state: this._state,
        intentEvent: cloneIntentEvent(intentEvent),
        graph: this._graph,
        proof: this._proof
      })
    );

    const authorityRatified = isRecord(result?.ratifiedEvent) ? result.ratifiedEvent : null;
    const effects = Array.isArray(authorityRatified?.effects)
      ? cloneEffectsList(authorityRatified.effects)
      : cloneEffectsList(defaultEffects);
    const grants = Array.isArray(authorityRatified?.grants) ? [...authorityRatified.grants] : [];

    const ratifiedEvent = createRatifiedEvent({
      id: typeof authorityRatified?.id === "string" ? authorityRatified.id : this._nextRatifiedId(),
      intentId: typeof authorityRatified?.intentId === "string"
        ? authorityRatified.intentId
        : intentEvent.id,
      effects,
      grants,
      at: Number.isFinite(authorityRatified?.at) ? authorityRatified.at : this._clock.now(),
      reason: authorityRatified?.reason ?? defaultReason
    });

    const eventClock = {
      now: () => ratifiedEvent.at
    };
    applyEffects(ratifiedEvent.effects, this._state, eventClock);

    for (const grant of ratifiedEvent.grants) {
      this._state.capabilities[grant] = true;
    }

    this._state.ratifiedLog.push(cloneRatifiedEvent(ratifiedEvent));
    const receipt = this._normalizeReceipt(result?.receipt, {
      intentEvent,
      ratifiedEvent
    });
    this._state.receiptLog.push(cloneReceiptEvent(receipt));
    return ratifiedEvent;
  }

  _storyletKey(nodeId, storyletId) {
    return `${nodeId}:${storyletId}`;
  }

  _computeEligibleStorylets(node) {
    const storylets = Array.isArray(node.storylets) ? node.storylets : [];

    const visible = storylets.filter((storylet) => {
      return evaluateConditions(storylet.requires ?? [], this._state);
    });

    visible.sort((a, b) => {
      const byPriority = storyletPriority(b) - storyletPriority(a);
      if (byPriority !== 0) {
        return byPriority;
      }
      return a.id.localeCompare(b.id);
    });

    return visible;
  }

  _selectVisibleStorylets(node) {
    const eligible = this._computeEligibleStorylets(node);

    return eligible
      .filter((storylet) => {
        if (!storylet.once) {
          return true;
        }

        const key = this._storyletKey(node.id, storylet.id);
        return !this._state.revealedStorylets[key] || this._newlyRevealedStorylets[key] === true;
      })
      .map((storylet) => ({
        id: storylet.id,
        body: storylet.body
      }));
  }

  async _processStoryletReveals() {
    let changed = false;

    while (true) {
      const node = this._getCurrentNode();
      const eligible = this._computeEligibleStorylets(node);
      const toReveal = eligible.filter((storylet) => {
        if (!storylet.once) {
          return false;
        }
        const key = this._storyletKey(node.id, storylet.id);
        return this._state.revealedStorylets[key] !== true;
      });

      if (toReveal.length === 0) {
        break;
      }

      const storyletIds = toReveal.map((storylet) => storylet.id);
      const revealedKeys = toReveal.map((storylet) => this._storyletKey(node.id, storylet.id));
      const effects = cloneEffectsList(toReveal.flatMap((storylet) => storylet.effectsOnReveal ?? []));

      const intentEvent = createIntentEvent({
        id: this._nextIntentId(),
        type: INTERNAL_ACTION_TYPES.REVEAL_STORYLETS,
        payload: {
          nodeId: node.id,
          storyletIds,
          revealedKeys,
          effects
        },
        at: this._clock.now()
      });

      this._state.intentLog.push(cloneIntentEvent(intentEvent));
      await this._ratifyAndApply(intentEvent, {
        defaultEffects: effects,
        defaultReason: "storylet-reveal"
      });

      for (const key of revealedKeys) {
        this._state.revealedStorylets[key] = true;
        this._newlyRevealedStorylets[key] = true;
      }

      changed = true;
    }

    return changed;
  }

  _syncIntentPayload(intentEvent) {
    const latest = this._state.intentLog[this._state.intentLog.length - 1];
    if (!latest) {
      return;
    }
    if (latest.id !== intentEvent.id) {
      return;
    }

    latest.payload = { ...(intentEvent.payload ?? {}) };
  }

  _buildSnapshot({ consumeNewlyRevealed }) {
    const node = this._getNode(this._state.currentNodeId);
    const availableChoices = node.choices.filter((choice) => {
      return evaluateConditions(choice.requires ?? [], this._state);
    });

    const logTail = this._state.log.slice(-this._tailLimit);
    const snapshot = {
      node,
      visibleStorylets: this._selectVisibleStorylets(node),
      availableChoices: [...availableChoices],
      history: cloneHistory(this._state.history),
      flags: { ...this._state.flags },
      capabilities: { ...this._state.capabilities },
      knowledge: cloneTruthMap(this._state.knowledge),
      inventory: cloneNumericMap(this._state.inventory),
      relationships: cloneNumericMap(this._state.relationships),
      timers: cloneNumericMap(this._state.timers),
      sceneState: cloneSceneState(this._state.sceneState),
      logTail: cloneLog(logTail),
      provisionalTail: this._provisionalTail.map((item) => ({ ...item })),
      intentLog: cloneIntentLog(this._state.intentLog),
      ratifiedLog: cloneRatifiedLog(this._state.ratifiedLog),
      receiptLog: cloneReceiptLog(this._state.receiptLog)
    };

    if (consumeNewlyRevealed) {
      this._newlyRevealedStorylets = {};
    }

    return snapshot;
  }

  async _persist() {
    const state = cloneState(this._state);
    await Promise.resolve(this._storage.save(state));
  }

  _emit() {
    if (this._listeners.size === 0) {
      return;
    }

    const snapshot = this._buildSnapshot({ consumeNewlyRevealed: true });
    for (const listener of Array.from(this._listeners)) {
      listener(snapshot);
    }
  }
}

export { validateGraph };
