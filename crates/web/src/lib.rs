//! Key Tuner Web
//!
//! WebAssembly向けのパスワード生成インターフェース

use wasm_bindgen::prelude::*;

use std::cell::RefCell;

use key_tuner_core::{
    LengthError, ModeError, PasswordError, PasswordGenerator, PasswordSettings, TextError,
};

// WebAssemblyのメモリアロケータとしてwee_allocを使用
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// パスワード設定のグローバルインスタンス
thread_local! {
    static PASSWORD_CONFIG: RefCell<PasswordConfig> = RefCell::new(PasswordConfig::default());
}

// JavaScriptの関数を呼び出すための外部関数宣言
#[wasm_bindgen(js_namespace = __KEY_TUNER_WASM_BRIDGE__)]
extern "C" {
    // 生成されたパスワードを表示する関数
    fn draw_generated_password(password: String);
    // 各種エラーを表示する関数
    fn draw_pass_phrase_error(error_message: String);
    fn draw_service_name_error(error_message: String);
    fn draw_version_error(error_message: String);
    fn draw_password_mode_error(error_message: String);
    fn draw_password_length_error(error_message: String);
    // 生成されたパスワードをクリップボードに貼り付ける関数
    fn paste_generated_password_to_clipboard(password: String);
}

// フロントエンド用のパスワード設定
#[derive(Debug, Clone, Default)]
struct PasswordConfig {
    settings: PasswordSettings,
    generated_password: Option<String>,
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
                self.generated_password = Some(password);
                self.draw_generated_password(self.generated_password.clone());
                self.draw_error(None);
            }
            Err(err) => {
                self.generated_password = None;
                self.draw_generated_password(None);
                self.draw_error(Some(err));
            }
        }
    }

    // エラーを描画するメソッド
    fn draw_error(&self, err: Option<PasswordError>) {
        let err = err.unwrap_or_default();

        // パスフレーズのエラー
        draw_pass_phrase_error(format_text_error("パスフレーズ", err.pass_phrase()));

        // サービス名のエラー
        draw_service_name_error(format_text_error("サービス名", err.service_name()));

        // バージョンのエラー
        draw_version_error(format_text_error("バージョン", err.version()));

        // モードのエラー
        draw_password_mode_error(format_mode_error(err.mode()));

        // 長さのエラー
        draw_password_length_error(format_length_error(err.length()));
    }

    // 生成されたパスワードを描画するメソッド
    fn draw_generated_password(&self, password: Option<String>) {
        draw_generated_password(format_password(password));
    }
}

/// パスワードをフォーマットする関数
///
/// # 引数
///
/// * `password` - `Option<String>` 型のパスワード
///
/// # 戻り値
///
/// * `String` - フォーマットされたパスワード文字列（Noneの場合は空文字列）
fn format_password(password: Option<String>) -> String {
    match password {
        Some(pass) => pass,
        None => "".to_string(),
    }
}

/// テキストエラーをフォーマットする関数
///
/// # 引数
///
/// * `prefix` - エラーメッセージの前に付けるテキスト（例：「パスフレーズ」、「サービス名」など）
/// * `err` - `Option<TextError>` 型のエラー
///
/// # 戻り値
///
/// * `String` - フォーマットされたエラーメッセージ文字列
fn format_text_error(prefix: &'static str, err: &Option<TextError>) -> String {
    match err {
        Some(error) => match *error {
            TextError::Empty => format!("{}を入力してください", prefix),
            TextError::TooLong(max_len) => format!("{}が長すぎます（最大{}文字）", prefix, max_len),
        },
        None => "".to_string(),
    }
}

/// モードエラーをフォーマットする関数
///
/// # 引数
///
/// * `err` - `Option<ModeError>` 型のエラー
///
/// # 戻り値
///
/// * `String` - フォーマットされたエラーメッセージ文字列
fn format_mode_error(err: &Option<ModeError>) -> String {
    match err {
        Some(error) => match *error {
            ModeError::InvalidMode => "不正なパスワード生成モードです".to_string(),
        },
        None => "".to_string(),
    }
}

/// 長さエラーをフォーマットする関数
///
/// # 引数
///
/// * `err` - `Option<LengthError>` 型のエラー
///
/// # 戻り値
///
/// * `String` - フォーマットされたエラーメッセージ文字列
fn format_length_error(err: &Option<LengthError>) -> String {
    match err {
        Some(error) => match *error {
            LengthError::InvalidLength => "不正なパスワード長です".to_string(),
            LengthError::BelowMinimum(min) => {
                format!("パスワード長が短すぎます（最小{}文字）", min)
            }
            LengthError::ExceedsMaximum(max) => {
                format!("パスワード長が長すぎます（最大{}文字）", max)
            }
        },
        None => "".to_string(),
    }
}

// 初期化関数
#[wasm_bindgen(start)]
pub fn init() {
    // パニック時にコンソールにエラーを出力
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
    let phrase = phrase.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.pass_phrase = phrase;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn set_service_name(name: JsValue) {
    let name = name.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.service_name = name;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn set_version(version: JsValue) {
    let version = version.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.version = version;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn set_password_mode(mode: JsValue) {
    let mode = mode.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.mode = mode;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn set_password_length(length: JsValue) {
    let length = length.as_string().unwrap_or_default();
    PASSWORD_CONFIG.with(|config| {
        let mut config_ref = config.borrow_mut();
        config_ref.settings.length = length;

        // 設定を検証し、エラーを更新
        config_ref.validate_settings();
    });
}

#[wasm_bindgen]
pub fn copy_generated_password() {
    PASSWORD_CONFIG.with(|config| {
        let config_ref = config.borrow();

        // generated_passwordがSome(password)の場合にクリップボードにコピー
        if let Some(password) = &config_ref.generated_password {
            paste_generated_password_to_clipboard(password.clone());
        }
    });
}
