# HyperX Mars HID Protocol

This specification gathers what was obtained from static analysis of HyperX Genesis
2.2.1.4, inspection of the original databases and XMLs, capture of the Sonix DLL
traffic, and tests on a real HyperX Mars (`VID 0951`, `PID 16C6`, USB revision
`0100`).

The confirmed scope is device detection, writing the five lighting effects
accepted by the firmware and, by means of one specific complete transaction
(see "Per-key custom lighting"), writing per-key custom lighting standalone,
without Genesis. Fields that were not observed are treated as unknown, even when
a suggestive name exists in the Genesis files.

## Interface and transport

The Mars exposes common keyboard interfaces and additional HID collections. The
Genesis commands work on the collection:

- path containing `vid_0951&pid_16c6&mi_00`;
- interface `0`;
- HID usage page `0001`;
- feature reports of 65 bytes.

The report sent to Windows has:

- physical byte 0: report ID, always `00`;
- physical bytes 1–64: protocol payload described in this document.

The indices in the following tables refer to the 64-byte payload, therefore they
do not include the physical HID ID byte.

The keyboard collection normally rejects `CreateFileA` with
`GENERIC_READ | GENERIC_WRITE` (`ERROR_ACCESS_DENIED`). The confirmed transport
retries the open with:

- desired access `0`;
- sharing `FILE_SHARE_READ | FILE_SHARE_WRITE`;
- creation `OPEN_EXISTING`.

Each `HidD_SetFeature` and `HidD_GetFeature` opens and closes its own handle.
This behavior was observed in `SonixHidDll.dll` and reproduced directly in Rust;
it is not necessary to load any Genesis DLL in production.

The relevant exports of the original DLL are `FindDeviceWithID`, `HIDReportOut`,
`HIDReportIn`, and `HIDReportIn2`.

## Acknowledgements and echo

A successful response repeats the command in bytes 0–1 and uses `01` in byte 3:

```text
04 CC 00 01 ...
```

Byte 3 equal to `00` may be merely the echo of the sent packet. For this reason
Mars Control waits for the response and may retry idempotent commands up to three
times.

Responses confirmed during a real write:

```text
04 AB -> 04 AB 00 01 00 00 00 00 ...
04 02, opening -> 04 02 00 01 2D 4B E9 E0 ...
04 0A -> 04 0A 00 01 00 00 00 00 0F ...
04 02, final -> 04 02 00 01 0A 56 00 00 ...
04 E0 -> 04 E0 00 01 ...
```

The four extra bytes of the `04 02` responses were reproduced by the Rust
transport, but their internal semantics were not determined.

Gate 5 observed repetition of these four bytes in subsets: the closing
`89 56` repeated in six transactions with commit `80` (Genesis 17:36, 4D×2,
4E×3), and the opening `8D 4F 91 7F` repeated in six transactions with the 4A
session_block. This does not demonstrate general determinism by transaction
type — only repetition in the cases observed so far.

## Complete write session

A valid write follows this order:

1. Locate the `MI_00` collection of `0951:16C6`.
2. Send `04 AB` and read `04 AB 00 01`.
3. Send an opaque 64-byte session block.
4. Send `04 02` and read the opening acknowledgement.
5. Send the `04 0A` header, with `0F` in byte 8, and read the acknowledgement.
6. Send, in this order, the `01`, `03`, `04`, `05`, and `08` frames.
7. Send the nine per-key custom lighting frames.
8. Send the active-mode commit frame (effect code, or `80` for per-key custom).
9. Send `04 02` and read the final acknowledgement.

The read after the `04 0A` header is mandatory. Without it, the first effect
frame may be discarded by the device.

