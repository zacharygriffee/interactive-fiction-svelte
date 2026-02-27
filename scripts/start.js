import { spawn, spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const sirvCommand = process.platform === "win32"
  ? "node_modules\\.bin\\sirv.cmd"
  : "./node_modules/.bin/sirv";

function runPrepare() {
  const result = spawnSync(npmCommand, ["run", "prepare-dist:play"], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

let serverProcess = null;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
  }

  setTimeout(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGKILL");
    }
  }, 1500).unref();

  process.exitCode = code;
}

function startServer() {
  serverProcess = spawn(sirvCommand, ["dist", "--single", "--host", "0.0.0.0", "--port", "4173"], {
    stdio: "inherit"
  });

  serverProcess.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (code === 0) {
      process.exit(0);
      return;
    }

    const reason = signal ? `signal ${signal}` : `exit code ${code}`;
    console.error(`[start] server exited unexpectedly (${reason})`);
    shutdown(code ?? 1);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

runPrepare();
startServer();
