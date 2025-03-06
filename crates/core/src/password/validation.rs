use crate::password::data::PasswordMode;

/// パスワード生成時のエラー
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PasswordError {
    /// パスフレーズのエラー
    pass_phrase: Option<TextError>,
    /// サービス名のエラー
    service_name: Option<TextError>,
    /// バージョンのエラー
    version: Option<TextError>,
    /// 不正なパスワード生成モード
    mode: Option<ModeError>,
    /// パスワードの長さに関するエラー
    length: Option<LengthError>,
}

/// テキスト入力に関するエラー
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TextError {
    /// 入力が長すぎる（最大長）
    TooLong(usize),
}

/// パスワード生成モードに関するエラー
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ModeError {
    /// 不正なモード
    InvalidMode,
}

/// パスワードの長さに関するエラー
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LengthError {
    /// 文字列から usize への変換に失敗
    InvalidLength,
    /// 値が最小値を下回る
    BelowMinimum(usize),
    /// 値が最大値を超える
    ExceedsMaximum(usize),
}

impl PasswordError {
    /// パスフレーズのエラーを取得
    pub fn pass_phrase(&self) -> &Option<TextError> {
        &self.pass_phrase
    }

    /// サービス名のエラーを取得
    pub fn service_name(&self) -> &Option<TextError> {
        &self.service_name
    }

    /// バージョンのエラーを取得
    pub fn version(&self) -> &Option<TextError> {
        &self.version
    }

    /// モードのエラーを取得
    pub fn mode(&self) -> &Option<ModeError> {
        &self.mode
    }

    /// 長さのエラーを取得
    pub fn length(&self) -> &Option<LengthError> {
        &self.length
    }

    /// パスフレーズのエラーを設定
    pub fn with_pass_phrase_error(mut self, error: TextError) -> Self {
        self.pass_phrase = Some(error);
        self
    }

    /// サービス名のエラーを設定
    pub fn with_service_name_error(mut self, error: TextError) -> Self {
        self.service_name = Some(error);
        self
    }

    /// バージョンのエラーを設定
    pub fn with_version_error(mut self, error: TextError) -> Self {
        self.version = Some(error);
        self
    }

    /// モードのエラーを設定
    pub fn with_mode_error(mut self, error: ModeError) -> Self {
        self.mode = Some(error);
        self
    }

    /// 長さのエラーを設定
    pub fn with_length_error(mut self, error: LengthError) -> Self {
        self.length = Some(error);
        self
    }
}

/// テキスト検証用の構造体
pub struct TextValidator<'a>(&'a str);

impl<'a> TextValidator<'a> {
    pub fn new(text: &'a str) -> Self {
        Self(text)
    }

    /// テキストの長さが指定された最大長以下であることを検証
    pub fn max_length(self, max_length: usize) -> Result<Self, TextError> {
        if self.0.len() > max_length {
            return Err(TextError::TooLong(max_length));
        }
        Ok(Self(self.0))
    }

    /// 検証が完了した後、内部の文字列を取り出す
    pub fn finish(self) -> &'a str {
        self.0
    }
}

/// パスワード生成モードを検証するための構造体
pub struct ModeValidator(Result<PasswordMode, ModeError>);

impl ModeValidator {
    /// 新しい ModeValidator インスタンスを作成
    pub fn new(mode: &str) -> Self {
        let result = match mode {
            "ex" => Ok(PasswordMode::Ex),
            "full" => Ok(PasswordMode::Full),
            "short" => Ok(PasswordMode::Short),
            _ => Err(ModeError::InvalidMode),
        };
        Self(result)
    }

    /// モードが有効であることを検証
    pub fn mode(self) -> Result<Self, ModeError> {
        match self.0 {
            Ok(_) => Ok(self),
            Err(e) => Err(e),
        }
    }

    /// 検証が完了した後、内部のパスワードモードを取り出す
    /// エラーの場合は None を返す
    pub fn finish(self) -> Option<PasswordMode> {
        self.0.ok()
    }
}

/// パスワードの長さを検証するための構造体
pub struct LengthValidator(Result<usize, LengthError>);

impl LengthValidator {
    /// 新しい LengthValidator インスタンスを作成
    pub fn new(text: &str) -> Self {
        Self(
            text.parse::<usize>()
                .map_err(|_| LengthError::InvalidLength),
        )
    }

    /// 文字列が有効な長さ（数値）であることを検証
    pub fn length(self) -> Result<Self, LengthError> {
        match self.0 {
            Ok(_) => Ok(self),
            Err(e) => Err(e),
        }
    }

    /// 長さが指定された最小値以上であることを検証
    pub fn min_length(self, min: usize) -> Result<Self, LengthError> {
        match self.0 {
            Ok(length) if length < min => Err(LengthError::BelowMinimum(min)),
            Ok(length) => Ok(Self(Ok(length))),
            Err(e) => Err(e),
        }
    }

    /// 長さが指定された最大値以下であることを検証
    pub fn max_length(self, max: usize) -> Result<Self, LengthError> {
        match self.0 {
            Ok(length) if length > max => Err(LengthError::ExceedsMaximum(max)),
            Ok(length) => Ok(Self(Ok(length))),
            Err(e) => Err(e),
        }
    }

    /// 検証が完了した後、内部の数値を返す
    /// エラーが発生した場合は None を返す
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
