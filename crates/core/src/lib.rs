//! Key Tuner Core
//!
//! パスワード生成のコアロジックを提供するクレート

pub mod cksum;

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
            return Err(format!(
                "パスワードの長さは8から64の間である必要があります: {}",
                length
            ));
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
        // 各入力文字列のCRC-32チェックサムの合計を計算
        let mut sum: u64 = 0;
        sum += Self::calculate_checksum_sum(&settings.pass_phrase);
        sum += Self::calculate_checksum_sum(&settings.service_name);
        sum += Self::calculate_checksum_sum(&settings.version);

        // 合計値を長さ倍にする
        sum *= settings.length as u64;

        // シードを作成（合計値を2回繰り返す）
        let seed = format!("{}{}", sum, sum);
        let sum_string = sum.to_string();

        // モードに応じた文字セットを選択
        let charset = match settings.mode {
            PasswordMode::Ex => "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-/:;()&@.,?!'[]{}#%^*+=_|<>$",
            PasswordMode::Full => "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#&*%!?@#&*%!?@#&*%!?",
            PasswordMode::Short => "0123456789abcdefghijklmnopqrstuvwxyz",
        };

        // パスワードを生成
        let mut result = String::with_capacity(settings.length);
        let mut last_char = None;
        let mut i = 0;

        while result.len() < settings.length {
            // シードから3桁の数値を取得（シェルスクリプトと同じ動作にする）
            let seed_index = i % sum_string.len();
            let end_index = std::cmp::min(seed_index + 3, seed.len());
            let seed_slice = &seed[seed_index..end_index];

            // 変換に失敗した場合は0とする
            let seed_number = seed_slice.parse::<usize>().unwrap_or(0);

            // 文字のインデックスを計算
            let index = (seed_number * (i + 1)) % charset.len();

            // 文字を取得
            let current_char = charset.chars().nth(index).unwrap();

            // 前回と同じ文字でなければ追加
            if last_char != Some(current_char) {
                result.push(current_char);
                last_char = Some(current_char);
            }

            i += 1;
        }

        result
    }

    /// 文字列の各文字のCRC-32チェックサムの合計を計算
    fn calculate_checksum_sum(input: &str) -> u64 {
        let mut sum = 0;

        for c in input.chars() {
            // 各文字に対してCRC-32を計算
            let (checksum, _) = cksum::Cksum::compute_bytes(format!("{}\n", c).as_bytes());
            sum += checksum as u64;
        }

        sum
    }
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
        assert_eq!(
            PasswordMode::try_from("short").unwrap(),
            PasswordMode::Short
        );

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
        )
        .unwrap();

        let password = PasswordGenerator::generate(&settings);

        assert_eq!(password.len(), 16);
    }

    #[test]
    fn test_password_ex_mode_charset() {
        let settings = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Ex,
            12,
        )
        .unwrap();

        let password = PasswordGenerator::generate(&settings);

        // Exモードでは特殊文字を含む可能性がある
        for c in password.chars() {
            assert!(
                c.is_ascii_digit()
                    || c.is_ascii_lowercase()
                    || c.is_ascii_uppercase()
                    || "/-:;()&@.,?!'[]{}#%^*+=_|<>$".contains(c)
            );
        }
    }

    #[test]
    fn test_password_full_mode_charset() {
        let settings = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Full,
            12,
        )
        .unwrap();

        let password = PasswordGenerator::generate(&settings);

        // Fullモードでは特定の文字セットのみを使用
        for c in password.chars() {
            assert!(
                c.is_ascii_digit()
                    || c.is_ascii_lowercase()
                    || c.is_ascii_uppercase()
                    || "@#&*%!?".contains(c)
            );
        }
    }

    #[test]
    fn test_password_short_mode_charset() {
        let settings = PasswordSettings::new(
            "my passphrase".to_string(),
            "example.com".to_string(),
            "1".to_string(),
            PasswordMode::Short,
            12,
        )
        .unwrap();

        let password = PasswordGenerator::generate(&settings);

        // Shortモードでは小文字と数字のみ
        for c in password.chars() {
            assert!(c.is_ascii_digit() || c.is_ascii_lowercase());
        }
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
        )
        .unwrap();

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
        )
        .unwrap();

        let password3 = PasswordGenerator::generate(&settings2);

        // 異なる入力からは異なるパスワードが生成されるはず
        assert_ne!(password1, password3);
    }

    #[test]
    fn test_checksum_calculation() {
        // 単一文字のチェックサム計算をテスト
        let checksum_a = PasswordGenerator::calculate_checksum_sum("a");
        let checksum_b = PasswordGenerator::calculate_checksum_sum("b");

        // 異なる文字は異なるチェックサム値を持つはず
        assert_ne!(checksum_a, checksum_b);

        // 同じ文字列は同じチェックサム値を持つはず
        let checksum1 = PasswordGenerator::calculate_checksum_sum("test");
        let checksum2 = PasswordGenerator::calculate_checksum_sum("test");
        assert_eq!(checksum1, checksum2);
    }

    #[test]
    fn test_specific_password_generation() {
        // 特定のパラメータでのパスワード生成をテスト
        let settings = PasswordSettings::new(
            "example".to_string(),
            "my-service".to_string(),
            "0".to_string(),
            PasswordMode::Ex,
            32,
        )
        .unwrap();

        let password = PasswordGenerator::generate(&settings);

        assert_eq!(password, "ZMG*pc%=J%I?_IJIbARai.m6J%rGKuL4");
    }
}
