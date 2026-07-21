use serde::{Deserialize, Serialize};

pub const REPORT_SIZE: usize = 64;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Effect {
    Wave,
    Stack,
    Static,
    Heartbeat,
    Spectrum,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Direction {
    Up,
    Left,
    Right,
    Down,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LightingConfig {
    pub effect: Effect,
    pub colors: Vec<String>,
    pub brightness: u8,
    pub speed: u8,
    pub direction: Direction,
    pub loop_mode: bool,
}

fn color(value: Option<&String>, fallback: [u8; 3]) -> [u8; 3] {
    let Some(value) = value else { return fallback };
    let value = value.trim_start_matches('#');
    if value.len() != 6 {
        return fallback;
    }
    let parsed = u32::from_str_radix(value, 16).ok();
    parsed
        .map(|rgb| {
            [
                ((rgb >> 16) & 0xff) as u8,
                ((rgb >> 8) & 0xff) as u8,
                (rgb & 0xff) as u8,
            ]
        })
        .unwrap_or(fallback)
}

fn palette(config: &LightingConfig) -> [[u8; 3]; 5] {
    let defaults = [
        [0xff, 0x00, 0x00],
        [0xff, 0x00, 0xff],
        [0x00, 0xff, 0x00],
        [0xff, 0xff, 0x00],
        [0x00, 0x00, 0xff],
    ];
    std::array::from_fn(|index| color(config.colors.get(index), defaults[index]))
}

fn clamp_setting(value: u8) -> u8 {
    value.clamp(1, 5)
}

fn put_palette(report: &mut [u8; REPORT_SIZE], colors: &[[u8; 3]; 5]) {
    for (index, rgb) in colors.iter().enumerate() {
        report[1 + index * 3..4 + index * 3].copy_from_slice(rgb);
    }
}

fn gradient_palette(start: [u8; 3], end: [u8; 3]) -> [[u8; 3]; 5] {
    std::array::from_fn(|step| {
        std::array::from_fn(|channel| {
            let start_weight = 4 - step as u16;
            let end_weight = step as u16;
            ((start[channel] as u16 * start_weight + end[channel] as u16 * end_weight) / 4) as u8
        })
    })
}

#[cfg(test)]
pub fn build_lighting_reports(config: &LightingConfig) -> Vec<[u8; REPORT_SIZE]> {
    build_lighting_reports_with_settings(config, std::slice::from_ref(config))
}

fn setting_for<'a>(
    effect: Effect,
    active: &'a LightingConfig,
    settings: &'a [LightingConfig],
) -> &'a LightingConfig {
    settings
        .iter()
        .find(|config| config.effect == effect)
        .unwrap_or(active)
}

fn direction_code(direction: Direction) -> u8 {
    match direction {
        Direction::Up => 0,
        Direction::Left => 1,
        Direction::Right => 2,
        Direction::Down => 3,
    }
}

