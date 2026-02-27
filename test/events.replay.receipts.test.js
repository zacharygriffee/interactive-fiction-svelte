import test from "brittle";
import { replay } from "../src/lib/story/events/replay.js";
import { createStoryGraph } from "./fixtures/story.fixture.js";

test("replay: carries receipt log with intent/ratified linkage", (t) => {
  const graph = createStoryGraph();
  const intentLog = [
    {
      kind: "intent",
      id: "intent-1",
      type: "CHOOSE",
      payload: {
        nodeId: "start",
        choiceId: "reflect",
        choiceLabel: "Reflect",
        to: "start",
        effects: [{ type: "setFlag", key: "introspected", value: true }],
        historyEntry: {
          nodeId: "start",
          viaChoiceId: "reflect",
          at: 2
        }
      },
      at: 1
    }
  ];
  const ratifiedLog = [
    {
      kind: "ratified",
      id: "ratified-1",
      intentId: "intent-1",
      effects: [{ type: "setFlag", key: "introspected", value: true }],
      grants: [],
      at: 1
    }
  ];
  const receiptLog = [
    {
      kind: "receipt",
      authority: "local",
      at: 1,
      intentId: "intent-1",
      ratifiedId: "ratified-1"
    }
  ];

  const result = replay({ graph, intentLog, ratifiedLog, receiptLog });

  t.is(result.receiptLog.length, 1);
  t.is(result.receiptLog[0].intentId, "intent-1");
  t.is(result.receiptLog[0].ratifiedId, "ratified-1");
});
