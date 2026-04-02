import { expect } from "@playwright/test";

const STORAGE_KEY_PREFIX = "interactive-fiction-runtime-state";

function getStoryStorageKey(storyId) {
  return `${STORAGE_KEY_PREFIX}:${storyId}`;
}

export function trackRuntimeFailures(page) {
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

export async function clearStoryStorage(page, storyId) {
  await page.goto("/");
  await page.evaluate((key) => {
    globalThis.localStorage.removeItem(key);
  }, getStoryStorageKey(storyId));
}

export async function openStory(page, storyId, { mode = "play" } = {}) {
  await page.goto(`/?mode=${mode}&story=${storyId}`);
}

export async function expectNode(page, title, bodyText) {
  await expect(page.getByTestId("node-title")).toHaveText(title);

  if (bodyText) {
    await expect(page.getByTestId("node-body")).toContainText(bodyText);
  }
}

export async function choose(page, choiceId) {
  await page.getByTestId(`choice-${choiceId}`).click();
}

export async function goBack(page) {
  await page.getByRole("button", { name: "Go Back", exact: true }).click();
}

export async function expectStoryletText(page, text) {
  await expect(page.getByTestId("node-storylets")).toContainText(text);
}

export async function expectLockedChoice(page, choiceId, reasonText) {
  const lockedChoice = page.getByTestId(`locked-choice-${choiceId}`);
  await expect(lockedChoice).toBeVisible();

  if (reasonText) {
    await expect(page.getByTestId("locked-choices-panel")).toContainText(reasonText);
  }
}
