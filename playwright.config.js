import { createPlaywrightConfig } from "./playwright.shared.js";

export default createPlaywrightConfig({
  testDir: "./smoke",
  testMatch: "**/*.smoke.spec.js",
  includeFirefoxInCI: true
});
