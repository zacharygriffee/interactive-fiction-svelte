function canonicalizePrimitive(value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : JSON.stringify(String(value));
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return JSON.stringify(String(value));
}

export function canonicalizeValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeValue(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort();

    const pairs = keys.map((key) => `${JSON.stringify(key)}:${canonicalizeValue(value[key])}`);
    return `{${pairs.join(",")}}`;
  }

  return canonicalizePrimitive(value);
}

export function canonicalizeEventStream({ intentLog = [], ratifiedLog = [], receiptLog = [] } = {}) {
  return canonicalizeValue({
    intentLog,
    ratifiedLog,
    receiptLog
  });
}
