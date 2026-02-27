import test from "brittle";
import { access, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const assetsDemoPath = path.join(projectRoot, "assets", "demo.png");
const distAssetsDemoPath = path.join(projectRoot, "dist", "assets", "demo.png");
const distManifestPath = path.join(projectRoot, "dist", "assets", "manifest.json");

test("assets convention: demo asset exists in repo", async (t) => {
  await access(assetsDemoPath);
  const info = await stat(assetsDemoPath);
  t.ok(info.isFile());
  t.ok(info.size > 0);
});

test("assets convention: prepare-dist copies assets to dist/assets", async (t) => {
  await rm(path.join(projectRoot, "dist", "assets"), { recursive: true, force: true });

  const { stdout } = await execFileAsync("node", ["scripts/prepare-dist.js", "play"], {
    cwd: projectRoot
  });

  t.ok(stdout.includes("assets copied"));

  await access(distAssetsDemoPath);
  const info = await stat(distAssetsDemoPath);
  t.ok(info.isFile());
  t.ok(info.size > 0);

  const manifestRaw = await readFile(distManifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);
  t.ok(Array.isArray(manifest.files));
  t.ok(manifest.files.includes("demo.png"));
});
