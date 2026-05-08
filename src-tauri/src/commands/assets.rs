use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetInfo {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
}

#[tauri::command]
pub async fn list_assets(project_path: String) -> Result<Vec<AssetInfo>, String> {
    let assets_dir = Path::new(&project_path).join("assets");
    if !assets_dir.exists() {
        return Ok(vec![]);
    }

    let mut assets = Vec::new();
    let entries = fs::read_dir(&assets_dir)
        .map_err(|e| format!("Failed to read assets directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.is_file() {
            let metadata = fs::metadata(&path)
                .map_err(|e| format!("Failed to read metadata: {}", e))?;
            assets.push(AssetInfo {
                name: entry.file_name().to_string_lossy().to_string(),
                path: path.to_string_lossy().to_string(),
                size_bytes: metadata.len(),
            });
        }
    }

    Ok(assets)
}

#[tauri::command]
pub async fn import_asset(project_path: String, source_path: String) -> Result<AssetInfo, String> {
    let source = Path::new(&source_path);
    let file_name = source.file_name()
        .ok_or_else(|| "Invalid source path".to_string())?
        .to_string_lossy()
        .to_string();

    let dest = Path::new(&project_path).join("assets").join(&file_name);
    fs::create_dir_all(dest.parent().unwrap())
        .map_err(|e| format!("Failed to create assets directory: {}", e))?;
    fs::copy(source, &dest)
        .map_err(|e| format!("Failed to copy asset: {}", e))?;

    let metadata = fs::metadata(&dest)
        .map_err(|e| format!("Failed to read metadata: {}", e))?;

    Ok(AssetInfo {
        name: file_name,
        path: dest.to_string_lossy().to_string(),
        size_bytes: metadata.len(),
    })
}

#[tauri::command]
pub async fn delete_asset(asset_path: String) -> Result<(), String> {
    fs::remove_file(&asset_path)
        .map_err(|e| format!("Failed to delete asset: {}", e))?;
    Ok(())
}
