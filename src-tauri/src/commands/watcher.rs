use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

struct WatcherState {
    _watcher: Option<RecommendedWatcher>,
}

static WATCHER: std::sync::LazyLock<Arc<Mutex<Option<WatcherState>>>> =
    std::sync::LazyLock::new(|| Arc::new(Mutex::new(None)));

#[tauri::command]
pub async fn start_watch(path: String, app_handle: AppHandle) -> Result<(), String> {
    let path = Path::new(&path).to_path_buf();
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }

    let (tx, rx) = mpsc::channel::<Event>();

    let mut watcher = RecommendedWatcher::new(
        move |res| {
            if let Ok(event) = res {
                let _ = tx.send(event);
            }
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(&path, RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch path: {}", e))?;

    std::thread::spawn(move || {
        while let Ok(event) = rx.recv() {
            for path in event.paths {
                let kind = format!("{:?}", event.kind);
                let file_path = path.to_string_lossy().to_string();
                let _ = app_handle.emit("file-changed", serde_json::json!({
                    "path": file_path,
                    "kind": kind,
                }));
            }
        }
    });

    let mut w = WATCHER.lock().map_err(|e| format!("Lock error: {}", e))?;
    *w = Some(WatcherState {
        _watcher: Some(watcher),
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_watch() -> Result<(), String> {
    let mut w = WATCHER.lock().map_err(|e| format!("Lock error: {}", e))?;
    *w = None;
    Ok(())
}
