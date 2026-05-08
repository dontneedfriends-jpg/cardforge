use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateFiles {
    pub html: String,
    pub css: String,
}

#[tauri::command]
pub async fn read_template(deck_path: String) -> Result<TemplateFiles, String> {
    let base = Path::new(&deck_path);
    let html_path = base.join("template.html");
    let css_path = base.join("template.css");

    let html = if html_path.exists() {
        fs::read_to_string(&html_path).map_err(|e| format!("Failed to read template.html: {}", e))?
    } else {
        String::new()
    };

    let css = if css_path.exists() {
        fs::read_to_string(&css_path).map_err(|e| format!("Failed to read template.css: {}", e))?
    } else {
        String::new()
    };

    Ok(TemplateFiles { html, css })
}

#[tauri::command]
pub async fn write_template(deck_path: String, html: String, css: String) -> Result<(), String> {
    let base = Path::new(&deck_path);
    fs::create_dir_all(base).map_err(|e| format!("Failed to create deck directory: {}", e))?;

    fs::write(base.join("template.html"), &html)
        .map_err(|e| format!("Failed to write template.html: {}", e))?;
    fs::write(base.join("template.css"), &css)
        .map_err(|e| format!("Failed to write template.css: {}", e))?;

    Ok(())
}
