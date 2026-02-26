import test from "brittle";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

test("validate-graph CLI exits 0 on current graph", (t) => {
  const scriptPath = resolve(process.cwd(), "scripts/validate-graph.js");
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  t.is(result.status, 0);
});
