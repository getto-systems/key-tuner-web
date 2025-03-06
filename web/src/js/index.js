// WASMモジュールの初期化
import { initWasm } from './wasm/index.ts';
import { setupDom } from './dom/index.ts';

// アプリケーションの初期化
function initApp() {
  // DOMイベントのセットアップ
  setupDom(initWasm());
}

// アプリケーションの起動
window.addEventListener('DOMContentLoaded', initApp);