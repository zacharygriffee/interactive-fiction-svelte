function toPersistedState(state) {
  if (!state || typeof state !== "object") {
    return state;
  }

  const { provisional, provisionalTail, ...authoritative } = state;
  return authoritative;
}

export class BrowserStorage {
  constructor(key = "interactive-fiction-state") {
    this._key = key;
  }

  load() {
    const raw = localStorage.getItem(this._key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  save(state) {
    const persisted = toPersistedState(state);
    localStorage.setItem(this._key, JSON.stringify(persisted));
  }

  clear() {
    localStorage.removeItem(this._key);
  }
}

export { toPersistedState };
