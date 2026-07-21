# <picture><source media="(prefers-color-scheme: dark)" srcset="src/assets/dark%20text%20logo.png"><source media="(prefers-color-scheme: light)" srcset="src/assets/light%20text%20logo.png"><img alt="Neo Genesis" src="src/assets/light%20text%20logo.png" width="512"></picture>

Independent lighting control for the **HyperX Mars** keyboard (`VID 0951`, `PID 16C6`). Neo Genesis communicates directly with the device over HID on Windows; it does not require HyperX Genesis, NGENUITY, a bridge, or any external DLL.

## Features

- RGB Wave, Color Loading, Solid, Color Cycle, and Heartbeat effects;
- brightness, speed, direction, and repeat when supported by the firmware;
- ten local profiles;
- per-key and LED-bar custom paint;
- direct write to onboard keyboard memory;
- keepalive to keep the Heartbeat effect moving.

## Usage

1. Close any other programs that may be controlling the keyboard.
2. Open `src-tauri\target\release\neo-genesis.exe`.
3. Choose an effect or paint keys on the **Custom per key** card.
4. Click **Apply on Mars** or **Apply per key**.

Do not disconnect the keyboard while a write is in progress. For the Heartbeat effect, keep Neo Genesis open or minimized — the firmware relies on the app's keepalive.

## Development

Prerequisites: Node.js, stable Rust, Visual Studio C++ tools, and the WebView2 Runtime.

```powershell
npm install
npm run tauri dev
```

Local checks:

```powershell
npm test
npm run build
cargo check --manifest-path src-tauri\Cargo.toml
cargo test --manifest-path src-tauri\Cargo.toml
```

Production build:

```powershell
npm run tauri build
```

The executable lands at `src-tauri\target\release\neo-genesis.exe`. Windows may show a warning because the binary is not digitally signed. The WebView2 Runtime is typically already present on Windows 10 and 11.

## Known Limitations

- Support is specific to the HyperX Mars `0951:16C6`.
- Only lighting is implemented; macros, remapping, and game mode are not part of the app.
- Custom-mode colors are saved locally and are not separated by profile.
- The current release is Windows-only.

This project is not affiliated with or endorsed by HyperX.
