import { describe, expect, it } from "vitest";
import { changedEffects, diffPaint, diffProfile, formatChangeValue, groupByEffect } from "@/lib/changes";
import { cloneEffectConfigs, effectDefaults } from "@/lib/types";

describe("diffProfile", () => {
  it("returns no entries when saved and current are identical", () => {
    const saved = cloneEffectConfigs();
    const current = cloneEffectConfigs();
    expect(diffProfile(saved, current, "wave", "wave")).toEqual([]);
  });

  it("lists the active effect switch first", () => {
    const saved = cloneEffectConfigs();
    const current = cloneEffectConfigs();
    const entries = diffProfile(saved, current, "wave", "static");
    expect(entries[0]).toEqual({ effect: "static", field: "active", from: "wave", to: "static" });
  });

  it("detects scalar field changes with before/after values", () => {
    const saved = cloneEffectConfigs();
    const current = cloneEffectConfigs();
    current.wave = { ...current.wave, brightness: 2, direction: "down", loopMode: false };
    const entries = diffProfile(saved, current, "wave", "wave");
    expect(entries).toContainEqual({ effect: "wave", field: "brightness", from: 5, to: 2 });
    expect(entries).toContainEqual({ effect: "wave", field: "direction", from: "right", to: "down" });
    expect(entries).toContainEqual({ effect: "wave", field: "loopMode", from: true, to: false });
  });

  it("detects individual color changes, case-insensitively", () => {
    const saved = cloneEffectConfigs();
    const current = cloneEffectConfigs();
    current.heartbeat = { ...current.heartbeat, colors: [...current.heartbeat.colors] };
    current.heartbeat.colors[1] = "#FF7A00"; // same as saved, different case
    current.heartbeat.colors[2] = "#123456";
    const entries = diffProfile(saved, current, "heartbeat", "heartbeat");
    expect(entries).toEqual([{ effect: "heartbeat", field: "colors", colorIndex: 2, from: effectDefaults.heartbeat.colors[2], to: "#123456" }]);
  });

  it("groups entries by effect in first-seen order", () => {
    const saved = cloneEffectConfigs();
    const current = cloneEffectConfigs();
    current.static = { ...current.static, speed: 1 };
    current.wave = { ...current.wave, speed: 4 };
    const groups = groupByEffect(diffProfile(saved, current, "wave", "wave"));
    expect(groups.map(([effect]) => effect)).toEqual(["wave", "static"]);
    expect(changedEffects(diffProfile(saved, current, "wave", "wave"))).toEqual(new Set(["wave", "static"]));
  });
});

describe("formatChangeValue", () => {
  it("translates directions and loop states", () => {
    expect(formatChangeValue("direction", "left")).toBe("Esquerda");
    expect(formatChangeValue("loopMode", true)).toBe("Ativada");
    expect(formatChangeValue("brightness", 3)).toBe("3");
  });
});

describe("diffPaint", () => {
  it("counts added, removed and recolored keys", () => {
    const applied = { 1: "#ff0000", 2: "#00ff00", 3: "#0000ff" };
    const current = { 2: "#00ff00", 3: "#ffffff", 4: "#123456" };
    expect(diffPaint(applied, current)).toEqual({ added: 1, removed: 1, recolored: 1 });
  });

  it("treats hex case as equal", () => {
    expect(diffPaint({ 1: "#FF0000" }, { 1: "#ff0000" })).toEqual({ added: 0, removed: 0, recolored: 0 });
  });

  it("handles empty states", () => {
    expect(diffPaint({}, {})).toEqual({ added: 0, removed: 0, recolored: 0 });
    expect(diffPaint({}, { 5: "#ff0000" })).toEqual({ added: 1, removed: 0, recolored: 0 });
  });
});
