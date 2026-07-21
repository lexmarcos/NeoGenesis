// The 119 addressable lighting positions of the HyperX Mars (0951:16C6):
// 104 keys (rows 0-6) + 15 LED-bar segments (row 7, cols 3-17).
//
// Extracted verbatim from LightingUI.xml KeyDecoratorLightWnd entries
// (ID_LIGHT_KeyDecorator_<row>_<col>, Text, X/Y/Width/Height, normalized to
// origin 0,0). The (row, col) set is identical to VALID_KEY_INDICES in
// src-tauri/src/protocol.rs; key_index = row * 18 + col. The backend
// (build_custom_transaction) remains the authority and rejects anything
// outside this set.

export interface KeyDecorator {
  row: number;
  col: number;
  /** Empty for the 15 LED-bar segments (row 7). */
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Normalized drawing surface (same units as the XML pixel geometry). */
export const KEYMAP_SURFACE = { width: 724, height: 222 } as const;

export const keyIndexOf = (key: Pick<KeyDecorator, "row" | "col">): number =>
  key.row * 18 + key.col;

/** Inverse of keyIndexOf: 39 -> { row: 2, col: 3 }. */
export const rowColOf = (keyIndex: number): { row: number; col: number } => ({
  row: Math.floor(keyIndex / 18),
  col: keyIndex % 18
});

/** "#rrggbb" -> [r, g, b], the payload shape apply_custom_lighting expects. */
export const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
};

/** One entry of the apply_custom_lighting payload (serde camelCase CustomKeyColor). */
export interface CustomKeyPayload {
  row: number;
  col: number;
  rgb: [number, number, number];
}

export type CustomApplyPlan =
  | { ok: true; keys: CustomKeyPayload[] }
  | { ok: false; reason: "empty" };

