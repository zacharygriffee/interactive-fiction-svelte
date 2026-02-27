import { storyGraph as defaultStoryGraph } from "../src/lib/story/graph.js";
import { storyGraph as terminalDossierGraph } from "../examples/terminal-dossier/graph.js";
import { validateGraph } from "../src/lib/story/dsl/validate.js";

const graphs = [
  { id: "default", graph: defaultStoryGraph },
  { id: "terminal-dossier", graph: terminalDossierGraph }
];

try {
  for (const item of graphs) {
    validateGraph(item.graph);
    console.log(`OK: ${item.id} graph valid`);
  }
  process.exit(0);
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  if (error.code) {
    console.error(`CODE: ${error.code}`);
  }
  if (error.path) {
    console.error(`PATH: ${error.path}`);
  }
  process.exit(1);
}
