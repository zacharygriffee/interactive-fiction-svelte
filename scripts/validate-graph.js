import { storyGraph } from "../src/lib/story/graph.js";
import { validateGraph } from "../src/lib/story/dsl/validate.js";

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectDuplicates(items, getId) {
  const counts = new Map();

  for (const item of items) {
    const id = getId(item);
    if (typeof id !== "string" || id.length === 0) {
      continue;
    }
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort((a, b) => a.localeCompare(b));
}

function buildReport(graph) {
  const missingTargets = new Map();
  const duplicateChoiceIdsByNode = new Map();
  const duplicateStoryletIdsByNode = new Map();

  const nodesById = isRecord(graph?.nodesById) ? graph.nodesById : {};

  for (const nodeId of Object.keys(nodesById).sort((a, b) => a.localeCompare(b))) {
    const node = nodesById[nodeId];
    if (!isRecord(node)) {
      continue;
    }

    const choices = Array.isArray(node.choices) ? node.choices : [];
    const storylets = Array.isArray(node.storylets) ? node.storylets : [];

    const duplicateChoiceIds = collectDuplicates(choices, (choice) => choice?.id);
    if (duplicateChoiceIds.length > 0) {
      duplicateChoiceIdsByNode.set(nodeId, duplicateChoiceIds);
    }

    const duplicateStoryletIds = collectDuplicates(storylets, (storylet) => storylet?.id);
    if (duplicateStoryletIds.length > 0) {
      duplicateStoryletIdsByNode.set(nodeId, duplicateStoryletIds);
    }

    for (let index = 0; index < choices.length; index += 1) {
      const choice = choices[index];
      if (!isRecord(choice) || choice.to === undefined || typeof choice.to !== "string") {
        continue;
      }
      if (nodesById[choice.to]) {
        continue;
      }

      const ref = `nodesById.${nodeId}.choices[${index}].to`;
      const refs = missingTargets.get(choice.to) ?? [];
      refs.push(ref);
      refs.sort((a, b) => a.localeCompare(b));
      missingTargets.set(choice.to, refs);
    }
  }

  return {
    missingTargets,
    duplicateChoiceIdsByNode,
    duplicateStoryletIdsByNode
  };
}

function printReport(report) {
  console.error("REPORT:");

  if (report.missingTargets.size === 0) {
    console.error("- Missing choice.to targets: none");
  } else {
    console.error("- Missing choice.to targets:");
    for (const target of Array.from(report.missingTargets.keys()).sort((a, b) => a.localeCompare(b))) {
      const refs = report.missingTargets.get(target) ?? [];
      console.error(`  - ${target}: ${refs.join(", ")}`);
    }
  }

  if (report.duplicateChoiceIdsByNode.size === 0) {
    console.error("- Duplicate choice ids: none");
  } else {
    console.error("- Duplicate choice ids:");
    for (const nodeId of Array.from(report.duplicateChoiceIdsByNode.keys()).sort((a, b) => a.localeCompare(b))) {
      const ids = report.duplicateChoiceIdsByNode.get(nodeId) ?? [];
      console.error(`  - ${nodeId}: ${ids.join(", ")}`);
    }
  }

  if (report.duplicateStoryletIdsByNode.size === 0) {
    console.error("- Duplicate storylet ids: none");
  } else {
    console.error("- Duplicate storylet ids:");
    for (const nodeId of Array.from(report.duplicateStoryletIdsByNode.keys()).sort((a, b) => a.localeCompare(b))) {
      const ids = report.duplicateStoryletIdsByNode.get(nodeId) ?? [];
      console.error(`  - ${nodeId}: ${ids.join(", ")}`);
    }
  }
}

try {
  validateGraph(storyGraph);
  console.log("OK: storyGraph valid");
  process.exit(0);
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  if (error.code) {
    console.error(`CODE: ${error.code}`);
  }
  if (error.path) {
    console.error(`PATH: ${error.path}`);
  }
  if (error.hint) {
    console.error(`HINT: ${error.hint}`);
  }

  printReport(buildReport(storyGraph));
  process.exit(1);
}
