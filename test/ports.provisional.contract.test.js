import test from "brittle";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { NullProvisionalAdapter } from "../src/lib/adapters/provisional_null.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

class TestProvisionalAdapter {
  constructor() {
    this._listeners = new Set();
  }

  subscribe(cb) {
    this._listeners.add(cb);
    return () => {
      this._listeners.delete(cb);
    };
  }

  emit(message) {
    for (const listener of this._listeners) {
      listener(message);
    }
  }
}

test("provisional port contract: null adapter provides no-op subscription", (t) => {
  const adapter = new NullProvisionalAdapter();
  const unsubscribe = adapter.subscribe(() => {
    t.fail("NullProvisionalAdapter should not emit");
  });

  t.is(typeof unsubscribe, "function");
  unsubscribe();
  t.pass();
});

test("provisional port contract: emissions reach snapshot and are not persisted", async (t) => {
  const graph = createStoryGraph();
  const storage = new MemoryStorage();
  const provisional = new TestProvisionalAdapter();

  const first = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 300, step: 1 }),
    provisional
  });

  await first.init();
  provisional.emit({ at: 900, source: "organism", text: "pending suggestion" });

  const withProvisional = first.getSnapshot();
  t.is(withProvisional.provisionalTail.length, 1);
  t.is(withProvisional.provisionalTail[0].source, "organism");
  t.is(withProvisional.provisionalTail[0].text, "pending suggestion");

  const persisted = storage.load();
  t.absent(persisted.provisionalTail);
  t.absent(persisted.provisional);

  const second = new LocalDriver({
    graph,
    storage,
    clock: createClock({ start: 1000, step: 1 }),
    provisional: new NullProvisionalAdapter()
  });

  await second.init();
  const afterReload = second.getSnapshot();
  t.is(afterReload.provisionalTail.length, 0);
});
