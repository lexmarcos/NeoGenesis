#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

install -Dm644 \
  "$SCRIPT_DIR/70-neogenesis-hyperx-mars.rules" \
  /etc/udev/rules.d/70-neogenesis-hyperx-mars.rules
udevadm control --reload-rules
udevadm trigger --subsystem-match=hidraw

echo "udev rule installed. Reconnect the HyperX Mars keyboard."
