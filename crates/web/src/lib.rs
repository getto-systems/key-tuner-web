//! Key Tuner Web
//!
//! WebAssembly向けのパスワード生成インターフェース

use wasm_bindgen::prelude::{wasm_bindgen, JsValue};

use std::cell::RefCell;

use key_tuner_core::password::{PasswordSettings, PasswordGenerator, ValidatedPasswordSettings};

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
    data: PasswordSettings,
}

impl Default for PasswordConfig {
    fn default() -> Self {
        Self {
            data: PasswordSettings {
                pass_phrase: "default passphrase".to_string(),
                service_name: "default service".to_string(),
                version: "1".to_string(),
                mode: "ex".to_string(),
                length: "12".to_string(),
            },
        }
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
        // 直接PasswordSettingsを使用
        PasswordGenerator::generate(&config.data)
            .map_err(|e| JsValue::from_str(&format!("{:?}", e)))
    })
}

#[wasm_bindgen]
pub fn set_pass_phrase(phrase: String) {
    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().data.pass_phrase = phrase;
    });
}

#[wasm_bindgen]
pub fn set_service_name(name: String) {
    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().data.service_name = name;
    });
}

#[wasm_bindgen]
pub fn set_version(version: String) {
    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().data.version = version;
    });
}

#[wasm_bindgen]
pub fn set_password_mode(mode: String) -> Result<(), JsValue> {
    // モードの検証は PasswordSettings::try_from で行われるため、
    // ここでは単に文字列を設定するだけ
    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().data.mode = mode;
    });
    Ok(())
}

#[wasm_bindgen]
pub fn set_password_length(length: usize) -> Result<(), JsValue> {
    if length < 8 || length > 64 {
        return Err(JsValue::from_str(&format!(
            "パスワードの長さは8から64の間である必要があります: {}",
            length
        )));
    }

    PASSWORD_CONFIG.with(|config| {
        config.borrow_mut().data.length = length.to_string();
    });

    Ok(())
}