pub fn build_lighting_reports_with_settings(
    active: &LightingConfig,
    settings: &[LightingConfig],
) -> Vec<[u8; REPORT_SIZE]> {
    let heartbeat_config = setting_for(Effect::Heartbeat, active, settings);
    let heartbeat_colors = palette(heartbeat_config);

    let mut breathing = [0u8; REPORT_SIZE];
    breathing[0] = 0x01;
    // The Mars breathing engine expects all five palette positions when color
    // cycling is enabled. Genesis always sends five distinct colors; expanding
    // the two user-selected endpoints into a five-step gradient preserves that
    // firmware contract while keeping the UI intentionally simple.
    let breathing_colors = gradient_palette(heartbeat_colors[0], heartbeat_colors[1]);
    put_palette(&mut breathing, &breathing_colors);
    breathing[59] = 0;
    breathing[60] = u8::from(heartbeat_config.loop_mode);
    breathing[62] = clamp_setting(heartbeat_config.brightness);
    breathing[63] = clamp_setting(heartbeat_config.speed);

    let spectrum_config = setting_for(Effect::Spectrum, active, settings);
    let mut spectrum = [0u8; REPORT_SIZE];
    spectrum[0] = 0x03;
    spectrum[62] = clamp_setting(spectrum_config.brightness);
    spectrum[63] = clamp_setting(spectrum_config.speed);

    let static_config = setting_for(Effect::Static, active, settings);
    let static_colors = palette(static_config);
    let mut solid = [0u8; REPORT_SIZE];
    solid[0] = 0x04;
    solid[1..4].copy_from_slice(&static_colors[0]);
    solid[62] = clamp_setting(static_config.brightness);

    let wave_config = setting_for(Effect::Wave, active, settings);
    let mut wave = [0u8; REPORT_SIZE];
    wave[0] = 0x05;
    wave[61] = direction_code(wave_config.direction);
    wave[62] = clamp_setting(wave_config.brightness);
    wave[63] = clamp_setting(wave_config.speed);

    let stack_config = setting_for(Effect::Stack, active, settings);
    let stack_colors = palette(stack_config);
    let mut stack = [0u8; REPORT_SIZE];
    stack[0] = 0x08;
    put_palette(&mut stack, &stack_colors);
    stack[59] = 0;
    stack[60] = direction_code(stack_config.direction);
    stack[61] = u8::from(stack_config.loop_mode);
    stack[62] = clamp_setting(stack_config.brightness);
    stack[63] = clamp_setting(stack_config.speed);

    let mut commit = [0u8; REPORT_SIZE];
    commit[0] = match active.effect {
        Effect::Wave => 0x05,
        Effect::Stack => 0x08,
        Effect::Static => 0x04,
        Effect::Heartbeat => 0x01,
        Effect::Spectrum => 0x03,
    };
    commit[1] = 0x05;
    commit[62] = 0xaa;
    commit[63] = 0x55;

    let mut header = [0u8; REPORT_SIZE];
    header[0] = 0x04;
    header[1] = 0x0a;
    header[8] = 0x0f;

    let mut reports = vec![header, breathing, spectrum, solid, wave, stack];
    reports.extend_from_slice(&DEFAULT_CUSTOM_LIGHT_REPORTS);
    reports.push(commit);
    reports
}

// ================================================================
// Custom per-key profile builder
// ================================================================

/// 119 valid key indices from LightingUI.xml KeyDecoratorLightWnd:
/// 104 keys (rows 0-6) + 15 LED-bar segments (row 7, cols 3-17).
pub const VALID_KEY_INDICES: [usize; 119] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
    32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
    86, 87, 88, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 112, 113,
    115, 116, 117, 118, 119, 120, 121, 122, 123, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138,
    139, 140, 141, 142, 143,
];

/// Template prefix bytes for the keyboard's custom lighting frames.
/// Preserved opaquely; each entry occupies 4 bytes in the custom frames.
const CUSTOM_PREFIXES: [u8; 144] = [
    // frame 0 (custom_0): all 0x80
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    // frame 1 (custom_1): all 0x80
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    // frame 2 (custom_2): all 0x80
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    // frame 3 (custom_3): all 0x80
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    // frame 4 (custom_4): all 0x80
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    // frame 5 (custom_5): 6x80, 3x00, 7x80
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x00, 0x00, 0x00, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    // frame 6 (custom_6): all 0x80
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    // frame 7 (custom_7): all 0x80
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    // frame 8 (custom_8): 1x80, 11x00, 3x80, 1x00
    0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x80, 0x80, 0x00,
];

