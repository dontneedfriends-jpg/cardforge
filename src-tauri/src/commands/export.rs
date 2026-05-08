use std::fs;
use std::path::Path;
use std::io::Write;

#[tauri::command]
pub async fn export_png_batch(output_dir: String, images: Vec<Vec<u8>>, names: Vec<String>) -> Result<(), String> {
    let dir = Path::new(&output_dir);
    fs::create_dir_all(dir).map_err(|e| format!("Failed to create output directory: {}", e))?;

    for (i, name) in names.iter().enumerate() {
        let file_path = dir.join(name);
        if let Some(data) = images.get(i) {
            let mut file = fs::File::create(&file_path)
                .map_err(|e| format!("Failed to create file {}: {}", name, e))?;
            file.write_all(data)
                .map_err(|e| format!("Failed to write file {}: {}", name, e))?;
        }
    }

    Ok(())
}

#[derive(serde::Serialize)]
pub struct TtsSpritesheetResult {
    pub num_width: u32,
    pub num_height: u32,
    pub spritesheet_path: String,
    pub back_path: String,
}

#[tauri::command]
pub fn export_tts_spritesheet(
    output_dir: String,
    card_images: Vec<Vec<u8>>,
    card_back_image: Vec<u8>,
    cards_per_row: u32,
) -> Result<TtsSpritesheetResult, String> {
    use image::{RgbaImage, GenericImageView};
    use image::imageops;

    let dir = Path::new(&output_dir);
    fs::create_dir_all(dir).map_err(|e| format!("Failed to create output directory: {}", e))?;

    let num_cards = card_images.len() as u32;
    if num_cards == 0 {
        return Err("No card images provided".into());
    }

    let num_width = cards_per_row.min(num_cards).max(1);
    let num_height = (num_cards + num_width - 1) / num_width;

    let first_img = image::load_from_memory(&card_images[0])
        .map_err(|e| format!("Failed to decode first card image: {}", e))?;
    let (card_w, card_h) = first_img.dimensions();

    let sheet_w = card_w * num_width;
    let sheet_h = card_h * num_height;
    let mut sheet = RgbaImage::new(sheet_w, sheet_h);

    for (i, img_data) in card_images.iter().enumerate() {
        let img = image::load_from_memory(img_data)
            .map_err(|e| format!("Failed to decode card {}: {}", i, e))?;
        let x = (i as u32 % num_width) * card_w;
        let y = (i as u32 / num_width) * card_h;
        imageops::overlay(&mut sheet, &img, x as i64, y as i64);
    }

    let spritesheet_path = dir.join("spritesheet.png");
    sheet.save(&spritesheet_path)
        .map_err(|e| format!("Failed to save spritesheet: {}", e))?;

    let back_path = dir.join("card_back.png");
    fs::write(&back_path, &card_back_image)
        .map_err(|e| format!("Failed to save card back: {}", e))?;

    Ok(TtsSpritesheetResult {
        num_width,
        num_height,
        spritesheet_path: spritesheet_path.to_string_lossy().to_string(),
        back_path: back_path.to_string_lossy().to_string(),
    })
}
