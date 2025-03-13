mod settings_validator;

use crate::crypto::cksum::Cksum;

use crate::password::{
    data::{PasswordMode, PasswordSettings},
    error::{GenerationError, PasswordError},
};

/// パスワード生成器
///
/// この構造体は、ユーザーが指定した設定に基づいて安全なパスワードを生成するための
/// 静的メソッドを提供します。
///
/// # 使用例
///
/// ```
/// use key_tuner_core::{PasswordGenerator, PasswordSettings};
///
/// // パスワード設定を作成
/// let settings = PasswordSettings {
///     pass_phrase: "my passphrase".to_string(),
///     service_name: "example.com".to_string(),
///     version: "1".to_string(),
///     mode: "ex".to_string(),
///     length: "16".to_string(),
/// };
///
/// // 設定を検証
/// if let Err(error) = PasswordGenerator::validate_settings(&settings) {
///     println!("設定エラー: {:?}", error);
///     return;
/// }
///
/// // パスワードを生成
/// match PasswordGenerator::generate(&settings) {
///     Ok(password) => println!("生成されたパスワード: {}", password),
///     Err(error) => println!("パスワード生成エラー: {:?}", error),
/// }
/// ```
#[derive(Debug)]
pub struct PasswordGenerator;

/// パスワード生成の設定（検証済み）
///
/// この構造体は、`PasswordSettings`から変換された検証済みの設定を保持します。
/// 内部的に使用され、すべてのフィールドが適切な型と範囲に変換されています。
#[derive(Debug, Clone)]
struct ValidatedPasswordSettings<'a> {
    /// パスフレーズ（検証済み）
    pass_phrase: &'a str,
    /// サービス名（検証済み）
    service_name: &'a str,
    /// バージョン（検証済み）
    version: &'a str,
    /// 生成モード（検証済み）
    mode: PasswordMode,
    /// パスワードの長さ (8-64)（検証済み）
    length: usize,
}

impl PasswordGenerator {
    /// パスワード設定を検証します
    ///
    /// 指定された設定が有効かどうかを検証し、問題がなければ`Ok(())`を返します。
    /// 無効な設定の場合は、具体的なエラー情報を含む`PasswordError`を返します。
    ///
    /// # 引数
    ///
    /// * `settings` - 検証するパスワード設定
    ///
    /// # 戻り値
    ///
    /// * `Ok(())` - 設定が有効な場合
    /// * `Err(PasswordError)` - 設定が無効な場合、エラーの詳細を含む
    ///
    /// # 例
    ///
    /// ```
    /// use key_tuner_core::{PasswordGenerator, PasswordSettings};
    ///
    /// // 有効な設定
    /// let valid_settings = PasswordSettings {
    ///     pass_phrase: "my passphrase".to_string(),
    ///     service_name: "example.com".to_string(),
    ///     version: "1".to_string(),
    ///     mode: "ex".to_string(),
    ///     length: "16".to_string(),
    /// };
    ///
    /// assert!(PasswordGenerator::validate_settings(&valid_settings).is_ok());
    ///
    /// // 無効な設定（長さが短すぎる）
    /// let invalid_settings = PasswordSettings {
    ///     pass_phrase: "my passphrase".to_string(),
    ///     service_name: "example.com".to_string(),
    ///     version: "1".to_string(),
    ///     mode: "ex".to_string(),
    ///     length: "5".to_string(), // 最小値は8
    /// };
    ///
    /// assert!(PasswordGenerator::validate_settings(&invalid_settings).is_err());
    /// ```
    pub fn validate_settings(settings: &PasswordSettings) -> Result<(), PasswordError> {
        // ValidatedPasswordSettings::try_from を使用して設定を検証
        ValidatedPasswordSettings::try_from(settings)?;

        // 検証に成功した場合は Ok(()) を返す
        Ok(())
    }

