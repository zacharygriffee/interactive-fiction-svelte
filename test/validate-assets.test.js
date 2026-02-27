import test from "brittle";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { formatAssetValidationReport, validateAssets } from "../scripts/validate-assets.js";

async function withTempDir(fn) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "if-assets-test-"));
  try {
    return await fn(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("validate-assets: returns ok for existing asset references", async (t) => {
  await withTempDir(async (rootDir) => {
    const assetsDir = path.join(rootDir, "assets");
    await mkdir(assetsDir, { recursive: true });
    await writeFile(path.join(assetsDir, "present.png"), "ok");

    const graph = {
      startNodeId: "start",
      nodesById: {
        start: {
          id: "start",
          body: "<img src=\"/assets/present.png\" alt=\"present\" />",
          choices: []
        }
      }
    };

    const result = await validateAssets({
      rootDir,
      graphs: [{ id: "synthetic", graph }],
      assetFiles: ["present.png"]
    });

    t.is(result.ok, true);
    t.is(result.missing.length, 0);
    t.is(result.unused.length, 0);
  });
});

test("validate-assets: reports missing references with sorted deterministic output", async (t) => {
  await withTempDir(async (rootDir) => {
    const assetsDir = path.join(rootDir, "assets");
    await mkdir(assetsDir, { recursive: true });
    await writeFile(path.join(assetsDir, "present.png"), "ok");
    await writeFile(path.join(assetsDir, "unused.png"), "unused");

    const graph = {
      startNodeId: "start",
      nodesById: {
        start: {
          id: "start",
          body: "<img src=\"/assets/z-missing.png\" /><img src=\"/assets/present.png\" />",
          storylets: [
            {
              id: "s1",
              body: "<img src=\"/assets/a-missing.png\" />"
            }
          ],
          choices: []
        }
      }
    };

    const result = await validateAssets({
      rootDir,
      graphs: [{ id: "synthetic", graph }],
      assetFiles: ["present.png", "unused.png"]
    });

    t.is(result.ok, false);
    t.alike(
      result.missing.map((item) => item.assetPath),
      ["/assets/a-missing.png", "/assets/z-missing.png"]
    );
    t.is(result.missing[0].references[0].storyletId, "s1");
    t.ok(result.missing[0].references[0].location.includes("storylets[0].body"));
    t.ok(result.unused.includes("unused.png"));

    const report = formatAssetValidationReport(result);
    t.ok(report.includes("ERROR: missing /assets references detected"));
    t.ok(report.includes("/assets/a-missing.png"));
    t.ok(report.includes("WARN: unused assets:"));
  });
});
