import { defineConfig } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "4174";
const baseURL = `http://127.0.0.1:${port}`;

function createProjects({ includeFirefoxInCI = false } = {}) {
  const projects = [
    {
      name: "chromium",
      use: {
        browserName: "chromium"
      }
    }
  ];

  if (includeFirefoxInCI && process.env.CI) {
    projects.push({
      name: "firefox",
      use: {
        browserName: "firefox"
      }
    });
  }

  return projects;
}

export function createPlaywrightConfig({
  testDir,
  testMatch,
  includeFirefoxInCI = false
} = {}) {
  return defineConfig({
    testDir,
    testMatch,
    forbidOnly: Boolean(process.env.CI),
    fullyParallel: false,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    projects: createProjects({ includeFirefoxInCI }),
    reporter: process.env.CI
      ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
      : "list",
    use: {
      baseURL,
      headless: true,
      screenshot: "only-on-failure",
      trace: "retain-on-failure",
      video: "retain-on-failure"
    },
    webServer: {
      command: `node ./node_modules/sirv-cli/bin.js dist --single --host 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    }
  });
}
