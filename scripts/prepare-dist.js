import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

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

async function main() {
  const targetMode = process.argv[2] === "dev" ? "dev" : "play";
  const appEnv = resolveAppEnv(targetMode);
  const appJsSource = await readFile(path.join(projectRoot, "app.js"), "utf8");

  await mkdir(distDir, { recursive: true });
  await writeFile(path.join(distDir, "index.html"), createIndexHtml(appEnv), "utf8");
  await writeFile(path.join(distDir, "app.js"), appJsSource, "utf8");

  console.log(`prepared dist shell for ${targetMode} mode (app env: ${appEnv})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
