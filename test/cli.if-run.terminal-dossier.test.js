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

function includesId(list, id) {
  return Array.isArray(list) && list.some((item) => item?.id === id);
}

function includesText(list, text) {
  return Array.isArray(list) && list.some((item) => item?.text === text);
}

test("if-run CLI terminal-dossier: fx and gating mechanics are active", async (t) => {
  const result = await runCli({
    story: "terminal-dossier",
    mode: "local",
    actions: [
      { type: "CHOOSE", choiceId: "probe-handshake" },
      { type: "CHOOSE", choiceId: "to-corridor" },
      { type: "CHOOSE", choiceId: "corridor-to-terminal" }
    ],
    includeCheckpoint: true,
    includeReceipts: false
  });

  const output = parseOutput(t, result);
  const snapshot = output.snapshot;

  t.is(snapshot.node?.id, "terminal_boot");
  t.is(output.intentCount, 4);
  t.is(output.ratifiedCount, 4);
  t.is(output.receiptCount, 4);

  t.is(snapshot.flags.probePrimed, true);
  t.is(snapshot.flags.steps, 1);
  t.is(snapshot.flags.curiosity, 2);

  t.is(snapshot.capabilities["cap.deepDossier"], true);
  t.is(snapshot.capabilities["cap.askAgent"], true);

  t.ok(includesId(snapshot.availableChoices, "to-mirror-feed"));
  t.ok(includesId(snapshot.availableChoices, "to-root-console"));

  t.ok(includesId(snapshot.visibleStorylets, "liaison-whisper"));
  t.ok(includesId(snapshot.visibleStorylets, "deep-dossier-window"));

  t.ok(includesText(snapshot.logTail, "TRACE: handshake fragment cached"));
  t.ok(includesText(snapshot.logTail, "ACTION: probe-handshake"));
  t.ok(includesText(snapshot.logTail, "MOVE: service_corridor"));

  t.is(output.checkpoint?.hash, "a94203ef30e278916b38390a7ae0e82883b59d31e2bc6db86195d9ec1f85e092");
});

test("if-run CLI terminal-dossier: deterministic full playthrough reaches exfil", async (t) => {
  const result = await runCli({
    story: "terminal-dossier",
    mode: "local",
    actions: [
      { type: "CHOOSE", choiceId: "probe-handshake" },
      { type: "CHOOSE", choiceId: "to-archive" },
      { type: "CHOOSE", choiceId: "read-manifest" },
      { type: "CHOOSE", choiceId: "probe-index-lattice" },
      { type: "CHOOSE", choiceId: "archive-to-relay" },
      { type: "CHOOSE", choiceId: "align-relay" },
      { type: "CHOOSE", choiceId: "relay-to-witness" },
      { type: "CHOOSE", choiceId: "interrogate-witness" },
      { type: "CHOOSE", choiceId: "witness-to-lift" },
      { type: "CHOOSE", choiceId: "lift-to-root" },
      { type: "CHOOSE", choiceId: "compile-dossier" },
      { type: "CHOOSE", choiceId: "root-to-exfil" },
      { type: "CHOOSE", choiceId: "transmit-dossier" }
    ],
    includeCheckpoint: true,
    includeReceipts: false,
    exportArtifact: true
  });

  const output = parseOutput(t, result);
  const snapshot = output.snapshot;

  t.is(snapshot.node?.id, "exfil_gateway");
  t.is(snapshot.flags.transmitted, true);
  t.is(snapshot.flags.dossierCompiled, true);
  t.is(snapshot.flags.witnessSpoken, true);
  t.is(snapshot.capabilities["cap.deepDossier"], true);
  t.is(snapshot.capabilities["cap.askAgent"], true);

  t.is(output.intentCount, 14);
  t.is(output.ratifiedCount, 14);
  t.is(output.receiptCount, 14);
  t.is(typeof output.artifact?.encoded, "string");
  t.ok(output.artifact.encoded.length > 0);

  t.is(output.checkpoint?.at, 40);
  t.is(output.checkpoint?.hash, "0745d217f2d239ea8076505829947d43763f6f1c9822ee66ce0c978bf332454a");
});

test("if-run CLI terminal-dossier: extended investigation mechanics are active off the golden route", async (t) => {
  const result = await runCli({
    story: "terminal-dossier",
    mode: "local",
    actions: [
      { type: "CHOOSE", choiceId: "cache-operator-sig" },
      { type: "CHOOSE", choiceId: "to-corridor" },
      { type: "CHOOSE", choiceId: "mark-service-door" },
      { type: "CHOOSE", choiceId: "corridor-to-relay" },
      { type: "CHOOSE", choiceId: "relay-to-memory" },
      { type: "CHOOSE", choiceId: "stabilize-agent-link" },
      { type: "CHOOSE", choiceId: "memory-to-witness" },
      { type: "CHOOSE", choiceId: "witness-to-lift" },
      { type: "CHOOSE", choiceId: "lift-to-rooftop" }
    ],
    includeCheckpoint: true,
    includeReceipts: false
  });

  const output = parseOutput(t, result);
  const snapshot = output.snapshot;

  t.is(snapshot.node?.id, "rooftop_array");
  t.ok(snapshot.knowledge?.operatorHash);
  t.ok(snapshot.knowledge?.agentLink);
  t.is(snapshot.inventory?.traceKey, 1);
  t.is(snapshot.relationships?.liaison, 2);
  t.is(snapshot.timers?.liaisonWindow, 2);
  t.alike(snapshot.sceneState?.witness_chamber, { serviceDoorOpen: true });
  t.ok(includesId(snapshot.visibleStorylets, "liaison-trust"));
  t.ok(includesText(snapshot.logTail, "TRACE: operator signature cached"));
  t.ok(includesText(snapshot.logTail, "TRACE: witness chamber backdoor marked"));
  t.ok(includesText(snapshot.logTail, "ACTION: agent link stabilized"));
  t.is(output.intentCount, 10);
  t.is(output.ratifiedCount, 10);
  t.is(output.receiptCount, 10);
  t.is(typeof output.checkpoint?.hash, "string");
});
