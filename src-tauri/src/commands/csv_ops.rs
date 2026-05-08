use std::collections::HashMap;
use std::fs;

#[tauri::command]
pub async fn read_csv(path: String) -> Result<Vec<HashMap<String, String>>, String> {
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read CSV: {}", e))?;

    let mut reader = csv::Reader::from_reader(content.as_bytes());
    let headers = reader.headers()
        .map_err(|e| format!("Failed to read CSV headers: {}", e))?
        .clone();

    let mut rows = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|e| format!("Failed to read CSV record: {}", e))?;
        let mut row = HashMap::new();
        for (i, field) in record.iter().enumerate() {
            if let Some(header) = headers.get(i) {
                row.insert(header.to_string(), field.to_string());
            }
        }
        rows.push(row);
    }

    Ok(rows)
}

#[tauri::command]
pub async fn write_csv(path: String, rows: Vec<HashMap<String, String>>) -> Result<(), String> {
    if rows.is_empty() {
        return Ok(());
    }

    let mut header_set = std::collections::HashSet::new();
    for row in &rows {
        for key in row.keys() {
            header_set.insert(key.clone());
        }
    }
    let headers: Vec<String> = header_set.into_iter().collect();
    let mut wtr = csv::Writer::from_path(&path)
        .map_err(|e| format!("Failed to create CSV writer: {}", e))?;

    wtr.write_record(headers.iter().map(|h| h.as_str()))
        .map_err(|e| format!("Failed to write CSV headers: {}", e))?;

    for row in &rows {
        let values: Vec<String> = headers.iter().map(|h| {
            row.get(h).cloned().unwrap_or_default()
        }).collect();
        wtr.write_record(values.iter().map(|s| s.as_str()))
            .map_err(|e| format!("Failed to write CSV record: {}", e))?;
    }

    wtr.flush().map_err(|e| format!("Failed to flush CSV: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn write_csv_content(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write CSV: {}", e))?;
    Ok(())
}
