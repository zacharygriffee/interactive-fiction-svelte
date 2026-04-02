import { createPlaywrightConfig } from "./playwright.shared.js";

export default createPlaywrightConfig({
  testDir: "./browser",
  testMatch: "**/*.browser.spec.js",
  includeFirefoxInCI: false
});