/// Validated custom-profile session block (starts C7 59 65 6C).
const E1_SESSION_BLOCK: [u8; 64] = [
    0xC7, 0x59, 0x65, 0x6C, 0x84, 0xA7, 0x2B, 0x46, 0xB3, 0x1F, 0xF2, 0xA3, 0xBF, 0xD2, 0x95, 0xCA,
    0x63, 0xDC, 0xCE, 0x53, 0x63, 0x47, 0x94, 0x32, 0x7A, 0x2C, 0xA7, 0xF1, 0x93, 0x1B, 0x69, 0x3D,
    0x3C, 0xBD, 0xEF, 0xA4, 0x57, 0xB8, 0x58, 0x9D, 0x12, 0xD3, 0x5D, 0xC9, 0x1A, 0x5B, 0x2A, 0x78,
    0x0C, 0xC5, 0x6C, 0x6F, 0x2D, 0x94, 0xAC, 0xE9, 0x5A, 0x7E, 0xDB, 0xDB, 0x42, 0xCA, 0x2E, 0x7C,
];

/// Validated custom-profile effect payload.
/// Starts 01 FF 00 00 00 5A FF 00, ends 01 00 05 05.
const E1_EFFECT_01: [u8; 64] = [
    0x01, 0xFF, 0x00, 0x00, 0x00, 0x5A, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0xFF,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x05, 0x05,
];

/// Effect template: Spectrum, no loop.
const CAPTURED_EFFECT_03: [u8; 64] = [
    0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x03,
];

/// Effect template: Static.
const CAPTURED_EFFECT_04: [u8; 64] = [
    0x04, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x00,
];

/// Effect template: Wave.
const CAPTURED_EFFECT_05: [u8; 64] = [
    0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x03,
];

/// Effect template: Stack.
const CAPTURED_EFFECT_08: [u8; 64] = [
    0x08, 0xFF, 0x00, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0xFF,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x05, 0x03,
];

/// E1 commit: custom/per-key mode (byte 0 = 0x80), byte 1 = 0x05,
/// bytes 62-63 = 0xAA 0x55.
const E1_COMMIT: [u8; 64] = [
    0x80, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xAA, 0x55,
];

/// Error returned by `build_custom_transaction` on validation failure.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CustomBuildError {
    RowOutOfRange(u8),
    ColOutOfRange(u8),
    UnmappedPosition { row: u8, col: u8, key_index: usize },
    DuplicatePosition { row: u8, col: u8, key_index: usize },
}

impl std::fmt::Display for CustomBuildError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::RowOutOfRange(r) => write!(f, "row {r} out of range 0..=7"),
            Self::ColOutOfRange(c) => write!(f, "col {c} out of range 0..=17"),
            Self::UnmappedPosition {
                row,
                col,
                key_index,
            } => {
                write!(f, "position (row={row}, col={col}, key_index={key_index}) is not in the 119-key keymap")
            }
            Self::DuplicatePosition {
                row,
                col,
                key_index,
            } => {
                write!(
                    f,
                    "duplicate key_index {key_index} at (row={row}, col={col})"
                )
            }
        }
    }
}

/// Per-key color assignment for the custom profile builder.
///
/// - `row`: 0..=7
/// - `col`: 0..=17
/// - `rgb`: [R, G, B] each 0..=255
///
/// Only the 119 positions confirmed by `LightingUI.xml` KeyDecoratorLightWnd
/// are accepted (104 keys rows 0-6 + 15 LED-bar segments row 7 cols 3-17).
#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomKeyColor {
    pub row: u8,
    pub col: u8,
    pub rgb: [u8; 3],
}

