/// パスワード設定のデータ転送オブジェクト
/// 各フィールドが文字列として保持される
#[derive(Debug, Clone, Default)]
pub struct PasswordSettings {
    /// パスフレーズ
    pub pass_phrase: String,
    /// サービス名
    pub service_name: String,
    /// バージョン
    pub version: String,
    /// 生成モード（文字列）
    pub mode: String,
    /// パスワードの長さ（文字列）
    pub length: String,
}

/// パスワード生成モード
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PasswordMode {
    /// 大文字小文字数字記号を含むパスワード
    Ex,
    /// 大文字小文字数字記号を含むパスワード(後方互換性のために残されている)
    Full,
    /// 小文字数字のみのパスワード
    Short,
}
