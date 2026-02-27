import {
  createIdentityArtifact,
  decodeIdentityArtifact,
  encodeIdentityArtifact,
  verifyIdentityArtifact
} from "./identity/artifact.js";

export { createDriver } from "./story/createDriver.js";
export { StoryDriver } from "./story/driver.js";
export { replay } from "./story/events/replay.js";

export {
  ACTION_TYPES,
  CONDITION_TYPES,
  EFFECT_TYPES,
  EVENT_KINDS,
  INTERNAL_ACTION_TYPES,
  STATE_VERSION
} from "./story/public-types.js";

export {
  body,
  choice,
  choices,
  fx,
  graph,
  node,
  requires,
  storylet,
  storylets,
  tags
} from "./story/dsl/index.js";
export { validateGraph } from "./story/dsl/validate.js";

export { assertAuthorityPort } from "./ports/authority.js";
export { assertGraphResolverPort } from "./ports/graph_resolver.js";
export { assertProofPort } from "./ports/proof.js";
export { assertProvisionalPort } from "./ports/provisional.js";

export { DefaultGraphResolver } from "./adapters/graph_resolver_default.js";
export { LocalAuthorityAdapter } from "./adapters/authority_local.js";
export { DummyProofAdapter } from "./adapters/proof_dummy.js";
export { NullProvisionalAdapter } from "./adapters/provisional_null.js";

export { canonicalizeEventStream, canonicalizeValue } from "./story/events/canonical.js";
export {
  CHECKPOINT_HASH_ALG,
  buildCheckpointArtifact,
  buildCheckpointChain,
  computeCheckpoint,
  hashCheckpointValue
} from "./story/events/checkpoint.js";

export {
  createIdentityArtifact,
  decodeIdentityArtifact,
  encodeIdentityArtifact,
  verifyIdentityArtifact
};

export const identity = {
  createIdentityArtifact,
  decodeIdentityArtifact,
  encodeIdentityArtifact,
  verifyIdentityArtifact
};
