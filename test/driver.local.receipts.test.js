import test from "brittle";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

test("local driver: intent/ratified ids and receipt log are recorded", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 100, step: 1 })
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "probe-signal" });

  const snapshot = driver.getSnapshot();
  const latestIntent = snapshot.intentLog[snapshot.intentLog.length - 1];
  const latestRatified = snapshot.ratifiedLog[snapshot.ratifiedLog.length - 1];
  const latestReceipt = snapshot.receiptLog[snapshot.receiptLog.length - 1];

  t.is(typeof latestIntent.id, "string");
  t.is(typeof latestRatified.id, "string");
  t.is(latestReceipt.version, 1);
  t.is(latestRatified.intentId, latestIntent.id);
  t.is(latestReceipt.intentId, latestIntent.id);
  t.is(latestReceipt.ratifiedId, latestRatified.id);
});

test("local driver: receipt log is persisted and restored", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage();

  const first = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 200, step: 2 })
  });

  await first.init();
  await first.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });

  const persisted = storage.load();
  t.ok(Array.isArray(persisted.receiptLog));
  t.ok(persisted.receiptLog.length > 0);

  const second = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 500, step: 2 })
  });

  await second.init();
  const snapshot = second.getSnapshot();
  t.ok(Array.isArray(snapshot.receiptLog));
  t.ok(snapshot.receiptLog.length > 0);
  t.is(snapshot.receiptLog[0].version, 1);
});

test("local driver: throws when authority receipt is missing required linkage", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage();
  const badAuthority = {
    ratifyIntent() {
      return {
        ratifiedEvent: {
          kind: "ratified",
          id: "ratified-1",
          intentId: "intent-1",
          effects: [],
          grants: [],
          at: 10
        },
        receipt: {
          version: 1,
          kind: "receipt",
          authority: "bad",
          at: 10,
          intentId: "intent-1"
        }
      };
    }
  };

  const driver = new LocalDriver({
    graph,
    storage,
    authority: badAuthority,
    clock: createClock({ start: 10, step: 1 })
  });

  await t.exception(
    driver.init(),
    /Invalid receipt from authority/
  );
});
