//! # Key Tuner Core
//!
//! `key-tuner-core`はパスワード生成のコアロジックを提供するクレートです。
//! このクレートは、ユーザーが指定したパスフレーズ、サービス名、バージョンなどの
//! 入力に基づいて、決定論的かつ安全なパスワードを生成します。
//!
//! ## 主な機能
//!
//! - 複数のパスワード生成モード（Ex、Full、Short）
//! - 設定の検証機能
//! - エラー処理
//!
//! ## 使用例
//!
//! ```
//! use key_tuner_core::{PasswordGenerator, PasswordSettings};
//!
//! // パスワード設定を作成
//! let settings = PasswordSettings {
//!     pass_phrase: "my passphrase".to_string(),
//!     service_name: "example.com".to_string(),
//!     version: "1".to_string(),
//!     mode: "ex".to_string(),
//!     length: "16".to_string(),
//! };
//!
//! // パスワードを生成
//! let password = PasswordGenerator::generate(&settings).unwrap();
//! assert_eq!(password.len(), 16);
//! ```
//!
//! ## モジュール構造
//!
//! - `crypto`: チェックサム計算などの暗号関連機能
//! - `password`: パスワード生成と検証のコア機能
//!   - `data`: パスワード設定のデータ構造
//!   - `error`: エラー型の定義
//!   - `generator`: パスワード生成ロジック
//!   - `validation`: 入力検証ロジック

mod crypto;
mod password;

pub use password::data::PasswordSettings;
pub use password::error::{LengthError, ModeError, PasswordError, TextError};
pub use password::generator::PasswordGenerator;
