import test from "brittle";
import * as api from "../src/lib/index.js";

test("public api: expected exports exist", (t) => {
  t.is(typeof api.createDriver, "function");
  t.is(typeof api.StoryDriver, "function");
  t.is(typeof api.validateGraph, "function");
  t.is(typeof api.graph, "function");
  t.is(typeof api.choice, "function");
  t.is(typeof api.assertAuthorityPort, "function");
  t.is(typeof api.DefaultGraphResolver, "function");
  t.is(typeof api.canonicalizeEventStream, "function");
  t.is(typeof api.buildCheckpointArtifact, "function");
  t.is(typeof api.computeCheckpoint, "function");
  t.is(typeof api.createIdentityArtifact, "function");
  t.is(typeof api.verifyIdentityArtifact, "function");
  t.is(typeof api.identity.createIdentityArtifact, "function");
});
