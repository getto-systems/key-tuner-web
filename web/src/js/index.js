// WASMモジュールの初期化
import { initWasm } from './wasm/index.ts';
import { setupDom } from './dom/index.ts';

// アプリケーションの起動
window.addEventListener('DOMContentLoaded', () => {
  // DOMイベントのセットアップ
  setupDom(initWasm());
});