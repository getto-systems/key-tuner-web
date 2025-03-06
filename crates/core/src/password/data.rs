/// パスワード設定のデータ転送オブジェクト
///
/// この構造体は、パスワード生成に必要な設定情報を保持します。
/// 各フィールドは文字列として保持され、生成時に検証されます。
///
/// # 使用例
///
/// ```
/// use key_tuner_core::PasswordSettings;
///
/// // 新しいパスワード設定を作成
/// let settings = PasswordSettings {
///     pass_phrase: "my passphrase".to_string(),
///     service_name: "example.com".to_string(),
///     version: "1".to_string(),
///     mode: "ex".to_string(),
///     length: "16".to_string(),
/// };
///
/// // フィールドにアクセス
/// assert_eq!(settings.pass_phrase, "my passphrase");
/// assert_eq!(settings.service_name, "example.com");
/// assert_eq!(settings.mode, "ex");
/// ```
#[derive(Debug, Clone, Default)]
pub struct PasswordSettings {
    /// パスフレーズ
    ///
    /// パスワード生成の基本となる秘密の文字列です。
    /// このフィールドは最大255文字まで設定可能です。
    pub pass_phrase: String,

    /// サービス名
    ///
    /// パスワードを生成するサービスやウェブサイトの名前です。
    /// 例: "example.com", "my-service" など
    /// このフィールドは最大255文字まで設定可能です。
    pub service_name: String,

    /// バージョン
    ///
    /// パスワードのバージョンを指定します。サービスのパスワードを
    /// 更新する必要がある場合にバージョンを変更することで、
    /// 新しいパスワードを生成できます。
    /// このフィールドは最大255文字まで設定可能です。
    pub version: String,

    /// 生成モード（文字列）
    ///
    /// パスワードの生成モードを指定します。
    /// 有効な値: "ex", "full", "short"
    /// - "ex": 大文字小文字数字記号を含む拡張パスワード
    /// - "full": 大文字小文字数字記号を含むパスワード（後方互換性用）
    /// - "short": 小文字数字のみのパスワード
    pub mode: String,

    /// パスワードの長さ（文字列）
    ///
    /// 生成するパスワードの長さを指定します。
    /// 有効な値: "8" から "64" までの数値（文字列形式）
    pub length: String,
}

/// パスワード生成モード
///
/// パスワード生成時に使用する文字セットを定義します。
///
/// # 使用例
///
/// ```
/// use key_tuner_core::{PasswordGenerator, PasswordSettings};
///
/// // Ex モードでパスワードを生成
/// let settings = PasswordSettings {
///     pass_phrase: "my passphrase".to_string(),
///     service_name: "example.com".to_string(),
///     version: "1".to_string(),
///     mode: "ex".to_string(), // Ex モードを指定
///     length: "16".to_string(),
/// };
///
/// let password = PasswordGenerator::generate(&settings).unwrap();
/// // Ex モードでは大文字小文字数字記号を含むパスワードが生成される
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PasswordMode {
    /// 大文字小文字数字記号を含むパスワード
    ///
    /// 最も多様な文字セットを使用し、セキュリティが高いパスワードを生成します。
    /// 特殊記号を含む、最も広範囲の文字を使用します。
    Ex,

    /// 大文字小文字数字記号を含むパスワード(後方互換性のために残されている)
    ///
    /// Ex モードと同様に大文字小文字数字記号を含みますが、
    /// 使用する特殊記号のセットが異なります。
    /// 主に後方互換性のために残されています。
    Full,

    /// 小文字数字のみのパスワード
    ///
    /// 小文字アルファベットと数字のみを使用します。
    /// 特殊記号や大文字を使用できないシステム向けです。
    Short,
}
