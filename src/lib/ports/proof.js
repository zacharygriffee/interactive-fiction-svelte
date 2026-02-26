/**
 * @typedef {Object} ProofIdentity
 * @property {string} pubkey
 * @property {string} alg
 */

/**
 * @typedef {Object} ProofSignature
 * @property {string} sig
 * @property {string} alg
 */

/**
 * @typedef {Object} ProofPort
 * @property {() => ProofIdentity} getPublicIdentity
 * @property {(input: Uint8Array|string) => ProofSignature} sign
 */

/**
 * @param {any} value
 * @returns {asserts value is ProofPort}
 */
export function assertProofPort(value) {
  if (!value || typeof value.getPublicIdentity !== "function" || typeof value.sign !== "function") {
    throw new Error("ProofPort must implement getPublicIdentity() and sign(input)");
  }
}
