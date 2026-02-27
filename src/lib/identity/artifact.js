import { canonicalizeValue } from "../story/events/canonical.js";
import { CHECKPOINT_HASH_ALG, hashCheckpointValue } from "../story/events/checkpoint.js";

export const IDENTITY_ARTIFACT_VERSION = 1;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTimestamp({ createdAt, checkpointAt, clock }) {
  if (Number.isFinite(createdAt)) {
    return createdAt;
  }

  if (clock && typeof clock.now === "function") {
    const value = clock.now();
    if (Number.isFinite(value)) {
      return value;
    }
  }

  if (Number.isFinite(checkpointAt)) {
    return checkpointAt;
  }

  return Date.now();
}

function normalizeIdentity(proof) {
  if (!proof || typeof proof.getPublicIdentity !== "function") {
    throw new Error("createIdentityArtifact requires proof.getPublicIdentity()");
  }

  const identity = proof.getPublicIdentity();
  if (!isRecord(identity) || typeof identity.pubkey !== "string" || typeof identity.alg !== "string") {
    throw new Error("proof.getPublicIdentity() must return { pubkey, alg }");
  }

  return {
    pubkey: identity.pubkey,
    alg: identity.alg
  };
}

function normalizeCheckpoint(checkpoint) {
  if (!isRecord(checkpoint)) {
    throw new Error("createIdentityArtifact requires checkpoint");
  }

  if (typeof checkpoint.hash !== "string" || checkpoint.hash.length === 0) {
    throw new Error("checkpoint.hash must be a non-empty string");
  }
  const hasAlg = typeof checkpoint.alg === "string" && checkpoint.alg.length > 0;
  if (checkpoint.alg !== undefined && !hasAlg) {
    throw new Error("checkpoint.alg must be a non-empty string when provided");
  }
  if (!Number.isFinite(checkpoint.at)) {
    throw new Error("checkpoint.at must be a finite number");
  }

  return {
    hash: checkpoint.hash,
    alg: hasAlg ? checkpoint.alg : CHECKPOINT_HASH_ALG,
    at: checkpoint.at
  };
}

function toReceiptRef(receipt) {
  return `rcpt-${hashCheckpointValue(receipt)}`;
}

function summarizeReceipts(receipts) {
  if (receipts === undefined) {
    return undefined;
  }

  if (Array.isArray(receipts)) {
    const summary = {
      count: receipts.length
    };

    if (receipts.length > 0) {
      summary.head = toReceiptRef(receipts[0]);
      summary.tail = toReceiptRef(receipts[receipts.length - 1]);
    }

    return summary;
  }

  if (isRecord(receipts)) {
    if (!Number.isFinite(receipts.count) || receipts.count < 0) {
      throw new Error("receipts.count must be a non-negative number");
    }

    const summary = {
      count: Math.floor(receipts.count)
    };

    if (typeof receipts.head === "string" && receipts.head.length > 0) {
      summary.head = receipts.head;
    }

    if (typeof receipts.tail === "string" && receipts.tail.length > 0) {
      summary.tail = receipts.tail;
    }

    return summary;
  }

  throw new Error("receipts must be an array or summary object");
}

function getSignaturePayload({ identity, checkpoint }) {
  return canonicalizeValue({
    identity,
    checkpoint
  });
}

function normalizeSignature(signature) {
  if (!isRecord(signature) || typeof signature.sig !== "string" || typeof signature.alg !== "string") {
    return null;
  }

  return {
    sig: signature.sig,
    alg: signature.alg
  };
}

export function createIdentityArtifact({ proof, checkpoint, receipts, meta, createdAt, clock } = {}) {
  const identity = normalizeIdentity(proof);
  const normalizedCheckpoint = normalizeCheckpoint(checkpoint);

  const artifact = {
    version: IDENTITY_ARTIFACT_VERSION,
    createdAt: normalizeTimestamp({
      createdAt,
      checkpointAt: normalizedCheckpoint.at,
      clock
    }),
    identity,
    checkpoint: normalizedCheckpoint
  };

  if (proof && typeof proof.sign === "function") {
    const signaturePayload = getSignaturePayload({
      identity,
      checkpoint: normalizedCheckpoint
    });
    const signature = normalizeSignature(proof.sign(signaturePayload));

    if (signature) {
      artifact.signature = signature;
    }
  }

  const receiptSummary = summarizeReceipts(receipts);
  if (receiptSummary) {
    artifact.receipts = receiptSummary;
  }

  if (isRecord(meta)) {
    artifact.meta = { ...meta };
  }

  return artifact;
}

export function encodeIdentityArtifact(artifact) {
  if (!isRecord(artifact)) {
    throw new Error("encodeIdentityArtifact requires an artifact object");
  }

  // Canonical JSON string encoding keeps portability and deterministic output stable.
  return canonicalizeValue(artifact);
}

