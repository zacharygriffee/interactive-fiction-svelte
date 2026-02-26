import test from "brittle";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

test("local driver: init starts on startNodeId", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 10, step: 5 })
  });

  await driver.init();

  const snapshot = driver.getSnapshot();
  t.is(snapshot.node.id, "start");
  t.is(snapshot.history.length, 1);
  t.is(snapshot.history[0].nodeId, "start");
  t.is(snapshot.history[0].at, 10);
});

test("local driver: ENTER_NODE navigates and records history without effects", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 100, step: 10 })
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });
  await driver.dispatch({ type: ACTION_TYPES.ENTER_NODE, nodeId: "grove" });

  const snapshot = driver.getSnapshot();
  const last = snapshot.history[snapshot.history.length - 1];

  t.is(snapshot.node.id, "grove");
  t.is(snapshot.flags.introspected, true);
  t.absent(snapshot.flags.steps);
  t.is(last.nodeId, "grove");
  t.is(last.viaChoiceId, undefined);
});

test("local driver: CHOOSE without to stays and records history", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 200, step: 3 })
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });

  const snapshot = driver.getSnapshot();
  const last = snapshot.history[snapshot.history.length - 1];

  t.is(snapshot.node.id, "start");
  t.is(snapshot.flags.introspected, true);
  t.is(snapshot.history.length, 2);
  t.is(last.nodeId, "start");
  t.is(last.viaChoiceId, "reflect");
});

test("local driver: CHOOSE applies effects and navigates", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 300, step: 5 })
  });

  await driver.init();
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "to-grove" });

  const snapshot = driver.getSnapshot();
  const last = snapshot.history[snapshot.history.length - 1];

  t.is(snapshot.node.id, "grove");
  t.is(snapshot.flags.steps, 1);
  t.is(snapshot.logTail.length, 1);
  t.is(snapshot.logTail[0].text, "Moved to grove");
  t.is(last.nodeId, "grove");
  t.is(last.viaChoiceId, "to-grove");
});

test("local driver: invalid choice throws", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock()
  });

  await driver.init();

  await t.exception(async () => {
    await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "missing-choice" });
  });

  const snapshot = driver.getSnapshot();
  t.is(snapshot.history.length, 1);
  t.is(snapshot.node.id, "start");
});

test("local driver: GO_BACK root no-op and pop semantics", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 400, step: 2 })
  });

  await driver.init();

  await driver.dispatch({ type: ACTION_TYPES.GO_BACK });
  let snapshot = driver.getSnapshot();
  t.is(snapshot.history.length, 1);
  t.is(snapshot.node.id, "start");

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "to-grove" });
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "grove-to-start" });

  snapshot = driver.getSnapshot();
  t.is(snapshot.history.length, 3);
  t.is(snapshot.node.id, "start");

  await driver.dispatch({ type: ACTION_TYPES.GO_BACK });
  snapshot = driver.getSnapshot();
  t.is(snapshot.history.length, 2);
  t.is(snapshot.node.id, "grove");

  await driver.dispatch({ type: ACTION_TYPES.GO_BACK });
  snapshot = driver.getSnapshot();
  t.is(snapshot.history.length, 1);
  t.is(snapshot.node.id, "start");

  await driver.dispatch({ type: ACTION_TYPES.GO_BACK });
  snapshot = driver.getSnapshot();
  t.is(snapshot.history.length, 1);
  t.is(snapshot.node.id, "start");
});

test("local driver: invalid graph choice target throws early", async (t) => {
  const graph = createStoryGraph();
  graph.nodesById.start.choices.push({ id: "bad", label: "Bad", to: "missing" });

  await t.exception(() => {
    new LocalDriver({
      graph,
      storage: new MemoryStorage(),
      clock: createClock()
    });
  });
});

test("local driver: ratified log grows and grants are applied by ratifier", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 500, step: 1 })
  });

  await driver.init();

  let snapshot = driver.getSnapshot();
  const initialIntentCount = snapshot.intentLog.length;
  const initialRatifiedCount = snapshot.ratifiedLog.length;

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "probe-signal" });
  snapshot = driver.getSnapshot();
  t.is(snapshot.intentLog.length, initialIntentCount + 1);
  t.is(snapshot.ratifiedLog.length, initialRatifiedCount + 1);
  t.ok(snapshot.capabilities["cap.deepDossier"]);

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });
  snapshot = driver.getSnapshot();
  t.ok(snapshot.capabilities["cap.askAgent"]);
});
