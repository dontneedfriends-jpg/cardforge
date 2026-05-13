use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionState {
    pub active_deck_id: String,
    pub editor_mode: String,
    pub active_tab: String,
    pub sidebar_tab: String,
    pub preview_card_index: i32,
    pub clean_shutdown: bool,
    pub last_active_timestamp: String,
}

#[tauri::command]
pub async fn read_session(project_path: String) -> Result<SessionState, String> {
    let path = Path::new(&project_path).join("cardforge.session.json");
    if !path.exists() {
        return Ok(SessionState {
            active_deck_id: String::new(),
            editor_mode: "code".to_string(),
            active_tab: "html".to_string(),
            sidebar_tab: "decks".to_string(),
            preview_card_index: 0,
            clean_shutdown: true,
            last_active_timestamp: String::new(),
        });
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read session: {}", e))?;
    let session: SessionState = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse session: {}", e))?;
    Ok(session)
}

#[tauri::command]
pub async fn write_session(project_path: String, session: SessionState) -> Result<(), String> {
    let path = Path::new(&project_path).join("cardforge.session.json");
    let content = serde_json::to_string_pretty(&session)
        .map_err(|e| format!("Failed to serialize session: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write session: {}", e))?;
    Ok(())
}
