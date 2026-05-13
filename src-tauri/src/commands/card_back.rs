use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardBackDesign {
    pub background_top: String,
    pub background_mid: String,
    pub background_bottom: String,
    pub gradient_angle: f64,
    pub border_color: String,
    pub border_width: f64,
    pub border_radius: f64,
    pub shadow_color: String,
    pub shadow_size: f64,
    pub symbol: String,
    pub symbol_set: String,
    pub symbol_size: f64,
    pub symbol_color: String,
    pub symbol2: String,
    pub symbol2_size: f64,
    pub symbol2_color: String,
    pub pattern: String,
    pub pattern_color: String,
    pub pattern_opacity: f64,
    pub texture_url: String,
    pub texture_opacity: f64,
}

impl Default for CardBackDesign {
    fn default() -> Self {
        Self {
            background_top: "#1a0a2e".to_string(),
            background_mid: "#1f1240".to_string(),
            background_bottom: "#2a1a4e".to_string(),
            gradient_angle: 135.0,
            border_color: "rgba(255,255,255,0.1)".to_string(),
            border_width: 2.0,
            border_radius: 8.0,
            shadow_color: "rgba(0,0,0,0.4)".to_string(),
            shadow_size: 12.0,
            symbol: "?".to_string(),
            symbol_set: "none".to_string(),
            symbol_size: 36.0,
            symbol_color: "rgba(255,255,255,0.6)".to_string(),
            symbol2: String::new(),
            symbol2_size: 18.0,
            symbol2_color: "rgba(255,255,255,0.3)".to_string(),
            pattern: "stripes".to_string(),
            pattern_color: "rgba(255,255,255,0.02)".to_string(),
            pattern_opacity: 1.0,
            texture_url: String::new(),
            texture_opacity: 0.3,
        }
    }
}

#[tauri::command]
pub async fn read_card_back(deck_path: String) -> Result<CardBackDesign, String> {
    let path = Path::new(&deck_path).join("card_back.json");
    if !path.exists() {
        return Ok(CardBackDesign::default());
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read card_back.json: {}", e))?;
    let design: CardBackDesign = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse card_back.json: {}", e))?;
    Ok(design)
}

#[tauri::command]
pub async fn write_card_back(deck_path: String, design: CardBackDesign) -> Result<(), String> {
    let path = Path::new(&deck_path).join("card_back.json");
    let content = serde_json::to_string_pretty(&design)
        .map_err(|e| format!("Failed to serialize card back: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to write card_back.json: {}", e))?;
    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CardBackTemplateFiles {
    pub html: String,
    pub css: String,
}

#[tauri::command]
pub async fn read_card_back_template(deck_path: String) -> Result<CardBackTemplateFiles, String> {
    let base = Path::new(&deck_path);
    let html_path = base.join("cardback.html");
    let css_path = base.join("cardback.css");

    let html = if html_path.exists() {
        fs::read_to_string(&html_path).map_err(|e| format!("Failed to read cardback.html: {}", e))?
    } else {
        String::new()
    };

    let css = if css_path.exists() {
        fs::read_to_string(&css_path).map_err(|e| format!("Failed to read cardback.css: {}", e))?
    } else {
        String::new()
    };

    Ok(CardBackTemplateFiles { html, css })
}

#[tauri::command]
pub async fn write_card_back_template(deck_path: String, html: String, css: String) -> Result<(), String> {
    let base = Path::new(&deck_path);
    fs::create_dir_all(base).map_err(|e| format!("Failed to create deck directory: {}", e))?;
    fs::write(base.join("cardback.html"), &html)
        .map_err(|e| format!("Failed to write cardback.html: {}", e))?;
    fs::write(base.join("cardback.css"), &css)
        .map_err(|e| format!("Failed to write cardback.css: {}", e))?;
    Ok(())
}
