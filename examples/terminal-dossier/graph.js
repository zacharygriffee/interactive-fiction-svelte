import { graph } from "../../src/lib/story/dsl/index.js";
import { terminalDossierAuthorGraph } from "./graph.author.js";

export const storyGraph = graph(terminalDossierAuthorGraph);
