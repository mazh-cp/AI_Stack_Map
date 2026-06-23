// SQLite (via Prisma) has no JSON column type, so list/object fields are stored
// as JSON strings. This module (de)serializes them at the API boundary and maps
// SecurityControl's positionX/Y <-> position{x,y}.

export const JSON_FIELDS: Record<string, string[]> = {
  controls: ["mitigates", "owasp"],
  risks: ["owasp", "controls"],
  integrations: ["supportedLayers"],
  models: ["allowedTools", "lastEvaluation"],
  fileScans: ["rawEvidence"],
  promptInspections: ["categories", "rawEvidence"],
};

type Row = Record<string, unknown>;

/** DB row → API: parse JSON-string fields back into values. */
export function parseJsonFields(path: string, row: Row): Row {
  const fields = JSON_FIELDS[path] ?? [];
  const out: Row = { ...row };
  for (const f of fields) {
    if (typeof out[f] === "string") {
      try {
        out[f] = JSON.parse(out[f] as string);
      } catch {
        /* leave as-is */
      }
    }
  }
  return out;
}

/** API → DB: stringify value fields into JSON strings. */
export function stringifyJsonFields(path: string, data: Row): Row {
  const fields = JSON_FIELDS[path] ?? [];
  const out: Row = { ...data };
  for (const f of fields) {
    if (f in out && out[f] !== undefined && typeof out[f] !== "string") {
      out[f] = JSON.stringify(out[f]);
    }
  }
  return out;
}

export function controlOut(c: Row): Row {
  const { positionX, positionY, ...rest } = c as {
    positionX: number | null;
    positionY: number | null;
  } & Row;
  return {
    ...rest,
    position:
      positionX != null && positionY != null
        ? { x: positionX, y: positionY }
        : undefined,
  };
}

export function controlIn(body: Row): Row {
  const { position, ...rest } = body as { position?: { x: number; y: number } } & Row;
  const out: Row = { ...rest };
  if (position) {
    out.positionX = position.x;
    out.positionY = position.y;
  }
  return out;
}
