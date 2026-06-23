import { describe, it, expect } from "vitest";
import {
  parseJsonFields,
  stringifyJsonFields,
  controlIn,
  controlOut,
} from "../src/serialize.js";

describe("JSON field (de)serialization", () => {
  it("stringifies and parses array fields round-trip", () => {
    const input = { mitigates: ["r1"], owasp: ["LLM01"], name: "x" };
    const stored = stringifyJsonFields("controls", input);
    expect(typeof stored.mitigates).toBe("string");
    expect(typeof stored.owasp).toBe("string");
    const back = parseJsonFields("controls", stored);
    expect(back.mitigates).toEqual(["r1"]);
    expect(back.owasp).toEqual(["LLM01"]);
    expect(back.name).toBe("x");
  });

  it("leaves non-JSON fields untouched", () => {
    const r = parseJsonFields("risks", { severity: "high", owasp: '["LLM01"]', controls: "[]" });
    expect(r.severity).toBe("high");
    expect(r.owasp).toEqual(["LLM01"]);
    expect(r.controls).toEqual([]);
  });
});

describe("control position mapping", () => {
  it("controlIn splits position into x/y", () => {
    const r = controlIn({ name: "x", position: { x: 10, y: 20 } });
    expect(r.positionX).toBe(10);
    expect(r.positionY).toBe(20);
    expect(r.position).toBeUndefined();
  });

  it("controlOut rebuilds position object", () => {
    const r = controlOut({ name: "x", positionX: 10, positionY: 20 });
    expect(r.position).toEqual({ x: 10, y: 20 });
    expect(r.positionX).toBeUndefined();
  });

  it("controlOut omits position when coords absent", () => {
    const r = controlOut({ name: "x", positionX: null, positionY: null });
    expect(r.position).toBeUndefined();
  });
});
