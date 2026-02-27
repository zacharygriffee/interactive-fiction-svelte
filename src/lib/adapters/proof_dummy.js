function toBytes(input) {
  if (typeof input === "string") {
    return new TextEncoder().encode(input);
  }

  if (input instanceof Uint8Array) {
    return input;
  }

  if (Array.isArray(input)) {
    return new Uint8Array(input);
  }

  return new TextEncoder().encode(String(input));
}

function fnv1a(bytes) {
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

export class DummyProofAdapter {
  constructor({ seed = "dummy-seed", pubkey = "dummy-pubkey", alg = "dummy-fnv1a" } = {}) {
    this._seed = seed;
    this._pubkey = pubkey;
    this._alg = alg;
  }

  getPublicIdentity() {
    return {
      pubkey: this._pubkey,
      alg: this._alg
    };
  }

  sign(input) {
    const seedBytes = toBytes(this._seed);
    const inputBytes = toBytes(input);
    const merged = new Uint8Array(seedBytes.length + inputBytes.length);
    merged.set(seedBytes, 0);
    merged.set(inputBytes, seedBytes.length);

    const hash = fnv1a(merged).toString(16).padStart(8, "0");

    return {
      sig: `${this._pubkey}:${hash}`,
      alg: this._alg
    };
  }

  verify(input, signature, identity) {
    if (identity && (identity.pubkey !== this._pubkey || identity.alg !== this._alg)) {
      return false;
    }

    if (!signature || typeof signature.sig !== "string" || typeof signature.alg !== "string") {
      return false;
    }

    if (signature.alg !== this._alg) {
      return false;
    }

    const expected = this.sign(input);
    return expected.sig === signature.sig && expected.alg === signature.alg;
  }
}
