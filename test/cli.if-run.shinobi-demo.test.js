import test from "brittle";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const SCRIPT_PATH = resolve(process.cwd(), "scripts/if-run.js");

function runCli(input) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [SCRIPT_PATH, "--stdin"], {
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

    child.stdin.end(JSON.stringify(input));
  });
}

function parseOutput(t, result) {
  t.is(result.signal, null);
  t.is(result.status, 0);
  t.is(result.stderr, "");

  const parsed = JSON.parse(result.stdout);
  t.ok(parsed && typeof parsed === "object");
  return parsed;
}

test("if-run CLI shinobi-demo: golden route reaches clean exit", async (t) => {
  const result = await runCli({
    story: "shinobi-demo",
    mode: "local",
    actions: [
      { type: "CHOOSE", choiceId: "collect-sniffer-chip" },
      { type: "CHOOSE", choiceId: "ping-zephyr" },
      { type: "CHOOSE", choiceId: "drop-to-service" },
      { type: "CHOOSE", choiceId: "decode-chip" },
      { type: "CHOOSE", choiceId: "enter-archive" },
      { type: "CHOOSE", choiceId: "pull-mirror-trace" },
      { type: "CHOOSE", choiceId: "download-ledger" },
      { type: "CHOOSE", choiceId: "route-through-echo" },
      { type: "CHOOSE", choiceId: "seal-trace-and-exfil" }
    ],
    includeCheckpoint: true,
    includeReceipts: false
  });

  const output = parseOutput(t, result);
  const snapshot = output.snapshot;

  t.is(snapshot.node?.id, "clean_exit");
  t.ok(snapshot.knowledge?.nexusPattern);
  t.ok(snapshot.knowledge?.echoAnchor);
  t.is(snapshot.relationships?.zephyr, 3);
  t.is(snapshot.timers?.pursuit, 3);
  t.is(snapshot.timers?.zephyrWindow, 2);
  t.alike(snapshot.sceneState?.archive, { terminalOpen: true });
  t.absent(snapshot.inventory?.signalChip);
  t.is(snapshot.inventory?.ledgerFragment, 1);
  t.is(output.intentCount, 10);
  t.is(output.ratifiedCount, 10);
  t.is(output.receiptCount, 10);
  t.is(typeof output.checkpoint?.hash, "string");
});
