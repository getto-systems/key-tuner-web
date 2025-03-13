/// パスワード生成時のエラー
///
/// この構造体は、パスワード生成時に発生する可能性のあるすべてのエラーを
/// 一つのオブジェクトにまとめて保持します。各フィールドは特定の入力パラメータに
/// 関連するエラーを表します。
///
/// # 使用例
///
/// ```
/// use key_tuner_core::{PasswordGenerator, PasswordSettings};
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
/// // エラーを取得して処理
/// if let Err(error) = PasswordGenerator::validate_settings(&invalid_settings) {
///     if let Some(length_error) = error.length() {
///         println!("長さのエラー: {:?}", length_error);
///     }
/// }
/// ```
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
    /// パスワード生成プロセスに関するエラー
    generation: Option<GenerationError>,
}

/// テキスト入力に関するエラー
///
/// テキスト入力（パスフレーズ、サービス名、バージョンなど）の
/// 検証時に発生するエラーを表します。
///
/// # バリアント
///
/// * `Empty` - 入力が空の場合。
/// * `TooLong(usize)` - 入力が指定された最大長を超えている場合。
///   パラメータは最大許容長を示します。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TextError {
    /// 入力が空
    Empty,
    /// 入力が長すぎる（最大長）
    TooLong(usize),
}

/// パスワード生成モードに関するエラー
///
/// パスワード生成モードの検証時に発生するエラーを表します。
///
/// # バリアント
///
/// * `InvalidMode` - 指定されたモードが無効な場合（"ex", "full", "short"以外）。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ModeError {
    /// 不正なモード
    InvalidMode,
}

/// パスワードの長さに関するエラー
///
/// パスワードの長さの検証時に発生するエラーを表します。
///
/// # バリアント
///
/// * `InvalidLength` - 長さの文字列が数値に変換できない場合。
/// * `BelowMinimum(usize)` - 長さが最小値未満の場合。パラメータは最小許容長を示します。
/// * `ExceedsMaximum(usize)` - 長さが最大値を超える場合。パラメータは最大許容長を示します。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LengthError {
    /// 文字列から usize への変換に失敗
    InvalidLength,
    /// 値が最小値を下回る
    BelowMinimum(usize),
    /// 値が最大値を超える
    ExceedsMaximum(usize),
}

/// パスワード生成プロセスに関するエラー
///
/// パスワード生成時に発生するエラーを表します。
///
/// # バリアント
///
/// * `CharacterRepetitionLimit(char, usize)` - 同じ文字が指定された回数以上現れた場合。
///   最初のパラメータは繰り返された文字、2番目のパラメータは試行回数を示します。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GenerationError {
    /// 同じ文字が多すぎる（繰り返された文字、試行回数）
    CharacterRepetitionLimit(char, usize),
}

impl PasswordError {
    /// パスフレーズのエラーを取得します
    ///
    /// # 戻り値
    ///
    /// * `&Option<TextError>` - パスフレーズに関するエラー（存在する場合）
    pub fn pass_phrase(&self) -> &Option<TextError> {
        &self.pass_phrase
    }

    /// サービス名のエラーを取得します
    ///
    /// # 戻り値
    ///
    /// * `&Option<TextError>` - サービス名に関するエラー（存在する場合）
    pub fn service_name(&self) -> &Option<TextError> {
        &self.service_name
    }

    /// バージョンのエラーを取得します
    ///
    /// # 戻り値
    ///
    /// * `&Option<TextError>` - バージョンに関するエラー（存在する場合）
    pub fn version(&self) -> &Option<TextError> {
        &self.version
    }

    /// モードのエラーを取得します
    ///
    /// # 戻り値
    ///
    /// * `&Option<ModeError>` - モードに関するエラー（存在する場合）
    pub fn mode(&self) -> &Option<ModeError> {
        &self.mode
    }

    /// 長さのエラーを取得します
    ///
    /// # 戻り値
    ///
    /// * `&Option<LengthError>` - 長さに関するエラー（存在する場合）
    pub fn length(&self) -> &Option<LengthError> {
        &self.length
    }

    /// 生成プロセスのエラーを取得します
    ///
    /// # 戻り値
    ///
    /// * `&Option<GenerationError>` - 生成プロセスに関するエラー（存在する場合）
    pub fn generation(&self) -> &Option<GenerationError> {
        &self.generation
    }

    /// パスフレーズのエラーを設定します
    ///
    /// # 引数
    ///
    /// * `error` - 設定するエラー
    ///
    /// # 戻り値
    ///
    /// * `Self` - エラーが設定された新しいインスタンス
    pub(super) fn with_pass_phrase_error(mut self, error: TextError) -> Self {
        self.pass_phrase = Some(error);
        self
    }

    /// サービス名のエラーを設定します
    ///
    /// # 引数
    ///
    /// * `error` - 設定するエラー
    ///
    /// # 戻り値
    ///
    /// * `Self` - エラーが設定された新しいインスタンス
    pub(super) fn with_service_name_error(mut self, error: TextError) -> Self {
        self.service_name = Some(error);
        self
    }

    /// バージョンのエラーを設定します
    ///
    /// # 引数
    ///
    /// * `error` - 設定するエラー
    ///
    /// # 戻り値
    ///
    /// * `Self` - エラーが設定された新しいインスタンス
    pub(super) fn with_version_error(mut self, error: TextError) -> Self {
        self.version = Some(error);
        self
    }

    /// モードのエラーを設定します
    ///
    /// # 引数
    ///
    /// * `error` - 設定するエラー
    ///
    /// # 戻り値
    ///
    /// * `Self` - エラーが設定された新しいインスタンス
    pub(super) fn with_mode_error(mut self, error: ModeError) -> Self {
        self.mode = Some(error);
        self
    }

    /// 長さのエラーを設定します
    ///
    /// # 引数
    ///
    /// * `error` - 設定するエラー
    ///
    /// # 戻り値
    ///
    /// * `Self` - エラーが設定された新しいインスタンス
    pub(super) fn with_length_error(mut self, error: LengthError) -> Self {
        self.length = Some(error);
        self
    }

    /// 生成プロセスのエラーを設定します
    ///
    /// # 引数
    ///
    /// * `error` - 設定するエラー
    ///
    /// # 戻り値
    ///
    /// * `Self` - エラーが設定された新しいインスタンス
    pub(super) fn with_generation_error(mut self, error: GenerationError) -> Self {
        self.generation = Some(error);
        self
    }
}
