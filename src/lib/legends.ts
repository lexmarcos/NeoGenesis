/**
 * Short keycap legends. The keymap carries full names from the firmware XML
 * ("Left Shift", "Num Enter", "Scroll lock"); the on-screen keycaps need the
 * short forms a real keyboard prints on its caps.
 */
const LEGENDS: Record<string, string> = {
  "Caps Lock": "Caps",
  "Left Shift": "Shift",
  "Right Shift": "Shift",
  "Left Ctrl": "Ctrl",
  "Right Ctrl": "Ctrl",
  "Left Win": "Win",
  "Left Alt": "Alt",
  "Right Alt": "Alt",
  "Num Lock": "Num",
  "Num Enter": "Ent",
  "Print Scr": "Prt",
  "Scroll lock": "Scr",
  "Pause": "Pse",
  "Home": "Hm",
  "Page up": "Pg↑",
  "Page down": "Pg↓",
  "Insert": "Ins",
  "Delete": "Del",
  "Backspace": "←",
  "Left": "←",
  "Right": "→",
  "Up": "↑",
  "Down": "↓",
  "App": "Menu",
  "Decimal": "."
};

export function legendOf(label: string): string {
  if (label in LEGENDS) return LEGENDS[label];
  // "Num 7" -> "7", "Num /" -> "/", "Num +" -> "+"
  if (label.startsWith("Num ")) return label.slice(4);
  return label;
}
