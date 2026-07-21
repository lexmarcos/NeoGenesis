#!/bin/sh
set -e

if command -v udevadm >/dev/null; then
  udevadm control --reload-rules
  udevadm trigger --subsystem-match=hidraw
fi
