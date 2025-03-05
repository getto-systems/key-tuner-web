//! Key Tuner Core
//!
//! パスワード生成のコアロジックを提供するクレート

use sha2::{Sha256, Digest};
use std::fmt;

/// パスワード生成モード
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PasswordMode {
    /// 大文字小文字数字記号を含むパスワード
    Ex,
    /// 後方互換性のために残されている生成モード
    Full,
    /// 小文字数字のみのモード
    Short,
}

impl fmt::Display for PasswordMode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PasswordMode::Ex => write!(f, "ex"),
            PasswordMode::Full => write!(f, "full"),
            PasswordMode::Short => write!(f, "short"),
        }
    }
}

impl TryFrom<&str> for PasswordMode {
    type Error = String;

    fn try_from(s: &str) -> Result<Self, Self::Error> {
        match s.to_lowercase().as_str() {
            "ex" => Ok(PasswordMode::Ex),
            "full" => Ok(PasswordMode::Full),
            "short" => Ok(PasswordMode::Short),
            _ => Err(format!("不正なパスワード生成モード: {}", s)),
        }
    }
}

/// パスワード生成の設定
#[derive(Debug, Clone)]
pub struct PasswordSettings {
    /// パスフレーズ
    pub pass_phrase: String,
    /// サービス名
    pub service_name: String,
    /// バージョン
    pub version: String,
    /// 生成モード
    pub mode: PasswordMode,
    /// パスワードの長さ (8-64)
    pub length: usize,
}

impl PasswordSettings {
    /// 新しいパスワード設定を作成
    pub fn new(
        pass_phrase: String,
        service_name: String,
        version: String,
        mode: PasswordMode,
        length: usize,
    ) -> Result<Self, String> {
        // 長さの検証
        if length < 8 || length > 64 {
            return Err(format!("パスワードの長さは8から64の間である必要があります: {}", length));
        }

        Ok(Self {
            pass_phrase,
            service_name,
            version,
            mode,
            length,
        })
    }
}

/// パスワード生成器
#[derive(Debug)]
pub struct PasswordGenerator;

impl PasswordGenerator {
    /// パスワードを生成
    pub fn generate(settings: &PasswordSettings) -> String {
        // 入力文字列を結合
        let input = format!(
            "{}:{}:{}:{}",
            settings.pass_phrase,
            settings.service_name,
            settings.version,
            settings.mode
        );

        // SHA-256ハッシュを計算
        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes());
        let hash = hasher.finalize();
        let hash_hex = format!("{:x}", hash);

        // モードに応じた文字セットを選択
        let charset = match settings.mode {
            PasswordMode::Ex => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?",
            PasswordMode::Full => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
            PasswordMode::Short => "abcdefghijklmnopqrstuvwxyz0123456789",
        };

        // ハッシュ値を使用してパスワードを生成
        let mut password = String::with_capacity(settings.length);
        let charset_len = charset.len();
        let charset_chars: Vec<char> = charset.chars().collect();

        for i in 0..settings.length {
            // ハッシュの各バイトを使用して文字を選択
            let idx = (hash[i % hash.len()] as usize) % charset_len;
            password.push(charset_chars[idx]);
        }

        // モードに応じて文字要件を確認
        match settings.mode {
            PasswordMode::Ex => ensure_ex_requirements(&mut password, &charset_chars),
            PasswordMode::Full => ensure_full_requirements(&mut password, &charset_chars),
            PasswordMode::Short => password, // shortモードは追加の要件なし
        }
    }
}

/// Exモードの要件（大文字、小文字、数字、記号を含む）を確保
fn ensure_ex_requirements(password: &mut String, charset: &[char]) -> String {
    let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
    let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
    let has_number = password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = password.chars().any(|c| !c.is_alphanumeric());

    let mut chars: Vec<char> = password.chars().collect();
    let len = chars.len();

    // 各カテゴリが含まれていない場合は追加
    if !has_uppercase {
        chars[0] = 'A';
    }
    if !has_lowercase {
        chars[1 % len] = 'a';
    }
    if !has_number {
        chars[2 % len] = '1';
    }
    if !has_symbol {
        chars[3 % len] = '!';
    }

    chars.into_iter().collect()
}

