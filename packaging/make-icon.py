#!/usr/bin/env python3
"""Compose the app icon source from the tracked logo artwork.

The logo is a wide (668x358), transparent-background mark, but every platform
wants a square icon — and the AppImage bundler refuses to build without one.
This wraps the mark in a white rounded square and writes app-icon.svg, which is
gitignored because it is generated. Regenerate the whole icon set with:

    python3 packaging/make-icon.py
    npm run tauri icon -- app-icon.svg
"""

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src/assets/light logo.svg"
OUT = ROOT / "app-icon.svg"

SIZE = 1024
RADIUS = 225  # ~22% of SIZE, the corner rounding used across the icon set
LOGO_WIDTH = 0.80  # fraction of the canvas the wide mark spans

svg = SRC.read_text()

viewbox = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
if not viewbox:
    raise SystemExit(f"no viewBox in {SRC}")
logo_w, logo_h = float(viewbox.group(1)), float(viewbox.group(2))

# Everything between the <svg> tag and </svg> is the mark itself.
body = svg.split(">", 1)[1].rsplit("</svg>", 1)[0].strip()

scale = (SIZE * LOGO_WIDTH) / logo_w
tx = (SIZE - logo_w * scale) / 2
ty = (SIZE - logo_h * scale) / 2

OUT.write_text(
    f'<svg width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}" '
    f'xmlns="http://www.w3.org/2000/svg">\n'
    f'  <rect width="{SIZE}" height="{SIZE}" rx="{RADIUS}" ry="{RADIUS}" fill="#ffffff"/>\n'
    f'  <g transform="translate({tx:.3f} {ty:.3f}) scale({scale:.6f})">\n'
    f"    {body}\n"
    f"  </g>\n"
    f"</svg>\n"
)

print(f"{SRC.name} {logo_w:.0f}x{logo_h:.0f} -> {OUT.relative_to(ROOT)} {SIZE}x{SIZE}")
