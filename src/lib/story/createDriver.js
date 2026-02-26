import { LocalDriver } from "./drivers/local.js";
import { EcologyDriver } from "./drivers/ecology_stub.js";
import { LocalAuthorityAdapter } from "../adapters/authority_local.js";
import { NullProvisionalAdapter } from "../adapters/provisional_null.js";
import { DefaultGraphResolver } from "../adapters/graph_resolver_default.js";
import { DummyProofAdapter } from "../adapters/proof_dummy.js";

function buildLocalDependencies(options = {}) {
  const graphResolver = options.graphResolver ?? new DefaultGraphResolver({ graph: options.graph });
  const graph = graphResolver.getGraph({});

  const authority = options.authority ??
    new LocalAuthorityAdapter({
      graph,
      clock: options.clock,
      ratifier: options.ratifier
    });

  const provisional = options.provisional ?? new NullProvisionalAdapter();
  const proof = options.proof ?? new DummyProofAdapter();

  return {
    ...options,
    graph,
    graphResolver,
    authority,
    provisional,
    proof
  };
}

export function createDriver(options = {}) {
  const { mode = "local" } = options;

  if (mode === "local") {
    return new LocalDriver(buildLocalDependencies(options));
  }

  if (mode === "ecology") {
    if (options.localDriver) {
      return new EcologyDriver(options);
    }

    const localDriver = new LocalDriver(buildLocalDependencies(options));
    return new EcologyDriver({
      ...options,
      localDriver
    });
  }

  throw new Error(`Unknown driver mode: ${mode}`);
}
