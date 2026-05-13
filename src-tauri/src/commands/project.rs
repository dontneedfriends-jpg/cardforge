use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardForgeManifest {
    pub version: String,
    pub name: String,
    #[serde(default)]
    pub decks: Vec<DeckMeta>,
    #[serde(default)]
    pub boards: Vec<BoardMeta>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoardMeta {
    pub id: String,
    pub name: String,
    pub path: String,
    pub width_mm: f64,
    pub height_mm: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeckMeta {
    pub id: String,
    pub name: String,
    pub path: String,
    pub card_size: CardSize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardSize {
    pub width_mm: f64,
    pub height_mm: f64,
    pub bleed_mm: f64,
}

#[tauri::command]
pub async fn open_project(path: String) -> Result<CardForgeManifest, String> {
    let manifest_path = Path::new(&path).join("cardforge.json");
    let content = fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read cardforge.json: {}", e))?;
    let manifest: CardForgeManifest = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse cardforge.json: {}", e))?;
    Ok(manifest)
}

#[tauri::command]
pub async fn create_project(path: String, name: String) -> Result<CardForgeManifest, String> {
    let project_path = Path::new(&path);
    fs::create_dir_all(project_path.join("decks")).map_err(|e| format!("Failed to create project: {}", e))?;
    fs::create_dir_all(project_path.join("boards")).map_err(|e| format!("Failed to create project: {}", e))?;
    fs::create_dir_all(project_path.join("assets")).map_err(|e| format!("Failed to create assets: {}", e))?;

    let manifest = CardForgeManifest {
        version: "1".to_string(),
        name,
        decks: vec![],
        boards: vec![],
    };

    let manifest_path = project_path.join("cardforge.json");
    let content = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize manifest: {}", e))?;
    fs::write(&manifest_path, content).map_err(|e| format!("Failed to write manifest: {}", e))?;

    Ok(manifest)
}

#[tauri::command]
pub async fn save_manifest(path: String, manifest: CardForgeManifest) -> Result<(), String> {
    let manifest_path = Path::new(&path).join("cardforge.json");
    let content = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize manifest: {}", e))?;
    fs::write(&manifest_path, content).map_err(|e| format!("Failed to write manifest: {}", e))?;
    Ok(())
}
