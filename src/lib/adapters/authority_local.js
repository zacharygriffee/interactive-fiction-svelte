import { createRatifiedEvent } from "../story/events/types.js";
import { createRatifierSim } from "../story/policy/ratifier_sim.js";

function cloneEffects(effects = []) {
  return effects.map((effect) => ({ ...effect }));
}

export class LocalAuthorityAdapter {
  constructor({ graph, clock, ratifier, authorityName = "local" } = {}) {
    this._clock = clock ?? { now: () => Date.now() };
    this._ratifier = ratifier ?? createRatifierSim({ graph, clock: this._clock });
    this._authorityName = authorityName;
  }

  ratifyIntent({ state, intentEvent, graph }) {
    const decision = this._ratifier.ratifyIntent({ state, intentEvent, graph });

    const effects = Array.isArray(decision?.effects)
      ? cloneEffects(decision.effects)
      : cloneEffects(intentEvent?.payload?.effects ?? []);

    const grants = Array.isArray(decision?.grants) ? [...decision.grants] : [];

    const ratifiedEvent = createRatifiedEvent({
      effects,
      grants,
      at: this._clock.now(),
      reason: decision?.reason
    });

    const receipt = {
      kind: "receipt",
      authority: this._authorityName,
      at: Number.isFinite(intentEvent?.at) ? intentEvent.at : ratifiedEvent.at
    };

    return {
      ratifiedEvent,
      receipt
    };
  }

  close() {}
}
