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
  first.knowledge.injected = true;
  first.inventory.fake = 9;
  first.relationships.fake = 9;
  first.timers.fake = 9;
  first.sceneState.injected = { open: true };
  first.history.push({ nodeId: "lab", viaChoiceId: "x", at: 9999 });
  first.availableChoices.pop();
  first.logTail.push({ level: "warn", text: "mutated", at: 1 });

  const second = driver.getSnapshot();

  t.absent(second.flags.hacked);
  t.absent(second.capabilities.injected);
  t.absent(second.knowledge.injected);
  t.absent(second.inventory.fake);
  t.absent(second.relationships.fake);
  t.absent(second.timers.fake);
  t.absent(second.sceneState.injected);
  t.is(second.history.length, 2);
  t.ok(second.availableChoices.length >= 1);
  t.is(second.logTail.length, 0);
});

test("local snapshot: extended state domains drive investigation branching", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 300, step: 10 })
  });

  await driver.init();

  let choiceIds = driver.getSnapshot().availableChoices.map((choice) => choice.id);
  t.absent(choiceIds.includes("decode-pattern"));
  t.absent(choiceIds.includes("to-archive"));

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "collect-chip" });
  choiceIds = driver.getSnapshot().availableChoices.map((choice) => choice.id);
  t.ok(choiceIds.includes("decode-pattern"));

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "decode-pattern" });
  const snapshot = driver.getSnapshot();

  t.ok(snapshot.knowledge.nexusPattern);
  t.is(snapshot.inventory.signalChip, 1);
  t.is(snapshot.relationships.zephyr, 2);
  t.is(snapshot.timers.window, 2);
  t.is(snapshot.timers.pursuit, 1);
  t.alike(snapshot.sceneState.archive, { terminalOpen: true });
  t.ok(snapshot.availableChoices.some((choice) => choice.id === "to-archive"));

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "to-archive" });
  t.is(driver.getSnapshot().node.id, "archive");
});
