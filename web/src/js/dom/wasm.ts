// WASM呼び出しを安全に行うためのモジュール

import { WasmModule } from "../wasm/index";
import { FatalErrorHandler } from "./error";

// WASM関数呼び出しを安全に行うための型定義
export interface WasmCall {
    (fn: (wasm: WasmModule) => void, errorPrefix: string): void;
}

/**
 * WASM呼び出し関数を初期化する
 * @param {WasmModule} wasm - WASMモジュール
 * @param {FatalErrorHandler} fatalError - 致命的エラーハンドラ
 * @returns {WasmCall} WASM呼び出し関数
 */
export function initWasmCall<T>(wasm: WasmModule, fatalError: FatalErrorHandler<T>): WasmCall {
    return (fn: (wasm: WasmModule) => void, errorPrefix: string): void => {
        try {
            fn(wasm);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            fatalError.show(`${errorPrefix}: ${errorMessage}`);
        }
    };
}