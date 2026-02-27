import { createHash } from "node:crypto";
import { canonicalizeValue } from "./canonical.js";

export const CHECKPOINT_HASH_ALG = "sha256";
const SHA256_ZERO_HASH = "0".repeat(64);

function hashSha256(input) {
  const value = input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
  return createHash("sha256").update(value).digest("hex");
}

export function hashCheckpointValue(value) {
  return hashSha256(canonicalizeValue(value));
}

function withFallbackId(prefix, event, index) {
  if (typeof event?.id === "string" && event.id.length > 0) {
    return event.id;
  }
  return `${prefix}-${index + 1}`;
}

function toCommitmentPayload({ index, intentEvent, ratifiedEvent, receipt, includeReceipts }) {
  // Commitment policy:
  // - default: commit to intent + ratified events only
  // - optional: include receipts when includeReceipts=true
  const payload = {
    index,
    intentEvent,
    ratifiedEvent
  };

  if (includeReceipts) {
    payload.receipt = receipt;
  }

  return payload;
}

function toCheckpointRecord({
  index,
  prevHash,
  intentEvent,
  ratifiedEvent,
  receipt,
  includeReceipts
}) {
  const canonicalPayload = canonicalizeValue(
    toCommitmentPayload({ index, intentEvent, ratifiedEvent, receipt, includeReceipts })
  );

  const hash = hashSha256(`${prevHash}|${canonicalPayload}`);

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

export function buildCheckpointChain({
  intentLog = [],
  ratifiedLog = [],
  receiptLog = [],
  seedHash = SHA256_ZERO_HASH,
  includeReceipts = false
} = {}) {
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
      version: 1,
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
      receipt,
      includeReceipts
    });

    chain.push(record);
    prevHash = record.hash;
  }

  return chain;
}

export function computeCheckpoint({
  intentLog = [],
  ratifiedLog = [],
  receiptLog = [],
  seedHash,
  includeReceipts = false
} = {}) {
  const chain = buildCheckpointChain({
    intentLog,
    ratifiedLog,
    receiptLog,
    seedHash,
    includeReceipts
  });
  const head = chain[chain.length - 1];

  if (!head) {
    return {
      hash: seedHash ?? SHA256_ZERO_HASH,
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

export function buildCheckpointArtifact({
  intentLog = [],
  ratifiedLog = [],
  receiptLog = [],
  proof,
  seedHash,
  includeReceipts = false
} = {}) {
  const chain = buildCheckpointChain({
    intentLog,
    ratifiedLog,
    receiptLog,
    seedHash,
    includeReceipts
  });
  const head = chain[chain.length - 1] ?? {
    index: -1,
    prevHash: seedHash ?? SHA256_ZERO_HASH,
    hash: seedHash ?? SHA256_ZERO_HASH,
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
