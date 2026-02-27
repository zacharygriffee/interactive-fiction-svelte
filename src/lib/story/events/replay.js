import { ACTION_TYPES, INTERNAL_ACTION_TYPES, STATE_VERSION } from "../types.js";
import { applyEffects } from "../eval/effects.js";

function cloneHistory(history) {
  return history.map((entry) => ({ ...entry }));
}

function cloneRatifiedLog(ratifiedLog) {
  return ratifiedLog.map((event) => ({
    kind: event.kind,
    id: event.id,
    intentId: event.intentId,
    at: event.at,
    reason: event.reason,
    effects: Array.isArray(event.effects) ? event.effects.map((effect) => ({ ...effect })) : [],
    grants: Array.isArray(event.grants) ? [...event.grants] : []
  }));
}

function cloneReceiptLog(receiptLog) {
  return receiptLog.map((receipt) => ({
    kind: receipt.kind,
    authority: receipt.authority,
    at: receipt.at,
    intentId: receipt.intentId,
    ratifiedId: receipt.ratifiedId,
    ref: receipt.ref,
    sig: receipt.sig,
    meta: receipt.meta && typeof receipt.meta === "object" ? { ...receipt.meta } : undefined
  }));
}

function createBaseState(graph) {
  const startNodeId = graph.startNodeId;
  return {
    version: STATE_VERSION,
    currentNodeId: startNodeId,
    history: [
      {
        nodeId: startNodeId,
        at: 0
      }
    ],
    flags: {},
    capabilities: {},
    log: [],
    revealedStorylets: {},
    intentLog: [],
    ratifiedLog: [],
    receiptLog: []
  };
}

function applyGrants(grants, state) {
  for (const grant of grants ?? []) {
    state.capabilities[grant] = true;
  }
}

function applyNavigation(intentEvent, state) {
  const payload = intentEvent.payload ?? {};

  switch (intentEvent.type) {
    case ACTION_TYPES.CHOOSE:
    case ACTION_TYPES.ENTER_NODE: {
      if (payload.historyEntry) {
        state.currentNodeId = payload.historyEntry.nodeId;
        state.history.push({ ...payload.historyEntry });
      }
      break;
    }
    case ACTION_TYPES.GO_BACK: {
      if (state.history.length > 1) {
        state.history.pop();
        state.currentNodeId = state.history[state.history.length - 1].nodeId;
      }
      break;
    }
    case INTERNAL_ACTION_TYPES.REVEAL_STORYLETS: {
      for (const key of payload.revealedKeys ?? []) {
        state.revealedStorylets[key] = true;
      }
      break;
    }
    default:
      break;
  }
}

export function replay({ graph, initialState, intentLog = [], ratifiedLog = [], receiptLog = [], ratifier, clockLike }) {
  void ratifier;
  void clockLike;

  const base = initialState
    ? {
        version: STATE_VERSION,
        currentNodeId: initialState.currentNodeId,
        history: cloneHistory(initialState.history),
        flags: { ...initialState.flags },
        capabilities: { ...initialState.capabilities },
        log: initialState.log.map((entry) => ({ ...entry })),
        revealedStorylets: { ...initialState.revealedStorylets },
        intentLog: [],
        ratifiedLog: [],
        receiptLog: cloneReceiptLog(initialState.receiptLog ?? [])
      }
    : createBaseState(graph);

  for (let index = 0; index < intentLog.length; index += 1) {
    const intentEvent = intentLog[index];
    const ratifiedEvent = ratifiedLog[index] ?? {
      kind: "ratified",
      id: `ratified-${index + 1}`,
      intentId: intentEvent.id ?? `intent-${index + 1}`,
      effects: [],
      grants: [],
      at: intentEvent.at
    };

    base.intentLog.push({
      kind: "intent",
      id: intentEvent.id ?? `intent-${index + 1}`,
      type: intentEvent.type,
      payload: { ...(intentEvent.payload ?? {}) },
      at: intentEvent.at
    });

    const eventClock = {
      now: () => ratifiedEvent.at
    };

    applyEffects(ratifiedEvent.effects ?? [], base, eventClock);
    applyGrants(ratifiedEvent.grants ?? [], base);
    base.ratifiedLog.push({
      kind: "ratified",
      id: ratifiedEvent.id ?? `ratified-${index + 1}`,
      intentId: ratifiedEvent.intentId ?? (intentEvent.id ?? `intent-${index + 1}`),
      effects: (ratifiedEvent.effects ?? []).map((effect) => ({ ...effect })),
      grants: [...(ratifiedEvent.grants ?? [])],
      at: ratifiedEvent.at,
      reason: ratifiedEvent.reason
    });

    const receipt = receiptLog[index];
    if (receipt) {
      base.receiptLog.push({
        kind: "receipt",
        authority: receipt.authority,
        at: receipt.at,
        intentId: receipt.intentId ?? (intentEvent.id ?? `intent-${index + 1}`),
        ratifiedId: receipt.ratifiedId ?? (ratifiedEvent.id ?? `ratified-${index + 1}`),
        ref: receipt.ref,
        sig: receipt.sig,
        meta: receipt.meta && typeof receipt.meta === "object" ? { ...receipt.meta } : undefined
      });
    }

    applyNavigation(intentEvent, base);
  }

  return {
    version: base.version,
    currentNodeId: base.currentNodeId,
    history: cloneHistory(base.history),
    flags: { ...base.flags },
    capabilities: { ...base.capabilities },
    log: base.log.map((entry) => ({ ...entry })),
    revealedStorylets: { ...base.revealedStorylets },
    intentLog: base.intentLog.map((event) => ({
      kind: event.kind,
      id: event.id,
      type: event.type,
      payload: { ...event.payload },
      at: event.at
    })),
    ratifiedLog: cloneRatifiedLog(base.ratifiedLog),
    receiptLog: cloneReceiptLog(base.receiptLog)
  };
}
