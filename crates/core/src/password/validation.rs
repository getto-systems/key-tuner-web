use crate::password::{
    data::PasswordMode,
    error::{LengthError, ModeError, TextError},
};

/// テキスト検証用の構造体
///
/// この構造体は、テキスト入力（パスフレーズ、サービス名、バージョンなど）の
/// 検証を行うためのビルダーパターンを実装しています。
///
/// # 使用例
///
/// ```
/// use key_tuner_core::TextValidator;
/// use key_tuner_core::TextError;
///
/// // テキストを検証
/// let text = "example";
/// let result = TextValidator::new(text)
///     .max_length(255) // 最大長を指定
///     .map(|v| v.finish()); // 検証が成功したら文字列を取得
///
/// assert_eq!(result.unwrap(), "example");
///
/// // 長すぎるテキストの検証
/// let long_text = "a".repeat(300);
/// let result = TextValidator::new(&long_text).max_length(255);
/// assert!(result.is_err());
/// ```
pub struct TextValidator<'a>(&'a str);

impl<'a> TextValidator<'a> {
    /// 新しいTextValidatorインスタンスを作成します
    ///
    /// # 引数
    ///
    /// * `text` - 検証する文字列
    ///
    /// # 戻り値
    ///
    /// * `TextValidator` - 新しいバリデータインスタンス
    pub fn new(text: &'a str) -> Self {
        Self(text)
    }

    /// テキストの長さが指定された最大長以下であることを検証します
    ///
    /// # 引数
    ///
    /// * `max_length` - 許容される最大文字数
    ///
    /// # 戻り値
    ///
    /// * `Ok(Self)` - 検証が成功した場合
    /// * `Err(TextError::TooLong)` - テキストが最大長を超える場合
    ///
    /// # 例
    ///
    /// ```
    /// use key_tuner_core::TextValidator;
    /// use key_tuner_core::TextError;
    ///
    /// // 有効なテキスト
    /// let text = "example";
    /// let result = TextValidator::new(text).max_length(10);
    /// assert!(result.is_ok());
    ///
    /// // 長すぎるテキスト
    /// let result = TextValidator::new("too long text").max_length(5);
    /// assert!(matches!(result, Err(TextError::TooLong(5))));
    /// ```
    pub fn max_length(self, max_length: usize) -> Result<Self, TextError> {
        if self.0.len() > max_length {
            return Err(TextError::TooLong(max_length));
        }
        Ok(Self(self.0))
    }

    /// テキストが空でないことを検証します
    ///
    /// # 戻り値
    ///
    /// * `Ok(Self)` - テキストが空でない場合
    /// * `Err(TextError::Empty)` - テキストが空の場合
    ///
    /// # 例
    ///
    /// ```
    /// use key_tuner_core::TextValidator;
    /// use key_tuner_core::TextError;
    ///
    /// // 有効なテキスト
    /// let text = "example";
    /// let result = TextValidator::new(text).present();
    /// assert!(result.is_ok());
    ///
    /// // 空のテキスト
    /// let result = TextValidator::new("").present();
    /// assert!(matches!(result, Err(TextError::Empty)));
    /// ```
    pub fn present(self) -> Result<Self, TextError> {
        if self.0.is_empty() {
            return Err(TextError::Empty);
        }
        Ok(Self(self.0))
    }

    /// 検証が完了した後、内部の文字列を取り出します
    ///
    /// # 戻り値
    ///
    /// * `&'a str` - 検証済みの文字列
    pub fn finish(self) -> &'a str {
        self.0
    }
}

/// パスワード生成モードを検証するための構造体
///
/// この構造体は、パスワード生成モード（"ex", "full", "short"）の
/// 検証を行うためのビルダーパターンを実装しています。
///
/// # 使用例
///
/// ```
/// use key_tuner_core::ModeValidator;
/// use key_tuner_core::ModeError;
///
/// // 有効なモード
/// let result = ModeValidator::new("ex").mode();
/// assert!(result.is_ok());
/// let mode = ModeValidator::new("ex").finish();
/// assert!(mode.is_some());
///
/// // 無効なモード
/// let result = ModeValidator::new("invalid").mode();
/// assert!(matches!(result, Err(ModeError::InvalidMode)));
/// ```
pub struct ModeValidator(Result<PasswordMode, ModeError>);

