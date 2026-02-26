/**
 * @typedef {Object} GraphResolverPort
 * @property {(input?: { concernId?: string }) => object} getGraph
 */

/**
 * @param {any} value
 * @returns {asserts value is GraphResolverPort}
 */
export function assertGraphResolverPort(value) {
  if (!value || typeof value.getGraph !== "function") {
    throw new Error("GraphResolverPort must implement getGraph({ concernId? })");
  }
}
