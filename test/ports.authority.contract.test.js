import test from "brittle";
import { LocalAuthorityAdapter } from "../src/lib/adapters/authority_local.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { createStoryGraph } from "./fixtures/story.fixture.js";

test("authority port contract: deterministic ratified event and receipt shape", async (t) => {
  const graph = createStoryGraph();
  const fixedClock = { now: () => 777 };

  const authority = new LocalAuthorityAdapter({ graph, clock: fixedClock });

  const state = {
    history: [
      { nodeId: "start", at: 1 },
      { nodeId: "start", viaChoiceId: "reflect", at: 2 }
    ],
    flags: {
      curiosity: 1
    },
    capabilities: {}
  };

  const intentEvent = {
    kind: "intent",
    id: "intent-1",
    type: ACTION_TYPES.CHOOSE,
    payload: {
      choiceId: "probe-signal",
      choiceLabel: "Probe signal",
      effects: []
    },
    at: 123
  };

  const first = await authority.ratifyIntent({ state, intentEvent, graph });
  const second = await authority.ratifyIntent({ state, intentEvent, graph });

  t.alike(first, second);
  t.is(first.ratifiedEvent.kind, "ratified");
  t.is(first.ratifiedEvent.at, 777);
  t.ok(first.ratifiedEvent.effects.some((effect) => effect.type === "inc" && effect.key === "curiosity"));
  t.ok(first.ratifiedEvent.grants.includes("cap.askAgent"));
  t.ok(first.ratifiedEvent.grants.includes("cap.deepDossier"));
  t.is(first.ratifiedEvent.intentId, "intent-1");
  t.is(typeof first.ratifiedEvent.id, "string");

  t.is(first.receipt.version, 1);
  t.is(first.receipt.kind, "receipt");
  t.is(first.receipt.authority, "local");
  t.is(first.receipt.at, 123);
  t.is(first.receipt.intentId, "intent-1");
  t.is(first.receipt.ratifiedId, first.ratifiedEvent.id);
});
