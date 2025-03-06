// WASMモジュールの初期化
import { initWasm } from './wasm/index.ts';
import { setupDom } from './dom/index.ts';

// アプリケーションの初期化
async function initApp() {
  try {
    // WASMモジュールの初期化
    const wasm = await initWasm();
    
    // DOMイベントのセットアップ
    setupDom(wasm);
  } catch (error) {
    console.error('Failed to initialize the application:', error);
    
    // 復帰不可能なエラーを表示
    const fatalError = document.getElementById('fatal-error');
    const fatalErrorMessage = document.getElementById('fatal-error-message');
    
    if (fatalError && fatalErrorMessage) {
      fatalErrorMessage.textContent = `アプリケーションの初期化中にエラーが発生しました: ${error.message || error}`;
      fatalError.classList.add('show');
    }
  }
}

// アプリケーションの起動
window.addEventListener('DOMContentLoaded', initApp);