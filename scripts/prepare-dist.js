import { mkdir, readFile, readdir, stat, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const assetsDir = path.join(projectRoot, "assets");

function resolveAppEnv(targetMode) {
  if (targetMode === "dev") {
    return "development";
  }
  return "production";
}

function createIndexHtml(appEnv) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Interactive Fiction Runtime</title>
</head>
<body>
  <div id="app"></div>
  <script>window.__APP_ENV__ = ${JSON.stringify(appEnv)};</script>
  <script type="module" src="./app.js"></script>
</body>
</html>
`;
}

async function copyDirectoryContents(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(srcDir, entry.name);
    const destinationPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryContents(sourcePath, destinationPath);
      continue;
    }

    if (entry.isFile()) {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

async function listAssetFiles(rootDir) {
  const result = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }

      const relativePath = toPosixPath(path.relative(rootDir, fullPath));
      if (relativePath === "manifest.json") {
        continue;
      }

      result.push(relativePath);
    }
  }

  await walk(rootDir);
  result.sort((a, b) => a.localeCompare(b));
  return result;
}

async function copyAssetsIfPresent() {
  try {
    const info = await stat(assetsDir);
    if (!info.isDirectory()) {
      return null;
    }

    const distAssetsDir = path.join(distDir, "assets");
    await copyDirectoryContents(assetsDir, distAssetsDir);

    const files = await listAssetFiles(assetsDir);
    await writeFile(
      path.join(distAssetsDir, "manifest.json"),
      JSON.stringify({ files }, null, 2),
      "utf8"
    );
    return files;
  } catch (_error) {
    return null;
  }
}

async function main() {
  const targetMode = process.argv[2] === "dev" ? "dev" : "play";
  const appEnv = resolveAppEnv(targetMode);
  const appJsSource = await readFile(path.join(projectRoot, "app.js"), "utf8");

  await mkdir(distDir, { recursive: true });
  await writeFile(path.join(distDir, "index.html"), createIndexHtml(appEnv), "utf8");
  await writeFile(path.join(distDir, "app.js"), appJsSource, "utf8");

  const copiedAssets = await copyAssetsIfPresent();
  const assetsMessage = copiedAssets
    ? `assets copied (${copiedAssets.length} files + manifest)`
    : "no assets directory found";

  console.log(`prepared dist shell for ${targetMode} mode (app env: ${appEnv}; ${assetsMessage})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
