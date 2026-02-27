import { spawn, spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function runSync(args, name) {
  const result = spawnSync(npmCommand, args, {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    console.error(`[dev] ${name} failed`);
    process.exit(result.status ?? 1);
  }
}

function runAsync(args, name) {
  const child = spawn(npmCommand, args, {
    stdio: "inherit"
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (code === 0) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `exit code ${code}`;
    console.error(`[dev] ${name} stopped unexpectedly (${reason})`);
    shutdown(code ?? 1);
  });

  return child;
}

let shuttingDown = false;
const children = [];

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
    process.exit(exitCode);
  }, 1500).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

runSync(["run", "prepare-dist:dev"], "prepare-dist:dev");

children.push(runAsync(["run", "dev:watch"], "dev:watch"));
children.push(runAsync(["run", "dev:serve"], "dev:serve"));
