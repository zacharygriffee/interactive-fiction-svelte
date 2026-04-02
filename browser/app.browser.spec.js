import { test, expect } from "@playwright/test";
import {
  trackRuntimeFailures,
  clearStoryStorage,
  openStory,
  expectNode,
  choose,
  goBack,
  expectStoryletText,
  expectLockedChoice
} from "./helpers.js";

test("default story preserves navigation history and browser persistence", async ({ page }) => {
  const assertHealthy = trackRuntimeFailures(page);

  await clearStoryStorage(page, "default");
  await openStory(page, "default");

  await expect(page.getByTestId("runtime-view")).toBeVisible();
  await expectNode(page, "Crossroads", "You stand at the edge of the old forest.");

  await choose(page, "to-forest");
  await expectNode(page, "Forest", "Trees close in around you.");
  await expect(page.getByTestId("recent-outcome-panel")).toContainText("Moved to Forest");
  await expect(page.getByTestId("recent-outcome-panel")).toContainText("Unlocked choice: to-start");

  await goBack(page);
  await expectNode(page, "Crossroads", "You stand at the edge of the old forest.");
  await expect(page.getByTestId("recent-outcome-panel")).toContainText("Moved to Crossroads");

  await choose(page, "to-forest");
  await expectNode(page, "Forest", "Trees close in around you.");

  await page.reload();
  await expectNode(page, "Forest", "Trees close in around you.");

  await clearStoryStorage(page, "default");
  await openStory(page, "default");
  await expectNode(page, "Crossroads", "You stand at the edge of the old forest.");

  assertHealthy();
});

test("terminal dossier dev mode exposes capability gating and unlock progression", async ({ page }) => {
  const assertHealthy = trackRuntimeFailures(page);

  await clearStoryStorage(page, "terminal-dossier");
  await openStory(page, "terminal-dossier", { mode: "dev" });

  await expect(page.getByRole("heading", { name: "Interactive Fiction Runtime — Dev Mode" })).toBeVisible();
  await expectNode(
    page,
    "Signal Terminal",
    "A green cursor blinks over an open dossier shell. Something is already watching this session."
  );
  await expect(page.getByAltText("signal still frame")).toBeVisible();
  await expect(page.getByTestId("debug-panel")).toBeVisible();

  await expectLockedChoice(page, "to-root-console", 'Requires capability "cap.deepDossier"');
  await expectLockedChoice(page, "to-mirror-feed", 'Requires capability "cap.askAgent"');

  await choose(page, "probe-handshake");
  await expectNode(
    page,
    "Signal Terminal",
    "A green cursor blinks over an open dossier shell. Something is already watching this session."
  );
  await expect(page.getByTestId("recent-outcome-panel")).toContainText("Unlocked choice: to-root-console");
  await expect(page.getByTestId("choice-to-root-console")).toBeVisible();
  await expectLockedChoice(page, "to-mirror-feed", 'Requires capability "cap.askAgent"');
  await expect(page.getByTestId("debug-panel")).toContainText("ACTION: probe-handshake");

  await choose(page, "to-corridor");
  await expectNode(page, "Service Corridor", "The lights dim whenever the terminal emits a ping behind you.");

  await choose(page, "corridor-to-terminal");
  await expectNode(
    page,
    "Signal Terminal",
    "A green cursor blinks over an open dossier shell. Something is already watching this session."
  );
  await expect(page.getByTestId("choice-to-mirror-feed")).toBeVisible();
  await expect(page.getByTestId("choice-to-root-console")).toBeVisible();
  await expect(page.getByTestId("recent-outcome-panel")).toContainText("Unlocked choice: to-mirror-feed");
  await expectStoryletText(page, "A second voice appears only after your probe and asks for confirmation.");
  await expectStoryletText(page, "Deep dossier blocks unfold into personnel links and suppressed timestamps.");
  await expect(page.getByTestId("debug-panel")).toContainText("TRACE: handshake fragment cached");

  assertHealthy();
});

test("shinobi demo golden route unlocks archive access and reaches clean exit", async ({ page }) => {
  const assertHealthy = trackRuntimeFailures(page);

  await clearStoryStorage(page, "shinobi-demo");
  await openStory(page, "shinobi-demo");

  await expectNode(
    page,
    "Roofline",
    "Rain combs across the antenna field while Shinobi studies Virtualia's service district cycling through another sleepless loop."
  );

  await choose(page, "collect-sniffer-chip");
  await choose(page, "ping-zephyr");
  await choose(page, "drop-to-service");

  await expectNode(
    page,
    "Service Access",
    "The maintenance corridor smells like wet dust and coolant. Ahead, a terminal sits half-closed, as if somebody stood up from it too fast."
  );
  await expect(page.getByTestId("choice-enter-archive")).toHaveCount(0);
  await expect(page.getByTestId("choice-decode-chip")).toBeVisible();

  await choose(page, "decode-chip");
  await expect(page.getByTestId("recent-outcome-panel")).toContainText("Unlocked choice: enter-archive");
  await expect(page.getByTestId("choice-enter-archive")).toBeVisible();

  await choose(page, "enter-archive");
  await expectNode(
    page,
    "Archive Shell",
    "Cold mirrors stack into black corridors, each one holding routes that should have died on contact and somehow didn't."
  );

  await choose(page, "pull-mirror-trace");
  await choose(page, "download-ledger");
  await choose(page, "route-through-echo");

  await expectNode(
    page,
    "Echo Chamber",
    "The channel is supposed to be dead. It still carries enough current to decide whether Shinobi walks out with the evidence or gets buried under it."
  );
  await expect(page.getByTestId("choice-seal-trace-and-exfil")).toBeVisible();

  await choose(page, "seal-trace-and-exfil");
  await expectNode(
    page,
    "Clean Exit",
    "Shinobi leaves with proof, a thinner shadow, and the kind of certainty that only gets heavier once you're carrying it."
  );

  assertHealthy();
});
