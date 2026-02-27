import test from "brittle";
import { DummyProofAdapter } from "../src/lib/adapters/proof_dummy.js";
import { computeCheckpoint } from "../src/lib/story/events/checkpoint.js";
import {
  createIdentityArtifact,
  decodeIdentityArtifact,
  encodeIdentityArtifact,
  verifyIdentityArtifact
} from "../src/lib/identity/artifact.js";

function fixtureLogs() {
  return {
    intentLog: [
      {
        kind: "intent",
        id: "intent-1",
        type: "CHOOSE",
        payload: { nodeId: "start", choiceId: "probe-signal", to: "start", effects: [] },
        at: 10
      }
    ],
    ratifiedLog: [
      {
        kind: "ratified",
        id: "ratified-1",
        intentId: "intent-1",
        effects: [{ type: "inc", key: "curiosity", by: 1 }],
        grants: ["cap.askAgent"],
        at: 11
      }
    ],
    receiptLog: [
      {
        version: 1,
        kind: "receipt",
        authority: "local",
        at: 11,
        intentId: "intent-1",
        ratifiedId: "ratified-1",
        sig: "local:abc123"
      }
    ]
  };
}

test("identity artifact: round-trip encode/decode is stable", (t) => {
  const proof = new DummyProofAdapter({ seed: "seed-a", pubkey: "agent-a", alg: "dummy-fnv1a" });
  const checkpoint = {
    hash: "0011aabb",
    alg: "fnv1a-32",
    at: 42
  };

  const artifact = createIdentityArtifact({
    proof,
    checkpoint,
    meta: { storyId: "terminal-dossier" },
    createdAt: 100
  });

  const encoded = encodeIdentityArtifact(artifact);
  const decoded = decodeIdentityArtifact(encoded);

  t.alike(decoded, artifact);
});

test("identity artifact: deterministic signature with dummy proof", (t) => {
  const proof = new DummyProofAdapter({ seed: "seed-b", pubkey: "agent-b", alg: "dummy-fnv1a" });
  const checkpoint = {
    hash: "00ffeedd",
    alg: "fnv1a-32",
    at: 77
  };

  const first = createIdentityArtifact({ proof, checkpoint, createdAt: 700 });
  const second = createIdentityArtifact({ proof, checkpoint, createdAt: 700 });

  t.alike(first.signature, second.signature);
  const verification = verifyIdentityArtifact({ artifact: first, proof, mode: "strict" });
  t.alike(verification, { ok: true });
});

test("identity artifact: strict mode fails without proof", (t) => {
  const proof = new DummyProofAdapter({ seed: "seed-strict-1", pubkey: "agent-strict-1", alg: "dummy-fnv1a" });
  const artifact = createIdentityArtifact({
    proof,
    checkpoint: {
      hash: "abc12300",
      alg: "fnv1a-32",
      at: 88
    },
    createdAt: 88
  });

  const verification = verifyIdentityArtifact({ artifact, mode: "strict" });
  t.alike(verification, { ok: false, reason: "strict-proof-required" });
});

test("identity artifact: strict mode fails without signature", (t) => {
  const proof = new DummyProofAdapter({ seed: "seed-strict-2", pubkey: "agent-strict-2", alg: "dummy-fnv1a" });
  const artifact = {
    version: 1,
    createdAt: 12,
    identity: proof.getPublicIdentity(),
    checkpoint: {
      hash: "abc12399",
      alg: "fnv1a-32",
      at: 12
    }
  };

  const verification = verifyIdentityArtifact({ artifact, proof, mode: "strict" });
  t.alike(verification, { ok: false, reason: "strict-signature-required" });
});

test("identity artifact: structural mode is permissive without proof", (t) => {
  const proof = new DummyProofAdapter({ seed: "seed-struct-1", pubkey: "agent-struct-1", alg: "dummy-fnv1a" });
  const artifact = createIdentityArtifact({
    proof,
    checkpoint: {
      hash: "ff00ee11",
      alg: "fnv1a-32",
      at: 91
    },
    createdAt: 91
  });

  const verification = verifyIdentityArtifact({ artifact, mode: "structural" });
  t.alike(verification, { ok: true, warning: "signature-unverified-no-proof" });
});

test("identity artifact: privacy default omits raw receipt logs", (t) => {
  const logs = fixtureLogs();
  const proof = new DummyProofAdapter({ seed: "seed-c", pubkey: "agent-c", alg: "dummy-fnv1a" });
  const checkpoint = computeCheckpoint(logs);

  const artifact = createIdentityArtifact({
    proof,
    checkpoint,
    receipts: logs.receiptLog,
    createdAt: 900
  });

  t.is(Array.isArray(artifact.receiptLog), false);
  t.ok(artifact.receipts);
  t.is(artifact.receipts.count, 1);
  t.is(typeof artifact.receipts.head, "string");
  t.is(typeof artifact.receipts.tail, "string");
});

test("identity artifact: compatibility failures return reasons", (t) => {
  const unknownVersion = verifyIdentityArtifact({
    artifact: {
      version: 2,
      createdAt: 1,
      identity: { pubkey: "p", alg: "a" },
      checkpoint: { hash: "abc", alg: "fnv1a-32", at: 1 }
    }
  });
  t.alike(unknownVersion, { ok: false, reason: "unknown-version" });

  const missingRequired = verifyIdentityArtifact({ artifact: { version: 1 } });
  t.alike(missingRequired, { ok: false, reason: "missing-createdAt" });

  const malformedCheckpoint = verifyIdentityArtifact({
    artifact: {
      version: 1,
      createdAt: 1,
      identity: { pubkey: "p", alg: "a" },
      checkpoint: { hash: "", alg: "fnv1a-32", at: 1 }
    }
  });
  t.alike(malformedCheckpoint, { ok: false, reason: "malformed-checkpoint-hash" });
});

test("identity artifact: checkpoint binding matches computeCheckpoint", (t) => {
  const logs = fixtureLogs();
  const checkpoint = computeCheckpoint(logs);
  const proof = new DummyProofAdapter({ seed: "seed-d", pubkey: "agent-d", alg: "dummy-fnv1a" });

  const artifact = createIdentityArtifact({
    proof,
    checkpoint,
    receipts: logs.receiptLog,
    meta: { storyId: "default" },
    createdAt: 1234
  });

  t.is(artifact.checkpoint.hash, checkpoint.hash);
  t.is(artifact.checkpoint.alg, checkpoint.alg);
  t.is(artifact.checkpoint.at, checkpoint.at);
});

test("identity artifact: createdAt defaults to checkpoint.at deterministically", (t) => {
  const proof = new DummyProofAdapter({ seed: "seed-created-at", pubkey: "agent-created-at", alg: "dummy-fnv1a" });
  const checkpoint = {
    hash: "cc11dd22",
    alg: "fnv1a-32",
    at: 333
  };

  const first = createIdentityArtifact({
    proof,
    checkpoint,
    clock: { now: () => 999 }
  });
  const second = createIdentityArtifact({
    proof,
    checkpoint,
    clock: { now: () => 111 }
  });

  t.is(first.createdAt, 333);
  t.is(second.createdAt, 333);
  t.is(encodeIdentityArtifact(first), encodeIdentityArtifact(second));
});
