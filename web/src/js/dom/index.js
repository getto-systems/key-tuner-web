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
  const passwordLength = document.getElementById('password-length');
  const lengthValue = document.getElementById('length-value');
  const includeUppercase = document.getElementById('include-uppercase');
  const includeLowercase = document.getElementById('include-lowercase');
  const includeNumbers = document.getElementById('include-numbers');
  const includeSymbols = document.getElementById('include-symbols');

  // パスワード長スライダーの変更イベント
  passwordLength.addEventListener('input', () => {
    const length = passwordLength.value;
    lengthValue.textContent = length;
    
    // WASMに設定を通知
    wasm.setPasswordLength(parseInt(length, 10));
  });

  // チェックボックスの変更イベント
  includeUppercase.addEventListener('change', () => {
    wasm.setIncludeUppercase(includeUppercase.checked);
  });

  includeLowercase.addEventListener('change', () => {
    wasm.setIncludeLowercase(includeLowercase.checked);
  });

  includeNumbers.addEventListener('change', () => {
    wasm.setIncludeNumbers(includeNumbers.checked);
  });

  includeSymbols.addEventListener('change', () => {
    wasm.setIncludeSymbols(includeSymbols.checked);
  });

  // パスワード生成ボタンのクリックイベント
  generateButton.addEventListener('click', () => {
    try {
      // WASMからパスワードを生成
      const password = wasm.generatePassword();
      
      // 生成されたパスワードを表示
      passwordOutput.textContent = password;
    } catch (error) {
      console.error('Failed to generate password:', error);
      passwordOutput.textContent = 'エラーが発生しました';
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
  wasm.setPasswordLength(parseInt(passwordLength.value, 10));
  wasm.setIncludeUppercase(includeUppercase.checked);
  wasm.setIncludeLowercase(includeLowercase.checked);
  wasm.setIncludeNumbers(includeNumbers.checked);
  wasm.setIncludeSymbols(includeSymbols.checked);
}