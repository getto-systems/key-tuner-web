// WASMモジュールの初期化と連携を担当するモジュール

/**
 * WASMモジュールを初期化する
 * @returns {Promise<Object>} - 初期化されたWASMモジュールのインターフェース
 */
export async function initWasm() {
  try {
    // WASMモジュールをインポートして初期化
    const wasmModule = await import('./pkg/key_tuner_web.js');
    await wasmModule.default();
    console.log('WASM module initialized successfully');
    return wasmModule;
    
    // 開発用モックを使用する場合はこちらを有効化
    // console.log('WASM module mock initialized');
    // return createWasmMock();
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    throw error;
  }
}

/**
 * 開発用のWASMモックを作成
 * 実際のWASMモジュールが利用可能になったら削除します
 */
function createWasmMock() {
  let passPhrase = "default passphrase";
  let serviceName = "default service";
  let version = "1";
  let mode = "ex";
  let length = 12;
  
  return {
    // 設定メソッド
    set_pass_phrase: (phrase) => {
      console.log(`Mock: Setting pass phrase to ${phrase}`);
      passPhrase = phrase;
    },
    
    set_service_name: (name) => {
      console.log(`Mock: Setting service name to ${name}`);
      serviceName = name;
    },
    
    set_version: (ver) => {
      console.log(`Mock: Setting version to ${ver}`);
      version = ver;
    },
    
    set_password_mode: (m) => {
      console.log(`Mock: Setting password mode to ${m}`);
      if (!['ex', 'full', 'short'].includes(m)) {
        throw new Error(`Invalid password mode: ${m}`);
      }
      mode = m;
    },
    
    set_password_length: (len) => {
      console.log(`Mock: Setting password length to ${len}`);
      if (len < 8 || len > 64) {
        throw new Error(`Password length must be between 8 and 64: ${len}`);
      }
      length = len;
    },
    
    // パスワード生成メソッド
    generate_password: () => {
      console.log('Mock: Generating password with settings:', {
        passPhrase,
        serviceName,
        version,
        mode,
        length
      });
      
      // 簡易的なモックパスワード生成
      // 実際の実装では、パスフレーズ、サービス名、バージョンに基づいて
      // 決定論的にパスワードを生成する必要があります
      
      // モードに応じた文字セットを選択
      let chars = '';
      switch (mode) {
        case 'ex':
          chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
          break;
        case 'full':
          chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          break;
        case 'short':
          chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          break;
      }
      
      // 入力文字列からシード値を生成
      const seed = hashString(`${passPhrase}:${serviceName}:${version}:${mode}`);
      
      // シード値を使用してパスワードを生成
      let password = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.abs(seed[i % seed.length]) % chars.length;
        password += chars[randomIndex];
      }
      
      // モードに応じた文字要件を確保
      if (mode === 'ex') {
        // 大文字、小文字、数字、記号を含むことを確保
        if (!/[A-Z]/.test(password)) password = replaceAt(password, 0, 'A');
        if (!/[a-z]/.test(password)) password = replaceAt(password, 1 % length, 'a');
        if (!/[0-9]/.test(password)) password = replaceAt(password, 2 % length, '1');
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) password = replaceAt(password, 3 % length, '!');
      } else if (mode === 'full') {
        // 大文字、小文字、数字を含むことを確保
        if (!/[A-Z]/.test(password)) password = replaceAt(password, 0, 'A');
        if (!/[a-z]/.test(password)) password = replaceAt(password, 1 % length, 'a');
        if (!/[0-9]/.test(password)) password = replaceAt(password, 2 % length, '1');
      }
      
      return password;
    },
    
    // 現在の設定を取得
    get_current_config: () => {
      return {
        passPhrase,
        serviceName,
        version,
        mode,
        length
      };
    }
  };
}

// 文字列をハッシュ化する簡易関数
function hashString(str) {
  let hash = Array(16).fill(0);
  for (let i = 0; i < str.length; i++) {
    hash[i % 16] = (hash[i % 16] + str.charCodeAt(i)) % 256;
  }
  return hash;
}

// 文字列の特定の位置の文字を置き換える
function replaceAt(str, index, replacement) {
  return str.substring(0, index) + replacement + str.substring(index + 1);
}