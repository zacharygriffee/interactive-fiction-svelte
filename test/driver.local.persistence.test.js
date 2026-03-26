import test from "brittle";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { ACTION_TYPES, STATE_VERSION } from "../src/lib/story/types.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

test("local persistence: save after successful mutations only", async (t) => {
  const storage = new MemoryStorage();
  let saveCount = 0;
  const originalSave = storage.save.bind(storage);
  storage.save = (state) => {
    saveCount += 1;
    originalSave(state);
  };

  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage,
    clock: createClock()
  });

  await driver.init();
  t.is(saveCount, 1);

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });
  t.is(saveCount, 2);

  await driver.dispatch({ type: ACTION_TYPES.GO_BACK });
  t.is(saveCount, 3);

  await driver.dispatch({ type: ACTION_TYPES.GO_BACK });
  t.is(saveCount, 4);
});

test("local persistence: reload restores state", async (t) => {
  const storage = new MemoryStorage();
  const graph = createStoryGraph();

  const first = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 200, step: 10 })
  });

  await first.init();
  await first.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "to-grove" });
  await first.dispatch({ type: ACTION_TYPES.GO_BACK });
  await first.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "collect-chip" });
  await first.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "decode-pattern" });

  const second = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 1000, step: 50 })
  });

  await second.init();
  const snapshot = second.getSnapshot();

  t.is(snapshot.node.id, "start");
  t.is(snapshot.flags.steps, 1);
  t.ok(snapshot.knowledge.nexusPattern);
  t.is(snapshot.inventory.signalChip, 1);
  t.is(snapshot.relationships.zephyr, 2);
  t.is(snapshot.timers.window, 2);
  t.alike(snapshot.sceneState.archive, { terminalOpen: true });
  t.is(snapshot.history.length, 3);
  t.is(snapshot.history[1].viaChoiceId, "collect-chip");
  t.is(snapshot.history[2].viaChoiceId, "decode-pattern");
});

test("local persistence: missing version ignored", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage({
    currentNodeId: "grove",
    history: [{ nodeId: "grove", at: 111 }],
    flags: { steps: 9 },
    capabilities: {},
    log: []
  });

  const driver = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 500, step: 1 })
  });

  await driver.init();
  const snapshot = driver.getSnapshot();

  t.is(snapshot.node.id, "start");
  t.is(snapshot.history.length, 1);
  t.absent(snapshot.flags.steps);
});

test("local persistence: wrong version ignored", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage({
    version: STATE_VERSION + 1,
    currentNodeId: "grove",
    history: [{ nodeId: "grove", at: 222 }],
    flags: { steps: 2 },
    capabilities: {},
    log: []
  });

  const driver = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 600, step: 1 })
  });

  await driver.init();
  const snapshot = driver.getSnapshot();

  t.is(snapshot.node.id, "start");
  t.is(snapshot.history.length, 1);
  t.absent(snapshot.flags.steps);
});

test("local persistence: clear removes saved state and fresh init is used", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage();

  const first = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 700, step: 5 })
  });

  await first.init();
  await first.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "to-grove" });

  const beforeClear = first.getSnapshot();
  t.is(beforeClear.node.id, "grove");
  t.is(beforeClear.flags.steps, 1);

  const persistedBeforeClear = storage.load();
  t.is(persistedBeforeClear.version, STATE_VERSION);

  storage.clear();

  const second = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 1000, step: 10 })
  });

  await second.init();
  const afterClear = second.getSnapshot();
  t.is(afterClear.node.id, graph.startNodeId);
  t.is(afterClear.history.length, 1);
  t.absent(afterClear.flags.steps);

  await second.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "reflect" });
  const persistedAfterFreshInit = storage.load();
  t.is(persistedAfterFreshInit.version, STATE_VERSION);
});
