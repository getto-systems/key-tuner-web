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
    
    // 開発用モックは不要になりました
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
  let passwordLength = 12;
  let includeUppercase = true;
  let includeLowercase = true;
  let includeNumbers = true;
  let includeSymbols = false;
  
  return {
    // 設定メソッド
    setPasswordLength: (length) => {
      console.log(`Mock: Setting password length to ${length}`);
      passwordLength = length;
    },
    
    setIncludeUppercase: (include) => {
      console.log(`Mock: Setting include uppercase to ${include}`);
      includeUppercase = include;
    },
    
    setIncludeLowercase: (include) => {
      console.log(`Mock: Setting include lowercase to ${include}`);
      includeLowercase = include;
    },
    
    setIncludeNumbers: (include) => {
      console.log(`Mock: Setting include numbers to ${include}`);
      includeNumbers = include;
    },
    
    setIncludeSymbols: (include) => {
      console.log(`Mock: Setting include symbols to ${include}`);
      includeSymbols = include;
    },
    
    // パスワード生成メソッド
    generatePassword: () => {
      console.log('Mock: Generating password with settings:', {
        passwordLength,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols
      });
      
      // 簡易的なモックパスワード生成
      const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
      const numberChars = '0123456789';
      const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      let chars = '';
      if (includeUppercase) chars += uppercaseChars;
      if (includeLowercase) chars += lowercaseChars;
      if (includeNumbers) chars += numberChars;
      if (includeSymbols) chars += symbolChars;
      
      // 少なくとも1つのカテゴリを含める
      if (chars.length === 0) {
        chars = lowercaseChars;
      }
      
      let password = '';
      for (let i = 0; i < passwordLength; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
      }
      
      return password;
    }
  };
}