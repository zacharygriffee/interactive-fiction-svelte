import test from "brittle";
import { LocalDriver } from "../src/lib/story/drivers/local.js";
import { MemoryStorage } from "../src/lib/story/storage/memory.js";
import { ACTION_TYPES } from "../src/lib/story/types.js";
import { createStoryGraph, createClock } from "./fixtures/story.fixture.js";

test("storylets: visibility filtering and deterministic sort", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 100, step: 1 })
  });

  await driver.init();

  const first = driver.getSnapshot();
  t.alike(
    first.visibleStorylets.map((storylet) => storylet.id),
    ["first-reveal", "ambient"]
  );

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "probe-signal" });
  let snapshot = driver.getSnapshot();
  t.alike(
    snapshot.visibleStorylets.map((storylet) => storylet.id),
    ["deep-dossier", "ambient"]
  );

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "set-keycard" });
  snapshot = driver.getSnapshot();
  t.alike(
    snapshot.visibleStorylets.map((storylet) => storylet.id),
    ["full-brief", "deep-dossier", "ambient"]
  );
});

test("storylets: once storylet appears once and remains revealed", async (t) => {
  const driver = new LocalDriver({
    graph: createStoryGraph(),
    storage: new MemoryStorage(),
    clock: createClock({ start: 200, step: 1 })
  });

  await driver.init();

  const first = driver.getSnapshot();
  const second = driver.getSnapshot();

  t.ok(first.visibleStorylets.some((storylet) => storylet.id === "first-reveal"));
  t.absent(second.visibleStorylets.some((storylet) => storylet.id === "first-reveal"));

  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "to-grove" });
  await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId: "grove-to-start" });
  const third = driver.getSnapshot();

  t.absent(third.visibleStorylets.some((storylet) => storylet.id === "first-reveal"));
});
