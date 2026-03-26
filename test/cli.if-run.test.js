import test from "brittle";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { storyGraph as defaultStoryGraph } from "../src/lib/story/graph.js";

const SCRIPT_PATH = resolve(process.cwd(), "scripts/if-run.js");

function runCli({ args = [], input } = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [SCRIPT_PATH, ...args], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      rejectRun(error);
    });

    child.on("close", (status, signal) => {
      resolveRun({
        status,
        signal,
        stdout,
        stderr
      });
    });

    if (input === undefined) {
      child.stdin.end();
      return;
    }

    child.stdin.end(JSON.stringify(input));
  });
}

function parseCliJsonOutput(t, result) {
  if (result.signal !== null) {
    t.fail(`CLI terminated by signal: ${result.signal}`);
    return null;
  }
  if (result.status !== 0) {
    t.fail(`CLI exited with status ${result.status}. stderr: ${result.stderr} stdout: ${result.stdout}`);
    return null;
  }
  if (result.stderr) {
    t.fail(`CLI wrote to stderr: ${result.stderr}`);
    return null;
  }

  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (_error) {
    t.fail(`Expected valid JSON output, got: ${result.stdout}`);
    return null;
  }

  const isObject = Boolean(parsed) && typeof parsed === "object";
  t.ok(isObject);
  return isObject ? parsed : null;
}

test("if-run CLI: basic load starts at graph start node", async (t) => {
  const result = await runCli();
  const output = parseCliJsonOutput(t, result);
  t.ok(output);
  if (!output) {
    return;
  }

  const currentNodeId = output.snapshot?.currentNodeId ?? output.snapshot?.node?.id;
  t.is(currentNodeId, defaultStoryGraph.startNodeId);
});

test("if-run CLI: deterministic playthrough yields golden checkpoint hash", async (t) => {
  const input = {
    story: "default",
    mode: "local",
    actions: [
      { type: "CHOOSE", choiceId: "inspect" },
      { type: "GO_BACK" }
    ],
    includeCheckpoint: true,
    includeReceipts: false
  };

  const result = await runCli({
    args: ["--stdin"],
    input
  });
  const output = parseCliJsonOutput(t, result);
  t.ok(output);
  if (!output) {
    return;
  }

  t.is(typeof output.checkpoint?.hash, "string");
  t.is(output.checkpoint?.hash, "70f687b7523ab1379288f97448222a48ef1a2a2b341a769ea3890203bc526e79");
});

test("if-run CLI: artifact encoding is deterministic for same input", async (t) => {
  const input = {
    story: "default",
    mode: "local",
    actions: [
      { type: "CHOOSE", choiceId: "inspect" },
      { type: "GO_BACK" }
    ],
    includeCheckpoint: true,
    includeReceipts: false,
    exportArtifact: true
  };

  const firstResult = await runCli({
    args: ["--stdin"],
    input
  });
  const secondResult = await runCli({
    args: ["--stdin"],
    input
  });

  const first = parseCliJsonOutput(t, firstResult);
  const second = parseCliJsonOutput(t, secondResult);
  t.ok(first);
  t.ok(second);
  if (!first || !second) {
    return;
  }

  t.is(typeof first.artifact?.encoded, "string");
  t.is(first.artifact?.encoded, second.artifact?.encoded);
});
