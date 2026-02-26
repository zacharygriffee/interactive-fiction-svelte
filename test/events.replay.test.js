import test from "brittle";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { replay } from "../src/lib/story/events/replay.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

function compactHistory(history) {
  return history.map((entry) => ({
    nodeId: entry.nodeId,
    viaChoiceId: entry.viaChoiceId
  }));
}

test("events replay: reproduces final authoritative state", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage();
  const driver = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 1000, step: 5 })
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "probe-signal" });
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "to-grove" });

  const liveState = storage.load();

  const replayed = replay({
    graph,
    intentLog: liveState.intentLog,
    ratifiedLog: liveState.ratifiedLog
  });

  t.is(replayed.currentNodeId, liveState.currentNodeId);
  t.alike(replayed.flags, liveState.flags);
  t.alike(replayed.capabilities, liveState.capabilities);
  t.alike(replayed.revealedStorylets, liveState.revealedStorylets);
  t.is(replayed.history.length, liveState.history.length);
  t.alike(compactHistory(replayed.history), compactHistory(liveState.history));
});
