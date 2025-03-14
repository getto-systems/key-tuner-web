// アプリケーションのメインエントリポイント

import { initKeyTunerWasm } from "../../wasm_artifacts/key_tuner_wasm";
import { checkAndRedirectToLatestVersion, replaceVersionInUrl } from "../../common/version_checker";
import { FatalErrorHandler } from "../../common/fatal_error";
import { initDomElements, DomElements } from "./elements";
import { registerWasmCallbacks, setupEventHandlers, sendInitialValueToWasm } from "./handlers";

// アプリケーションの起動
window.addEventListener("DOMContentLoaded", async () => {
    // DOMイベントのセットアップ
    const fatalError = await setupDom();

    // fatalErrorが取得できない場合は処理を中断
    if (!fatalError) {
        return;
    }

    try {
        // 最新バージョンのチェックとリダイレクト
        await checkAndRedirectToLatestVersion({
            currentLocation: window.location,
            versionExistenceChecker: async (version) => {
                // 現在のURLから新しいバージョンのURLを生成
                const currentUrl = window.location.href;
                const newUrl = replaceVersionInUrl(currentUrl, version);

                // URLの置換に失敗した場合
                if (newUrl === null) {
                    return false;
                }

                const response = await fetch(newUrl, { method: "HEAD" });
                return response.ok;
            },
            redirectHandler: (version) => {
                // 現在のURLから新しいバージョンのURLを生成
                const currentUrl = window.location.href;
                const newUrl = replaceVersionInUrl(currentUrl, version);

                // URLの置換に失敗した場合はデフォルトURLを構築
                if (newUrl === null) {
                    window.location.href = `${window.location.origin}/${version}/index.html`;
                } else {
                    window.location.href = newUrl;
                }
            },
            defaultVersion: "0.8.0", // デフォルトバージョンは checkAndRedirectToLatestVersion を呼び出している確実に存在しているバージョンを指定。バージョンアップによって変更する必要はない
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fatalError.show(`バージョンチェックエラー: ${errorMessage}`);
    }
});

/**
 * DOM要素のセットアップとイベントハンドラの登録
 * @returns {FatalErrorHandler<DomElements>|null} fatalError オブジェクト、または初期化失敗時はnull
 */
async function setupDom(): Promise<FatalErrorHandler<DomElements> | null> {
    // DOM要素とエラーハンドラを初期化
    const domInit = initDomElements();

    // 初期化に失敗した場合は終了
    if (domInit === null) {
        return null;
    }

    const { elements, fatalError } = domInit;

    // WASMから呼び出される関数をグローバルスコープに割り当て
    registerWasmCallbacks(elements, fatalError);

    try {
        // WASMモジュールを初期化して安全な呼び出し関数を作成
        const wasm = await initKeyTunerWasm();

        // イベントハンドラを宣言的に設定
        setupEventHandlers(elements, wasm, fatalError);

        // 初期設定をWASMに通知
        sendInitialValueToWasm(elements, wasm, fatalError);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fatalError.show(`初期化エラー: ${errorMessage}`);
    }

    return fatalError;
}
