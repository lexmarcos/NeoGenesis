mod device;
mod protocol;
mod transport;

use protocol::{CustomKeyColor, LightingConfig};

#[tauri::command]
fn get_device_status() -> device::DeviceStatus {
    device::status()
}

#[tauri::command]
fn apply_lighting(
    config: LightingConfig,
    effect_configs: Vec<LightingConfig>,
) -> Result<(), String> {
    device::apply_with_settings(&config, &effect_configs)
}

#[tauri::command]
fn apply_custom_lighting(keys: Vec<CustomKeyColor>) -> Result<(), String> {
    device::apply_custom(&keys)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    device::start_keepalive();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_device_status,
            apply_lighting,
            apply_custom_lighting
        ])
        .run(tauri::generate_context!())
        .expect("erro ao executar o Neo Genesis");
}
