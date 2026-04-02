import test from "brittle";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("package manifest: publish surface targets the runtime entrypoint", (t) => {
  t.is(packageJson.main, "./src/lib/index.js");
  t.is(packageJson.sideEffects, false);
  t.is(packageJson.exports["."], "./src/lib/index.js");
  t.is(packageJson.exports["./examples"], "./examples/index.js");
});

test("package manifest: published files are limited to library content", (t) => {
  t.alike(packageJson.files, [
    "src/lib/index.js",
    "src/lib/adapters",
    "src/lib/identity",
    "src/lib/ports",
    "src/lib/story",
    "examples",
    "README.md",
    "LICENSE"
  ]);
});