impl ModeValidator {
    /// 新しいModeValidatorインスタンスを作成します
    ///
    /// # 引数
    ///
    /// * `mode` - 検証するモード文字列 ("ex", "full", "short")
    ///
    /// # 戻り値
    ///
    /// * `ModeValidator` - 新しいバリデータインスタンス
    pub fn new(mode: &str) -> Self {
        let result = match mode {
            "ex" => Ok(PasswordMode::Ex),
            "full" => Ok(PasswordMode::Full),
            "short" => Ok(PasswordMode::Short),
            _ => Err(ModeError::InvalidMode),
        };
        Self(result)
    }

    /// モードが有効であることを検証します
    ///
    /// # 戻り値
    ///
    /// * `Ok(Self)` - モードが有効な場合
    /// * `Err(ModeError::InvalidMode)` - モードが無効な場合
    pub fn mode(self) -> Result<Self, ModeError> {
        match self.0 {
            Ok(_) => Ok(self),
            Err(e) => Err(e),
        }
    }

    /// 検証が完了した後、内部のパスワードモードを取り出します
    /// エラーの場合は None を返します
    ///
    /// # 戻り値
    ///
    /// * `Option<PasswordMode>` - 検証済みのパスワードモード（有効な場合）
    pub fn finish(self) -> Option<PasswordMode> {
        self.0.ok()
    }
}

/// パスワードの長さを検証するための構造体
///
/// この構造体は、パスワードの長さの検証を行うためのビルダーパターンを実装しています。
/// 文字列から数値への変換、最小値・最大値のチェックなどを行います。
///
/// # 使用例
///
/// ```
/// use key_tuner_core::LengthValidator;
/// use key_tuner_core::LengthError;
///
/// // 有効な長さ
/// let result = LengthValidator::new("16")
///     .length()
///     .and_then(|v| v.min_length(8))
///     .and_then(|v| v.max_length(64));
/// assert!(result.is_ok());
///
/// // 無効な長さ（短すぎる）
/// let result = LengthValidator::new("4")
///     .length()
///     .and_then(|v| v.min_length(8));
/// assert!(matches!(result, Err(LengthError::BelowMinimum(8))));
/// ```
pub struct LengthValidator(Result<usize, LengthError>);

impl LengthValidator {
    /// 新しいLengthValidatorインスタンスを作成します
    ///
    /// # 引数
    ///
    /// * `text` - 検証する長さの文字列表現
    ///
    /// # 戻り値
    ///
    /// * `LengthValidator` - 新しいバリデータインスタンス
    pub fn new(text: &str) -> Self {
        Self(
            text.parse::<usize>()
                .map_err(|_| LengthError::InvalidLength),
        )
    }

    /// 文字列が有効な長さ（数値）であることを検証します
    ///
    /// # 戻り値
    ///
    /// * `Ok(Self)` - 文字列が有効な数値に変換できる場合
    /// * `Err(LengthError::InvalidLength)` - 文字列が数値に変換できない場合
    pub fn length(self) -> Result<Self, LengthError> {
        match self.0 {
            Ok(_) => Ok(self),
            Err(e) => Err(e),
        }
    }

    /// 長さが指定された最小値以上であることを検証します
    ///
    /// # 引数
    ///
    /// * `min` - 最小許容長
    ///
    /// # 戻り値
    ///
    /// * `Ok(Self)` - 長さが最小値以上の場合
    /// * `Err(LengthError::BelowMinimum)` - 長さが最小値未満の場合
    /// * `Err(LengthError::InvalidLength)` - 長さが無効な場合
    pub fn min_length(self, min: usize) -> Result<Self, LengthError> {
        match self.0 {
            Ok(length) if length < min => Err(LengthError::BelowMinimum(min)),
            Ok(length) => Ok(Self(Ok(length))),
            Err(e) => Err(e),
        }
    }

