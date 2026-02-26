function jsonClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export class MemoryStorage {
  constructor(initial = null) {
    this._value = jsonClone(initial);
  }

  load() {
    return jsonClone(this._value);
  }

  save(state) {
    this._value = jsonClone(state);
  }

  clear() {
    this._value = null;
  }
}
