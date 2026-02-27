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
 * Notes:
 * - Implementations should emit messages in arrival order per subscription.
 * - Consumers may drop/trim messages (for example via tail limits); no backpressure is assumed.
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
