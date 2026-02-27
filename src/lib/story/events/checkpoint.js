import { canonicalizeValue } from "./canonical.js";

export const CHECKPOINT_HASH_ALG = "fnv1a-32";

function toBytes(input) {
  if (input instanceof Uint8Array) {
    return input;
  }
  return new TextEncoder().encode(String(input));
}

function fnv1a(input) {
  const bytes = toBytes(input);
  let hash = 2166136261;

  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export function hashCheckpointValue(value) {
  return fnv1a(canonicalizeValue(value));
}

function withFallbackId(prefix, event, index) {
  if (typeof event?.id === "string" && event.id.length > 0) {
    return event.id;
  }
  return `${prefix}-${index + 1}`;
}

function toCheckpointRecord({ index, prevHash, intentEvent, ratifiedEvent, receipt }) {
  const canonicalPayload = canonicalizeValue({
    index,
    intentEvent,
    ratifiedEvent,
    receipt
  });

  const hash = fnv1a(`${prevHash}|${canonicalPayload}`);

  return {
    index,
    prevHash,
    hash,
    alg: CHECKPOINT_HASH_ALG,
    at: Number.isFinite(ratifiedEvent?.at) ? ratifiedEvent.at : intentEvent?.at,
    intentId: withFallbackId("intent", intentEvent, index),
    ratifiedId: withFallbackId("ratified", ratifiedEvent, index)
  };
}

export function buildCheckpointChain({ intentLog = [], ratifiedLog = [], receiptLog = [], seedHash = "00000000" } = {}) {
  const chain = [];
  let prevHash = seedHash;

  const count = Math.max(intentLog.length, ratifiedLog.length);
  for (let index = 0; index < count; index += 1) {
    const intentEvent = intentLog[index] ?? {
      kind: "intent",
      id: `intent-${index + 1}`,
      type: "UNKNOWN",
      payload: {},
      at: 0
    };
    const ratifiedEvent = ratifiedLog[index] ?? {
      kind: "ratified",
      id: `ratified-${index + 1}`,
      intentId: withFallbackId("intent", intentEvent, index),
      effects: [],
      grants: [],
      at: intentEvent.at
    };

    const receipt = receiptLog[index] ?? {
      kind: "receipt",
      authority: "unknown",
      at: ratifiedEvent.at,
      intentId: withFallbackId("intent", intentEvent, index),
      ratifiedId: withFallbackId("ratified", ratifiedEvent, index)
    };

    const record = toCheckpointRecord({
      index,
      prevHash,
      intentEvent,
      ratifiedEvent,
      receipt
    });

    chain.push(record);
    prevHash = record.hash;
  }

  return chain;
}

export function computeCheckpoint({ intentLog = [], ratifiedLog = [], receiptLog = [], seedHash } = {}) {
  const chain = buildCheckpointChain({ intentLog, ratifiedLog, receiptLog, seedHash });
  const head = chain[chain.length - 1];

  if (!head) {
    return {
      hash: seedHash ?? "00000000",
      alg: CHECKPOINT_HASH_ALG,
      at: 0
    };
  }

  return {
    hash: head.hash,
    alg: head.alg,
    at: Number.isFinite(head.at) ? head.at : 0
  };
}

export function buildCheckpointArtifact({ intentLog = [], ratifiedLog = [], receiptLog = [], proof, seedHash } = {}) {
  const chain = buildCheckpointChain({ intentLog, ratifiedLog, receiptLog, seedHash });
  const head = chain[chain.length - 1] ?? {
    index: -1,
    prevHash: seedHash ?? "00000000",
    hash: seedHash ?? "00000000",
    alg: CHECKPOINT_HASH_ALG,
    at: 0
  };

  const artifact = {
    head,
    chain
  };

  if (proof && typeof proof.sign === "function" && typeof proof.getPublicIdentity === "function") {
    artifact.identity = proof.getPublicIdentity();
    artifact.signature = proof.sign(head.hash);
  }

  return artifact;
}
