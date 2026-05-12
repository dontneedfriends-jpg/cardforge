#[tauri::command]
pub fn start_drag(window: tauri::Window) {
    let _ = window.start_dragging();
}
