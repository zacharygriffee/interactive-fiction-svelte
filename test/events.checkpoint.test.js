import test from "brittle";
import {
  CHECKPOINT_HASH_ALG,
  buildCheckpointArtifact,
  buildCheckpointChain,
  computeCheckpoint
} from "../src/lib/story/events/checkpoint.js";
import { canonicalizeEventStream, canonicalizeValue } from "../src/lib/story/events/canonical.js";
import { DummyProofAdapter } from "../src/lib/adapters/proof_dummy.js";

function fixtureLogs() {
  return {
    intentLog: [
      {
        kind: "intent",
        id: "intent-1",
        type: "CHOOSE",
        payload: { choiceId: "probe-signal", to: "start" },
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
        at: 11,
        reason: "policy"
      }
    ],
    receiptLog: [
      {
        kind: "receipt",
        authority: "local",
        at: 10,
        intentId: "intent-1",
        ratifiedId: "ratified-1"
      }
    ]
  };
}

test("canonical: object key order is stable", (t) => {
  const first = canonicalizeValue({ b: 2, a: 1, nested: { z: true, y: false } });
  const second = canonicalizeValue({ nested: { y: false, z: true }, a: 1, b: 2 });

  t.is(first, second);
});

test("canonical: event stream canonicalization is deterministic", (t) => {
  const logs = fixtureLogs();
  const first = canonicalizeEventStream(logs);
  const second = canonicalizeEventStream(logs);

  t.is(first, second);
});

test("checkpoint: chain hash is deterministic for same input", (t) => {
  const logs = fixtureLogs();

  const first = buildCheckpointChain(logs);
  const second = buildCheckpointChain(logs);

  t.alike(first, second);
  t.is(first.length, 1);
  t.is(first[0].intentId, "intent-1");
  t.is(first[0].ratifiedId, "ratified-1");
});

test("checkpoint: artifact can include optional proof signature", (t) => {
  const logs = fixtureLogs();
  const proof = new DummyProofAdapter({ seed: "seed-a", pubkey: "agent-a", alg: "dummy-fnv1a" });

  const artifact = buildCheckpointArtifact({ ...logs, proof });

  t.is(typeof artifact.head.hash, "string");
  t.is(artifact.identity.pubkey, "agent-a");
  t.is(artifact.signature.alg, "dummy-fnv1a");
});

test("checkpoint: computeCheckpoint returns stable hash/alg/at", (t) => {
  const logs = fixtureLogs();
  const checkpoint = computeCheckpoint(logs);
  const checkpointAgain = computeCheckpoint(logs);

  t.alike(checkpoint, checkpointAgain);
  t.is(checkpoint.alg, CHECKPOINT_HASH_ALG);
  t.is(typeof checkpoint.hash, "string");
  t.is(checkpoint.at, 11);
});