    /// 長さが指定された最大値以下であることを検証します
    ///
    /// # 引数
    ///
    /// * `max` - 最大許容長
    ///
    /// # 戻り値
    ///
    /// * `Ok(Self)` - 長さが最大値以下の場合
    /// * `Err(LengthError::ExceedsMaximum)` - 長さが最大値を超える場合
    /// * `Err(LengthError::InvalidLength)` - 長さが無効な場合
    pub fn max_length(self, max: usize) -> Result<Self, LengthError> {
        match self.0 {
            Ok(length) if length > max => Err(LengthError::ExceedsMaximum(max)),
            Ok(length) => Ok(Self(Ok(length))),
            Err(e) => Err(e),
        }
    }

    /// 検証が完了した後、内部の数値を返します
    /// エラーが発生した場合は None を返します
    ///
    /// # 戻り値
    ///
    /// * `Option<usize>` - 検証済みの長さ（有効な場合）
    pub fn finish(self) -> Option<usize> {
        self.0.ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_text_validator_max_length() {
        // 正常なケース - 最大長以下のテキスト
        let validate = TextValidator::new("テスト");
        let result = validate.max_length(10);
        assert!(result.is_ok());

        // 正常なケース - 最大長と同じ長さのテキスト
        let text = "あいうえお"; // 5文字だが15バイト
        let validate = TextValidator::new(text);
        let result = validate.max_length(15);
        assert!(result.is_ok());

        // 異常なケース - 最大長を超えるテキスト
        let text = "あいうえお"; // 5文字だが15バイト
        let validate = TextValidator::new(text);
        let result = validate.max_length(14);
        assert!(matches!(result, Err(TextError::TooLong(14))));
    }

    #[test]
    fn test_text_validator_method_chaining() {
        // メソッドチェーンの正常なケース
        let validate = TextValidator::new("テスト");
        let result = validate.max_length(10);
        assert!(result.is_ok());

        // メソッドチェーンの異常なケース - 最大長を超えるテキスト
        let text = "とても長いテキスト";
        let validate = TextValidator::new(text);
        let result = validate.max_length(5);
        assert!(matches!(result, Err(TextError::TooLong(5))));
    }

    #[test]
    fn test_text_validator_finish() {
        // 基本的な使用法
        let text = "テスト文字列";
        let validate = TextValidator::new(text);
        let result = validate.finish();
        assert_eq!(result, text);

        // バリデーション後の使用法
        let text = "検証済み"; // より短いテキストを使用
        let validate = TextValidator::new(text);
        let validated = validate.max_length(20).unwrap();
        let result = validated.finish();
        assert_eq!(result, text);

        // メソッドチェーンでの使用法
        let text = "チェーン検証";
        let result = TextValidator::new(text)
            .max_length(30) // より大きな最大長を使用
            .map(|v| v.finish());
        assert_eq!(result.unwrap(), text);
    }

    #[test]
    fn test_length_validator_new() {
        // 基本的な使用法
        let text = "12";
        let validator = LengthValidator::new(text);
        // new メソッドは内部状態を変更しないので、直接テストはできないが
        // 他のメソッドを通じて間接的に検証
        let result = validator.finish();
        assert_eq!(result, Some(12));
    }

    #[test]
    fn test_length_validator_length() {
        // 正常なケース - 有効な数値
        let validator = LengthValidator::new("42");
        let result = validator.length();
        assert!(result.is_ok());

        // 異常なケース - 無効な数値
        let validator = LengthValidator::new("invalid");
        let result = validator.length();
        if let Err(LengthError::InvalidLength) = result {
            // テスト成功
        } else {
            panic!("Expected InvalidLength error");
        }
    }

    #[test]
    fn test_length_validator_min_length() {
        // 正常なケース - 最小値以上
        let validator = LengthValidator::new("10");
        let result = validator.min_length(8);
        assert!(result.is_ok());

        // 正常なケース - 最小値と同じ
        let validator = LengthValidator::new("8");
        let result = validator.min_length(8);
        assert!(result.is_ok());

        // 異常なケース - 最小値未満
        let validator = LengthValidator::new("7");
        let result = validator.min_length(8);
        assert!(matches!(result, Err(LengthError::BelowMinimum(s)) if s == 8));

        // 異常なケース - 無効な数値
        let validator = LengthValidator::new("invalid");
        let result = validator.min_length(8);
        if let Err(LengthError::InvalidLength) = result {
            // テスト成功
        } else {
            panic!("Expected InvalidLength error");
        }
    }

    #[test]
    fn test_length_validator_max_length() {
        // 正常なケース - 最大値以下
        let validator = LengthValidator::new("32");
        let result = validator.max_length(64);
        assert!(result.is_ok());

        // 正常なケース - 最大値と同じ
        let validator = LengthValidator::new("64");
        let result = validator.max_length(64);
        assert!(result.is_ok());

        // 異常なケース - 最大値超過
        let validator = LengthValidator::new("65");
        let result = validator.max_length(64);
        assert!(matches!(result, Err(LengthError::ExceedsMaximum(s)) if s == 64));

        // 異常なケース - 無効な数値
        let validator = LengthValidator::new("invalid");
        let result = validator.max_length(64);
        if let Err(LengthError::InvalidLength) = result {
            // テスト成功
        } else {
            panic!("Expected InvalidLength error");
        }
    }

    #[test]
    fn test_length_validator_finish() {
        // 正常なケース - 有効な数値
        let validator = LengthValidator::new("42");
        let result = validator.finish();
        assert_eq!(result, Some(42));

        // 異常なケース - 無効な数値（None が返される）
        let validator = LengthValidator::new("invalid");
        let result = validator.finish();
        assert_eq!(result, None);
    }

    #[test]
    fn test_length_validator_method_chaining() {
        // 正常なケース - すべての検証を通過
        let result = LengthValidator::new("32")
            .length()
            .and_then(|v| v.min_length(8))
            .and_then(|v| v.max_length(64))
            .map(|v| v.finish());
        assert_eq!(result.unwrap(), Some(32));

        // 異常なケース - 最初の検証で失敗
        let result = LengthValidator::new("invalid")
            .length()
            .and_then(|v| v.min_length(8))
            .and_then(|v| v.max_length(64));
        if let Err(LengthError::InvalidLength) = result {
            // テスト成功
        } else {
            panic!("Expected InvalidLength error");
        }

        // 異常なケース - 2番目の検証で失敗
        let result = LengthValidator::new("7")
            .length()
            .and_then(|v| v.min_length(8))
            .and_then(|v| v.max_length(64));
        assert!(matches!(result, Err(LengthError::BelowMinimum(s)) if s == 8));

        // 異常なケース - 3番目の検証で失敗
        let result = LengthValidator::new("65")
            .length()
            .and_then(|v| v.min_length(8))
            .and_then(|v| v.max_length(64));
        assert!(matches!(result, Err(LengthError::ExceedsMaximum(s)) if s == 64));
    }

    #[test]
    fn test_mode_validator() {
        // Ex モードのテスト（小文字）
        let validator = ModeValidator::new("ex");
        let result = validator.mode();
        assert!(result.is_ok());
        let mode = ModeValidator::new("ex").finish().unwrap();
        assert_eq!(mode, PasswordMode::Ex);

        // Full モードのテスト（小文字）
        let validator = ModeValidator::new("full");
        let result = validator.mode();
        assert!(result.is_ok());
        let mode = ModeValidator::new("full").finish().unwrap();
        assert_eq!(mode, PasswordMode::Full);

        // Short モードのテスト（小文字）
        let validator = ModeValidator::new("short");
        let result = validator.mode();
        assert!(result.is_ok());
        let mode = ModeValidator::new("short").finish().unwrap();
        assert_eq!(mode, PasswordMode::Short);

        // 異常なケース - 無効なモード
        let validator = ModeValidator::new("invalid");
        let result = validator.mode();
        assert!(matches!(result, Err(ModeError::InvalidMode)));

        // finish メソッドのテスト - エラーケース（None を返す）
        let validator = ModeValidator::new("invalid");
        let result = validator.finish();
        assert_eq!(result, None);
    }
}
