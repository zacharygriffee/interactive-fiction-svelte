import { readdir, stat, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const assetsRoot = path.join(projectRoot, "assets");

const ASSET_REF_PATTERN = /\/assets\/[^"'\s)><]+/g;

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function normalizeAssetRef(ref) {
  const withoutQuery = ref.split("?")[0].split("#")[0];
  if (!withoutQuery.startsWith("/assets/")) {
    return null;
  }
  return withoutQuery;
}

function extractAssetRefsFromString(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const matches = text.match(ASSET_REF_PATTERN) ?? [];
  const normalized = matches
    .map((item) => normalizeAssetRef(item))
    .filter((item) => typeof item === "string");

  return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
}

function collectAssetReferencesFromGraph(graph, graphId) {
  const references = [];
  const nodesById = graph?.nodesById ?? {};

  const nodeIds = Object.keys(nodesById).sort((a, b) => a.localeCompare(b));
  for (const nodeId of nodeIds) {
    const node = nodesById[nodeId];

    const nodeBodyRefs = extractAssetRefsFromString(node?.body);
    for (const assetPath of nodeBodyRefs) {
      references.push({
        graphId,
        nodeId,
        field: "node.body",
        assetPath,
        location: `${graphId}:nodesById.${nodeId}.body`
      });
    }

    const storylets = Array.isArray(node?.storylets) ? node.storylets : [];
    for (let index = 0; index < storylets.length; index += 1) {
      const storylet = storylets[index];
      const storyletId = typeof storylet?.id === "string" ? storylet.id : `index-${index}`;
      const storyletRefs = extractAssetRefsFromString(storylet?.body);

      for (const assetPath of storyletRefs) {
        references.push({
          graphId,
          nodeId,
          storyletId,
          field: "storylet.body",
          assetPath,
          location: `${graphId}:nodesById.${nodeId}.storylets[${index}].body`
        });
      }
    }
  }

  references.sort((a, b) => {
    const byAsset = a.assetPath.localeCompare(b.assetPath);
    if (byAsset !== 0) {
      return byAsset;
    }
    return a.location.localeCompare(b.location);
  });

  return references;
}

async function listFilesRecursive(rootDir) {
  const info = await stat(rootDir);
  if (!info.isDirectory()) {
    return [];
  }

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
      if (entry.isFile()) {
        result.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return result;
}

async function discoverExampleGraphFiles(examplesRoot) {
  try {
    const files = await listFilesRecursive(examplesRoot);
    return files
      .filter((file) => path.basename(file) === "graph.js")
      .sort((a, b) => a.localeCompare(b));
  } catch (_error) {
    return [];
  }
}

function toExampleGraphId(filePath) {
  const relative = path.relative(path.join(projectRoot, "examples"), filePath);
  const dirname = path.dirname(relative);
  return dirname === "." ? "example" : toPosixPath(dirname);
}

async function loadGraphFromFile(filePath) {
  const url = pathToFileURL(filePath).href;
  const module = await import(url);
  if (!module || typeof module.storyGraph !== "object") {
    throw new Error(`Missing storyGraph export: ${filePath}`);
  }
  return module.storyGraph;
}

export async function loadKnownGraphs({ rootDir = projectRoot } = {}) {
  const knownGraphs = [];

  const defaultGraphFile = path.join(rootDir, "src", "lib", "story", "graph.js");
  const defaultGraph = await loadGraphFromFile(defaultGraphFile);
  knownGraphs.push({ id: "default", graph: defaultGraph });

  const examplesRoot = path.join(rootDir, "examples");
  const exampleFiles = await discoverExampleGraphFiles(examplesRoot);
  for (const filePath of exampleFiles) {
    const graph = await loadGraphFromFile(filePath);
    knownGraphs.push({
      id: `example:${toExampleGraphId(filePath)}`,
      graph
    });
  }

  knownGraphs.sort((a, b) => a.id.localeCompare(b.id));
  return knownGraphs;
}

export async function listAssetFiles({ rootDir = projectRoot } = {}) {
  const root = path.join(rootDir, "assets");

  try {
    const files = await listFilesRecursive(root);
    return files
      .map((filePath) => path.relative(root, filePath))
      .map((relativePath) => toPosixPath(relativePath))
      .filter((relativePath) => relativePath !== "manifest.json")
      .sort((a, b) => a.localeCompare(b));
  } catch (_error) {
    return [];
  }
}

async function fileExists(fullPath) {
  try {
    await access(fullPath);
    return true;
  } catch (_error) {
    return false;
  }
}

function groupMissingReferences(missingReferences) {
  const byAsset = new Map();

  for (const reference of missingReferences) {
    const list = byAsset.get(reference.assetPath) ?? [];
    list.push(reference);
    byAsset.set(reference.assetPath, list);
  }

  const grouped = Array.from(byAsset.entries())
    .map(([assetPath, refs]) => ({
      assetPath,
      references: refs.sort((a, b) => a.location.localeCompare(b.location))
    }))
    .sort((a, b) => a.assetPath.localeCompare(b.assetPath));

  return grouped;
}

export async function validateAssets({ graphs, assetFiles, rootDir = projectRoot } = {}) {
  const resolvedGraphs = graphs ?? await loadKnownGraphs({ rootDir });
  const resolvedAssetFiles = assetFiles ?? await listAssetFiles({ rootDir });
  const assetsByPath = new Set(resolvedAssetFiles.map((item) => `/assets/${item}`));

  const references = [];
  for (const graphItem of resolvedGraphs) {
    const refs = collectAssetReferencesFromGraph(graphItem.graph, graphItem.id);
    references.push(...refs);
  }

  references.sort((a, b) => {
    const byAsset = a.assetPath.localeCompare(b.assetPath);
    if (byAsset !== 0) {
      return byAsset;
    }
    return a.location.localeCompare(b.location);
  });

  const missingReferences = [];
  for (const reference of references) {
    if (assetsByPath.has(reference.assetPath)) {
      continue;
    }

    const relativePath = reference.assetPath.slice("/assets/".length);
    const expectedPath = path.join(rootDir, "assets", relativePath);
    // Double-check via filesystem to support tests that pass synthetic asset lists.
    // If path truly exists, treat it as present.
    // eslint-disable-next-line no-await-in-loop
    if (await fileExists(expectedPath)) {
      continue;
    }

    missingReferences.push(reference);
  }

  const referencedAssetPaths = new Set(references.map((item) => item.assetPath));
  const unusedAssets = resolvedAssetFiles
    .filter((relativePath) => !referencedAssetPaths.has(`/assets/${relativePath}`))
    .sort((a, b) => a.localeCompare(b));

  return {
    ok: missingReferences.length === 0,
    references,
    missing: groupMissingReferences(missingReferences),
    unused: unusedAssets
  };
}

export function formatAssetValidationReport(result) {
  const lines = [];

  if (result.ok) {
    lines.push("OK: all /assets references resolve");
  } else {
    lines.push("ERROR: missing /assets references detected");
    for (const item of result.missing) {
      lines.push(`- ${item.assetPath}`);
      for (const reference of item.references) {
        lines.push(`  - ${reference.location}`);
      }
    }
  }

  if (result.unused.length === 0) {
    lines.push("WARN: unused assets: none");
  } else {
    lines.push("WARN: unused assets:");
    for (const unused of result.unused) {
      lines.push(`- /assets/${unused}`);
    }
  }

  return lines.join("\n");
}

async function main() {
  const result = await validateAssets();
  const report = formatAssetValidationReport(result);

  if (!result.ok) {
    console.error(report);
    process.exit(1);
  }

  console.log(report);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
