use std::ffi::CStr;

use hidapi::HidApi;

use crate::protocol::REPORT_SIZE;

#[cfg(windows)]
use std::{ffi::c_void, ffi::CString};

#[cfg(windows)]
const FILE_SHARE_READ: u32 = 0x0000_0001;
#[cfg(windows)]
const FILE_SHARE_WRITE: u32 = 0x0000_0002;
#[cfg(windows)]
const GENERIC_READ: u32 = 0x8000_0000;
#[cfg(windows)]
const GENERIC_WRITE: u32 = 0x4000_0000;
#[cfg(windows)]
const OPEN_EXISTING: u32 = 3;
#[cfg(windows)]
const INVALID_HANDLE_VALUE: isize = -1;

#[cfg(windows)]
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

#[cfg(windows)]
#[link(name = "hid")]
extern "system" {
    fn HidD_SetFeature(device: isize, report_buffer: *mut c_void, report_size: u32) -> u8;
    fn HidD_GetFeature(device: isize, report_buffer: *mut c_void, report_size: u32) -> u8;
}

#[cfg(windows)]
struct FeatureHandle(isize);

#[cfg(windows)]
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

#[cfg(windows)]
impl Drop for FeatureHandle {
    fn drop(&mut self) {
        unsafe { CloseHandle(self.0) };
    }
}

#[cfg(windows)]
pub struct Transport {
    path: CString,
}

#[cfg(windows)]
impl Transport {
    pub fn open(_api: &HidApi, path: &CStr) -> Result<Self, String> {
        Ok(Self {
            path: path.to_owned(),
        })
    }

    pub fn send(&self, payload: &[u8; REPORT_SIZE]) -> Result<(), String> {
        let path = self.path.as_c_str();
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

    pub fn receive(&self) -> Result<Vec<u8>, String> {
        let path = self.path.as_c_str();
        let mut framed = [0u8; REPORT_SIZE + 1];
        let device = FeatureHandle::open(path)?;
        let received =
            unsafe { HidD_GetFeature(device.0, framed.as_mut_ptr().cast(), framed.len() as u32) };
        if received == 0 {
            return Err("o teclado não respondeu ao relatório HID".into());
        }
        Ok(framed[1..].to_vec())
    }
}

#[cfg(target_os = "linux")]
pub struct Transport {
    device: hidapi::HidDevice,
}

#[cfg(target_os = "linux")]
impl Transport {
    pub fn open(api: &HidApi, path: &CStr) -> Result<Self, String> {
        api.open_path(path)
            .map(|device| Self { device })
            .map_err(|error| {
                let message = error.to_string();
                if message.contains("Permission denied") || message.contains("EACCES") {
                    "sem permissão para acessar o HyperX Mars via hidraw — instale a regra udev: sudo ./packaging/linux/install-udev-rules.sh, depois reconecte o teclado".into()
                } else {
                    message
                }
            })
    }

    pub fn send(&self, payload: &[u8; REPORT_SIZE]) -> Result<(), String> {
        let mut framed = [0u8; REPORT_SIZE + 1];
        framed[1..].copy_from_slice(payload);
        self.device
            .send_feature_report(&framed)
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn receive(&self) -> Result<Vec<u8>, String> {
        let mut framed = [0u8; REPORT_SIZE + 1];
        match self.device.get_feature_report(&mut framed) {
            Ok(0) => Err("o teclado não respondeu ao relatório HID".into()),
            Ok(_) => Ok(framed[1..].to_vec()),
            Err(error) => Err(format!("o teclado não respondeu ao relatório HID: {error}")),
        }
    }
}

#[cfg(not(any(windows, target_os = "linux")))]
compile_error!("Neo Genesis only implements the Mars HID transport on Windows and Linux");