The only validated way so far to enable per-key custom mode is to reproduce
exactly the three frames described in recipe E1 (see "Recipe E1 — validated
per-key transaction"); the remaining 17 frames of the sequence are identical to
those of the 4A effect transaction. Gate 4E demonstrated that the 4E-1
transaction — 4A session_block (starting C7 59 65 6C) + exact effect_01 of 4D
(starting 01 FF 00 00 00 5A FF 00, ending 01 00 05 05) + commit 80 — is
accepted by the firmware (close 04 02 00 01 89 56), producing the visual
transition all-red → only W/A/S/D red in that test. In the comparison tested,
the byte-exact effect_01 was the discriminant. The exact 4D session_block was
not necessary; the exact 4A block was sufficient. Arbitrary/pseudorandom blocks
were not validated.
This does not prove that any session_block works — only this exact one was
validated. Formal repetition executed (Gate 5 discipline): two valid visual
transitions, three `01` closes.

The session block looks like opaque entropy. A real capture of another
transaction started with:

```text
5D 2F F9 CC F0 21 64 07 07 BF 1F 53 E8 07 C2 39
0B 65 97 2A 28 7A 4F 65 95 1C F3 1B CF 9E 1D D0
57 51 67 04 BF 4A 24 13 04 66 4E 5A 1E 8C C0 9B
D6 32 A5 A2 D8 23 31 29 09 7F 8F FA 1A 03 1A 53
```

The session_block of the 4A transaction, validated in Gate 4E-1 (accepted with
effect_01 of 4D + commit 80), starts with `C7 59 65 6C` (see "Recipe E1 —
validated per-key transaction").

No challenge-response was found in the bytes returned by `04 AB`. Both the
captured block and locally generated blocks were accepted by the firmware. There
is not enough evidence to attribute cryptographic meaning to the content.

## Timing

The capture distinguished two intervals, measured more precisely in Gate 5:

- commands followed by a read: `RESPONSE_DELAY`, set to 30 ms in the Rust
  transport to avoid reading only the echo; the response observed in practice
  was around 40–42 ms (with overhead);
- consecutive profile frames: `PROFILE_REPORT_DELAY`, set to 5 ms, equal to the
  `CommandDelayTime` configured in Genesis; the spacing observed in practice was
  around 10–12 ms (with overhead).

Using 30 ms between all 16 frames makes the transaction unnecessarily long. Mars
Control uses 5 ms on the profile frames and serializes the whole operation with a
mutex to prevent collision with state queries.

## Effect order and structure

The Mars `EnableLightingMode` XML enables only:

```text
BreathingMode
SpectrumCyclingMode
StaticMode
WaveMode
StackMode
```

Each application sends all five frames, even when only one will be activated. For
this reason the settings of every effect must remain independent. Reusing the
color of the active effect in the other frames caused, in earlier tests, the
Solid color to contaminate Breathing and other modes.

### `01` — Breathing / Heartbeat

| Index | Confirmed content |
| ---: | --- |
| 0 | `01` |
| 1–15 | five RGB colors, three bytes per color |
| 59 | `ActiveColorIndex`, observed as `00` |
| 60 | `Loop` (`00` or `01`) |
| 61 | reserved/zero in the capture |
| 62 | brightness `01`–`05` |
| 63 | speed/frequency `01`–`05` |

Functional capture made by Genesis with a multicolor loop:

```text
01 FF0000 005AFF 00FF00 FFFF00 FFFFFF
   [bytes 16–58 = 00]
   00 01 00 05 05
```

The last segment corresponds to indices 59–63. An important mistake during
reverse engineering was placing `Loop` in byte 61; that byte is the Stack mode
loop, not the `01` mode loop.

The new Heartbeat effect uses this native engine. The UI receives two colors and
the backend generates five interpolated positions:

```text
color A -> 25% -> 50% -> 75% -> color B
```

This replicates the five-color contract used by Genesis and avoids empty hidden
positions. The firmware handles the brightness pulse; the application handles the
multicolor continuity by means of the keepalive described below.

This same multicolor-with-loop configuration (start `01 FF 00 00 00 5A FF 00
...`, end `... 01 00 05 05`) is the `effect_01` payload present in the `4D`
transaction that enables per-key custom mode (see "Per-key custom lighting" and
"Recipe E1"). Gate 4E confirmed that this effect_01 is the discriminating
factor: the 4E-1 transaction (4A session_block + 4D effect_01 + commit 80) was
accepted, while 4C (4A session_block and effect_01 + commit 80) was rejected. In
the comparison tested, the byte-exact effect_01 was the discriminant. The exact
4D session_block was not necessary; the exact 4A block was sufficient.
Arbitrary/pseudorandom blocks were not validated.

### `03` — Color cycle / Spectrum

| Index | Content |
| ---: | --- |
| 0 | `03` |
| 62 | brightness `01`–`05` |
| 63 | speed `01`–`05` |

### `04` — Solid color

| Index | Content |
| ---: | --- |
| 0 | `04` |
| 1–3 | one RGB color |
| 62 | brightness `01`–`05` |
| 63 | observed as `00` |

### `05` — Wave

| Index | Content |
| ---: | --- |
| 0 | `05` |
| 61 | direction |
| 62 | brightness `01`–`05` |
| 63 | speed `01`–`05` |

Confirmed directions: up `00`, left `01`, right `02`, down `03`.

### `08` — Loading/Stack

| Index | Content |
| ---: | --- |
| 0 | `08` |
| 1–15 | five RGB colors |
| 59 | `ActiveColorIndex`, observed as `00` |
| 60 | direction |
| 61 | `Loop` |
| 62 | brightness `01`–`05` |
| 63 | speed `01`–`05` |

## Commit

The commit has:

| Index | Content |
| ---: | --- |
| 0 | selector: active effect code (`01`, `03`, `04`, `05`, or `08`) for the five effects, or `80` for per-key custom mode |
| 1 | observed constant `05` |
| 62–63 | signature `AA 55` |

The remaining bytes were observed as zero.

`commit[0] = 80` was physically confirmed as part of the complete `4D`
transaction and, later, in the 4E-1 transaction (4A session_block + 4D effect_01
+ commit 80 — see "Recipe E1"). Gate 4C mutated this single byte in isolation
over the effect transaction (baseline `4A`, code `04`/Solid) and the firmware
**rejected** the mutation — close `04 02 00 FF`, no visual change. Therefore it
is **forbidden to claim that `commit[0] = 80` alone activates the custom mode**;
in the comparison tested, the byte-exact effect_01 of 4D was the discriminant;
the exact 4A session_block was sufficient.

## Per-key custom lighting

After the five effects, the transaction sends nine 64-byte frames with the
individual lighting of each key (per-key mode).

### Validated complete transaction (E1)

Per-key control **does not require Genesis**. The complete, byte-exact `4D`
transaction — captured from Genesis in "Customize" mode (17:36) and later
reproduced by the Mars Control Rust transport, without Genesis — produces
standalone per-key lighting repeatably. Observed close:

```text
04 02 00 01 89 56
```

This transaction was physically confirmed in four independent applications:
Genesis 17:33, Genesis 17:36, Mars Control (`4D` transaction), and a repetition
in Gate 5. In all of them, `key_index` `39`, `56`, `57`, and `58` — W, A, S, D
on the tested keyboard — lit red.

The validation is about the **complete transaction**, not about an isolated byte
(see "Commit" above for the negative fact from Gate 4C). In the comparison
tested, the byte-exact effect_01 of 4D was the discriminant: the transaction with
4A session_block + 4D effect_01 + commit 80 was accepted by the firmware (close
04 02 00 01 89 56). The 4A session_block was sufficient.

The three only differences between the `4D` (per-key, functional) and `4A`
(Solid effect, baseline) transactions and the result of Gate 4E-1 are:

| Frame | `4A` (effect, rejected with commit 80) | `4D` (per-key, accepted) | `4E-1` (Gate 4E, accepted) |
| --- | --- | --- | --- |
| `session_block` | opaque block, starts `C7 59 65 6C` | *different* opaque block, starts `40 09 51 C0` | 4A session_block (starts `C7 59 65 6C`) |
| `effect_01` | active effect configuration | multicolor configuration + loop, starts `01 FF 00 00 00 5A FF 00`, ends `01 00 05 05` | 4D effect_01 |
| `commit` | byte 0 = effect code (`04`) | byte 0 = `80`, ends `80 05 00 ... AA 55` | commit `80` |

### Recipe E1 — validated per-key session

The exact bytes that compose recipe E1 to enable per-key custom mode (replacing
the corresponding ones of the baseline 4A effect transaction):

- **session_block** (64 bytes): the exact one from the 4A transaction, starting
  with `C7 59 65 6C`. The following 60 bytes must be copied byte by byte from the
  4A transaction capture (see "Implementation and evidence"); arbitrary blocks or
  the production pseudo_random_report were not tested.
- **effect_01** (frame `01`, 64 bytes): the exact one from the 4D transaction,
  starting with `01 FF 00 00 00 5A FF 00` and ending with `01 00 05 05`.
- **commit** (commit frame, 64 bytes): byte 0 = `80`; bytes 62–63 = `AA 55`;
  remaining bytes as in the 4D transaction.

The remaining 17 frames (03, 04, 05, 08 and the nine per-key frames) are
identical to those of the 4A effect transaction.

### Distinction between usage modes

- **BYTE-EXACT REPLAY**: reproduce the gate4e_control.txt artifact as is
  (preserves even the W/A/S/D red and all prefixes). Used for
  testing/verification (Gate 4E and formal repetitions).
- **NEW PROFILE ASSEMBLY**: use the formula key_index = row*18+col, preserve the
  template prefixes, initialize RGB=000000, apply the RGB requested by the user.
  Used for production/Gate 6.

### Addressing formula

```text
key_index   = row * 18 + col        (row: 0-7, col: 0-17; 144 positions)
frame       = key_index // 16       (0-8; one of the nine frames)
position    = key_index % 16        (0-15; position within the frame)
byte_offset = position * 4          (offset of the entry within the frame)
```

Each entry occupies four bytes:

```text
[prefix, R, G, B]
```

Rules for frame assembly (builder):
- Preserve only the opaque prefix P_i of each entry of the captured template.
- Initialize all RGB as 00 00 00.
- Then apply the requested RGB to the supported indices (key_index with a mapped
  key).
- Never infer key existence or validity from the prefix; the prefix is opaque.
- Never inherit the red RGB of W/A/S/D from the template; apply only the
  requested colors.

### Entry prefix (opaque)

The prefix byte of each entry is opaque; its meaning was not determined. The
reference capture contains 129 `80` prefixes against 119 equivalent decorators in
the Genesis XML, with contradictions in both directions (entries with a decorator
in the XML and prefix `00` in the capture, and vice versa). The observed values
are `80` and `00`.

Rules for frame assembly (builder):
- Preserve only the opaque prefix P_i of each entry of the captured template.
- Initialize all RGB as 00 00 00.
- Then apply the requested RGB to the supported indices (key_index with a mapped
  key).
- Never infer key existence or validity from the prefix; the prefix is opaque.
- Never inherit the red RGB of W/A/S/D from the template; apply only the
  requested colors.

### Scope of the evidence: E1 vs. E3

- `key_index` `39`, `56`, `57`, and `58` (W/A/S/D): physically and repeatedly
  confirmed (E1, four independent applications — see above).
- The other 100 mapped keys and the 15 LED bar segments (`row 7`, `col 3–17`):
  addressing and format consistent with the Genesis XML/database (static
  evidence, E3), **without individual physical confirmation**. Treat these
  indices as probable, not as verified.

The firmware stores the nine frames; activating the commit in isolation with code
`00` cleared the LEDs in an earlier historical test. This finding about code `00`
is a different transaction from `4D` and was not reinterpreted by the discovery of
`80` inside the complete transaction. For this reason the custom mode via isolated
commit `00` remains unexposed by Mars Control.

## `04 E0` keepalive and multicolor animation

This was the decisive discovery for the Heartbeat mode.

Genesis continuously sends:

```text
04 E0 00 00 ... -> 04 E0 00 01 ...
```

The observed interval was approximately 1.6 seconds. The literal reproduction of
the multicolor profile, including session block, responses, palette, and commit,
got stuck on the first color when the polling did not continue. During 15 `04 E0`
polls, the keyboard advanced from red to blue and then yellow; when the polls
ended, it froze on yellow. With the continuous keepalive of Mars Control, the
colors kept changing indefinitely.

Conclusion confirmed on the hardware:

- the palette and the loop are written to the keyboard memory;
- the multicolor animation of engine `01` needs the periodic host queries to keep
  advancing;
- Mars Control implements this polling directly in Rust;
- the app can stay minimized, but if the process is terminated, the animation
  freezes on the current color;
- Genesis and a bridge are not necessary.

The keepalive uses `try_lock`: if a write is in progress, that tick is skipped
instead of interleaving a command with the flash transaction.

This keepalive is specific to the multicolor animation of engine `01`. In the
`4A` (Solid) and `4D` (per-key) runs of Gate 5, no `04 E0` was sent, and the
resulting states — Solid red and per-key red on W/A/S/D — persisted without any
polling. That is, Static and per-key do not depend on the keepalive; only the
multicolor loop of engine `01` does.

## Volatile write (RAM): sought and not found

**Date: 2026-07-21.** Question investigated: does the firmware accept a
*volatile* lighting write — applied to the LEDs immediately, but not written to
flash? This would make frequent updates feasible, currently impractical because
the only known path is the 20-report transaction, which takes ~275 ms and
rewrites all 144 positions on every color change.

**Answer: there is no volatile path in anything the manufacturer's software
does.** The claim is about the observable repertoire of Genesis 2.2.1.4, not
about absolute absence in the firmware (see "Scope and limit of this
conclusion").

### Method

Instead of USBPcap/Wireshark, the capture used the DLL proxy already existing in
`reverse-lab/proxy`, which intercepts `HidD_SetFeature` and `HidD_GetFeature`
inside the Genesis process. For this question it is strictly better than a
bus-level capture: it records the exact bytes of each feature report, requires no
driver installation or reboot, and also captures writes that do not go through
the `SonixHidDll` exports.

Artifacts: `reverse-lab/artifacts/volatile-probe/{A,B}.log` and
`A_transaction.txt`. The whole `reverse-lab/` is in `.gitignore`, therefore these
files are not versioned.

### Capture A — live preview

Lighting screen → Effects → Solid; slow drag of the Brightness control from end
to end, without clicking OK.

- during the entire drag: **476 `04 E0` keepalives and zero writes**;
- the LEDs **did not change** while the mouse button was pressed (physical
  observation by the operator);
- on clicking OK: exactly **20 payloads in 274 ms** — the already documented
  flash transaction, without any structural deviation.

That is, there is no live preview to capture: Genesis writes nothing until the
explicit commit.

### Capture B — explicit write

Two selections in the color picker (Solid green). Each click produced a complete
and independent transaction:

| Time | Frame `04` (Solid) | Payloads | Duration |
| --- | --- | ---: | ---: |
| 18:33:49 | `04 00 FF 13` | 20 | 274 ms |
| 18:33:56 | `04 21 FF 00` | 20 | 274 ms |

Difference between consecutive transactions, payload by payload: only the
`session_block` and the `eff_04` frame. **The nine per-key frames are
retransmitted byte-identical even when only the Solid color changed** — the 144
positions are rewritten on every color change.

### Power-cycle test (executed)

After writing green and clicking OK, the keyboard was **physically
disconnected, waited ~5 s, and reconnected**. It came back green.

The decisive point is not just the survival of the color: on reconnection
(18:34:06) Genesis sent **only the read handshake** (`04 AB` + `session_block` +
`04 02`) and **no lighting write**. Therefore the color came from the keyboard's
own non-volatile memory, and not from a reapplication by the host. The observed
path is flash, without ambiguity.

### The `04 E0` keepalive is not a volatile path

The hypothesis that the keepalive would indicate a "host-controlled mode" was
verified and **discarded**:

- 3,078 `04 E0` writes accumulated in the logs, with **a single distinct
  payload**: the 64 zero bytes;
- the response is always `04 E0 00 01 00 00 00 00`, invariant.

There is no color field nor variation in either direction. The `04 E0` is timing
— it makes engine `01` advance the multicolor animation (see "`04 E0` keepalive
and multicolor animation") — and not pixel transport.

### Complementary static evidence

`GamingKeyboardWriter.dll`, the module that assembles the commands, contains only
the five mode strings `BreathingMode`, `SpectrumCyclingMode`, `StaticMode`,
`WaveMode`, and `StackMode`. There is no `preview`, `realtime`, `direct`, or
equivalent string in any Genesis binary.

The lighting UI exposes only Effects (RGB Wave, Color Loading, Solid, Breathing,
Color Cycle) and Customize (Custom1–5). Genesis 2.2.1.4 has **no** game
integration, audio visualizer, or screen mirroring — there is no real-time
feature whose capture could reveal another path.

### Scope and limit of this conclusion

Proven: **no volatile path is reachable by observing the manufacturer's
software**; every LED change that Genesis makes goes through the 20-report flash
transaction.

**Not** proven: that the firmware does not internally possess such a command.
Demonstrating this would require guessing command bytes never observed, which is
forbidden — unknown commands may render the keyboard permanently unusable and
there is no recovery tool.

Unexplored lead, recorded only as an observation: the `04 0A` header carries `0F`
in byte 8, and the Genesis `Entry.xml` exposes `<MemoryType>1</MemoryType>` with
the comment `0:EEPROM, 1:Flash`. Both are write-target parameters. **Neither was
mutated**, no alternative value is known by observation, and EEPROM and Flash —
the two documented options — are both non-volatile.

### Correction: the `session_block` is per-transaction entropy

This finding contradicts what was recorded in "Limits of current knowledge".

**13 distinct `session_block`s were observed actually sent to the hardware, and
all were accepted** (close `04 02 00 01`). Genesis generates a new,
apparently pseudorandom, block on each transaction; repeated blocks appear only
when the same block is reused within a single read burst, milliseconds later.

Therefore the firmware **does not validate the content** of the session block.
The caveat that "only the exact 4A block was validated" is superseded: the field
is opaque and arbitrary. This does not change recipe E1, but it removes the need
to treat `E1_SESSION_BLOCK` as a magic constant.

## Flash wear: why the current path is not suitable for real time

**Date: 2026-07-21.** This record exists to prevent a wrong conclusion from the
previous section. Having proven that "no volatile path exists" does **not** mean
"so let's optimize the flash transaction to be fast". The flash path cannot be
the basis for real-time effects — and the reason is not slowness, it is wear.

### What is measured

- Each lighting application is a complete 20-report transaction that takes
  **~275 ms** (captures A and B, 2026-07-21).
- The result **survives a power cycle** without any rewrite by the host (see
  "Power-cycle test"). Therefore, **each commit causes a write to non-volatile
  memory**.

### What is estimated

Embedded flash memory in this class of MCU usually supports between 10k and 100k
write/erase cycles. **We do not have the endurance specification of the exact
Mars part**, nor do we know the write amplification per commit (whether it is one
erase per commit, or whether there is wear leveling in the firmware). Treat the
numbers below as an order of magnitude, not as a measurement.

Assuming the plausible worst case of 10k cycles and one erase per commit:

| Update frequency | Cycles exhausted in |
| --- | --- |
| continuous (~3.6/s, the maximum the 275 ms allow) | **~46 minutes** |
| 1 per second | **~2.8 hours** |
| 1 per minute | ~7 days |

Even with 100k cycles, a continuous animation would consume the flash lifetime in
a few hours.

### Design consequences

- **Trimming the transaction does not solve it.** The dominant cost is the flash
  erase/write cycle, not the number of reports. Reducing 20 reports to 12 would
  make the operation a little faster and would wear the flash by exactly the same
  amount.
- **Per-key lighting is configuration, not an animation frame.** It must be
  written when the user decides to save, and never in response to a control drag,
  color cursor, or any continuous UI event. Note that Genesis itself writes flash
  on every click in the color picker (capture B, two transactions in 6.2 s) —
  this is an antipattern not to copy, not an example to follow.
- **Never build on this path** an audio visualizer, game integration, screen
  mirroring, or any frame-by-frame effect. This would render the keyboard flash
  permanently and irreversibly unusable.
- **What is safe for dynamism:** the native effect engines combined with the
  `04 E0` keepalive, which makes engine `01` advance the animation **without any
  flash write** (see "`04 E0` keepalive and multicolor animation"). It is limited
  — five-color palette, whole keyboard, not per-key — but it is the only
  zero-cost dynamic path available.

Real true real-time per-key control would require replacing the firmware (for
example via SonixQMK, since `SonixHidDll` indicates a Sonix MCU). The Mars is not
on that project's compatibility list, entering the bootloader requires grounding
the BOOT pin with the keyboard opened, and there is a documented risk of
bricking. Out of scope for Mars Control; recorded only as the only technically
real alternative.

## Modes found but not enabled

The generic Genesis models also contain `KeyLightReactive`, `KeyLightExplosion`,
and `KeyLightHeartBeating`. They do not appear in this keyboard's
`EnableLightingMode` list.

The experimental code `02`, associated with Reactive on other devices, cleared
the Mars LEDs and did not react to keys. Aurora based on this code also cleared
the keyboard. These modes are not exposed.

## Genesis persistence

The `GamingKeyboard.hxgkdb` database contains, among others, these tables:

- `ProfileSummary`;
- `KeyLightBreathing`;
- `KeyLightSpectrumCycling`;
- `KeyLightStatic`;
- `KeyLightWave`;
- `KeyLightStack`;
- `KeyLightCustomization` and `KeyLightCustomizationSummary`;
- generic `KeyLightReactive`, `KeyLightExplosion`, and `KeyLightHeartBeating`;
- `GamingMode`, macros, and key customization.

`KeyLightBreathing` confirms the fields `Color1`–`Color5`, `Frequency`,
`Brightness`, `Loop`, and `ActiveColorIndex`. `KeyLightStack` adds `Direction`.
The order in the database must not be confused with the packet offsets; the
offsets were determined by the HID capture.

## Limits of current knowledge

- The semantics of the four extra bytes of the `04 02` responses remains unknown.
  Gate 5 observed repetition of these bytes in subsets (see "Acknowledgements and
  echo"), which does not constitute general determinism proven by transaction
  type.
- The internal content of the opaque session block was not decoded.
- **E5 (pending).** It was not isolated which internal part of `effect_01` is
  necessary to enable per-key mode — whether it is bytes 60–61 (loop), 62–63
  (brightness/speed), the five-color palette, or a combination of them.
- ~~The session_block validated in Gate 4E is the exact one from the 4A
  transaction (start `C7 59 65 6C`). Random blocks or the production
  pseudo_random_report were not tested; there is no guarantee that any other
  session_block works.~~ **Superseded on 2026-07-21:** 13 distinct session_blocks
  were observed being sent to the hardware and all were accepted. Genesis
  generates a new block on each transaction; the firmware does not validate the
  content. See "Correction: the `session_block` is per-transaction entropy".
- Functional support was not demonstrated on the Mars for the generic mode `02`
  or for the custom mode with `commit[0] = 00` isolated as the active effect.
  This is distinct from `commit[0] = 80` inside the complete `4D` and `4E-1`
  transactions, which were physically confirmed (see "Per-key custom lighting"
  and "Commit").
- The protocol was validated only on the HyperX Mars `0951:16C6`.
- **Flash endurance not determined.** It is known that each commit writes to
  non-volatile memory (the state survives a power cycle), but the cycle limit of
  the part and the write amplification per commit are not known. The numbers in
  the "Flash wear" section are an order of magnitude, not a measurement. This does
  not weaken the design conclusion: at any plausible endurance value, continuous
  updating exhausts the flash in hours.
- Absolute black as a possible palette terminator was an initial hypothesis, but
  the later test showed that the absence of keepalive also explained the freeze.
  Therefore this hypothesis is not treated as fact.
- **Indices and prefixes outside W/A/S/D (pending).** Only `key_index`
  `39`/`56`/`57`/`58` have physical confirmation (E1). The other 100 keys and the
  15 LED bar segments (`row 7`, `col 3–17`) are only consistent with the
  XML/database (E3), without individual physical testing. The meaning of the
  prefix byte (`80`/`00`) per entry was also not determined.

## Implementation and evidence

- frame assembly: `src-tauri/src/protocol.rs`;
- transport, session, and keepalive: `src-tauri/src/device.rs`;
- unit tests and ignored physical tests: the same Rust modules;
- Genesis proxy and logs: `../reverse-lab`;
- chronological record of the experiments: `../reverse-lab/FINDINGS.md`;
- proxy log, effect session (baseline `4A`):
  `../reverse-lab/runtime/sonix-proxy.log`, lines 11745–11767;
- proxy log, per-key custom session (`4D`):
  `../reverse-lab/runtime/sonix-proxy.log`, lines 63181–63352 (close at line
  63352);
- Gate 4D reports: `../reverse-lab/reports/2026-07-20-keymap-gate4d-*.md`;
- Gate 5 repetition report, approved in senior review:
  `../reverse-lab/reports/2026-07-20-keymap-gate5-repetition-senior-review.md`.
- 4A runner message fix (Gate 4E, senior review): the executor was updated to
  print "entire keyboard red (Static effect transaction, commit 04; custom frames
  not displayed - mechanism not isolated)" instead of the obsolete expectation
  "expected: W/A/S/D red". Ref:
  `2026-07-20-runner4a-message-codefix-senior-review.md`.
