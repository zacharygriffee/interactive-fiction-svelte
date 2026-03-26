#!/usr/bin/env node
import { readFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ACTION_TYPES,
  EFFECT_TYPES,
  DummyProofAdapter,
  canonicalizeValue,
  computeCheckpoint,
  createDriver,
  createIdentityArtifact,
  encodeIdentityArtifact
} from "../src/lib/index.js";
import { storyGraph as defaultStoryGraph } from "../src/lib/story/graph.js";
import { storyGraph as terminalDossierGraph } from "../examples/terminal-dossier/graph.js";
import { storyGraph as shinobiDemoGraph } from "../examples/shinobi-demo/graph.js";

const STORY_ID_DEFAULT = "default";
const STORY_ID_TERMINAL_DOSSIER = "terminal-dossier";
const STORY_ID_SHINOBI_DEMO = "shinobi-demo";

const MODE_LOCAL = "local";
const MODE_LOOPBACK = "loopback";

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LOOPBACK_ADAPTER_RELATIVE_PATH = "../interactive-fiction-ecology-adapter/src/index.js";

function writeJson(value) {
  return new Promise((resolveWrite, rejectWrite) => {
    process.stdout.write(`${canonicalizeValue(value)}\n`, (error) => {
      if (error) {
        rejectWrite(error);
        return;
      }
      resolveWrite();
    });
  });
}

function parseBooleanString(value, flagName) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`${flagName} must be true or false`);
}

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    scriptPath: null,
    useStdin: false,
    storyOverride: null,
    modeOverride: null,
    includeReceiptsOverride: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--script") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--script requires a file path");
      }
      options.scriptPath = value;
      index += 1;
      continue;
    }

    if (arg === "--stdin") {
      options.useStdin = true;
      continue;
    }

    if (arg === "--story") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--story requires a value");
      }
      options.storyOverride = value;
      index += 1;
      continue;
    }

    if (arg === "--mode") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--mode requires a value");
      }
      options.modeOverride = value;
      index += 1;
      continue;
    }

    if (arg === "--includeReceipts") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--includeReceipts requires true or false");
      }
      options.includeReceiptsOverride = parseBooleanString(value, "--includeReceipts");
      index += 1;
      continue;
    }

    if (arg === "--json") {
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.scriptPath && options.useStdin) {
    throw new Error("Use either --script or --stdin, not both");
  }

  return options;
}

async function readStdinText() {
  process.stdin.setEncoding("utf8");
  let text = "";
  for await (const chunk of process.stdin) {
    text += chunk;
  }
  return text;
}

async function loadInputJson(options) {
  if (options.scriptPath) {
    const absolutePath = resolve(process.cwd(), options.scriptPath);
    const source = await readFile(absolutePath, "utf8");
    if (source.trim().length === 0) {
      return {};
    }
    return JSON.parse(source);
  }

  if (options.useStdin) {
    const source = await readStdinText();
    if (source.trim().length === 0) {
      return {};
    }
    return JSON.parse(source);
  }

  return {};
}

function createInMemoryStorage(initial = null) {
  let state = initial === null ? null : JSON.parse(JSON.stringify(initial));

  return {
    load() {
      return state === null ? null : JSON.parse(JSON.stringify(state));
    },
    save(nextState) {
      state = nextState === null ? null : JSON.parse(JSON.stringify(nextState));
    }
  };
}

function createStepClock({ start = 0, step = 1 } = {}) {
  let current = start - step;
  return {
    now() {
      current += step;
      return current;
    }
  };
}

function toRecord(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return {};
}

function normalizeMode(value) {
  if (typeof value !== "string") {
    return MODE_LOCAL;
  }

  const normalized = value.toLowerCase();
  if (normalized === MODE_LOCAL || normalized === MODE_LOOPBACK) {
    return normalized;
  }

  throw new Error(`Invalid mode: ${value}`);
}

function resolveStoryGraph(storyId) {
  if (storyId === STORY_ID_DEFAULT) {
    return defaultStoryGraph;
  }
  if (storyId === STORY_ID_TERMINAL_DOSSIER) {
    return terminalDossierGraph;
  }
  if (storyId === STORY_ID_SHINOBI_DEMO) {
    return shinobiDemoGraph;
  }

  throw new Error(`Unknown story id: ${storyId}`);
}

function normalizeInput({ parsedArgs, inputJson }) {
  const input = toRecord(inputJson);

  const story = parsedArgs.storyOverride ?? input.story ?? STORY_ID_DEFAULT;
  const mode = normalizeMode(parsedArgs.modeOverride ?? input.mode ?? MODE_LOCAL);
  let actions = [];

  if (input.actions === undefined) {
    actions = [];
  } else if (Array.isArray(input.actions)) {
    actions = input.actions;
  } else {
    throw new Error("actions must be an array");
  }

  for (const action of actions) {
    if (!action || typeof action !== "object" || Array.isArray(action)) {
      throw new Error("Each action must be an object");
    }
  }

  const includeCheckpoint = input.includeCheckpoint === true;
  const exportArtifact = input.exportArtifact === true;
  const includeReceipts = parsedArgs.includeReceiptsOverride ?? (input.includeReceipts === true);

  return {
    story,
    mode,
    actions,
    includeCheckpoint,
    exportArtifact,
    includeReceipts
  };
}

