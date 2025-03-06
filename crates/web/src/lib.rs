//! Key Tuner Web
//!
//! WebAssembly向けのパスワード生成インターフェース

use wasm_bindgen::prelude::*;

use std::cell::RefCell;

use key_tuner_core::{
    LengthError, ModeError, PasswordError, PasswordGenerator, PasswordSettings, TextError,
};

// WebAssemblyのメモリアロケータとしてwee_allocを使用
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// パスワード設定のグローバルインスタンス
thread_local! {
    static PASSWORD_CONFIG: RefCell<PasswordConfig> = RefCell::new(PasswordConfig::default());
}

// JavaScriptの関数を呼び出すための外部関数宣言
#[wasm_bindgen(js_namespace = window)]
extern "C" {
    // 生成されたパスワードを表示する関数
    fn draw_generated_password(password: String);
    // 各種エラーを表示する関数
    fn draw_pass_phrase_error(error_message: String);
    fn draw_service_name_error(error_message: String);
    fn draw_version_error(error_message: String);
    fn draw_password_mode_error(error_message: String);
    fn draw_password_length_error(error_message: String);
}

// フロントエンド用のパスワード設定
#[derive(Debug, Clone, Default)]
struct PasswordConfig {
    settings: PasswordSettings,
}

impl PasswordConfig {
    // 設定を検証し、エラーを更新する関数
    fn validate_settings(&self) {
        self.draw_error(PasswordGenerator::validate_settings(&self.settings).err());
    }

    // パスワードを生成するメソッド
    fn generate_password(&mut self) {
        match PasswordGenerator::generate(&self.settings) {
            Ok(password) => {
                self.draw_generated_password(Some(password));
                self.draw_error(None);
            }
            Err(err) => {
                self.draw_generated_password(None);
                self.draw_error(Some(err));
            }
        }
    }

    // エラーを描画するメソッド
    fn draw_error(&self, err: Option<PasswordError>) {
        if let Some(error) = err {
            // パスフレーズのエラー
            if let Some(pass_phrase_err) = error.pass_phrase() {
                match pass_phrase_err {
                    TextError::TooLong(max_len) => {
                        draw_pass_phrase_error(format!(
                            "パスフレーズが長すぎます（最大{}文字）",
                            max_len
                        ));
                    }
                }
            } else {
                draw_pass_phrase_error("".to_string());
            }

            // サービス名のエラー
            if let Some(service_name_err) = error.service_name() {
                match service_name_err {
                    TextError::TooLong(max_len) => {
                        draw_service_name_error(format!(
                            "サービス名が長すぎます（最大{}文字）",
                            max_len
                        ));
                    }
                }
            } else {
                draw_service_name_error("".to_string());
            }

            // バージョンのエラー
            if let Some(version_err) = error.version() {
                match version_err {
                    TextError::TooLong(max_len) => {
                        draw_version_error(format!(
                            "バージョンが長すぎます（最大{}文字）",
                            max_len
                        ));
                    }
                }
            } else {
                draw_version_error("".to_string());
            }

            // モードのエラー
            if let Some(mode_err) = error.mode() {
                match mode_err {
                    ModeError::InvalidMode => {
                        draw_password_mode_error("不正なパスワード生成モードです".to_string());
                    }
                }
            } else {
                draw_password_mode_error("".to_string());
            }

            // 長さのエラー
            if let Some(length_err) = error.length() {
                match length_err {
                    LengthError::InvalidLength => {
                        draw_password_length_error("不正なパスワード長です".to_string());
                    }
                    LengthError::BelowMinimum(min) => {
                        draw_password_length_error(format!(
                            "パスワード長が短すぎます（最小{}文字）",
                            min
                        ));
                    }
                    LengthError::ExceedsMaximum(max) => {
                        draw_password_length_error(format!(
                            "パスワード長が長すぎます（最大{}文字）",
                            max
                        ));
                    }
                }
            } else {
                draw_password_length_error("".to_string());
            }
        } else {
            // エラーがない場合は、すべてのエラー表示をクリア
            draw_pass_phrase_error("".to_string());
            draw_service_name_error("".to_string());
            draw_version_error("".to_string());
            draw_password_mode_error("".to_string());
            draw_password_length_error("".to_string());
        }
    }

    // 生成されたパスワードを描画するメソッド
    fn draw_generated_password(&self, password: Option<String>) {
        match password {
            Some(pass) => draw_generated_password(pass),
            None => draw_generated_password("パスワードがここに表示されます".to_string()),
        }
    }
}

// 初期化関数
#[wasm_bindgen(start)]
pub fn init() {
    // パニック時にコンソールにエラーを出力
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// JavaScriptから呼び出し可能な関数群
#[wasm_bindgen]
pub fn generate_password() {
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();

        // PasswordConfigのメソッドを使用
        config_ref.generate_password();
    })
}

#[wasm_bindgen]
pub fn set_pass_phrase(phrase: JsValue) {
    let phrase: String = phrase.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.pass_phrase = phrase;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn set_service_name(name: JsValue) {
    let name: String = name.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.service_name = name;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn set_version(version: JsValue) {
    let version: String = version.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.version = version;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn set_password_mode(mode: JsValue) {
    let mode: String = mode.as_string().unwrap_or("invalid mode".into());
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.mode = mode;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn set_password_length(length: JsValue) {
    let length: String = length.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.length = length;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}
