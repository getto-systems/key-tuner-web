//! Key Tuner Web
//!
//! WebAssembly向けのパスワード生成インターフェース

use key_tuner_core::{PasswordGenerator, PasswordSettings, PasswordMode};
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

// WebAssemblyのメモリアロケータとしてwee_allocを使用
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// パスワード設定のグローバルインスタンス
thread_local! {
    static PASSWORD_CONFIG: RefCell<PasswordConfig> = RefCell::new(PasswordConfig::default());
}

// フロントエンド用のパスワード設定
#[derive(Debug, Clone)]
struct PasswordConfig {
    pass_phrase: String,
    service_name: String,
    version: String,
    mode: PasswordMode,
    length: usize,
}

impl Default for PasswordConfig {
    fn default() -> Self {
        Self {
            pass_phrase: "default passphrase".to_string(),
            service_name: "default service".to_string(),
            version: "1".to_string(),
            mode: PasswordMode::Ex,
            length: 12,
        }
    }
}

impl PasswordConfig {
    // PasswordSettingsに変換
    fn to_settings(&self) -> Result<PasswordSettings, String> {
        PasswordSettings::new(
            self.pass_phrase.clone(),
            self.service_name.clone(),
            self.version.clone(),
            self.mode,
            self.length,
        )
    }
}

// 初期化関数
#[wasm_bindgen(start)]
pub fn init() {
    // パニック時にコンソールにエラーを出力
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    
    // ログ出力
    web_sys::console::log_1(&"Key Tuner WASM module initialized".into());
}

// JavaScriptから呼び出し可能な関数群
#[wasm_bindgen]
pub fn generate_password() -> Result<String, JsValue> {
    PASSWORD_CONFIG.with(|config| {
        let config = config.borrow();
        match config.to_settings() {
            Ok(settings) => Ok(PasswordGenerator::generate(&settings)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    })
}

#[wasm_bindgen]
pub fn set_pass_phrase(phrase: String) {
    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().pass_phrase = phrase;
    });
}

#[wasm_bindgen]
pub fn set_service_name(name: String) {
    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().service_name = name;
    });
}

#[wasm_bindgen]
pub fn set_version(version: String) {
    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().version = version;
    });
}

#[wasm_bindgen]
pub fn set_password_mode(mode: String) -> Result<(), JsValue> {
    match PasswordMode::try_from(mode.as_str()) {
        Ok(password_mode) => {
            PASSWORD_CONFIG.with(|config| {
                config.borrow_mut().mode = password_mode;
            });
            Ok(())
        },
        Err(e) => Err(JsValue::from_str(&e)),
    }
}

#[wasm_bindgen]
pub fn set_password_length(length: usize) -> Result<(), JsValue> {
    if length < 8 || length > 64 {
        return Err(JsValue::from_str(&format!("パスワードの長さは8から64の間である必要があります: {}", length)));
    }
    
    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().length = length;
    });
    
    Ok(())
}
