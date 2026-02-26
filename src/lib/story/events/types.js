import { INTERNAL_ACTION_TYPES } from "../types.js";

export const EVENT_KINDS = {
  INTENT: "intent",
  RATIFIED: "ratified"
};

export function createIntentEvent({ type, payload = {}, at }) {
  return {
    kind: EVENT_KINDS.INTENT,
    type,
    payload,
    at
  };
}

export function createRatifiedEvent({ effects = [], grants = [], at, reason }) {
  const event = {
    kind: EVENT_KINDS.RATIFIED,
    effects,
    grants,
    at
  };

  if (reason !== undefined) {
    event.reason = reason;
  }

  return event;
}

export function isRevealIntent(intentEvent) {
  return intentEvent?.type === INTERNAL_ACTION_TYPES.REVEAL_STORYLETS;
}
