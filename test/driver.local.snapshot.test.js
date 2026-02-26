import test from "brittle";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

test("local snapshot: choice filtering respects conditions", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock()
  });

  await driver.init();

  let ids = driver.getSnapshot().availableChoices.map((choice) => choice.id);
  t.absent(ids.includes("to-lab"));
  t.absent(ids.includes("to-secret"));

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "set-keycard" });
  ids = driver.getSnapshot().availableChoices.map((choice) => choice.id);
  t.absent(ids.includes("to-lab"));

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "set-stage" });
  ids = driver.getSnapshot().availableChoices.map((choice) => choice.id);
  t.ok(ids.includes("to-lab"));

  const capabilityDriver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock(),
    capabilities: { betaRoute: true }
  });

  await capabilityDriver.init();
  const capabilityIds = capabilityDriver.getSnapshot().availableChoices.map((choice) => choice.id);
  t.ok(capabilityIds.includes("to-secret"));
});

test("local snapshot: flags and logs update with deterministic timestamps", async (t) => {
  const clock = createClock({ start: 50, step: 5 });
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "to-grove" });

  const snapshot = driver.getSnapshot();
  const lastHistory = snapshot.history[snapshot.history.length - 1];

  t.is(snapshot.flags.steps, 1);
  t.is(snapshot.logTail.length, 1);
  t.ok(typeof snapshot.logTail[0].at === "number");
  t.is(lastHistory.nodeId, "grove");
  t.ok(typeof lastHistory.at === "number");
  t.ok(lastHistory.at >= snapshot.logTail[0].at);
});

test("local snapshot: mutating returned snapshot does not mutate driver state", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 1000, step: 1 })
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });

  const first = driver.getSnapshot();
  first.flags.hacked = true;
  first.capabilities.injected = true;
  first.history.push({ nodeId: "lab", viaChoiceId: "x", at: 9999 });
  first.availableChoices.pop();
  first.logTail.push({ level: "warn", text: "mutated", at: 1 });

  const second = driver.getSnapshot();

  t.absent(second.flags.hacked);
  t.absent(second.capabilities.injected);
  t.is(second.history.length, 2);
  t.ok(second.availableChoices.length >= 1);
  t.is(second.logTail.length, 0);
});
