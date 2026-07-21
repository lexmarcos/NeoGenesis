use std::{
    ffi::{c_void, CStr, CString},
    sync::{Mutex, Once},
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use hidapi::HidApi;
use serde::Serialize;

use crate::protocol::{
    build_custom_transaction, build_lighting_reports_with_settings, CustomKeyColor, LightingConfig,
    REPORT_SIZE,
};

const VENDOR_ID: u16 = 0x0951;
const PRODUCT_ID: u16 = 0x16c6;
// Captured Genesis timing: commands followed by a response need about 30 ms,
// while consecutive profile reports are spaced by only 5 ms. The firmware
// treats those reports as one bounded profile-write transaction.
const RESPONSE_DELAY: Duration = Duration::from_millis(30);
const PROFILE_REPORT_DELAY: Duration = Duration::from_millis(5);
const KEEPALIVE_INTERVAL: Duration = Duration::from_millis(1_600);

static DEVICE_IO: Mutex<()> = Mutex::new(());
static START_KEEPALIVE: Once = Once::new();

const FILE_SHARE_READ: u32 = 0x0000_0001;
const FILE_SHARE_WRITE: u32 = 0x0000_0002;
const GENERIC_READ: u32 = 0x8000_0000;
const GENERIC_WRITE: u32 = 0x4000_0000;
const OPEN_EXISTING: u32 = 3;
const INVALID_HANDLE_VALUE: isize = -1;

#[link(name = "kernel32")]
extern "system" {
    fn CreateFileA(
        filename: *const u8,
        desired_access: u32,
        share_mode: u32,
        security_attributes: *const c_void,
        creation_disposition: u32,
        flags_and_attributes: u32,
        template_file: isize,
    ) -> isize;
    fn CloseHandle(handle: isize) -> i32;
}

#[link(name = "hid")]
extern "system" {
    fn HidD_SetFeature(device: isize, report_buffer: *mut c_void, report_size: u32) -> u8;
    fn HidD_GetFeature(device: isize, report_buffer: *mut c_void, report_size: u32) -> u8;
}

struct FeatureHandle(isize);

impl FeatureHandle {
    fn open(path: &CStr) -> Result<Self, String> {
        // Reproduce SonixHidDll exactly: try read/write first, then fall back to
        // desired_access=0 for protected keyboard collections.
        let mut handle = unsafe {
            CreateFileA(
                path.as_ptr().cast(),
                GENERIC_READ | GENERIC_WRITE,
                FILE_SHARE_READ | FILE_SHARE_WRITE,
                std::ptr::null(),
                OPEN_EXISTING,
                0,
                0,
            )
        };
        if handle == INVALID_HANDLE_VALUE {
            handle = unsafe {
                CreateFileA(
                    path.as_ptr().cast(),
                    0,
                    FILE_SHARE_READ | FILE_SHARE_WRITE,
                    std::ptr::null(),
                    OPEN_EXISTING,
                    0,
                    0,
                )
            };
        }
        if handle == INVALID_HANDLE_VALUE {
            Err(std::io::Error::last_os_error().to_string())
        } else {
            Ok(Self(handle))
        }
    }
}

impl Drop for FeatureHandle {
    fn drop(&mut self) {
        unsafe { CloseHandle(self.0) };
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStatus {
    pub connected: bool,
    pub name: String,
    pub vendor_id: u16,
    pub product_id: u16,
    pub firmware: Option<String>,
    pub usage_page: Option<u16>,
    pub interface_number: Option<i32>,
    pub error: Option<String>,
}

impl DeviceStatus {
    fn disconnected(error: impl Into<String>) -> Self {
        Self {
            connected: false,
            name: "HyperX Mars Gaming Keyboard".into(),
            vendor_id: VENDOR_ID,
            product_id: PRODUCT_ID,
            firmware: None,
            usage_page: None,
            interface_number: None,
            error: Some(error.into()),
        }
    }
}

fn candidate_paths(api: &HidApi) -> Vec<(CString, u16, i32, String)> {
    let mut candidates: Vec<_> = api
        .device_list()
        .filter(|info| info.vendor_id() == VENDOR_ID && info.product_id() == PRODUCT_ID)
        .map(|info| {
            (
                info.path().to_owned(),
                info.usage_page(),
                info.interface_number(),
                info.product_string()
                    .unwrap_or("HyperX Mars Gaming Keyboard")
                    .to_string(),
            )
        })
        .collect();

    // Genesis selects MI_00 (usage page 1, interface 0). Vendor collections
    // reject these 65-byte feature reports even though their names look closer.
    candidates.sort_by_key(|(_, usage, interface, _)| u8::from(!(*usage == 1 && *interface == 0)));
    candidates
}

fn select_protocol_path(api: &HidApi) -> Result<(CString, u16, i32, String), String> {
    candidate_paths(api)
        .into_iter()
        .find(|(_, usage, interface, _)| *usage == 1 && *interface == 0)
        .ok_or_else(|| "coleção HID MI_00 do HyperX Mars 0951:16C6 não encontrada".into())
}

fn send_payload(path: &CStr, payload: &[u8; REPORT_SIZE]) -> Result<(), String> {
    let mut framed = [0u8; REPORT_SIZE + 1];
    framed[1..].copy_from_slice(payload);
    let device = FeatureHandle::open(path)?;
    let sent =
        unsafe { HidD_SetFeature(device.0, framed.as_mut_ptr().cast(), framed.len() as u32) };
    if sent == 0 {
        return Err(std::io::Error::last_os_error().to_string());
    }
    drop(device);
    Ok(())
}

fn receive_payload(path: &CStr) -> Result<Vec<u8>, String> {
    let mut framed = [0u8; REPORT_SIZE + 1];
    let device = FeatureHandle::open(path)?;
    let received =
        unsafe { HidD_GetFeature(device.0, framed.as_mut_ptr().cast(), framed.len() as u32) };
    if received == 0 {
        return Err("o teclado não respondeu ao relatório HID".into());
    }
    Ok(framed[1..].to_vec())
}

fn transact(path: &CStr, payload: &[u8; REPORT_SIZE]) -> Result<Vec<u8>, String> {
    send_payload(path, payload)?;
    thread::sleep(RESPONSE_DELAY);
    receive_payload(path)
}

fn confirmed(response: &[u8], command: u8) -> bool {
    response
        .windows(4)
        .any(|bytes| bytes == [0x04, command, 0x00, 0x01])
}

fn transact_confirmed(
    path: &CStr,
    payload: &[u8; REPORT_SIZE],
    command: u8,
) -> Result<Vec<u8>, String> {
    let mut last = Vec::new();
    for _ in 0..3 {
        last = transact(path, payload)?;
        if confirmed(&last, command) {
            return Ok(last);
        }
    }
    Err(format!(
        "o teclado não confirmou 04 {command:02X}: {last:02X?}"
    ))
}

fn query(command: u8) -> [u8; REPORT_SIZE] {
    let mut report = [0u8; REPORT_SIZE];
    report[0] = 0x04;
    report[1] = command;
    if command == 0x05 {
        report[8] = 0x02;
    }
    report
}

fn pseudo_random_report() -> [u8; REPORT_SIZE] {
    let mut state = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos() as u64)
        .unwrap_or(0x95_16_c6_ab);
    let mut report = [0u8; REPORT_SIZE];
    for byte in &mut report {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        *byte = (state >> 24) as u8;
    }
    report
}

fn unlock_writes(path: &CStr) -> Result<(), String> {
    transact_confirmed(path, &query(0xab), 0xab)
        .map_err(|error| format!("handshake 04 AB: {error}"))?;
    send_payload(path, &pseudo_random_report())
        .map_err(|error| format!("resposta aleatória AB: {error}"))?;
    transact_confirmed(path, &query(0x02), 0x02)
        .map_err(|error| format!("o teclado recusou a sessão de gravação: {error}"))?;
    Ok(())
}

pub fn status() -> DeviceStatus {
    let api = match HidApi::new() {
        Ok(api) => api,
        Err(error) => return DeviceStatus::disconnected(error.to_string()),
    };
    match select_protocol_path(&api) {
        Ok((_path, usage, interface, name)) => DeviceStatus {
            connected: true,
            name,
            vendor_id: VENDOR_ID,
            product_id: PRODUCT_ID,
            firmware: Some("1.0".into()),
            usage_page: Some(usage),
            interface_number: Some(interface),
            error: None,
        },
        Err(error) => DeviceStatus::disconnected(error),
    }
}

pub fn start_keepalive() {
    START_KEEPALIVE.call_once(|| {
        thread::Builder::new()
            .name("mars-hid-keepalive".into())
            .spawn(|| loop {
                thread::sleep(KEEPALIVE_INTERVAL);

                // Never interleave a probe with a profile transaction. Missing
                // one tick is harmless; corrupting a flash write is not.
                let Ok(_guard) = DEVICE_IO.try_lock() else {
                    continue;
                };
                let Ok(api) = HidApi::new() else { continue };
                let Ok((path, _, _, _)) = select_protocol_path(&api) else {
                    continue;
                };
                let _ = transact_confirmed(&path, &query(0xe0), 0xe0);
            })
            .expect("falha ao iniciar o keepalive HID do Mars");
    });
}

pub fn apply_with_settings(
    active: &LightingConfig,
    settings: &[LightingConfig],
) -> Result<(), String> {
    let _guard = DEVICE_IO
        .lock()
        .map_err(|_| "controle HID do Mars ficou indisponÃ­vel".to_string())?;
    let api = HidApi::new().map_err(|error| error.to_string())?;
    let (path, _, _, _) = select_protocol_path(&api)?;
    unlock_writes(&path)?;
    for (index, report) in build_lighting_reports_with_settings(active, settings)
        .into_iter()
        .enumerate()
    {
        if index == 0 {
            let response = transact_confirmed(&path, &report, 0x0a)
                .map_err(|error| format!("cabeçalho do perfil 04 0A: {error}"))?;
            debug_assert!(confirmed(&response, 0x0a));
        } else {
            send_payload(&path, &report).map_err(|error| {
                format!("relatório de perfil {index} (0x{:02X}): {error}", report[0])
            })?;
            thread::sleep(PROFILE_REPORT_DELAY);
        }
    }
    let status = transact_confirmed(&path, &query(0x02), 0x02)
        .map_err(|error| format!("confirmação final 04 02: {error}"))?;
    debug_assert!(confirmed(&status, 0x02));
    Ok(())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CustomStepAction {
    Send,
    Transact { expected_command: u8 },
}

// The 20-step E1 custom transaction plan, indexed by payload position.
// Classification is by step index, never by payload content: effect_04
// also starts with 0x04 and must be sent, not transacted.
fn custom_step_action(index: usize) -> CustomStepAction {
    match index {
        0 => CustomStepAction::Transact {
            expected_command: 0xAB,
        },
        2 | 19 => CustomStepAction::Transact {
            expected_command: 0x02,
        },
        3 => CustomStepAction::Transact {
            expected_command: 0x0A,
        },
        _ => CustomStepAction::Send,
    }
}

// Single write/read per query, matching the validated custom-profile exchange.
// runner: no retry, and the response must start with 04 XX 00 01. The retrying
// transact_confirmed remains in the preexisting non-Custom paths, including
// effects, unlock, and keepalive.
fn transact_once_expecting(
    path: &CStr,
    payload: &[u8; REPORT_SIZE],
    command: u8,
) -> Result<Vec<u8>, String> {
    let response = transact(path, payload)?;
    let expected = [0x04, command, 0x00, 0x01];
    if response.len() < 4 || response[..4] != expected {
        return Err(format!(
            "o teclado não confirmou 04 {command:02X} 00 01: {:02X?}",
            &response[..response.len().min(4)]
        ));
    }
    Ok(response)
}

pub fn apply_custom(keys: &[CustomKeyColor]) -> Result<(), String> {
    // Validation happens before any HID access: an invalid key list returns
    // Err here without opening a device handle or taking the IO lock.
    let payloads = build_custom_transaction(keys).map_err(|error| error.to_string())?;
    debug_assert_eq!(payloads.len(), 20);

    let _guard = DEVICE_IO
        .lock()
        .map_err(|_| "controle HID do Mars ficou indisponível".to_string())?;
    let api = HidApi::new().map_err(|error| error.to_string())?;
    let (path, _, _, _) = select_protocol_path(&api)?;

    for (index, payload) in payloads.iter().enumerate() {
        match custom_step_action(index) {
            CustomStepAction::Transact { expected_command } => {
                transact_once_expecting(&path, payload, expected_command).map_err(|error| {
                    format!("etapa {index} (consulta 04 {expected_command:02X}): {error}")
                })?;
            }
            CustomStepAction::Send => {
                send_payload(&path, payload).map_err(|error| {
                    format!("payload custom {index} (0x{:02X}): {error}", payload[0])
                })?;
                thread::sleep(PROFILE_REPORT_DELAY);
            }
        }
    }
    Ok(())
}
