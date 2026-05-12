use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetInfo {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub size_bytes: u64,
    pub thumbnail_base64: Option<String>,
    pub is_folder: bool,
}

fn list_assets_recursive(
    dir: &Path,
    project_path: &Path,
    relative_prefix: &str,
) -> Result<Vec<AssetInfo>, String> {
    let mut assets = Vec::new();
    let entries = fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let relative_path = if relative_prefix.is_empty() {
            format!("assets/{}", name)
        } else {
            format!("{}/{}", relative_prefix, name)
        };

        if path.is_dir() {
            // Add folder as an item
            assets.push(AssetInfo {
                name: name.clone(),
                path: path.to_string_lossy().to_string(),
                relative_path: relative_path.clone(),
                size_bytes: 0,
                thumbnail_base64: None,
                is_folder: true,
            });
            // Recursively list contents
            let mut children = list_assets_recursive(&path, project_path, &relative_path)?;
            assets.append(&mut children);
        } else {
            let metadata = fs::metadata(&path)
                .map_err(|e| format!("Failed to read metadata: {}", e))?;
            let thumbnail_base64 = generate_thumbnail(&path);
            
            assets.push(AssetInfo {
                name,
                path: path.to_string_lossy().to_string(),
                relative_path,
                size_bytes: metadata.len(),
                thumbnail_base64,
                is_folder: false,
            });
        }
    }

    Ok(assets)
}

#[tauri::command]
pub async fn list_assets(project_path: String) -> Result<Vec<AssetInfo>, String> {
    let assets_dir = Path::new(&project_path).join("assets");
    if !assets_dir.exists() {
        return Ok(vec![]);
    }

    list_assets_recursive(&assets_dir, Path::new(&project_path), "assets")
}

