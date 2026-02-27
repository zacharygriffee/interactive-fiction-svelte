import { INTERNAL_ACTION_TYPES } from "../types.js";

export const EVENT_KINDS = {
  INTENT: "intent",
  RATIFIED: "ratified"
};

export function createIntentEvent({ id, type, payload = {}, at }) {
  const event = {
    kind: EVENT_KINDS.INTENT,
    type,
    payload,
    at
  };

  if (typeof id === "string" && id.length > 0) {
    event.id = id;
  }

  return event;
}

export function createRatifiedEvent({ id, intentId, effects = [], grants = [], at, reason }) {
  const event = {
    kind: EVENT_KINDS.RATIFIED,
    effects,
    grants,
    at
  };

  if (typeof id === "string" && id.length > 0) {
    event.id = id;
  }
  if (typeof intentId === "string" && intentId.length > 0) {
    event.intentId = intentId;
  }

  if (reason !== undefined) {
    event.reason = reason;
  }

  return event;
}

export function isRevealIntent(intentEvent) {
  return intentEvent?.type === INTERNAL_ACTION_TYPES.REVEAL_STORYLETS;
}
