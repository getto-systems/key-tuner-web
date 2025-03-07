// アプリケーションのメインエントリポイント

import { initKeyTunerWasm } from "../../wasm_artifacts/key-tuner-wasm";
import { initDomElements } from "./elements";
import { registerWasmCallbacks, setupEventHandlers, sendInitialValueToWasm } from "./handlers";

// アプリケーションの起動
window.addEventListener("DOMContentLoaded", () => {
    // DOMイベントのセットアップ
    setupDom();
});

/**
 * DOM要素のセットアップとイベントハンドラの登録
 */
async function setupDom(): Promise<void> {
    // DOM要素とエラーハンドラを初期化
    const domInit = initDomElements();

    // 初期化に失敗した場合は終了
    if (domInit === null) {
        return;
    }

    const { elements, fatalError } = domInit;

    // WASMから呼び出される関数をグローバルスコープに割り当て
    registerWasmCallbacks(elements);

    try {
        // WASMモジュールを初期化して安全な呼び出し関数を作成
        const wasm = await initKeyTunerWasm();

        // イベントハンドラを宣言的に設定
        setupEventHandlers(elements, wasm);

        // 初期設定をWASMに通知
        sendInitialValueToWasm(elements, wasm);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to initialize settings:", error);
        fatalError.show(`初期化エラー: ${errorMessage}`);
    }
}
