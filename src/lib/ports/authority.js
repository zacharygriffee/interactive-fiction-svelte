/**
 * @typedef {Object} Receipt
 * @property {"receipt"} kind
 * @property {string} authority
 * @property {number} at
 * @property {string=} ref
 * @property {string=} sig
 * @property {object=} meta
 */

/**
 * @typedef {Object} AuthorityRatifyResult
 * @property {object} ratifiedEvent
 * @property {Receipt=} receipt
 */

/**
 * @typedef {Object} AuthorityPort
 * @property {(input: { state: object, intentEvent: object, graph: object }) => (AuthorityRatifyResult|Promise<AuthorityRatifyResult>)} ratifyIntent
 * @property {(() => void)=} close
 */

/**
 * @param {any} value
 * @returns {asserts value is AuthorityPort}
 */
export function assertAuthorityPort(value) {
  if (!value || typeof value.ratifyIntent !== "function") {
    throw new Error("AuthorityPort must implement ratifyIntent({ state, intentEvent, graph })");
  }
}
