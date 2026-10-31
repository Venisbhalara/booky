const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function serializePayload(val: unknown): unknown {
  if (val instanceof Date) {
    return { __type: "Date", value: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return val.map(serializePayload);
  }
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined && !UNSAFE_KEYS.has(k)) {
        out[k] = serializePayload(v);
      }
    }
    return out;
  }
  return val;
}

export function deserializePayload(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map(deserializePayload);
  }
  if (val !== null && typeof val === "object") {
    const rec = val as Record<string, unknown>;
    if (rec.__type === "Date" && typeof rec.value === "string") {
      return new Date(rec.value);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (!UNSAFE_KEYS.has(k)) {
        out[k] = deserializePayload(v);
      }
    }
    return out;
  }
  return val;
}
