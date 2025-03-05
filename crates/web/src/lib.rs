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

// DOM構成情報の構築関数
#[wasm_bindgen]
pub fn create_dom_structure() -> JsValue {
    let structure = js_sys::Object::new();
    
    // アプリケーションのルート要素
    let app = js_sys::Object::new();
    js_sys::Reflect::set(&app, &"tag".into(), &"div".into()).unwrap();
    js_sys::Reflect::set(&app, &"id".into(), &"app".into()).unwrap();
    
    // ヘッダー
    let header = js_sys::Object::new();
    js_sys::Reflect::set(&header, &"tag".into(), &"header".into()).unwrap();
    
    let title = js_sys::Object::new();
    js_sys::Reflect::set(&title, &"tag".into(), &"h1".into()).unwrap();
    js_sys::Reflect::set(&title, &"text".into(), &"Key Tuner".into()).unwrap();
    
    let subtitle = js_sys::Object::new();
    js_sys::Reflect::set(&subtitle, &"tag".into(), &"p".into()).unwrap();
    js_sys::Reflect::set(&subtitle, &"text".into(), &"安全なパスワードを生成するツール".into()).unwrap();
    
    // ヘッダーの子要素を設定
    let header_children = js_sys::Array::new();
    header_children.push(&title);
    header_children.push(&subtitle);
    js_sys::Reflect::set(&header, &"children".into(), &header_children).unwrap();
    
    // メイン部分
    let main = js_sys::Object::new();
    js_sys::Reflect::set(&main, &"tag".into(), &"main".into()).unwrap();
    
    // フォーム
    let form = js_sys::Object::new();
    js_sys::Reflect::set(&form, &"tag".into(), &"form".into()).unwrap();
    js_sys::Reflect::set(&form, &"id".into(), &"password-form".into()).unwrap();
    
    // パスフレーズ入力
    let pass_phrase_group = create_form_group(
        "pass-phrase",
        "パスフレーズ",
        "text",
        "あなたの秘密のフレーズを入力してください"
    );
    
    // サービス名入力
    let service_name_group = create_form_group(
        "service-name",
        "サービス名",
        "text",
        "パスワードを使用するサービス名を入力してください"
    );
    
    // バージョン入力
    let version_group = create_form_group(
        "version",
        "バージョン",
        "text",
        "バージョン番号を入力してください"
    );
    
    // 生成モード選択
    let mode_group = js_sys::Object::new();
    js_sys::Reflect::set(&mode_group, &"tag".into(), &"div".into()).unwrap();
    js_sys::Reflect::set(&mode_group, &"class".into(), &"form-group".into()).unwrap();
    
    let mode_label = js_sys::Object::new();
    js_sys::Reflect::set(&mode_label, &"tag".into(), &"label".into()).unwrap();
    js_sys::Reflect::set(&mode_label, &"for".into(), &"password-mode".into()).unwrap();
    js_sys::Reflect::set(&mode_label, &"text".into(), &"生成モード".into()).unwrap();
    
    let mode_select = js_sys::Object::new();
    js_sys::Reflect::set(&mode_select, &"tag".into(), &"select".into()).unwrap();
    js_sys::Reflect::set(&mode_select, &"id".into(), &"password-mode".into()).unwrap();
    
    let option_ex = create_option("ex", "Ex: 大文字小文字数字記号を含む", true);
    let option_full = create_option("full", "Full: 大文字小文字数字を含む", false);
    let option_short = create_option("short", "Short: 小文字数字のみ", false);
    
    let mode_options = js_sys::Array::new();
    mode_options.push(&option_ex);
    mode_options.push(&option_full);
    mode_options.push(&option_short);
    js_sys::Reflect::set(&mode_select, &"children".into(), &mode_options).unwrap();
    
    let mode_children = js_sys::Array::new();
    mode_children.push(&mode_label);
    mode_children.push(&mode_select);
    js_sys::Reflect::set(&mode_group, &"children".into(), &mode_children).unwrap();
    
    // パスワード長さ入力
    let length_group = js_sys::Object::new();
    js_sys::Reflect::set(&length_group, &"tag".into(), &"div".into()).unwrap();
    js_sys::Reflect::set(&length_group, &"class".into(), &"form-group".into()).unwrap();
    
    let length_label = js_sys::Object::new();
    js_sys::Reflect::set(&length_label, &"tag".into(), &"label".into()).unwrap();
    js_sys::Reflect::set(&length_label, &"for".into(), &"password-length".into()).unwrap();
    js_sys::Reflect::set(&length_label, &"text".into(), &"パスワードの長さ (8-64)".into()).unwrap();
    
    let length_input = js_sys::Object::new();
    js_sys::Reflect::set(&length_input, &"tag".into(), &"input".into()).unwrap();
    js_sys::Reflect::set(&length_input, &"type".into(), &"number".into()).unwrap();
    js_sys::Reflect::set(&length_input, &"id".into(), &"password-length".into()).unwrap();
    js_sys::Reflect::set(&length_input, &"min".into(), &"8".into()).unwrap();
    js_sys::Reflect::set(&length_input, &"max".into(), &"64".into()).unwrap();
    js_sys::Reflect::set(&length_input, &"value".into(), &"12".into()).unwrap();
    
    let length_children = js_sys::Array::new();
    length_children.push(&length_label);
    length_children.push(&length_input);
    js_sys::Reflect::set(&length_group, &"children".into(), &length_children).unwrap();
    
    // 生成ボタン
    let generate_button = js_sys::Object::new();
    js_sys::Reflect::set(&generate_button, &"tag".into(), &"button".into()).unwrap();
    js_sys::Reflect::set(&generate_button, &"type".into(), &"button".into()).unwrap();
    js_sys::Reflect::set(&generate_button, &"id".into(), &"generate-button".into()).unwrap();
    js_sys::Reflect::set(&generate_button, &"text".into(), &"パスワードを生成".into()).unwrap();
    
    // 結果表示エリア
    let result_area = js_sys::Object::new();
    js_sys::Reflect::set(&result_area, &"tag".into(), &"div".into()).unwrap();
    js_sys::Reflect::set(&result_area, &"id".into(), &"result-area".into()).unwrap();
    js_sys::Reflect::set(&result_area, &"class".into(), &"result-area".into()).unwrap();
    
    let password_display = js_sys::Object::new();
    js_sys::Reflect::set(&password_display, &"tag".into(), &"input".into()).unwrap();
    js_sys::Reflect::set(&password_display, &"type".into(), &"text".into()).unwrap();
    js_sys::Reflect::set(&password_display, &"id".into(), &"password-display".into()).unwrap();
    js_sys::Reflect::set(&password_display, &"readonly".into(), &true.into()).unwrap();
    
    let copy_button = js_sys::Object::new();
    js_sys::Reflect::set(&copy_button, &"tag".into(), &"button".into()).unwrap();
    js_sys::Reflect::set(&copy_button, &"type".into(), &"button".into()).unwrap();
    js_sys::Reflect::set(&copy_button, &"id".into(), &"copy-button".into()).unwrap();
    js_sys::Reflect::set(&copy_button, &"text".into(), &"コピー".into()).unwrap();
    
    let result_children = js_sys::Array::new();
    result_children.push(&password_display);
    result_children.push(&copy_button);
    js_sys::Reflect::set(&result_area, &"children".into(), &result_children).unwrap();
    
    // フォームの子要素を設定
    let form_children = js_sys::Array::new();
    form_children.push(&pass_phrase_group);
    form_children.push(&service_name_group);
    form_children.push(&version_group);
    form_children.push(&mode_group);
    form_children.push(&length_group);
    form_children.push(&generate_button);
    form_children.push(&result_area);
    js_sys::Reflect::set(&form, &"children".into(), &form_children).unwrap();
    
    // メインの子要素を設定
    let main_children = js_sys::Array::new();
    main_children.push(&form);
    js_sys::Reflect::set(&main, &"children".into(), &main_children).unwrap();
    
    // アプリケーションの子要素を設定
    let app_children = js_sys::Array::new();
    app_children.push(&header);
    app_children.push(&main);
    js_sys::Reflect::set(&app, &"children".into(), &app_children).unwrap();
    
    // 構造をJavaScriptの値として返す
    app.into()
}

