//! Key Tuner Web
//! 
//! WebAssembly向けのパスワード生成インターフェース

use key_tuner_core::{PasswordGenerator, PasswordSettings};
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

// WebAssemblyのメモリアロケータとしてwee_allocを使用
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// パスワード生成器のグローバルインスタンス
thread_local! {
    static PASSWORD_GENERATOR: RefCell<PasswordGenerator> = RefCell::new(PasswordGenerator::default());
    static PASSWORD_SETTINGS: RefCell<PasswordSettings> = RefCell::new(PasswordSettings::default());
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
pub fn generate_password() -> String {
    PASSWORD_GENERATOR.with(|generator| {
        PASSWORD_SETTINGS.with(|settings| {
            let mut gen = generator.borrow_mut();
            gen.update_settings(settings.borrow().clone());
            gen.generate()
        })
    })
}

#[wasm_bindgen]
pub fn set_password_length(length: usize) {
    PASSWORD_SETTINGS.with(|settings| {
        settings.borrow_mut().length = length;
    });
}

#[wasm_bindgen]
pub fn set_include_uppercase(include: bool) {
    PASSWORD_SETTINGS.with(|settings| {
        settings.borrow_mut().include_uppercase = include;
    });
}

#[wasm_bindgen]
pub fn set_include_lowercase(include: bool) {
    PASSWORD_SETTINGS.with(|settings| {
        settings.borrow_mut().include_lowercase = include;
    });
}

#[wasm_bindgen]
pub fn set_include_numbers(include: bool) {
    PASSWORD_SETTINGS.with(|settings| {
        settings.borrow_mut().include_numbers = include;
    });
}

#[wasm_bindgen]
pub fn set_include_symbols(include: bool) {
    PASSWORD_SETTINGS.with(|settings| {
        settings.borrow_mut().include_symbols = include;
    });
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
    
    // アプリケーションの子要素を設定
    let app_children = js_sys::Array::new();
    app_children.push(&header);
    app_children.push(&main);
    js_sys::Reflect::set(&app, &"children".into(), &app_children).unwrap();
    
    // 構造をJavaScriptの値として返す
    app.into()
}

// イベントハンドラのコールバック登録
#[wasm_bindgen]
pub fn register_event_handler(event_type: &str, element_id: &str, callback: &js_sys::Function) -> bool {
    // 実際の実装では、イベントタイプと要素IDに基づいてコールバックを登録する
    // この例では単純に成功を返す
    web_sys::console::log_1(&format!("Registered {} event for {}", event_type, element_id).into());
    true
}