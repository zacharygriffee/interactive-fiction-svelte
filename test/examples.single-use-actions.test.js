import test from "brittle";
import { storyGraph as shinobiGraph } from "../examples/shinobi-demo/graph.js";
import { storyGraph as terminalDossierGraph } from "../examples/terminal-dossier/graph.js";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { createClock } from "./fixtures/story.fixture.js";

function choiceIds(snapshot) {
  return snapshot.availableChoices.map((choice) => choice.id);
}

test("examples: shinobi one-shot pickup and favor actions lock after use", async (t) => {
  const driver = new LocalDriver({
    graph: shinobiGraph,
    storage: new MemoryStorage(),
    clock: createClock({ start: 10, step: 1 })
  });

  await driver.init();
  let ids = choiceIds(driver.getSnapshot());
  t.ok(ids.includes("collect-sniffer-chip"));
  t.ok(ids.includes("ping-zephyr"));

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "collect-sniffer-chip" });
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "ping-zephyr" });

  ids = choiceIds(driver.getSnapshot());
  t.absent(ids.includes("collect-sniffer-chip"));
  t.absent(ids.includes("ping-zephyr"));
});

test("examples: terminal dossier one-shot setup actions lock after use", async (t) => {
  const driver = new LocalDriver({
    graph: terminalDossierGraph,
    storage: new MemoryStorage(),
    clock: createClock({ start: 20, step: 1 })
  });

  await driver.init();
  let ids = choiceIds(driver.getSnapshot());
  t.ok(ids.includes("probe-handshake"));
  t.ok(ids.includes("cache-operator-sig"));

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "probe-handshake" });
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "cache-operator-sig" });

  ids = choiceIds(driver.getSnapshot());
  t.absent(ids.includes("probe-handshake"));
  t.absent(ids.includes("cache-operator-sig"));
});
