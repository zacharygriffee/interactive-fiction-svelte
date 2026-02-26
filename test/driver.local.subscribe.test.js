import test from "brittle";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

test("local subscribe: init and successful mutations emit once each", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock()
  });

  const seen = [];
  const unsubscribe = driver.subscribe((snapshot) => {
    seen.push(snapshot.node.id);
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });
  await driver.dispatch({ type: ACTION_TYPES.GO_BACK });

  t.is(seen.length, 3);
  t.alike(seen, ["start", "start", "start"]);

  unsubscribe();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });
  t.is(seen.length, 3);
});

test("local subscribe: failed dispatch emits zero times", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock()
  });

  let emissions = 0;
  driver.subscribe(() => {
    emissions += 1;
  });

  await driver.init();
  t.is(emissions, 1);

  await t.exception(async () => {
    await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "does-not-exist" });
  });

  t.is(emissions, 1);
});

test("local subscribe: GO_BACK at root still emits for event logging", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock()
  });

  let emissions = 0;
  driver.subscribe(() => {
    emissions += 1;
  });

  await driver.init();
  t.is(emissions, 1);

  await driver.dispatch({ type: ACTION_TYPES.GO_BACK });
  t.is(emissions, 2);
});

test("local subscribe: multiple subscribers remain isolated after unsubscribe", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock()
  });

  let aCount = 0;
  let bCount = 0;

  const unsubscribeA = driver.subscribe(() => {
    aCount += 1;
  });
  driver.subscribe(() => {
    bCount += 1;
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });
  t.is(aCount, 2);
  t.is(bCount, 2);

  unsubscribeA();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });
  t.is(aCount, 2);
  t.is(bCount, 3);
});