export const KEY_DECORATORS: readonly KeyDecorator[] = [
  { row: 0, col: 1, label: "Esc", x: 0, y: 0, w: 30, h: 30 },
  { row: 0, col: 2, label: "F1", x: 65, y: 0, w: 30, h: 30 },
  { row: 0, col: 3, label: "F2", x: 98, y: 0, w: 30, h: 30 },
  { row: 0, col: 4, label: "F3", x: 130, y: 0, w: 30, h: 30 },
  { row: 0, col: 5, label: "F4", x: 162, y: 0, w: 30, h: 30 },
  { row: 0, col: 6, label: "F5", x: 210, y: 0, w: 30, h: 30 },
  { row: 0, col: 7, label: "F6", x: 242, y: 0, w: 30, h: 30 },
  { row: 0, col: 8, label: "F7", x: 275, y: 0, w: 30, h: 30 },
  { row: 0, col: 9, label: "F8", x: 307, y: 0, w: 30, h: 30 },
  { row: 0, col: 10, label: "F9", x: 354, y: 0, w: 30, h: 30 },
  { row: 0, col: 11, label: "F10", x: 386, y: 0, w: 30, h: 30 },
  { row: 0, col: 12, label: "F11", x: 418, y: 0, w: 30, h: 30 },
  { row: 0, col: 13, label: "F12", x: 450, y: 0, w: 30, h: 30 },
  { row: 1, col: 1, label: "`", x: 1, y: 49, w: 28, h: 28 },
  { row: 1, col: 2, label: "1", x: 33, y: 49, w: 28, h: 28 },
  { row: 1, col: 3, label: "2", x: 65, y: 49, w: 28, h: 28 },
  { row: 1, col: 4, label: "3", x: 97, y: 49, w: 28, h: 28 },
  { row: 1, col: 5, label: "4", x: 129, y: 49, w: 28, h: 28 },
  { row: 1, col: 6, label: "5", x: 161, y: 49, w: 28, h: 28 },
  { row: 1, col: 7, label: "6", x: 193, y: 49, w: 28, h: 28 },
  { row: 1, col: 8, label: "7", x: 226, y: 49, w: 28, h: 28 },
  { row: 1, col: 9, label: "8", x: 258, y: 49, w: 28, h: 28 },
  { row: 1, col: 10, label: "9", x: 290, y: 49, w: 28, h: 28 },
  { row: 1, col: 11, label: "0", x: 322, y: 49, w: 28, h: 28 },
  { row: 1, col: 12, label: "-", x: 354, y: 49, w: 28, h: 28 },
  { row: 1, col: 13, label: "=", x: 386, y: 49, w: 28, h: 28 },
  { row: 1, col: 14, label: "Num Lock", x: 599, y: 49, w: 28, h: 28 },
  { row: 1, col: 15, label: "Num /", x: 630, y: 49, w: 28, h: 28 },
  { row: 1, col: 16, label: "Num *", x: 662, y: 49, w: 28, h: 28 },
  { row: 2, col: 1, label: "Tab", x: 0, y: 82, w: 45, h: 28 },
  { row: 2, col: 2, label: "Q", x: 51, y: 82, w: 28, h: 28 },
  { row: 2, col: 3, label: "W", x: 83, y: 82, w: 28, h: 28 },
  { row: 2, col: 4, label: "E", x: 115, y: 82, w: 28, h: 28 },
  { row: 2, col: 5, label: "R", x: 147, y: 82, w: 28, h: 28 },
  { row: 2, col: 6, label: "T", x: 179, y: 82, w: 28, h: 28 },
  { row: 2, col: 7, label: "Y", x: 211, y: 82, w: 28, h: 28 },
  { row: 2, col: 8, label: "U", x: 243, y: 82, w: 28, h: 28 },
  { row: 2, col: 9, label: "I", x: 275, y: 82, w: 28, h: 28 },
  { row: 2, col: 10, label: "O", x: 307, y: 82, w: 28, h: 28 },
  { row: 2, col: 11, label: "P", x: 339, y: 82, w: 28, h: 28 },
  { row: 2, col: 12, label: "[", x: 371, y: 82, w: 28, h: 28 },
  { row: 2, col: 13, label: "]", x: 403, y: 82, w: 28, h: 28 },
  { row: 2, col: 14, label: "Num 7", x: 598, y: 82, w: 28, h: 28 },
  { row: 2, col: 15, label: "Num 8", x: 630, y: 82, w: 28, h: 28 },
  { row: 2, col: 16, label: "Num 9", x: 662, y: 82, w: 28, h: 28 },
  { row: 3, col: 1, label: "Caps Lock", x: 0, y: 113, w: 53, h: 30 },
  { row: 3, col: 2, label: "A", x: 58, y: 113, w: 28, h: 30 },
  { row: 3, col: 3, label: "S", x: 91, y: 113, w: 28, h: 30 },
  { row: 3, col: 4, label: "D", x: 123, y: 113, w: 28, h: 30 },
  { row: 3, col: 5, label: "F", x: 155, y: 113, w: 28, h: 30 },
  { row: 3, col: 6, label: "G", x: 187, y: 113, w: 28, h: 30 },
  { row: 3, col: 7, label: "H", x: 219, y: 113, w: 28, h: 30 },
  { row: 3, col: 8, label: "J", x: 251, y: 113, w: 28, h: 30 },
  { row: 3, col: 9, label: "K", x: 283, y: 113, w: 28, h: 30 },
  { row: 3, col: 10, label: "L", x: 315, y: 113, w: 28, h: 30 },
  { row: 3, col: 11, label: ";", x: 347, y: 113, w: 28, h: 30 },
  { row: 3, col: 12, label: "'", x: 379, y: 113, w: 28, h: 30 },
  { row: 3, col: 13, label: "\\", x: 435, y: 82, w: 45, h: 28 },
  { row: 3, col: 14, label: "Num 4", x: 598, y: 113, w: 28, h: 30 },
  { row: 3, col: 15, label: "Num 5", x: 630, y: 113, w: 28, h: 30 },
  { row: 3, col: 16, label: "Num 6", x: 662, y: 113, w: 28, h: 30 },
  { row: 4, col: 1, label: "Left Shift", x: 0, y: 146, w: 69, h: 30 },
  { row: 4, col: 2, label: "Z", x: 74, y: 146, w: 28, h: 30 },
  { row: 4, col: 3, label: "X", x: 106, y: 146, w: 28, h: 30 },
  { row: 4, col: 4, label: "C", x: 138, y: 146, w: 28, h: 30 },
  { row: 4, col: 5, label: "V", x: 170, y: 146, w: 28, h: 30 },
  { row: 4, col: 6, label: "B", x: 202, y: 146, w: 28, h: 30 },
  { row: 4, col: 7, label: "N", x: 234, y: 146, w: 28, h: 30 },
  { row: 4, col: 8, label: "M", x: 266, y: 146, w: 28, h: 30 },
  { row: 4, col: 9, label: ",", x: 298, y: 146, w: 28, h: 30 },
  { row: 4, col: 10, label: ".", x: 330, y: 146, w: 28, h: 30 },
  { row: 4, col: 11, label: "/", x: 362, y: 146, w: 28, h: 30 },
  { row: 4, col: 12, label: "Right Shift", x: 394, y: 146, w: 85, h: 30 },
  { row: 4, col: 13, label: "Enter", x: 411, y: 113, w: 70, h: 30 },
  { row: 4, col: 14, label: "Num 1", x: 598, y: 146, w: 28, h: 30 },
  { row: 4, col: 15, label: "Num 2", x: 630, y: 146, w: 28, h: 30 },
  { row: 4, col: 16, label: "Num 3", x: 662, y: 146, w: 28, h: 30 },
  { row: 5, col: 1, label: "Left Ctrl", x: 0, y: 178, w: 36, h: 30 },
  { row: 5, col: 2, label: "Left Win", x: 42, y: 178, w: 36, h: 30 },
  { row: 5, col: 3, label: "Left Alt", x: 82, y: 178, w: 36, h: 30 },
  { row: 5, col: 4, label: "Space", x: 122, y: 178, w: 198, h: 30 },
  { row: 5, col: 5, label: "Right Alt", x: 324, y: 178, w: 36, h: 30 },
  { row: 5, col: 6, label: "FN", x: 363, y: 178, w: 36, h: 30 },
  { row: 5, col: 7, label: "App", x: 404, y: 178, w: 36, h: 30 },
  { row: 5, col: 8, label: "Right Ctrl", x: 444, y: 178, w: 36, h: 30 },
  { row: 5, col: 9, label: "Left", x: 493, y: 178, w: 28, h: 30 },
  { row: 5, col: 10, label: "Down", x: 525, y: 178, w: 28, h: 30 },
  { row: 5, col: 11, label: "Up", x: 524, y: 146, w: 28, h: 30 },
  { row: 5, col: 12, label: "Right", x: 557, y: 178, w: 28, h: 30 },
  { row: 5, col: 13, label: "Backspace", x: 418, y: 49, w: 62, h: 28 },
  { row: 5, col: 14, label: "Num 0", x: 598, y: 178, w: 62, h: 30 },
  { row: 5, col: 15, label: "Decimal", x: 662, y: 178, w: 28, h: 30 },
  { row: 5, col: 16, label: "Num Enter", x: 696, y: 146, w: 28, h: 63 },
  { row: 6, col: 4, label: "Print Scr", x: 493, y: 0, w: 29, h: 30 },
  { row: 6, col: 5, label: "Scroll lock", x: 525, y: 0, w: 29, h: 30 },
  { row: 6, col: 7, label: "Pause", x: 557, y: 0, w: 29, h: 30 },
  { row: 6, col: 8, label: "Insert", x: 493, y: 49, w: 28, h: 28 },
  { row: 6, col: 9, label: "Home", x: 526, y: 49, w: 28, h: 28 },
  { row: 6, col: 10, label: "Page up", x: 557, y: 49, w: 28, h: 28 },
  { row: 6, col: 11, label: "Delete", x: 492, y: 82, w: 28, h: 28 },
  { row: 6, col: 12, label: "End", x: 525, y: 82, w: 28, h: 28 },
  { row: 6, col: 13, label: "Page down", x: 557, y: 82, w: 28, h: 28 },
  { row: 6, col: 14, label: "Num -", x: 694, y: 49, w: 28, h: 28 },
  { row: 6, col: 15, label: "Num +", x: 694, y: 82, w: 28, h: 60 },
  { row: 7, col: 3, label: "", x: 195, y: 217, w: 24, h: 5 },
  { row: 7, col: 4, label: "", x: 219, y: 217, w: 23, h: 5 },
  { row: 7, col: 5, label: "", x: 242, y: 217, w: 23, h: 5 },
  { row: 7, col: 6, label: "", x: 265, y: 217, w: 22, h: 5 },
  { row: 7, col: 7, label: "", x: 287, y: 217, w: 22, h: 5 },
  { row: 7, col: 8, label: "", x: 309, y: 217, w: 22, h: 5 },
  { row: 7, col: 9, label: "", x: 331, y: 217, w: 22, h: 5 },
  { row: 7, col: 10, label: "", x: 353, y: 217, w: 22, h: 5 },
  { row: 7, col: 11, label: "", x: 375, y: 217, w: 22, h: 5 },
  { row: 7, col: 12, label: "", x: 397, y: 217, w: 22, h: 5 },
  { row: 7, col: 13, label: "", x: 419, y: 217, w: 22, h: 5 },
  { row: 7, col: 14, label: "", x: 441, y: 217, w: 22, h: 5 },
  { row: 7, col: 15, label: "", x: 463, y: 217, w: 23, h: 5 },
  { row: 7, col: 16, label: "", x: 486, y: 217, w: 23, h: 5 },
  { row: 7, col: 17, label: "", x: 509, y: 217, w: 22, h: 5 },
];

/** The 119 addressable key indices, mirroring VALID_KEY_INDICES in protocol.rs. */
export const VALID_KEY_INDICES: ReadonlySet<number> = new Set(
  KEY_DECORATORS.map(keyIndexOf)
);

/**
 * Map painted positions to the apply_custom_lighting payload, ordered by
 * key_index so the same selection always serializes identically.
 *
 * An empty selection is refused instead of sent. The builder treats an empty
 * list as a valid transaction that writes RGB zero everywhere, so letting it
 * through would silently darken the whole keyboard.
 */
export function planCustomApply(colors: Record<number, string>): CustomApplyPlan {
  const keys = Object.keys(colors)
    .map(Number)
    .sort((left, right) => left - right)
    .map((keyIndex) => ({
      ...rowColOf(keyIndex),
      rgb: hexToRgb(colors[keyIndex])
    }));
  return keys.length > 0 ? { ok: true, keys } : { ok: false, reason: "empty" };
}
