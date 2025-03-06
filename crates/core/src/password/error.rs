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