/// Fullモードの要件（大文字、小文字、数字を含む）を確保
fn ensure_full_requirements(password: &mut String, charset: &[char]) -> String {
    let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
    let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
    let has_number = password.chars().any(|c| c.is_ascii_digit());

    let mut chars: Vec<char> = password.chars().collect();
    let len = chars.len();

    // 各カテゴリが含まれていない場合は追加
    if !has_uppercase {
        chars[0] = 'A';
    }
    if !has_lowercase {
        chars[1 % len] = 'a';
    }
    if !has_number {
        chars[2 % len] = '1';
    }

    chars.into_iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_settings_validation() {
        // 有効な設定
        let result = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Ex,
            12,
        );
        assert!(result.is_ok());

        // 無効な長さ（短すぎる）
        let result = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Ex,
            7,
        );
        assert!(result.is_err());

        // 無効な長さ（長すぎる）
        let result = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Ex,
            65,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_password_mode_from_str() {
        assert_eq!(PasswordMode::try_from("ex").unwrap(), PasswordMode::Ex);
        assert_eq!(PasswordMode::try_from("full").unwrap(), PasswordMode::Full);
        assert_eq!(PasswordMode::try_from("short").unwrap(), PasswordMode::Short);
        
        // 大文字小文字を区別しない
        assert_eq!(PasswordMode::try_from("EX").unwrap(), PasswordMode::Ex);
        
        // 無効なモード
        assert!(PasswordMode::try_from("invalid").is_err());
    }

    #[test]
    fn test_password_length() {
        let settings = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Ex,
            16,
        ).unwrap();
        
        let password = PasswordGenerator::generate(&settings);
        
        assert_eq!(password.len(), 16);
    }

    #[test]
    fn test_password_ex_mode_requirements() {
        let settings = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Ex,
            12,
        ).unwrap();
        
        let password = PasswordGenerator::generate(&settings);
        
        assert!(password.chars().any(|c| c.is_ascii_uppercase()));
        assert!(password.chars().any(|c| c.is_ascii_lowercase()));
        assert!(password.chars().any(|c| c.is_ascii_digit()));
        assert!(password.chars().any(|c| !c.is_alphanumeric()));
    }

    #[test]
    fn test_password_full_mode_requirements() {
        let settings = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Full,
            12,
        ).unwrap();
        
        let password = PasswordGenerator::generate(&settings);
        
        assert!(password.chars().any(|c| c.is_ascii_uppercase()));
        assert!(password.chars().any(|c| c.is_ascii_lowercase()));
        assert!(password.chars().any(|c| c.is_ascii_digit()));
        // Fullモードでは記号は含まれない
        assert!(!password.chars().any(|c| !c.is_alphanumeric()));
    }

    #[test]
    fn test_password_short_mode_requirements() {
        let settings = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Short,
            12,
        ).unwrap();
        
        let password = PasswordGenerator::generate(&settings);
        
        // Shortモードでは大文字は含まれない
        assert!(!password.chars().any(|c| c.is_ascii_uppercase()));
        // Shortモードでは小文字と数字のみ
        assert!(password.chars().any(|c| c.is_ascii_lowercase()));
        assert!(password.chars().any(|c| c.is_ascii_digit()));
        // Shortモードでは記号は含まれない
        assert!(!password.chars().any(|c| !c.is_alphanumeric()));
    }

    #[test]
    fn test_deterministic_password_generation() {
        // 同じ入力パラメータで2回パスワードを生成
        let settings = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Ex,
            12,
        ).unwrap();
        
        let password1 = PasswordGenerator::generate(&settings);
        let password2 = PasswordGenerator::generate(&settings);
        
        // 同じ入力からは同じパスワードが生成されるはず
        assert_eq!(password1, password2);
        
        // 異なるサービス名で生成
        let settings2 = PasswordSettings::new(
            "my passphrase".to_string(),
            "different.com".to_string(),
            "1".to_string(),
            PasswordMode::Ex,
            12,
        ).unwrap();
        
        let password3 = PasswordGenerator::generate(&settings2);
        
        // 異なる入力からは異なるパスワードが生成されるはず
        assert_ne!(password1, password3);
    }
}