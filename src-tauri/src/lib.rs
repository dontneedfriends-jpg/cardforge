mod commands;

use commands::{project, csv_ops, template, assets, watcher, card_back};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            project::open_project,
            project::create_project,
            project::save_manifest,
            csv_ops::read_csv,
            csv_ops::write_csv,
            csv_ops::write_csv_content,
            template::read_template,
            template::write_template,
            assets::list_assets,
            assets::import_asset,
            assets::delete_asset,
            watcher::start_watch,
            watcher::stop_watch,
            card_back::read_card_back,
            card_back::write_card_back,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
