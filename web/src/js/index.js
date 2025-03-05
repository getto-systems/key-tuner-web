// WASMモジュールの初期化
import { initWasm } from './wasm/index.js';
import { setupDom } from './dom/index.js';

// アプリケーションの初期化
async function initApp() {
  try {
    // WASMモジュールの初期化
    const wasm = await initWasm();
    
    // DOMイベントのセットアップ
    setupDom(wasm);
    
    console.log('Key Tuner application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize the application:', error);
  }
}

// アプリケーションの起動
window.addEventListener('DOMContentLoaded', initApp);