/// Build the full 20-payload custom-mode transaction using the validated E1 recipe.
///
/// # Transaction layout
///
/// - `session_block`: validated session block (`C7 59 65 6C...`)
/// - `effect_01`: validated custom effect (`01 FF 00 00 00 5A FF 00...01 00 05 05`)
/// - `commit[0]` = `0x80`, commit[1] = `0x05`, commit[62..] = `AA 55`
/// - Custom frames: preserve only opaque prefixes from template; zero all RGB;
///   then apply only requested colors.
/// - Never uses `pseudo_random_report()`.
///
/// # Validation
///
/// Each `CustomKeyColor` must have:
/// - row in 0..=7
/// - col in 0..=17
/// - key_index = row * 18 + col in the 119-positions keymap
/// - no duplicate key_index
///
/// # Returns
///
/// 20 payloads in transaction order (04_AB, session_block, 04_02_open, 04_0A,
/// effect_01..effect_08, custom_0..custom_8, commit, 04_02_close).
pub fn build_custom_transaction(
    keys: &[CustomKeyColor],
) -> Result<Vec<[u8; REPORT_SIZE]>, CustomBuildError> {
    // ---- validation pass ----
    let mut seen = [false; 144];
    for kc in keys {
        if kc.row > 7 {
            return Err(CustomBuildError::RowOutOfRange(kc.row));
        }
        if kc.col > 17 {
            return Err(CustomBuildError::ColOutOfRange(kc.col));
        }
        let ki = kc.row as usize * 18 + kc.col as usize;
        if !VALID_KEY_INDICES.contains(&ki) {
            return Err(CustomBuildError::UnmappedPosition {
                row: kc.row,
                col: kc.col,
                key_index: ki,
            });
        }
        if seen[ki] {
            return Err(CustomBuildError::DuplicatePosition {
                row: kc.row,
                col: kc.col,
                key_index: ki,
            });
        }
        seen[ki] = true;
    }

    let mut payloads: Vec<[u8; 64]> = Vec::with_capacity(20);

    // 0: 04_AB
    let mut p = [0u8; 64];
    p[0] = 0x04;
    p[1] = 0xAB;
    payloads.push(p);

    // 1: session_block
    payloads.push(E1_SESSION_BLOCK);

    // 2: 04_02_open
    let mut p = [0u8; 64];
    p[0] = 0x04;
    p[1] = 0x02;
    payloads.push(p);

    // 3: 04_0A header
    let mut p = [0u8; 64];
    p[0] = 0x04;
    p[1] = 0x0A;
    p[8] = 0x0F;
    payloads.push(p);

    // 4-8: effect payloads
    payloads.push(E1_EFFECT_01);
    payloads.push(CAPTURED_EFFECT_03);
    payloads.push(CAPTURED_EFFECT_04);
    payloads.push(CAPTURED_EFFECT_05);
    payloads.push(CAPTURED_EFFECT_08);

    // 9-17: custom frames (9 frames, 16 entries, 4 bytes per entry)
    for frame in 0..9 {
        let mut custom = [0u8; 64];
        for entry in 0..16 {
            let offset = entry * 4;
            let prefix_idx = frame * 16 + entry;
            custom[offset] = CUSTOM_PREFIXES[prefix_idx];
        }
        payloads.push(custom);
    }

    // Apply colors to custom frames
    for kc in keys {
        let ki = kc.row as usize * 18 + kc.col as usize;
        let frame = ki / 16;
        let pos = ki % 16;
        let off = pos * 4;
        let custom_idx = 9 + frame;
        payloads[custom_idx][off + 1] = kc.rgb[0];
        payloads[custom_idx][off + 2] = kc.rgb[1];
        payloads[custom_idx][off + 3] = kc.rgb[2];
    }

    // 18: commit
    payloads.push(E1_COMMIT);

    // 19: 04_02_close
    let mut p = [0u8; 64];
    p[0] = 0x04;
    p[1] = 0x02;
    payloads.push(p);

    Ok(payloads)
}

// Nine groups of 16 custom-lighting entries. Cada entrada usa
// [prefixo_opaco, R, G, B]. Os prefixos 0x80/0x00 sao preservados
// da captura e nao indicam validade da posicao.
const DEFAULT_CUSTOM_LIGHT_REPORTS: [[u8; REPORT_SIZE]; 9] = [
    repeated_keymap(),
    repeated_keymap(),
    [
        0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0,
        0x80, 0, 0, 0, 0x80, 0xff, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0,
        0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0,
    ],
    [
        0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0,
        0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0xff, 0, 0, 0x80, 0xff, 0, 0, 0x80, 0xff, 0, 0, 0x80,
        0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0,
    ],
    repeated_keymap(),
    [
        0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0,
        0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0,
    ],
    repeated_keymap(),
    repeated_keymap(),
    [
        0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0,
        0x80, 0, 0, 0, 0, 0, 0, 0,
    ],
];

