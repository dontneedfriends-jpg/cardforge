use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Deserialize)]
struct TtsSaveObject {
    #[serde(default)]
    object_states: Vec<TtsObjectState>,
}

#[derive(Deserialize)]
struct TtsObjectState {
    #[serde(default)]
    name: String,
    #[serde(default)]
    nickname: String,
    #[serde(default)]
    custom_deck: Option<serde_json::Value>,
    #[serde(default)]
    contained_objects: Vec<TtsCard>,
}

#[derive(Deserialize, Serialize)]
struct TtsCard {
    #[serde(default)]
    nickname: String,
    #[serde(default)]
    card_id: Option<u32>,
}

#[derive(Deserialize)]
struct TtsCustomDeck {
    #[serde(default)]
    face_url: String,
    #[serde(default)]
    back_url: String,
    #[serde(default)]
    num_width: u32,
    #[serde(default)]
    num_height: u32,
    #[serde(default)]
    #[allow(dead_code)]
    back_is_hidden: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedTtsInfo {
    pub deck_name: String,
    pub card_names: Vec<String>,
    pub num_width: u32,
    pub num_height: u32,
    pub card_count: usize,
    pub face_url: String,
    pub back_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportTtsResult {
    pub deck_name: String,
    pub card_names: Vec<String>,
    pub num_width: u32,
    pub num_height: u32,
    pub card_count: usize,
    pub deck_path: String,
}

#[tauri::command]
pub async fn parse_tts_json(tts_json_path: String) -> Result<ParsedTtsInfo, String> {
    let content = fs::read_to_string(&tts_json_path)
        .map_err(|e| format!("Failed to read TTS JSON: {}", e))?;

    let save_obj: TtsSaveObject = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse TTS JSON: {}", e))?;

    let deck_custom = save_obj.object_states.iter()
        .find(|o| o.name == "DeckCustom")
        .ok_or_else(|| "No DeckCustom found in JSON".to_string())?;

    let deck_name = if deck_custom.nickname.is_empty() {
        "Imported Deck".to_string()
    } else {
        deck_custom.nickname.clone()
    };

    let card_names: Vec<String> = if deck_custom.contained_objects.is_empty() {
        (0..1).map(|i| format!("Card {}", i + 1)).collect()
    } else {
        deck_custom.contained_objects.iter()
            .map(|c| if c.nickname.is_empty() { "Unnamed".to_string() } else { c.nickname.clone() })
            .collect()
    };

    let (num_width, num_height, face_url, back_url) = if let Some(ref custom_deck) = deck_custom.custom_deck {
        if let Some(first_entry) = custom_deck.as_object().and_then(|m| m.values().next()) {
            let cd: TtsCustomDeck = serde_json::from_value(first_entry.clone())
                .map_err(|e| format!("Failed to parse CustomDeck: {}", e))?;
            (cd.num_width.max(1), cd.num_height.max(1), cd.face_url, cd.back_url)
        } else {
            (1, 1, String::new(), String::new())
        }
    } else {
        (1, 1, String::new(), String::new())
    };

    let card_count = card_names.len().max(1);

    Ok(ParsedTtsInfo {
        deck_name,
        card_names,
        num_width,
        num_height,
        card_count,
        face_url,
        back_url,
    })
}

#[tauri::command]
pub async fn slice_tts_spritesheet(
    project_path: String,
    deck_name: String,
    spritesheet_data: Vec<u8>,
    back_data: Vec<u8>,
    num_width: u32,
    num_height: u32,
    card_names: Vec<String>,
) -> Result<ImportTtsResult, String> {
    use image::{GenericImageView, RgbaImage};
    use image::imageops;

    let deck_dir_name = deck_name.to_lowercase().replace(' ', "_").replace(|c: char| !c.is_alphanumeric() && c != '_', "");
    let deck_dir = Path::new(&project_path).join("decks").join(&deck_dir_name);
    let assets_dir = Path::new(&project_path).join("assets");

    fs::create_dir_all(&deck_dir).map_err(|e| format!("Failed to create deck dir: {}", e))?;
    fs::create_dir_all(&assets_dir).map_err(|e| format!("Failed to create assets dir: {}", e))?;

    // Load spritesheet
    let sheet = image::load_from_memory(&spritesheet_data)
        .map_err(|e| format!("Failed to decode spritesheet: {}", e))?;
    let (sheet_w, sheet_h) = sheet.dimensions();

    if num_width == 0 || num_height == 0 {
        return Err("Invalid spritesheet dimensions".into());
    }

    let card_w = sheet_w / num_width;
    let card_h = sheet_h / num_height;

    if card_w == 0 || card_h == 0 {
        return Err("Card dimensions too small".into());
    }

    // Save card back
    fs::write(&assets_dir.join("card_back.png"), &back_data)
        .map_err(|e| format!("Failed to save card back: {}", e))?;

    // Slice front cards and save as assets
    let mut csv_rows = Vec::new();
    let num_cards = card_names.len().min((num_width * num_height) as usize);

    for i in 0..num_cards {
        let col = i as u32 % num_width;
        let row = i as u32 / num_width;

        let mut card_img = RgbaImage::new(card_w, card_h);
        imageops::overlay(&mut card_img, &sheet, -(col as i64 * card_w as i64), -(row as i64 * card_h as i64));

        let asset_name = format!("card_{}.png", i + 1);
        let asset_path = assets_dir.join(&asset_name);
        card_img.save(&asset_path)
            .map_err(|e| format!("Failed to save card image {}: {}", i + 1, e))?;

        let card_name = card_names.get(i).map(|s| s.as_str()).unwrap_or(&asset_name);
        csv_rows.push(format!("{}\tassets/{}", card_name, asset_name));
    }

    // Generate simple template
    let template_html = r#"<div class="card">
  <div class="card-image"><img src="{{image}}" alt="{{name}}" /></div>
  <div class="card-name">{{name}}</div>
</div>"#.to_string();

    let template_css = r#".card {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 8px; box-sizing: border-box;
  color: #fff; font-family: sans-serif;
  overflow: hidden;
}
.card-image {
  width: 80%; flex: 1;
  display: flex; align-items: center; justify-content: center;
}
.card-image img { max-width: 100%; max-height: 100%; object-fit: contain; }
.card-name {
  font-size: 14px; font-weight: 600;
  text-align: center; padding: 4px 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  width: 100%;
}"#.to_string();

    // Write template files
    fs::write(&deck_dir.join("template.html"), &template_html)
        .map_err(|e| format!("Failed to write template HTML: {}", e))?;
    fs::write(&deck_dir.join("template.css"), &template_css)
        .map_err(|e| format!("Failed to write template CSS: {}", e))?;

    // Write CSV
    let csv_header = "name\timage\n";
    let mut csv_content = csv_header.to_string();
    csv_content.push_str(&csv_rows.join("\n"));
    fs::write(&deck_dir.join("cards.csv"), &csv_content)
        .map_err(|e| format!("Failed to write CSV: {}", e))?;

    Ok(ImportTtsResult {
        deck_name,
        card_names,
        num_width,
        num_height,
        card_count: num_cards,
        deck_path: deck_dir.to_string_lossy().to_string(),
    })
}