async function importIfAvailable(specifier) {
  try {
    return await import(specifier);
  } catch (_error) {
    return null;
  }
}

async function importFileIfExists(filePath) {
  try {
    await access(filePath);
  } catch (_error) {
    return null;
  }
  return import(pathToFileURL(filePath).href);
}

async function loadLoopbackAdapterModule() {
  const envSpecifier = process.env.IF_ECOLOGY_ADAPTER;
  if (typeof envSpecifier === "string" && envSpecifier.length > 0) {
    const fromEnv = await importIfAvailable(envSpecifier);
    if (fromEnv) {
      return fromEnv;
    }
  }

  const fromDependency = await importIfAvailable("interactive-fiction-ecology-adapter");
  if (fromDependency) {
    return fromDependency;
  }

  const relativeCandidate = resolve(ROOT_DIR, LOOPBACK_ADAPTER_RELATIVE_PATH);
  const fromSiblingRepo = await importFileIfExists(relativeCandidate);
  if (fromSiblingRepo) {
    return fromSiblingRepo;
  }

  throw new Error(
    "loopback mode requires interactive-fiction-ecology-adapter. Install it as a dependency, " +
    "set IF_ECOLOGY_ADAPTER, or place the repo at ../interactive-fiction-ecology-adapter."
  );
}

function assertLoopbackExports(moduleValue) {
  const required = [
    "createAuthorityAdapter",
    "createGraphResolverAdapter",
    "createLoopbackClient",
    "createProofAdapter",
    "createProvisionalAdapter"
  ];

  for (const key of required) {
    if (typeof moduleValue?.[key] !== "function") {
      throw new Error(`loopback adapter module missing export: ${key}`);
    }
  }
}

function createLocalRuntime({ story }) {
  const storage = createInMemoryStorage();
  const clock = createStepClock();
  const graph = resolveStoryGraph(story);
  const proof = new DummyProofAdapter();

  const graphResolver = {
    getGraph() {
      return graph;
    }
  };

  const driver = createDriver({
    mode: MODE_LOCAL,
    graphResolver,
    storage,
    clock,
    proof
  });

  return {
    storyGraph: graph,
    proof,
    driver
  };
}

async function createLoopbackRuntime({ story }) {
  const storage = createInMemoryStorage();
  const clock = createStepClock();
  const graph = resolveStoryGraph(story);
  const loopbackModule = await loadLoopbackAdapterModule();
  assertLoopbackExports(loopbackModule);

  const client = loopbackModule.createLoopbackClient({
    graph,
    clock,
    core: {
      ACTION_TYPES,
      EFFECT_TYPES
    }
  });

  const authority = loopbackModule.createAuthorityAdapter({ client });
  const provisional = loopbackModule.createProvisionalAdapter({ client });
  const graphResolver = loopbackModule.createGraphResolverAdapter({ client });
  const proof = loopbackModule.createProofAdapter({ client });

  const driver = createDriver({
    mode: MODE_LOCAL,
    storage,
    clock,
    authority,
    provisional,
    graphResolver,
    proof
  });

  return {
    storyGraph: graph,
    proof,
    driver
  };
}

async function createRuntime(config) {
  if (config.mode === MODE_LOCAL) {
    return createLocalRuntime(config);
  }

  if (config.mode === MODE_LOOPBACK) {
    return createLoopbackRuntime(config);
  }

  throw new Error(`Unsupported mode: ${config.mode}`);
}

function buildOutput({
  snapshot,
  includeCheckpoint,
  exportArtifact,
  includeReceipts,
  proof
}) {
  const checkpoint = (includeCheckpoint || exportArtifact)
    ? computeCheckpoint({
      intentLog: snapshot.intentLog,
      ratifiedLog: snapshot.ratifiedLog,
      receiptLog: snapshot.receiptLog,
      includeReceipts
    })
    : null;

  let artifact = null;
  if (exportArtifact) {
    const object = createIdentityArtifact({
      proof,
      checkpoint,
      receipts: snapshot.receiptLog
    });
    artifact = {
      object,
      encoded: encodeIdentityArtifact(object)
    };
  }

  return {
    snapshot,
    checkpoint: includeCheckpoint ? checkpoint : null,
    artifact,
    receiptCount: snapshot.receiptLog.length,
    ratifiedCount: snapshot.ratifiedLog.length,
    intentCount: snapshot.intentLog.length
  };
}

async function run() {
  const parsedArgs = parseArgs(process.argv.slice(2));
  const inputJson = await loadInputJson(parsedArgs);
  const input = normalizeInput({ parsedArgs, inputJson });
  const runtime = await createRuntime(input);

  await runtime.driver.init();

  for (const action of input.actions) {
    await runtime.driver.dispatch(action);
  }

  const snapshot = runtime.driver.getSnapshot();
  const output = buildOutput({
    snapshot,
    includeCheckpoint: input.includeCheckpoint,
    exportArtifact: input.exportArtifact,
    includeReceipts: input.includeReceipts,
    proof: runtime.proof
  });

  await writeJson(output);
}

run().catch(async (error) => {
  await writeJson({
    error: {
      message: error.message
    }
  });
  process.exitCode = 1;
});
