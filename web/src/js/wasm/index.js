// WASMモジュールの初期化と連携を担当するモジュール

/**
 * WASMモジュールを初期化する
 * @returns {Promise<Object>} - 初期化されたWASMモジュールのインターフェース
 */
export async function initWasm() {
  try {
    // WASMモジュールをインポートして初期化
    const wasmModule = await import('./pkg/key_tuner_web.js');
    return wasmModule.default();
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    throw error;
  }
}