export function decodeIdentityArtifact(str) {
  if (typeof str !== "string" || str.length === 0) {
    throw new Error("decodeIdentityArtifact requires a non-empty string");
  }

  try {
    return JSON.parse(str);
  } catch (_error) {
    throw new Error("Invalid identity artifact encoding");
  }
}

function verifyStructure(artifact) {
  if (!isRecord(artifact)) {
    return { ok: false, reason: "invalid-artifact" };
  }

  if (artifact.version !== IDENTITY_ARTIFACT_VERSION) {
    return { ok: false, reason: "unknown-version" };
  }

  if (!Number.isFinite(artifact.createdAt)) {
    return { ok: false, reason: "missing-createdAt" };
  }

  if (!isRecord(artifact.identity)) {
    return { ok: false, reason: "missing-identity" };
  }
  if (typeof artifact.identity.pubkey !== "string" || artifact.identity.pubkey.length === 0) {
    return { ok: false, reason: "malformed-identity-pubkey" };
  }
  if (typeof artifact.identity.alg !== "string" || artifact.identity.alg.length === 0) {
    return { ok: false, reason: "malformed-identity-alg" };
  }

  if (!isRecord(artifact.checkpoint)) {
    return { ok: false, reason: "missing-checkpoint" };
  }
  if (typeof artifact.checkpoint.hash !== "string" || artifact.checkpoint.hash.length === 0) {
    return { ok: false, reason: "malformed-checkpoint-hash" };
  }
  if (typeof artifact.checkpoint.alg !== "string" || artifact.checkpoint.alg.length === 0) {
    return { ok: false, reason: "malformed-checkpoint-alg" };
  }
  if (!Number.isFinite(artifact.checkpoint.at)) {
    return { ok: false, reason: "malformed-checkpoint-at" };
  }

  if (artifact.receipts !== undefined) {
    if (!isRecord(artifact.receipts)) {
      return { ok: false, reason: "malformed-receipts" };
    }
    if (!Number.isFinite(artifact.receipts.count) || artifact.receipts.count < 0) {
      return { ok: false, reason: "malformed-receipts-count" };
    }
    if (artifact.receipts.head !== undefined && typeof artifact.receipts.head !== "string") {
      return { ok: false, reason: "malformed-receipts-head" };
    }
    if (artifact.receipts.tail !== undefined && typeof artifact.receipts.tail !== "string") {
      return { ok: false, reason: "malformed-receipts-tail" };
    }
  }

  if (artifact.signature !== undefined) {
    if (!isRecord(artifact.signature)) {
      return { ok: false, reason: "malformed-signature" };
    }
    if (typeof artifact.signature.sig !== "string" || artifact.signature.sig.length === 0) {
      return { ok: false, reason: "malformed-signature-sig" };
    }
    if (typeof artifact.signature.alg !== "string" || artifact.signature.alg.length === 0) {
      return { ok: false, reason: "malformed-signature-alg" };
    }
  }

  return { ok: true };
}

function sameIdentity(a, b) {
  return a.pubkey === b.pubkey && a.alg === b.alg;
}

function verifySignatureIfPossible({ artifact, proof }) {
  if (!artifact.signature) {
    return { ok: true };
  }

  if (!proof) {
    return { ok: true };
  }

  if (typeof proof.getPublicIdentity === "function") {
    const proofIdentity = proof.getPublicIdentity();
    if (!isRecord(proofIdentity) || !sameIdentity(artifact.identity, proofIdentity)) {
      return { ok: false, reason: "proof-identity-mismatch" };
    }
  }

  const payload = getSignaturePayload({
    identity: artifact.identity,
    checkpoint: artifact.checkpoint
  });

  if (typeof proof.verify === "function") {
    try {
      const ok = proof.verify(payload, artifact.signature, artifact.identity);
      return ok
        ? { ok: true }
        : { ok: false, reason: "signature-mismatch" };
    } catch (_error) {
      return { ok: false, reason: "signature-verify-error" };
    }
  }

  if (typeof proof.sign === "function") {
    const expected = normalizeSignature(proof.sign(payload));
    if (!expected) {
      return { ok: false, reason: "signature-verify-error" };
    }

    const matches = expected.sig === artifact.signature.sig && expected.alg === artifact.signature.alg;
    return matches
      ? { ok: true }
      : { ok: false, reason: "signature-mismatch" };
  }

  return { ok: true };
}

export function verifyIdentityArtifact({ artifact, proof } = {}) {
  const structure = verifyStructure(artifact);
  if (!structure.ok) {
    return structure;
  }

  return verifySignatureIfPossible({ artifact, proof });
}
