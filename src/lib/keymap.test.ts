import { describe, expect, it } from "vitest";
import protocolSource from "../../src-tauri/src/protocol.rs?raw";
import {
  KEY_DECORATORS,
  VALID_KEY_INDICES,
  hexToRgb,
  keyIndexOf,
  planCustomApply,
  rowColOf
} from "./keymap";

/**
 * The backend is the validation authority, so the UI keymap may never drift
 * from it. Read VALID_KEY_INDICES straight out of protocol.rs instead of
 * copying the list here: a change on either side must fail this suite.
 */
function backendValidKeyIndices(): number[] {
  const match = protocolSource.match(
    /pub const VALID_KEY_INDICES: \[usize; (\d+)\] = \[([\s\S]*?)\];/
  );
  if (!match) throw new Error("VALID_KEY_INDICES not found in protocol.rs");
  const indices = match[2]
    .split(",")
    .map((token: string) => token.trim())
    .filter((token: string) => token.length > 0)
    .map(Number);
  expect(indices).toHaveLength(Number(match[1]));
  expect(indices.some(Number.isNaN)).toBe(false);
  return indices;
}

describe("keymap surface", () => {
  it("has the 119 addressable positions", () => {
    expect(KEY_DECORATORS).toHaveLength(119);
    expect(VALID_KEY_INDICES.size).toBe(119);
  });

  it("keeps every position inside the protocol ranges", () => {
    for (const key of KEY_DECORATORS) {
      expect(key.row, `row of ${key.label}`).toBeGreaterThanOrEqual(0);
      expect(key.row, `row of ${key.label}`).toBeLessThanOrEqual(7);
      expect(key.col, `col of ${key.label}`).toBeGreaterThanOrEqual(0);
      expect(key.col, `col of ${key.label}`).toBeLessThanOrEqual(17);
    }
  });

  it("labels only the LED bar as empty (row 7, cols 3-17)", () => {
    const unlabeled = KEY_DECORATORS.filter((key) => key.label === "");
    expect(unlabeled).toHaveLength(15);
    expect(unlabeled.map((key) => key.col)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17
    ]);
    expect(unlabeled.every((key) => key.row === 7)).toBe(true);
  });

  it("matches VALID_KEY_INDICES in protocol.rs exactly", () => {
    const frontend = [...VALID_KEY_INDICES].sort((left, right) => left - right);
    expect(frontend).toEqual(backendValidKeyIndices());
  });
});

describe("key_index mapping", () => {
  it("uses row * 18 + col", () => {
    expect(keyIndexOf({ row: 0, col: 1 })).toBe(1);
    expect(keyIndexOf({ row: 2, col: 3 })).toBe(39);
    expect(keyIndexOf({ row: 7, col: 17 })).toBe(143);
  });

  it("places W/A/S/D on their validated lighting indices", () => {
    const at = (label: string) => {
      const key = KEY_DECORATORS.find((decorator) => decorator.label === label);
      if (!key) throw new Error(`decorator ${label} missing`);
      return keyIndexOf(key);
    };
    expect([at("W"), at("A"), at("S"), at("D")]).toEqual([39, 56, 57, 58]);
  });

  it("round-trips every decorator through rowColOf", () => {
    for (const key of KEY_DECORATORS) {
      expect(rowColOf(keyIndexOf(key))).toEqual({ row: key.row, col: key.col });
    }
  });
});

describe("hexToRgb", () => {
  it("splits #rrggbb into the protocol byte order", () => {
    expect(hexToRgb("#ff0000")).toEqual([255, 0, 0]);
    expect(hexToRgb("#00ff00")).toEqual([0, 255, 0]);
    expect(hexToRgb("#0000ff")).toEqual([0, 0, 255]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
  });

  it("reads the default brush and is case-insensitive", () => {
    expect(hexToRgb("#ff164d")).toEqual([255, 22, 77]);
    expect(hexToRgb("#FF164D")).toEqual([255, 22, 77]);
  });
});

describe("planCustomApply", () => {
  it("maps painted keys to row/col/rgb for apply_custom_lighting", () => {
    const plan = planCustomApply({ 39: "#ff0000", 56: "#00ff00", 143: "#0000ff" });
    expect(plan).toEqual({
      ok: true,
      keys: [
        { row: 2, col: 3, rgb: [255, 0, 0] },
        { row: 3, col: 2, rgb: [0, 255, 0] },
        { row: 7, col: 17, rgb: [0, 0, 255] }
      ]
    });
  });

  it("reproduces the W/A/S/D red control payload", () => {
    const red = "#ff0000";
    const plan = planCustomApply({ 39: red, 56: red, 57: red, 58: red });
    expect(plan).toEqual({
      ok: true,
      keys: [
        { row: 2, col: 3, rgb: [255, 0, 0] },
        { row: 3, col: 2, rgb: [255, 0, 0] },
        { row: 3, col: 3, rgb: [255, 0, 0] },
        { row: 3, col: 4, rgb: [255, 0, 0] }
      ]
    });
  });

  it("orders by key_index regardless of paint order", () => {
    const plan = planCustomApply({ 58: "#ff0000", 39: "#ff0000", 57: "#ff0000" });
    if (!plan.ok) throw new Error("expected a payload");
    expect(plan.keys.map(keyIndexOf)).toEqual([39, 57, 58]);
  });

  it("blocks an empty selection instead of darkening the keyboard", () => {
    expect(planCustomApply({})).toEqual({ ok: false, reason: "empty" });
  });

  it("still builds a payload for a single key", () => {
    const plan = planCustomApply({ 1: "#ff164d" });
    expect(plan).toEqual({
      ok: true,
      keys: [{ row: 0, col: 1, rgb: [255, 22, 77] }]
    });
  });
});
