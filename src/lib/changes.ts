import type { Direction, Effect, LightingConfig } from "@/lib/types";

/**
 * Change tracking: the app keeps two copies of every effect config — the one
 * saved in the selected profile and the live one being edited. Everything the
 * user touches produces a diff entry here, and those entries feed the
 * "Alterações" rail, the dirty dots on effect cards, and the header pill.
 */

export type ChangeField = "active" | "colors" | "brightness" | "speed" | "direction" | "loopMode";

export interface ChangeEntry {
  effect: Effect;
  field: ChangeField;
  /** Only set when field === "colors". */
  colorIndex?: number;
  from: string | number | boolean;
  to: string | number | boolean;
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  up: "Cima",
  left: "Esquerda",
  right: "Direita",
  down: "Baixo"
};

export const FIELD_LABELS: Record<Exclude<ChangeField, "colors">, string> = {
  active: "Efeito ativo",
  brightness: "Brilho",
  speed: "Velocidade",
  direction: "Direção",
  loopMode: "Repetição"
};

/** Human-readable value for every field except colors (those render swatches). */
export function formatChangeValue(field: ChangeField, value: string | number | boolean): string {
  if (field === "direction") return DIRECTION_LABELS[value as Direction] ?? String(value);
  if (field === "loopMode") return value ? "Ativada" : "Desativada";
  return String(value);
}

function diffConfig(effect: Effect, saved: LightingConfig, current: LightingConfig): ChangeEntry[] {
  const entries: ChangeEntry[] = [];
  if (saved.brightness !== current.brightness) {
    entries.push({ effect, field: "brightness", from: saved.brightness, to: current.brightness });
  }
  if (saved.speed !== current.speed) {
    entries.push({ effect, field: "speed", from: saved.speed, to: current.speed });
  }
  if (saved.direction !== current.direction) {
    entries.push({ effect, field: "direction", from: saved.direction, to: current.direction });
  }
  if (saved.loopMode !== current.loopMode) {
    entries.push({ effect, field: "loopMode", from: saved.loopMode, to: current.loopMode });
  }
  const length = Math.max(saved.colors.length, current.colors.length);
  for (let index = 0; index < length; index++) {
    const from = saved.colors[index] ?? "";
    const to = current.colors[index] ?? "";
    if (from.toLowerCase() !== to.toLowerCase()) {
      entries.push({ effect, field: "colors", colorIndex: index, from, to });
    }
  }
  return entries;
}

/**
 * Full diff between the saved profile and the live editing state. The active
 * effect switch is itself a change and is listed first.
 */
export function diffProfile(
  savedEffects: Record<Effect, LightingConfig>,
  currentEffects: Record<Effect, LightingConfig>,
  savedActive: Effect,
  currentActive: Effect
): ChangeEntry[] {
  const entries: ChangeEntry[] = [];
  if (savedActive !== currentActive) {
    entries.push({ effect: currentActive, field: "active", from: savedActive, to: currentActive });
  }
  for (const effect of Object.keys(currentEffects) as Effect[]) {
    entries.push(...diffConfig(effect, savedEffects[effect], currentEffects[effect]));
  }
  return entries;
}

/** Effects touched by at least one change — drives the "modificado" badges. */
export function changedEffects(entries: ChangeEntry[]): Set<Effect> {
  return new Set(entries.map((entry) => entry.effect));
}

/** Bucket entries by effect, preserving first-seen order. */
export function groupByEffect(entries: ChangeEntry[]): [Effect, ChangeEntry[]][] {
  const groups = new Map<Effect, ChangeEntry[]>();
  for (const entry of entries) {
    const bucket = groups.get(entry.effect) ?? [];
    bucket.push(entry);
    groups.set(entry.effect, bucket);
  }
  return [...groups.entries()];
}

/**
 * Per-key paint diff against the snapshot taken at the last successful apply.
 * Counts added (new positions), removed (unpainted) and recolored keys.
 */
export interface PaintDiff {
  added: number;
  removed: number;
  recolored: number;
}

export function diffPaint(applied: Record<number, string>, current: Record<number, string>): PaintDiff {
  const diff: PaintDiff = { added: 0, removed: 0, recolored: 0 };
  for (const [key, color] of Object.entries(current)) {
    const before = applied[Number(key)];
    if (before === undefined) diff.added++;
    else if (before.toLowerCase() !== color.toLowerCase()) diff.recolored++;
  }
  for (const key of Object.keys(applied)) {
    if (current[Number(key)] === undefined) diff.removed++;
  }
  return diff;
}