const fn repeated_keymap() -> [u8; REPORT_SIZE] {
    let mut report = [0u8; REPORT_SIZE];
    let mut index = 0;
    while index < REPORT_SIZE {
        report[index] = 0x80;
        index += 4;
    }
    report
}

#[cfg(test)]
mod tests {
    use super::*;

    fn config(effect: Effect) -> LightingConfig {
        LightingConfig {
            effect,
            colors: vec!["#112233".into()],
            brightness: 5,
            speed: 3,
            direction: Direction::Right,
            loop_mode: true,
        }
    }

    #[test]
    fn static_packet_matches_capture_layout() {
        let reports = build_lighting_reports(&config(Effect::Static));
        assert_eq!(reports.len(), 16);
        assert_eq!(reports[0][8], 0x0f);
        assert_eq!(&reports[3][..4], &[0x04, 0x11, 0x22, 0x33]);
        assert_eq!(reports[3][62], 5);
        assert_eq!(&reports.last().unwrap()[..2], &[0x04, 0x05]);
        assert_eq!(&reports.last().unwrap()[62..], &[0xaa, 0x55]);
    }

    #[test]
    fn effect_commit_codes_match_genesis() {
        let cases = [
            (Effect::Wave, 0x05),
            (Effect::Stack, 0x08),
            (Effect::Static, 0x04),
            (Effect::Heartbeat, 0x01),
            (Effect::Spectrum, 0x03),
        ];
        for (effect, expected) in cases {
            assert_eq!(
                build_lighting_reports(&config(effect)).last().unwrap()[0],
                expected
            );
        }
    }

    #[test]
    fn heartbeat_expands_two_colors_into_the_five_firmware_slots() {
        let mut heartbeat = config(Effect::Heartbeat);
        heartbeat.colors = vec!["#112233".into(), "#aabbcc".into()];
        let reports = build_lighting_reports(&heartbeat);
        assert_eq!(
            &reports[1][..16],
            &[
                0x01, 0x11, 0x22, 0x33, 0x37, 0x48, 0x59, 0x5d, 0x6e, 0x7f, 0x83, 0x94, 0xa5, 0xaa,
                0xbb, 0xcc,
            ]
        );
        assert_eq!(reports[1][60], 1);
        assert_eq!(reports[1][61], 0);
        assert_eq!(&reports.last().unwrap()[..2], &[0x01, 0x05]);
    }

    #[test]
    fn every_effect_keeps_its_own_palette_and_settings() {
        let mut heartbeat = config(Effect::Heartbeat);
        heartbeat.colors = vec!["#ff1020".into(), "#ff8800".into()];
        heartbeat.speed = 5;

        let mut solid = config(Effect::Static);
        solid.colors = vec!["#00ffaa".into()];
        solid.brightness = 2;

        let mut stack = config(Effect::Stack);
        stack.colors = vec!["#0011ff".into(), "#00ff44".into()];
        stack.direction = Direction::Down;

        let settings = vec![heartbeat.clone(), solid, stack];
        let reports = build_lighting_reports_with_settings(&heartbeat, &settings);

        assert_eq!(
            &reports[1][1..10],
            &[0xff, 0x10, 0x20, 0xff, 0x2e, 0x18, 0xff, 0x4c, 0x10]
        );
        assert_eq!(&reports[3][1..4], &[0x00, 0xff, 0xaa]);
        assert_eq!(reports[3][62], 2);
        assert_eq!(&reports[5][1..7], &[0x00, 0x11, 0xff, 0x00, 0xff, 0x44]);
        assert_eq!(reports[5][60], 3);
    }
}
