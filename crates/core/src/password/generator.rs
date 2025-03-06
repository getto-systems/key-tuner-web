mod validate;

use crate::cksum::Cksum;

use crate::password::{
    data::{PasswordMode, PasswordSettings},
    validation::PasswordError,
};

/// パスワード生成器
#[derive(Debug)]
pub struct PasswordGenerator;

/// パスワード生成の設定
#[derive(Debug, Clone)]
pub struct ValidatedPasswordSettings<'a> {
    /// パスフレーズ
    pass_phrase: &'a str,
    /// サービス名
    service_name: &'a str,
    /// バージョン
    version: &'a str,
    /// 生成モード
    mode: PasswordMode,
    /// パスワードの長さ (8-64)
    length: usize,
}

impl PasswordGenerator {
    /// パスワードを生成
    pub fn generate(settings: &PasswordSettings) -> Result<String, PasswordError> {
        // 設定を検証
        let validated_settings = ValidatedPasswordSettings::try_from(settings)?;

        // 各入力文字列のCRC-32チェックサムの合計を計算
        let mut sum: u64 = 0;
        sum += Self::calculate_checksum_sum(&validated_settings.pass_phrase);
        sum += Self::calculate_checksum_sum(&validated_settings.service_name);
        sum += Self::calculate_checksum_sum(&validated_settings.version);

        // 合計値を長さ倍にする
        sum *= validated_settings.length as u64;

        // シードを作成（合計値を2回繰り返す）
        let seed = format!("{}{}", sum, sum);
        let sum_string = sum.to_string();

        // モードに応じた文字セットを選択
        let charset = match validated_settings.mode {
            PasswordMode::Ex => "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-/:;()&@.,?!'[]{}#%^*+=_|<>$",
            PasswordMode::Full => "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#&*%!?@#&*%!?@#&*%!?",
            PasswordMode::Short => "0123456789abcdefghijklmnopqrstuvwxyz",
        };

        // パスワードを生成
        let mut result = String::with_capacity(validated_settings.length);
        let mut last_char = None;
        let mut i = 0;

        while result.len() < validated_settings.length {
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

        Ok(result)
    }

    /// 文字列の各文字のCRC-32チェックサムの合計を計算
    fn calculate_checksum_sum(input: &str) -> u64 {
        let mut sum = 0;

        for c in input.chars() {
            // 各文字に対してCRC-32を計算
            let (checksum, _) = Cksum::compute_bytes(format!("{}\n", c).as_bytes());
            sum += checksum as u64;
        }

        sum
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_length() {
        let settings = PasswordSettings {
            pass_phrase: "my passphrase".to_string(),
            service_name: "example.com".to_string(),
            version: "1".to_string(),
            mode: "ex".to_string(),
            length: "16".to_string(),
        };

        let password = PasswordGenerator::generate(&settings).unwrap();

        assert_eq!(password.len(), 16);
    }

    #[test]
    fn test_deterministic_password_generation() {
        // 同じ入力パラメータで2回パスワードを生成
        let settings = PasswordSettings {
            pass_phrase: "my passphrase".to_string(),
            service_name: "example.com".to_string(),
            version: "1".to_string(),
            mode: "ex".to_string(),
            length: "12".to_string(),
        };

        let password1 = PasswordGenerator::generate(&settings).unwrap();
        let password2 = PasswordGenerator::generate(&settings).unwrap();

        // 同じ入力からは同じパスワードが生成されるはず
        assert_eq!(password1, password2);

        // 異なるサービス名で生成
        let settings2 = PasswordSettings {
            pass_phrase: "my passphrase".to_string(),
            service_name: "different.com".to_string(),
            version: "1".to_string(),
            mode: "ex".to_string(),
            length: "12".to_string(),
        };

        let password3 = PasswordGenerator::generate(&settings2).unwrap();

        // 異なる入力からは異なるパスワードが生成されるはず
        assert_ne!(password1, password3);
    }

    #[test]
    fn test_specific_password_generation_ex() {
        // 特定のパラメータでのパスワード生成をテスト
        let settings = PasswordSettings {
            pass_phrase: "example".to_string(),
            service_name: "my-service".to_string(),
            version: "0".to_string(),
            mode: "ex".to_string(),
            length: "32".to_string(),
        };

        let password = PasswordGenerator::generate(&settings).unwrap();

        assert_eq!(password, "ZMG*pc%=J%I?_IJIbARai.m6J%rGKuL4");
    }

    #[test]
    fn test_specific_password_generation_full() {
        // 特定のパラメータでのパスワード生成をテスト
        let settings = PasswordSettings {
            pass_phrase: "example".to_string(),
            service_name: "my-service".to_string(),
            version: "0".to_string(),
            mode: "full".to_string(),
            length: "32".to_string(),
        };

        let password = PasswordGenerator::generate(&settings).unwrap();

        assert_eq!(password, "?G1Brl&ki!8#0D%xc&pJbISp@0a7*#it");
    }

    #[test]
    fn test_specific_password_generation_short() {
        // 特定のパラメータでのパスワード生成をテスト
        let settings = PasswordSettings {
            pass_phrase: "example".to_string(),
            service_name: "my-service".to_string(),
            version: "0".to_string(),
            mode: "short".to_string(),
            length: "32".to_string(),
        };

        let password = PasswordGenerator::generate(&settings).unwrap();

        assert_eq!(password, "7u6spuqc980vq98bizs0ymo9q9oaub4u");
    }
}
