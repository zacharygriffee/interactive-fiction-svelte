import { test, expect } from "@playwright/test";

function trackRuntimeFailures(page) {
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  return () => {
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  };
}

async function gotoRoute(page, path) {
  await page.goto(path);
}

function getNodeView(page) {
  return page.getByTestId("node-view");
}

function getNodeTitle(page) {
  return page.getByTestId("node-title");
}

function getNodeBody(page) {
  return page.getByTestId("node-body");
}

function getDebugPanel(page) {
  return page.getByTestId("debug-panel");
}

async function clickChoice(page, choiceId) {
  await page.getByTestId(`choice-${choiceId}`).click();
}

test("landing page renders example selector", async ({ page }) => {
  const assertHealthy = trackRuntimeFailures(page);

  await gotoRoute(page, "/");

  const landingView = page.getByTestId("landing-view");
  await expect(landingView.getByRole("heading", { name: "Example Selector" })).toBeVisible();
  await expect(page.getByTestId("story-card-default")).toContainText("Default Story");
  await expect(page.getByTestId("story-card-terminal-dossier")).toContainText("Terminal Dossier");
  await expect(page.getByTestId("story-card-shinobi-demo")).toContainText("Shinobi Demo");

  assertHealthy();
});

test("default story route loads and advances after one interaction", async ({ page }) => {
  const assertHealthy = trackRuntimeFailures(page);

  await gotoRoute(page, "/?mode=play&story=default");

  const runtimeView = page.getByTestId("runtime-view");
  await expect(runtimeView).toBeVisible();
  await expect(getNodeView(page)).toBeVisible();
  await expect(getNodeTitle(page)).toHaveText("Crossroads");
  await expect(getNodeBody(page)).toContainText("You stand at the edge of the old forest.");
  await expect(page.getByTestId("choice-inspect")).toContainText("Inspect the path");

  await clickChoice(page, "to-forest");

  await expect(getNodeTitle(page)).toHaveText("Forest");
  await expect(getNodeBody(page)).toContainText("Trees close in around you.");

  assertHealthy();
});

test("terminal dossier route loads media-backed content and advances after one interaction", async ({ page }) => {
  const assertHealthy = trackRuntimeFailures(page);

  await gotoRoute(page, "/?mode=play&story=terminal-dossier");

  await expect(getNodeTitle(page)).toHaveText("Signal Terminal");
  await expect(getNodeBody(page)).toContainText(
    "A green cursor blinks over an open dossier shell. Something is already watching this session."
  );
  await expect(page.getByTestId("choice-probe-handshake")).toContainText("Probe handshake buffer");

  const stillFrame = page.getByAltText("signal still frame");
  await expect(stillFrame).toBeVisible();
  await expect(stillFrame).toHaveAttribute("src", "/assets/demo.png");

  await clickChoice(page, "to-corridor");

  await expect(getNodeTitle(page)).toHaveText("Service Corridor");
  await expect(getNodeBody(page)).toContainText("The lights dim whenever the terminal emits a ping behind you.");

  assertHealthy();
});

test("shinobi demo route loads and advances after one interaction", async ({ page }) => {
  const assertHealthy = trackRuntimeFailures(page);

  await gotoRoute(page, "/?mode=play&story=shinobi-demo");

  await expect(getNodeTitle(page)).toHaveText("Roofline");
  await expect(getNodeBody(page)).toContainText(
    "Rain combs across the antenna field while Shinobi studies Virtualia's service district cycling through another sleepless loop."
  );
  await expect(page.getByTestId("choice-collect-sniffer-chip")).toContainText("Slip a sniffer chip into your palm");

  await clickChoice(page, "drop-to-service");

  await expect(getNodeTitle(page)).toHaveText("Service Access");
  await expect(getNodeBody(page)).toContainText(
    "The maintenance corridor smells like wet dust and coolant. Ahead, a terminal sits half-closed, as if somebody stood up from it too fast."
  );

  assertHealthy();
});

test("dev mode shows console and locked-choice diagnostics for the default story", async ({ page }) => {
  const assertHealthy = trackRuntimeFailures(page);

  await gotoRoute(page, "/?mode=dev&story=default");

  await expect(page.getByRole("heading", { name: "Interactive Fiction Runtime — Dev Mode" })).toBeVisible();
  await expect(page.getByTestId("runtime-view")).toBeVisible();
  await expect(getDebugPanel(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide Console" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide Locked Choices" })).toBeVisible();

  const lockedChoicesPanel = page.getByTestId("locked-choices-panel");
  await expect(lockedChoicesPanel).toBeVisible();
  await expect(page.getByTestId("locked-choice-to-secret")).toContainText("Take the hidden route");
  await expect(lockedChoicesPanel).toContainText('Requires capability "cap.deepDossier"');

  await page.getByRole("button", { name: "Hide Console" }).click();
  await expect(getDebugPanel(page)).toBeHidden();
  await page.getByRole("button", { name: "Show Console" }).click();
  await expect(getDebugPanel(page)).toBeVisible();

  assertHealthy();
});
