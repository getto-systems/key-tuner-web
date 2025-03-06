// WASMモジュールの初期化と連携を担当するモジュール

/**
 * WASMモジュールのインターフェース型定義
 */
export interface WasmModule {
    // パスワード生成メソッド
    generate_password(): void;

    // パスワード設定メソッド
    set_pass_phrase(phrase: string): void;
    set_service_name(name: string): void;
    set_version(version: string): void;
    set_password_mode(mode: string): void;
    set_password_length(length: string): void;
}

/**
 * WASMモジュールを初期化して使用可能な状態にする
 * @returns WASMモジュールのインターフェースを返す関数
 */
export function initWasm(): () => WasmModule {
    return wrapWasmModule(initWasmModule);
}

/**
 * WASMモジュールを初期化する
 * @returns 初期化されたWASMモジュールのインターフェース
 */
async function initWasmModule(): Promise<WasmModule> {
    try {
        // WASMモジュールをインポートして初期化
        const wasmModule = await import("./pkg/key_tuner_web.js");
        return wasmModule.default() as Promise<WasmModule>;
    } catch (error) {
        console.error("Failed to initialize WASM module:", error);
        throw error;
    }
}

/**
 * WASMモジュールのラッパーを返す関数を返す
 * @param init WASMモジュールを初期化する関数
 * @returns WASMモジュールのラッパーを返す関数
 */
function wrapWasmModule(init: () => Promise<WasmModule>): () => WasmModule {
    let wasmPromise: Promise<WasmModule> | undefined;

    // ラッパー初期化関数
    return function initWrapper(): WasmModule {
        // 初期化関数が呼ばれていない場合は呼び出す
        if (!wasmPromise) {
            wasmPromise = init();
        }

        // 現在のPromiseを安全に参照するための変数
        const wasm = wasmPromise;

        // WASMモジュールのラッパーを返す
        return {
            generate_password(): void {
                // Promiseが完了するまで待ってからメソッドを呼び出す
                wasm.then((module) => module.generate_password()).catch((error) => {
                    throw error;
                });
            },

            set_pass_phrase(phrase: string): void {
                wasm.then((module) => module.set_pass_phrase(phrase)).catch((error) => {
                    throw error;
                });
            },

            set_service_name(name: string): void {
                wasm.then((module) => module.set_service_name(name)).catch((error) => {
                    throw error;
                });
            },

            set_version(version: string): void {
                wasm.then((module) => module.set_version(version)).catch((error) => {
                    throw error;
                });
            },

            set_password_mode(mode: string): void {
                wasm.then((module) => module.set_password_mode(mode)).catch((error) => {
                    throw error;
                });
            },

            set_password_length(length: string): void {
                wasm.then((module) => module.set_password_length(length)).catch((error) => {
                    throw error;
                });
            },
        };
    };
}
