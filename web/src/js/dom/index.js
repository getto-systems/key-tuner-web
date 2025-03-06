// DOM操作を担当するモジュール

/**
 * DOM要素のセットアップとイベントハンドラの登録
 * @param {Object} wasm - WASMモジュールのインスタンス
 */
export function setupDom(wasm) {
  // DOM要素の参照を取得
  const passwordOutput = document.getElementById('password-output');
  const generateButton = document.getElementById('generate-button');
  const copyButton = document.getElementById('copy-button');
  const passPhrase = document.getElementById('pass-phrase');
  const serviceName = document.getElementById('service-name');
  const version = document.getElementById('version');
  const passwordMode = document.getElementById('password-mode');
  const passwordLength = document.getElementById('password-length');
  const lengthValue = document.getElementById('length-value');
  
  // エラーメッセージ要素の参照を取得
  const passPhraseError = document.getElementById('pass-phrase-error');
  const serviceNameError = document.getElementById('service-name-error');
  const versionError = document.getElementById('version-error');
  const passwordModeError = document.getElementById('password-mode-error');
  const passwordLengthError = document.getElementById('password-length-error');
  const fatalError = document.getElementById('fatal-error');
  const fatalErrorMessage = document.getElementById('fatal-error-message');
  
  /**
   * エラーメッセージを表示する
   * @param {HTMLElement} element - エラーメッセージ要素
   * @param {string} message - 表示するエラーメッセージ
   */
  function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
  }
  
  /**
   * エラーメッセージを非表示にする
   * @param {HTMLElement} element - エラーメッセージ要素
   */
  function hideError(element) {
    if (!element) return;
    element.textContent = '';
    element.classList.remove('show');
  }
  
  /**
   * 復帰不可能なエラーを表示する
   * @param {string} errorMessage - エラーメッセージ
   */
  function showFatalError(errorMessage) {
    if (!fatalError || !fatalErrorMessage) return;
    
    // 致命的エラーメッセージを表示
    fatalErrorMessage.textContent = `致命的エラー: ${errorMessage}`;
    fatalError.classList.add('show', 'fatal');
    
    // 入力フィールドを無効化
    if (passPhrase) passPhrase.disabled = true;
    if (serviceName) serviceName.disabled = true;
    if (version) version.disabled = true;
    if (passwordMode) passwordMode.disabled = true;
    if (passwordLength) passwordLength.disabled = true;
    if (generateButton) generateButton.disabled = true;
    
    // エラーをコンソールに記録
    console.error('Fatal error:', errorMessage);
  }

  /**
   * 生成されたパスワードを表示する
   * @param {string} password - 生成されたパスワード
   */
  function draw_generated_password(password) {
    if (passwordOutput) {
      passwordOutput.textContent = password;
    }
  }

  /**
   * パスフレーズのエラーを表示する
   * @param {string} errorMessage - エラーメッセージ
   */
  function draw_pass_phrase_error(errorMessage) {
    if (errorMessage) {
      showError(passPhraseError, errorMessage);
    } else {
      hideError(passPhraseError);
    }
  }

  /**
   * サービス名のエラーを表示する
   * @param {string} errorMessage - エラーメッセージ
   */
  function draw_service_name_error(errorMessage) {
    if (errorMessage) {
      showError(serviceNameError, errorMessage);
    } else {
      hideError(serviceNameError);
    }
  }

  /**
   * バージョンのエラーを表示する
   * @param {string} errorMessage - エラーメッセージ
   */
  function draw_version_error(errorMessage) {
    if (errorMessage) {
      showError(versionError, errorMessage);
    } else {
      hideError(versionError);
    }
  }

  /**
   * パスワードモードのエラーを表示する
   * @param {string} errorMessage - エラーメッセージ
   */
  function draw_password_mode_error(errorMessage) {
    if (errorMessage) {
      showError(passwordModeError, errorMessage);
    } else {
      hideError(passwordModeError);
    }
  }

  /**
   * パスワード長のエラーを表示する
   * @param {string} errorMessage - エラーメッセージ
   */
  function draw_password_length_error(errorMessage) {
    if (errorMessage) {
      showError(passwordLengthError, errorMessage);
    } else {
      hideError(passwordLengthError);
    }
  }

  // WASMから呼び出される関数をグローバルスコープに割り当て
  window.draw_generated_password = draw_generated_password;
  window.draw_pass_phrase_error = draw_pass_phrase_error;
  window.draw_service_name_error = draw_service_name_error;
  window.draw_version_error = draw_version_error;
  window.draw_password_mode_error = draw_password_mode_error;
  window.draw_password_length_error = draw_password_length_error;

  // パスワード長スライダーの変更イベント
  passwordLength.addEventListener('input', () => {
    const length = passwordLength.value;
    lengthValue.textContent = length;
    
    // WASMに設定を通知
    try {
      wasm.set_password_length(length);
    } catch (error) {
      showFatalError(`パスワード長設定エラー: ${error.message || error}`);
    }
  });

  // パスフレーズの変更イベント
  passPhrase.addEventListener('input', () => {
    try {
      wasm.set_pass_phrase(passPhrase.value);
    } catch (error) {
      showFatalError(`パスフレーズ設定エラー: ${error.message || error}`);
    }
  });

  // サービス名の変更イベント
  serviceName.addEventListener('input', () => {
    try {
      wasm.set_service_name(serviceName.value);
    } catch (error) {
      showFatalError(`サービス名設定エラー: ${error.message || error}`);
    }
  });

  // バージョンの変更イベント
  version.addEventListener('input', () => {
    try {
      wasm.set_version(version.value);
    } catch (error) {
      showFatalError(`バージョン設定エラー: ${error.message || error}`);
    }
  });

  // 生成モードの変更イベント
  passwordMode.addEventListener('change', () => {
    try {
      wasm.set_password_mode(passwordMode.value);
    } catch (error) {
      showFatalError(`生成モード設定エラー: ${error.message || error}`);
    }
  });

  // パスワード生成ボタンのクリックイベント
  generateButton.addEventListener('click', () => {
    try {
      // WASMからパスワードを生成
      const password = wasm.generate_password();
    } catch (error) {
      showFatalError(`パスワード生成エラー: ${error.message || error}`);
    }
  });

  // コピーボタンのクリックイベント
  copyButton.addEventListener('click', () => {
    const password = passwordOutput.textContent;
    
    // パスワードがデフォルトメッセージでない場合のみコピー
    if (password !== 'パスワードがここに表示されます' && password !== 'エラーが発生しました') {
      navigator.clipboard.writeText(password)
        .then(() => {
          // コピー成功時の視覚的フィードバック
          const originalText = copyButton.textContent;
          copyButton.textContent = 'コピーしました！';
          
          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy password:', err);
        });
    }
  });

  // 初期設定をWASMに通知
  try {
    wasm.set_pass_phrase(passPhrase.value);
    wasm.set_service_name(serviceName.value);
    wasm.set_version(version.value);
    wasm.set_password_mode(passwordMode.value);
    wasm.set_password_length(passwordLength.value);
  } catch (error) {
    console.error('Failed to initialize settings:', error);
    showFatalError(`初期化エラー: ${error.message || error}`);
  }
}