    /// パスワードを生成します
    ///
    /// 指定された設定に基づいて、決定論的なパスワードを生成します。
    /// 同じ入力パラメータからは常に同じパスワードが生成されます。
    ///
    /// # アルゴリズム
    ///
    /// 1. 入力パラメータ（パスフレーズ、サービス名、バージョン）の検証
    /// 2. 各入力文字列のCRC-32チェックサムの合計を計算
    /// 3. 合計値を長さ倍にして、シードを作成
    /// 4. 選択されたモードに応じた文字セットの選択
    /// 5. シードを使用して、指定された長さのパスワードを生成
    ///
    /// # 引数
    ///
    /// * `settings` - パスワード生成に使用する設定
    ///
    /// # 戻り値
    ///
    /// * `Ok(String)` - 生成されたパスワード
    /// * `Err(PasswordError)` - 設定が無効な場合、エラーの詳細を含む
    ///
    /// # 例
    ///
    /// ```
    /// use key_tuner_core::{PasswordGenerator, PasswordSettings};
    ///
    /// // パスワード設定を作成
    /// let settings = PasswordSettings {
    ///     pass_phrase: "example".to_string(),
    ///     service_name: "my-service".to_string(),
    ///     version: "0".to_string(),
    ///     mode: "ex".to_string(),
    ///     length: "16".to_string(),
    /// };
    ///
    /// // パスワードを生成
    /// let password = PasswordGenerator::generate(&settings).unwrap();
    /// assert_eq!(password.len(), 16);
    ///
    /// // 同じ設定からは同じパスワードが生成される
    /// let password2 = PasswordGenerator::generate(&settings).unwrap();
    /// assert_eq!(password, password2);
    /// ```
    ///
    /// # 注意
    ///
    /// この関数は `references/tune.sh` シェルスクリプトの移植であり、
    /// 元のスクリプトの挙動を正確に保持することが重要です。
    /// 互換性を維持するために、アルゴリズムの詳細は慎重に実装されています。
    pub fn generate(settings: &PasswordSettings) -> Result<String, PasswordError> {
        // 設定を検証
        let validated_settings = ValidatedPasswordSettings::try_from(settings)?;
        
        // 検証済み設定でパスワードを生成
        Self::generate_with_validated_settings(validated_settings)
    }
    
    /// 検証済み設定を使用してパスワードを生成します（内部実装）
    ///
    /// # 引数
    ///
    /// * `validated_settings` - 検証済みのパスワード設定
    ///
    /// # 戻り値
    ///
    /// * `Ok(String)` - 生成されたパスワード
    /// * `Err(PasswordError)` - 生成プロセスでエラーが発生した場合
    fn generate_with_validated_settings(validated_settings: ValidatedPasswordSettings) -> Result<String, PasswordError> {
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
        let mut repeat_count = 0;
        // 同じ文字が連続して現れる最大試行回数
        const MAX_REPEAT_ATTEMPTS: usize = 100;

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
                repeat_count = 0;
            } else {
                // 同じ文字が連続して現れた場合、カウントを増やす
                repeat_count += 1;
                
                // 一定回数以上同じ文字が連続して現れた場合はエラーを返す
                if repeat_count >= MAX_REPEAT_ATTEMPTS {
                    return Err(PasswordError::default().with_generation_error(
                        GenerationError::CharacterRepetitionLimit(
                            current_char,
                            MAX_REPEAT_ATTEMPTS,
                        ),
                    ));
                }
            }

            i += 1;
        }

        Ok(result)
    }

    /// 文字列の各文字のCRC-32チェックサムの合計を計算します
    ///
    /// 入力文字列の各文字に対してCRC-32チェックサムを計算し、
    /// その合計を返します。
    ///
    /// # 引数
    ///
    /// * `input` - チェックサムを計算する文字列
    ///
    /// # 戻り値
    ///
    /// * `u64` - 計算されたチェックサムの合計
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
    fn test_validate_settings() {
        // 有効な設定
        let valid_settings = PasswordSettings {
            pass_phrase: "my passphrase".to_string(),
            service_name: "example.com".to_string(),
            version: "1".to_string(),
            mode: "ex".to_string(),
            length: "16".to_string(),
        };

        // 検証が成功することを確認
        assert!(PasswordGenerator::validate_settings(&valid_settings).is_ok());
    }

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

    #[test]
    fn test_character_repetition_limit() {
        // 空の入力パラメータを使用して、同じ文字が連続して現れるケースをテスト
        // 空の文字列のチェックサムは同じになるため、同じ文字が連続して現れやすくなる
        
        // 検証をスキップするために、直接 ValidatedPasswordSettings を作成
        let validated_settings = ValidatedPasswordSettings {
            pass_phrase: "",
            service_name: "",
            version: "",
            mode: PasswordMode::Ex,
            length: 16, // 適当な長さ
        };
        
        // generate_with_validated_settings を使用してパスワード生成を試みる
        let result = PasswordGenerator::generate_with_validated_settings(validated_settings);
        
        // エラーが返されることを確認
        assert!(result.is_err());
        
        // 返されたエラーが CharacterRepetitionLimit であることを確認
        if let Err(err) = result {
            if let Some(generation_error) = err.generation() {
                match generation_error {
                    GenerationError::CharacterRepetitionLimit(_, attempts) => {
                        assert_eq!(*attempts, 100); // MAX_REPEAT_ATTEMPTS の値
                    }
                }
            } else {
                panic!("Expected GenerationError::CharacterRepetitionLimit");
            }
        }
    }
}
