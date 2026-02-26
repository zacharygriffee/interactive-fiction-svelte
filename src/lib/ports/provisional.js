/**
 * @typedef {Object} ProvisionalMessage
 * @property {number} at
 * @property {string} source
 * @property {string} text
 * @property {object=} meta
 */

/**
 * @typedef {Object} ProvisionalPort
 * @property {(cb: (message: ProvisionalMessage) => void) => (() => void)} subscribe
 */

/**
 * @param {any} value
 * @returns {asserts value is ProvisionalPort}
 */
export function assertProvisionalPort(value) {
  if (!value || typeof value.subscribe !== "function") {
    throw new Error("ProvisionalPort must implement subscribe(cb)");
  }
}
