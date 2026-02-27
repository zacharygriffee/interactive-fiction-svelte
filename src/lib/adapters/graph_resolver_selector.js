function resolveStoryIdFromSearch(search) {
  if (typeof search !== "string" || search.length === 0) {
    return null;
  }

  const params = new URLSearchParams(search);
  const storyId = params.get("story");

  if (typeof storyId !== "string" || storyId.length === 0) {
    return null;
  }

  return storyId;
}

function getRuntimeSearch() {
  const search = globalThis?.location?.search;
  return typeof search === "string" ? search : "";
}

export class GraphResolverSelector {
  constructor({ defaultGraph, storyGraphsById = {}, search } = {}) {
    this._defaultGraph = defaultGraph;
    this._storyGraphsById = { ...storyGraphsById };
    this._search = typeof search === "string" ? search : getRuntimeSearch();
  }

  getSelectedStoryId(input = {}) {
    if (typeof input?.storyId === "string" && input.storyId.length > 0) {
      return input.storyId;
    }

    return resolveStoryIdFromSearch(this._search);
  }

  getGraph(input = {}) {
    const selectedStoryId = this.getSelectedStoryId(input);

    if (selectedStoryId && this._storyGraphsById[selectedStoryId]) {
      return this._storyGraphsById[selectedStoryId];
    }

    return this._defaultGraph;
  }
}
