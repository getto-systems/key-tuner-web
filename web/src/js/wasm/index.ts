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
 * WASMモジュールを初期化する
 * @returns 初期化されたWASMモジュールのインターフェース
 */
export async function initWasm(): Promise<WasmModule> {
    try {
        // WASMモジュールをインポートして初期化
        const wasmModule = await import("./pkg/key_tuner_web.js");
        return wasmModule.default() as Promise<WasmModule>;
    } catch (error) {
        console.error("Failed to initialize WASM module:", error);
        throw error;
    }
}
