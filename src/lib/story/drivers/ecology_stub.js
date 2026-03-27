import { StoryDriver } from "../driver.js";
import { LocalDriver } from "./local.js";

function cloneMessage(message) {
  if (message && typeof message === "object") {
    return { ...message };
  }
  return message;
}

export class EcologyDriver extends StoryDriver {
  constructor(options) {
    super();

    this._local = options?.localDriver ?? new LocalDriver(options);
    this._listeners = new Set();
    this._provisional = [];

    this._local.subscribe(() => {
      this._emit();
    });
  }

  async init() {
    this._provisional = [];
    await this._local.init();
  }

  getSnapshot() {
    const base = this._local.getSnapshot();
    return {
      ...base,
      provisionalTail: this._provisional.map(cloneMessage)
    };
  }

  async dispatch(action) {
    return this._local.dispatch(action);
  }

  subscribe(cb) {
    this._listeners.add(cb);
    return () => {
      this._listeners.delete(cb);
    };
  }

  injectProvisional(messages) {
    const list = Array.isArray(messages) ? messages : [messages];
    for (const message of list) {
      this._provisional.push(cloneMessage(message));
    }
    this._emit();
  }

  async applyRatified(effects) {
    return this._local.applyEffects(effects ?? []);
  }

  _emit() {
    const snapshot = this.getSnapshot();
    for (const listener of Array.from(this._listeners)) {
      listener(snapshot);
    }
  }
}
