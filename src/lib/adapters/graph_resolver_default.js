import { storyGraph } from "../story/graph.js";

export class DefaultGraphResolver {
  constructor({ graph = storyGraph } = {}) {
    this._graph = graph;
  }

  getGraph(_input = {}) {
    return this._graph;
  }
}
