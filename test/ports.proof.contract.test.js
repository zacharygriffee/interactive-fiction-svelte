import test from "brittle";
import { DummyProofAdapter } from "../src/lib/adapters/proof_dummy.js";

test("proof port contract: stable identity shape", (t) => {
  const proof = new DummyProofAdapter({ pubkey: "agent-1", alg: "dummy-fnv1a" });
  const identity = proof.getPublicIdentity();

  t.alike(identity, {
    pubkey: "agent-1",
    alg: "dummy-fnv1a"
  });
});

test("proof port contract: deterministic signatures", (t) => {
  const proof = new DummyProofAdapter({ seed: "s1", pubkey: "agent-1", alg: "dummy-fnv1a" });

  const first = proof.sign("hello");
  const second = proof.sign("hello");
  const third = proof.sign(new Uint8Array([104, 101, 108, 108, 111]));

  t.alike(first, second);
  t.alike(second, third);
  t.is(typeof first.sig, "string");
  t.is(first.alg, "dummy-fnv1a");
  t.is(proof.verify("hello", first, proof.getPublicIdentity()), true);
  t.is(proof.verify("bye", first, proof.getPublicIdentity()), false);
});
