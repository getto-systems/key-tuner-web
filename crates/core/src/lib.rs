//! Key Tuner Core
//! 
//! パスワード生成のコアロジックを提供するクレート

use rand::Rng;
use std::collections::HashSet;

/// パスワード生成の設定
#[derive(Debug, Clone)]
pub struct PasswordSettings {
    /// パスワードの長さ
    pub length: usize,
    /// 大文字を含めるかどうか
    pub include_uppercase: bool,
    /// 小文字を含めるかどうか
    pub include_lowercase: bool,
    /// 数字を含めるかどうか
    pub include_numbers: bool,
    /// 記号を含めるかどうか
    pub include_symbols: bool,
}

impl Default for PasswordSettings {
    fn default() -> Self {
        Self {
            length: 12,
            include_uppercase: true,
            include_lowercase: true,
            include_numbers: true,
            include_symbols: false,
        }
    }
}

/// パスワード生成器
#[derive(Debug)]
pub struct PasswordGenerator {
    settings: PasswordSettings,
}

impl PasswordGenerator {
    /// 新しいパスワード生成器を作成
    pub fn new(settings: PasswordSettings) -> Self {
        Self { settings }
    }

    /// デフォルト設定でパスワード生成器を作成
    pub fn default() -> Self {
        Self::new(PasswordSettings::default())
    }

    /// 設定を更新
    pub fn update_settings(&mut self, settings: PasswordSettings) {
        self.settings = settings;
    }

    /// パスワードを生成
    pub fn generate(&self) -> String {
        let mut rng = rand::thread_rng();
        let mut chars = String::new();
        
        // 使用する文字セットを決定
        if self.settings.include_uppercase {
            chars.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        }
        
        if self.settings.include_lowercase {
            chars.push_str("abcdefghijklmnopqrstuvwxyz");
        }
        
        if self.settings.include_numbers {
            chars.push_str("0123456789");
        }
        
        if self.settings.include_symbols {
            chars.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?");
        }
        
        // 少なくとも1つのカテゴリを含める
        if chars.is_empty() {
            chars.push_str("abcdefghijklmnopqrstuvwxyz");
        }
        
        let chars: Vec<char> = chars.chars().collect();
        let mut password = String::with_capacity(self.settings.length);
        
        // パスワードを生成
        for _ in 0..self.settings.length {
            let idx = rng.gen_range(0..chars.len());
            password.push(chars[idx]);
        }
        
        // 各カテゴリから少なくとも1文字を含めることを保証
        self.ensure_character_requirements(&mut password)
    }
    
    /// 各カテゴリから少なくとも1文字を含めることを保証
    fn ensure_character_requirements(&self, password: &mut String) -> String {
        let mut required_chars = Vec::new();
        
        if self.settings.include_uppercase {
            required_chars.push('A'); // 代表的な大文字
        }
        
        if self.settings.include_lowercase {
            required_chars.push('a'); // 代表的な小文字
        }
        
        if self.settings.include_numbers {
            required_chars.push('1'); // 代表的な数字
        }
        
        if self.settings.include_symbols {
            required_chars.push('!'); // 代表的な記号
        }
        
        // 必要な文字がない場合はそのまま返す
        if required_chars.is_empty() {
            return password.clone();
        }
        
        let mut rng = rand::thread_rng();
        let mut chars: Vec<char> = password.chars().collect();
        
        // 各カテゴリの文字が含まれているか確認
        let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
        let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
        let has_number = password.chars().any(|c| c.is_ascii_digit());
        let has_symbol = password.chars().any(|c| !c.is_alphanumeric());
        
        // 必要な文字を追加
        let mut positions_used = HashSet::new();
        
        if self.settings.include_uppercase && !has_uppercase {
            let pos = self.get_random_position(&mut rng, self.settings.length, &positions_used);
            positions_used.insert(pos);
            chars[pos] = 'A';
        }
        
        if self.settings.include_lowercase && !has_lowercase {
            let pos = self.get_random_position(&mut rng, self.settings.length, &positions_used);
            positions_used.insert(pos);
            chars[pos] = 'a';
        }
        
        if self.settings.include_numbers && !has_number {
            let pos = self.get_random_position(&mut rng, self.settings.length, &positions_used);
            positions_used.insert(pos);
            chars[pos] = '1';
        }
        
        if self.settings.include_symbols && !has_symbol {
            let pos = self.get_random_position(&mut rng, self.settings.length, &positions_used);
            positions_used.insert(pos);
            chars[pos] = '!';
        }
        
        chars.into_iter().collect()
    }
    
    /// 使用されていないランダムな位置を取得
    fn get_random_position(
        &self,
        rng: &mut rand::rngs::ThreadRng,
        length: usize,
        used_positions: &HashSet<usize>,
    ) -> usize {
        let mut pos = rng.gen_range(0..length);
        while used_positions.contains(&pos) {
            pos = rng.gen_range(0..length);
        }
        pos
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = PasswordSettings::default();
        assert_eq!(settings.length, 12);
        assert!(settings.include_uppercase);
        assert!(settings.include_lowercase);
        assert!(settings.include_numbers);
        assert!(!settings.include_symbols);
    }

    #[test]
    fn test_password_length() {
        let mut settings = PasswordSettings::default();
        settings.length = 16;
        
        let generator = PasswordGenerator::new(settings);
        let password = generator.generate();
        
        assert_eq!(password.len(), 16);
    }

    #[test]
    fn test_password_includes_required_characters() {
        let settings = PasswordSettings {
            length: 12,
            include_uppercase: true,
            include_lowercase: true,
            include_numbers: true,
            include_symbols: true,
        };
        
        let generator = PasswordGenerator::new(settings);
        let password = generator.generate();
        
        assert!(password.chars().any(|c| c.is_ascii_uppercase()));
        assert!(password.chars().any(|c| c.is_ascii_lowercase()));
        assert!(password.chars().any(|c| c.is_ascii_digit()));
        assert!(password.chars().any(|c| !c.is_alphanumeric()));
    }
}