// フォームグループを作成するヘルパー関数
fn create_form_group(id: &str, label_text: &str, input_type: &str, placeholder: &str) -> JsValue {
    let group = js_sys::Object::new();
    js_sys::Reflect::set(&group, &"tag".into(), &"div".into()).unwrap();
    js_sys::Reflect::set(&group, &"class".into(), &"form-group".into()).unwrap();
    
    let label = js_sys::Object::new();
    js_sys::Reflect::set(&label, &"tag".into(), &"label".into()).unwrap();
    js_sys::Reflect::set(&label, &"for".into(), &id.into()).unwrap();
    js_sys::Reflect::set(&label, &"text".into(), &label_text.into()).unwrap();
    
    let input = js_sys::Object::new();
    js_sys::Reflect::set(&input, &"tag".into(), &"input".into()).unwrap();
    js_sys::Reflect::set(&input, &"type".into(), &input_type.into()).unwrap();
    js_sys::Reflect::set(&input, &"id".into(), &id.into()).unwrap();
    js_sys::Reflect::set(&input, &"placeholder".into(), &placeholder.into()).unwrap();
    
    let children = js_sys::Array::new();
    children.push(&label);
    children.push(&input);
    js_sys::Reflect::set(&group, &"children".into(), &children).unwrap();
    
    group.into()
}

// セレクトオプションを作成するヘルパー関数
fn create_option(value: &str, text: &str, selected: bool) -> JsValue {
    let option = js_sys::Object::new();
    js_sys::Reflect::set(&option, &"tag".into(), &"option".into()).unwrap();
    js_sys::Reflect::set(&option, &"value".into(), &value.into()).unwrap();
    js_sys::Reflect::set(&option, &"text".into(), &text.into()).unwrap();
    
    if selected {
        js_sys::Reflect::set(&option, &"selected".into(), &true.into()).unwrap();
    }
    
    option.into()
}

// イベントハンドラのコールバック登録
#[wasm_bindgen]
pub fn register_event_handler(event_type: &str, element_id: &str, callback: &js_sys::Function) -> bool {
    // 実際の実装では、イベントタイプと要素IDに基づいてコールバックを登録する
    // この例では単純に成功を返す
    web_sys::console::log_1(&format!("Registered {} event for {}", event_type, element_id).into());
    true
}

// 現在の設定を取得
#[wasm_bindgen]
pub fn get_current_config() -> JsValue {
    PASSWORD_CONFIG.with(|config| {
        let config = config.borrow();
        let js_config = js_sys::Object::new();
        
        js_sys::Reflect::set(&js_config, &"passPhrase".into(), &config.pass_phrase.clone().into()).unwrap();
        js_sys::Reflect::set(&js_config, &"serviceName".into(), &config.service_name.clone().into()).unwrap();
        js_sys::Reflect::set(&js_config, &"version".into(), &config.version.clone().into()).unwrap();
        js_sys::Reflect::set(&js_config, &"mode".into(), &config.mode.to_string().into()).unwrap();
        js_sys::Reflect::set(&js_config, &"length".into(), &(config.length as u32).into()).unwrap();
        
        js_config.into()
    })
}