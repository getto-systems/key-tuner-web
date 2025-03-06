use crate::password::{
    data::{PasswordMode, PasswordSettings},
    validation::{
        LengthError, LengthValidator, ModeError, ModeValidator, PasswordError, TextError,
        TextValidator,
    },
};

use super::ValidatedPasswordSettings;

impl<'a> TryFrom<&'a PasswordSettings> for ValidatedPasswordSettings<'a> {
    type Error = PasswordError;

    fn try_from(data: &'a PasswordSettings) -> Result<Self, Self::Error> {
        let mut error = PasswordError::default();
        let mut is_error = false;

        // パスフレーズの検証
        let pass_phrase = match validate_pass_phrase(&data.pass_phrase) {
            Ok(text) => text,
            Err(err) => {
                error = error.with_pass_phrase_error(err);
                is_error = true;
                ""
            }
        };

        // サービス名の検証
        let service_name = match validate_service_name(&data.service_name) {
            Ok(text) => text,
            Err(err) => {
                error = error.with_service_name_error(err);
                is_error = true;
                ""
            }
        };

        // バージョンの検証
        let version = match validate_version(&data.version) {
            Ok(text) => text,
            Err(err) => {
                error = error.with_version_error(err);
                is_error = true;
                ""
            }
        };

        // モードの検証
        let mode = match validate_mode(&data.mode) {
            Ok(Some(mode)) => Some(mode),
            Ok(None) => None,
            Err(err) => {
                error = error.with_mode_error(err);
                is_error = true;
                None
            }
        }
        .unwrap_or(PasswordMode::Short);

        // 長さの検証
        let length = match validate_length(&data.length) {
            Ok(Some(length)) => Some(length),
            Ok(None) => None,
            Err(err) => {
                error = error.with_length_error(err);
                is_error = true;
                None
            }
        }
        .unwrap_or(0);

        // エラーがあれば返す
        if is_error {
            return Err(error);
        }

        // すべてのバリデーションが成功した場合
        Ok(Self {
            pass_phrase,
            service_name,
            version,
            mode,
            length,
        })
    }
}

/// パスフレーズを検証し、有効な場合は元の文字列を返す
fn validate_pass_phrase(text: &str) -> Result<&str, TextError> {
    Ok(TextValidator::new(text).max_length(255)?.finish())
}

/// サービス名を検証し、有効な場合は元の文字列を返す
fn validate_service_name(text: &str) -> Result<&str, TextError> {
    Ok(TextValidator::new(text).max_length(255)?.finish())
}

/// バージョンを検証し、有効な場合は元の文字列を返す
fn validate_version(text: &str) -> Result<&str, TextError> {
    Ok(TextValidator::new(text).max_length(255)?.finish())
}

/// パスワード生成モードを検証し、有効な場合はPasswordModeを返す
fn validate_mode(text: &str) -> Result<Option<PasswordMode>, ModeError> {
    Ok(ModeValidator::new(text).mode()?.finish())
}

/// パスワードの長さを検証し、有効な場合はOption<usize>を返す
fn validate_length(text: &str) -> Result<Option<usize>, LengthError> {
    let min_length = 8;
    let max_length = 64;
    Ok(LengthValidator::new(text)
        .length()?
        .min_length(min_length)?
        .max_length(max_length)?
        .finish())
}

#[test]
fn test_password_settings_try_into() {
    // 有効な設定
    let data = PasswordSettings {
        pass_phrase: "my passphrase".to_string(),
        service_name: "example.com".to_string(),
        version: "1".to_string(),
        mode: "ex".to_string(),
        length: "12".to_string(),
    };
    let result: Result<ValidatedPasswordSettings, _> = (&data).try_into();
    assert!(result.is_ok());

    // 空のパスフレーズ（空文字列チェックを削除したので有効になる）
    let data = PasswordSettings {
        pass_phrase: "".to_string(),
        service_name: "example.com".to_string(),
        version: "1".to_string(),
        mode: "ex".to_string(),
        length: "12".to_string(),
    };
    let result: Result<ValidatedPasswordSettings, _> = (&data).try_into();
    assert!(result.is_ok());

    // 空のサービス名（空文字列チェックを削除したので有効になる）
    let data = PasswordSettings {
        pass_phrase: "my passphrase".to_string(),
        service_name: "".to_string(),
        version: "1".to_string(),
        mode: "ex".to_string(),
        length: "12".to_string(),
    };
    let result: Result<ValidatedPasswordSettings, _> = (&data).try_into();
    assert!(result.is_ok());

    // 空のバージョン（空文字列チェックを削除したので有効になる）
    let data = PasswordSettings {
        pass_phrase: "my passphrase".to_string(),
        service_name: "example.com".to_string(),
        version: "".to_string(),
        mode: "ex".to_string(),
        length: "12".to_string(),
    };
    let result: Result<ValidatedPasswordSettings, _> = (&data).try_into();
    assert!(result.is_ok());

    // 無効なモード
    let data = PasswordSettings {
        pass_phrase: "my passphrase".to_string(),
        service_name: "example.com".to_string(),
        version: "1".to_string(),
        mode: "invalid".to_string(),
        length: "12".to_string(),
    };
    let result: Result<ValidatedPasswordSettings, _> = (&data).try_into();
    assert!(matches!(result, Err(err) if err.mode().is_some()));

    // 無効な長さ（短すぎる）
    let data = PasswordSettings {
        pass_phrase: "my passphrase".to_string(),
        service_name: "example.com".to_string(),
        version: "1".to_string(),
        mode: "ex".to_string(),
        length: "7".to_string(),
    };
    let result: Result<ValidatedPasswordSettings, _> = (&data).try_into();
    if let Err(err) = result {
        assert!(matches!(err.length(), &Some(LengthError::BelowMinimum(8))));
    } else {
        panic!("Expected error for short length");
    }

    // 無効な長さ（長すぎる）
    let data = PasswordSettings {
        pass_phrase: "my passphrase".to_string(),
        service_name: "example.com".to_string(),
        version: "1".to_string(),
        mode: "ex".to_string(),
        length: "65".to_string(),
    };
    let result: Result<ValidatedPasswordSettings, _> = (&data).try_into();
    if let Err(err) = result {
        assert!(matches!(
            err.length(),
            &Some(LengthError::ExceedsMaximum(64))
        ));
    } else {
        panic!("Expected error for long length");
    }
}