#[tauri::command]
pub async fn create_asset_folder(project_path: String, folder_path: String) -> Result<(), String> {
    let full_path = Path::new(&project_path).join(&folder_path);
    fs::create_dir_all(&full_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn delete_asset_folder(folder_path: String) -> Result<(), String> {
    fs::remove_dir_all(&folder_path)
        .map_err(|e| format!("Failed to delete folder: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn move_asset(source_path: String, dest_path: String) -> Result<(), String> {
    fs::rename(&source_path, &dest_path)
        .map_err(|e| format!("Failed to move asset: {}", e))?;
    Ok(())
}

fn generate_thumbnail(path: &Path) -> Option<String> {
    let ext = path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    let mime_type = match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => return None,
    };
    
    match fs::read(path) {
        Ok(bytes) => {
            let base64 = base64::Engine::encode(
                &base64::engine::general_purpose::STANDARD,
                &bytes
            );
            Some(format!("data:{};base64,{}", mime_type, base64))
        }
        Err(_) => None,
    }
}

#[tauri::command]
pub async fn import_asset(project_path: String, source_path: String, target_folder: Option<String>) -> Result<AssetInfo, String> {
    eprintln!("[import_asset] project_path={}", project_path);
    eprintln!("[import_asset] source_path={}", source_path);
    eprintln!("[import_asset] target_folder={:?}", target_folder);

    // Нормализуем source_path: убираем file:// префикс если есть (Tauri dialog иногда возвращает его)
    let clean_source = source_path
        .strip_prefix("file:///")
        .map(|s| {
            // На Windows file:///C:/... → C:/...
            if s.len() > 2 && s.chars().nth(1) == Some(':') {
                s.to_string()
            } else {
                format!("/{}", s)
            }
        })
        .unwrap_or_else(|| source_path.clone());

    let source = Path::new(&clean_source);

    if !source.exists() {
        return Err(format!("Source file does not exist: {}", clean_source));
    }

    let file_name = source.file_name()
        .ok_or_else(|| format!("Invalid source path, no filename: {}", clean_source))?
        .to_string_lossy()
        .to_string();

    let ext = source.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    // Determine target: provided folder or default to "assets"
    // target_folder is always a relative path like "assets" or "assets/icons"
    let target = target_folder.unwrap_or_else(|| "assets".to_string());
    
    // Font files always go to assets/fonts/
    let (dest, relative_path) = if ext == "ttf" || ext == "otf" {
        let d = Path::new(&project_path).join("assets").join("fonts").join(&file_name);
        let r = format!("assets/fonts/{}", file_name);
        (d, r)
    } else {
        // target is relative — join to project_path
        let d = Path::new(&project_path).join(&target).join(&file_name);
        let r = format!("{}/{}", target, file_name);
        (d, r)
    };

    eprintln!("[import_asset] dest={:?}", dest);
    eprintln!("[import_asset] relative_path={}", relative_path);

    // Ensure destination directory exists
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory {:?}: {}", parent, e))?;
        eprintln!("[import_asset] Created directory: {:?}", parent);
    }

    // Copy file
    let bytes_copied = fs::copy(source, &dest)
        .map_err(|e| format!("Failed to copy '{}' to '{:?}': {}", clean_source, dest, e))?;
    eprintln!("[import_asset] Copied {} bytes", bytes_copied);

    let metadata = fs::metadata(&dest)
        .map_err(|e| format!("Failed to read metadata after copy: {}", e))?;

    let thumbnail_base64 = generate_thumbnail(&dest);

    Ok(AssetInfo {
        name: file_name,
        path: dest.to_string_lossy().to_string(),
        relative_path,
        size_bytes: metadata.len(),
        thumbnail_base64,
        is_folder: false,
    })
}

#[tauri::command]
pub async fn delete_asset(asset_path: String) -> Result<(), String> {
    fs::remove_file(&asset_path)
        .map_err(|e| format!("Failed to delete asset: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn open_asset_externally(
    asset_path: String,
) -> Result<(), String> {
    tauri_plugin_opener::open_path(asset_path, None::<&str>)
        .map_err(|e| format!("Failed to open asset: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_font_face_css(project_path: String) -> Result<String, String> {
    let fonts_dir = Path::new(&project_path).join("assets").join("fonts");
    if !fonts_dir.exists() {
        return Ok(String::new());
    }

    let mut font_faces = Vec::new();
    let entries = fs::read_dir(&fonts_dir)
        .map_err(|e| format!("Failed to read fonts directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if !path.is_file() { continue; }
        let ext = path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if ext != "ttf" && ext != "otf" { continue; }

        let name = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown");
        let mime = if ext == "ttf" { "font/ttf" } else { "font/otf" };
        let bytes = fs::read(&path)
            .map_err(|e| format!("Failed to read font {}: {}", name, e))?;
        let base64_str = base64::Engine::encode(
            &base64::engine::general_purpose::STANDARD,
            &bytes
        );
        font_faces.push(format!(
            "@font-face {{ font-family: '{}'; src: url(data:{};base64,{}); }}",
            name, mime, base64_str
        ));
    }

    Ok(font_faces.join("\n"))
}

#[tauri::command]
pub async fn list_fonts(project_path: String) -> Result<Vec<String>, String> {
    let fonts_dir = Path::new(&project_path).join("assets").join("fonts");
    if !fonts_dir.exists() {
        return Ok(vec![]);
    }

    let mut fonts = Vec::new();
    let entries = fs::read_dir(&fonts_dir)
        .map_err(|e| format!("Failed to read fonts directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if !path.is_file() { continue; }
        let ext = path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if ext == "ttf" || ext == "otf" {
            if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                fonts.push(name.to_string());
            }
        }
    }

    Ok(fonts)
}

#[tauri::command]
pub async fn render_preview_html(
    html: String,
    css: String,
    row_json: String,
    project_path: String,
) -> Result<String, String> {
    eprintln!("[render_preview_html] Called with project_path: {}", project_path);
    eprintln!("[render_preview_html] HTML length: {}", html.len());
    eprintln!("[render_preview_html] CSS length: {}", css.len());
    eprintln!("[render_preview_html] Row JSON: {}", row_json);
    
    // Parse row data
    let row: serde_json::Value = serde_json::from_str(&row_json)
        .map_err(|e| format!("Invalid row data: {}", e))?;
    
    // Step 1: Replace Handlebars placeholders {{field}} with values
    let mut body = html;
    if let serde_json::Value::Object(map) = &row {
        for (key, value) in map {
            let placeholder = format!("{{{{{}}}}}", key);
            let replacement = match value {
                serde_json::Value::String(s) => s.clone(),
                serde_json::Value::Null => String::new(),
                _ => value.to_string(),
            };
            eprintln!("[render_preview_html] Replacing '{}' with '{}'", placeholder, replacement);
            body = body.replace(&placeholder, &replacement);
        }
    }
    eprintln!("[render_preview_html] After Handlebars replace, body length: {}", body.len());
    eprintln!("[render_preview_html] Body preview: {}", &body[..body.len().min(200)]);
    
    // Step 2: Нормализуем любые абсолютные пути к файлам в assets/<filename>.
    // Обрабатываем три формата:
    //   a) file:///C:/path/to/assets/photo.jpg
    //   b) C:\path\to\assets\photo.jpg   (Windows backslash, без file://)
    //   c) /home/user/path/assets/photo.jpg (Unix абсолютный)
    let mut result = body;
    
    // Функция: извлечь имя файла из любого пути
    fn path_to_assets_ref(raw: &str) -> String {
        // Нормализуем обратные слэши
        let normalized = raw.replace('\\', "/");
        // Убираем file:// или file:///
        let without_proto = if let Some(pos) = normalized.find("file://") {
            &normalized[pos + 7..]
        } else {
            &normalized
        };
        // Берём часть после /assets/ если есть
        if let Some(idx) = without_proto.rfind("/assets/") {
            format!("assets/{}", &without_proto[idx + 8..])
        } else {
            // Берём только имя файла
            let filename = without_proto.split('/').last().unwrap_or(without_proto);
            format!("assets/{}", filename)
        }
    }
    
    // Собираем все вхождения абсолютных путей через char-by-char парсинг
    // Ищем src="..." и url("...") паттерны
    let mut normalized_result = String::with_capacity(result.len());
    let bytes = result.as_bytes();
    let len = bytes.len();
    let mut i = 0;
    while i < len {
        // Ищем src=" или src='
        let is_src = i + 5 < len && &result[i..i+4] == "src=";
        let is_url = i + 5 < len && &result[i..i+4] == "url(";
        
        if is_src || is_url {
            let (prefix_len, _quote_char, end_marker) = if is_src {
                let q = bytes[i + 4];
                if q == b'"' || q == b'\'' {
                    (5usize, q, q)
                } else {
                    normalized_result.push(bytes[i] as char);
                    i += 1;
                    continue;
                }
            } else {
                // url( — ends with )
                let q = bytes[i + 4];
                if q == b'"' || q == b'\'' {
                    (5usize, q, q)
                } else {
                    // url(path) without quotes
                    (4usize, 0u8, b')')
                }
            };
            
            // Добавляем prefix
            normalized_result.push_str(&result[i..i + prefix_len]);
            i += prefix_len;
            
            // Читаем значение до закрывающего символа
            let val_start = i;
            while i < len && bytes[i] != end_marker && bytes[i] != b'\n' {
                i += 1;
            }
            let val = &result[val_start..i];
            
            // Если это абсолютный путь — конвертируем
            let needs_convert = val.starts_with("file:///")
                || val.starts_with("file://")
                || (val.len() > 2 && &val[1..3] == ":\\")  // C:\
                || (val.starts_with('/') && val.contains("/assets/"));
            
            if needs_convert {
                let converted = path_to_assets_ref(val);
                eprintln!("[render_preview_html] Converted path: '{}' -> '{}'", val, converted);
                normalized_result.push_str(&converted);
            } else {
                normalized_result.push_str(val);
            }
        } else {
            normalized_result.push(bytes[i] as char);
            i += 1;
        }
    }
    result = normalized_result;
    
    // Step 3: Replace assets/<filename> references with base64 data URLs
    let assets_dir = Path::new(&project_path).join("assets");
    
    // Собираем уникальные assets/... ссылки
    let mut asset_refs: Vec<String> = Vec::new();
    let mut search_start = 0;
    while let Some(pos) = result[search_start..].find("assets/") {
        let abs_pos = search_start + pos;
        let rest = &result[abs_pos..];
        // Читаем до ближайшего терминатора: " ' ) > пробел
        let end = rest.bytes()
            .position(|b| matches!(b, b'"' | b'\'' | b')' | b'>' | b' ' | b'\t' | b'\n' | b'\r'))
            .unwrap_or(rest.len());
        let asset_ref = &rest[..end];
        if !asset_ref.is_empty() && !asset_refs.contains(&asset_ref.to_string()) {
            asset_refs.push(asset_ref.to_string());
        }
        search_start = abs_pos + 1;
    }
    
    eprintln!("[render_preview_html] Found {} asset references: {:?}", asset_refs.len(), asset_refs);
    
    for asset_ref in &asset_refs {
        let asset_name = asset_ref.strip_prefix("assets/").unwrap_or(asset_ref);
        let asset_path = assets_dir.join(asset_name);
        
        eprintln!("[render_preview_html] Looking for asset at: {:?}", asset_path);
        
        if let Ok(bytes) = fs::read(&asset_path) {
            let ext = Path::new(asset_name)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("png");
            let mime = match ext.to_lowercase().as_str() {
                "jpg" | "jpeg" => "image/jpeg",
                "png" => "image/png",
                "gif" => "image/gif",
                "svg" => "image/svg+xml",
                "webp" => "image/webp",
                "bmp" => "image/bmp",
                "ttf" => "font/ttf",
                "otf" => "font/otf",
                _ => "image/png",
            };
            let base64_str = base64::Engine::encode(
                &base64::engine::general_purpose::STANDARD,
                &bytes
            );
            let data_url = format!("data:{};base64,{}", mime, base64_str);
            result = result.replace(asset_ref.as_str(), &data_url);
            eprintln!("[render_preview_html] Replaced '{}' with data URL ({} bytes)", asset_ref, bytes.len());
        } else {
            eprintln!("[render_preview_html] Asset not found: {:?}", asset_path);
        }
    }
    
    eprintln!("[render_preview_html] After assets replace, result length: {}", result.len());
    
    // Build full HTML document
    let final_html = format!(r#"<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 100%; height: 100%; overflow: hidden; }}
  {}
</style>
</head>
<body>{}</body>
</html>"#, css, result);
    eprintln!("[render_preview_html] Final HTML length: {}", final_html.len());
    Ok(final_html)
}
