import test from "brittle";
import { EcologyDriver } from "../src/lib/story/drivers/ecology_stub.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

test("ecology stub: conforms to story driver contract", (t) => {
  const driver = new EcologyDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock()
  });

  t.is(typeof driver.init, "function");
  t.is(typeof driver.getSnapshot, "function");
  t.is(typeof driver.dispatch, "function");
  t.is(typeof driver.subscribe, "function");
});

test("ecology stub: provisional messages are UI-only and not persisted", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage();

  const first = new EcologyDriver({
    graph,
    storage,
    clock: createClock({ start: 100, step: 10 })
  });

  await first.init();
  const before = first.getSnapshot();

  first.injectProvisional({ source: "ecology", text: "pending" });
  const after = first.getSnapshot();

  t.is(after.provisionalTail.length, 1);
  t.alike(after.flags, before.flags);
  t.alike(after.capabilities, before.capabilities);
  t.is(after.history.length, before.history.length);
  t.is(after.logTail.length, before.logTail.length);

  const second = new EcologyDriver({
    graph,
    storage,
    clock: createClock({ start: 1000, step: 10 })
  });

  await second.init();
  const restored = second.getSnapshot();
  t.is(restored.provisionalTail.length, 0);
  t.is(restored.node.id, "start");
});

test("ecology stub: applyRatified mutates authoritative local state", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage();

  const first = new EcologyDriver({
    graph,
    storage,
    clock: createClock({ start: 200, step: 5 })
  });

  await first.init();
  await first.applyRatified([
    { type: "setFlag", key: "ratified", value: true },
    { type: "pushLog", level: "info", text: "ratified effect" }
  ]);

  const afterRatify = first.getSnapshot();
  t.is(afterRatify.flags.ratified, true);
  t.is(afterRatify.logTail.length, 1);
  t.is(afterRatify.history.length, 1);
  t.is(afterRatify.provisionalTail.length, 0);

  const second = new EcologyDriver({
    graph,
    storage,
    clock: createClock({ start: 999, step: 1 })
  });

  await second.init();
  const restored = second.getSnapshot();
  t.is(restored.flags.ratified, true);
  t.is(restored.logTail.length, 1);
  t.is(restored.provisionalTail.length, 0);
});
