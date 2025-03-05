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

  // パスワード長スライダーの変更イベント
  passwordLength.addEventListener('input', () => {
    const length = passwordLength.value;
    lengthValue.textContent = length;
    
    // WASMに設定を通知
    try {
      wasm.set_password_length(parseInt(length, 10));
    } catch (error) {
      console.error('Failed to set password length:', error);
    }
  });

  // パスフレーズの変更イベント
  passPhrase.addEventListener('input', () => {
    wasm.set_pass_phrase(passPhrase.value);
  });

  // サービス名の変更イベント
  serviceName.addEventListener('input', () => {
    wasm.set_service_name(serviceName.value);
  });

  // バージョンの変更イベント
  version.addEventListener('input', () => {
    wasm.set_version(version.value);
  });

  // 生成モードの変更イベント
  passwordMode.addEventListener('change', () => {
    try {
      wasm.set_password_mode(passwordMode.value);
    } catch (error) {
      console.error('Failed to set password mode:', error);
      alert(`生成モードの設定に失敗しました: ${error}`);
    }
  });

  // パスワード生成ボタンのクリックイベント
  generateButton.addEventListener('click', () => {
    try {
      // WASMからパスワードを生成
      const password = wasm.generate_password();
      
      // 生成されたパスワードを表示
      passwordOutput.textContent = password;
    } catch (error) {
      console.error('Failed to generate password:', error);
      passwordOutput.textContent = 'エラーが発生しました';
      alert(`パスワード生成に失敗しました: ${error}`);
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
    wasm.set_password_length(parseInt(passwordLength.value, 10));
  } catch (error) {
    console.error('Failed to initialize settings:', error);
  }
}