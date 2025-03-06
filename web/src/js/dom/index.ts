// DOM操作を担当するモジュール

import { WasmModule } from "../wasm/index";

// DOM要素の型定義
interface DomElements {
    passwordOutput: HTMLElement | null;
    generateButton: HTMLButtonElement | null;
    copyButton: HTMLButtonElement | null;
    passPhrase: HTMLInputElement | null;
    serviceName: HTMLInputElement | null;
    version: HTMLInputElement | null;
    passwordMode: HTMLSelectElement | null;
    passwordLength: HTMLInputElement | null;
    lengthValue: HTMLElement | null;
    // エラー要素
    passPhraseError: HTMLElement | null;
    serviceNameError: HTMLElement | null;
    versionError: HTMLElement | null;
    passwordModeError: HTMLElement | null;
    passwordLengthError: HTMLElement | null;
    fatalError: HTMLElement | null;
    fatalErrorMessage: HTMLElement | null;
}

// エラーハンドラの型定義
interface ErrorHandlers {
    setError: (element: HTMLElement | null, message: "" | string) => void;
    showFatalError: (errorMessage: string) => void;
}

// イベントハンドラの設定を宣言的に定義するための型
interface EventHandlerConfig {
    element: HTMLElement | null;
    event: string;
    handler: () => void;
    condition: boolean;
}

/**
 * DOM要素のセットアップとイベントハンドラの登録
 * @param {() => WasmModule} initWasm - WASMモジュールを初期化する関数
 */
export function setupDom(initWasm: () => WasmModule): void {
    // DOM要素の参照を取得
    const elements = getDomElements();

    // エラーハンドリング関数
    const errorHandlers = createErrorHandlers(elements);

    // WASMから呼び出される関数をグローバルスコープに割り当て
    registerWasmCallbacks(elements, errorHandlers);

    try {
        // WASMモジュールを初期化（この部分は移動できない）
        const wasm = initWasm();

        // イベントハンドラを宣言的に設定
        setupEventHandlers(elements, wasm, errorHandlers);

        // 初期設定をWASMに通知
        initializeWasmSettings(elements, wasm, errorHandlers);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to initialize settings:", error);
        errorHandlers.showFatalError(`初期化エラー: ${errorMessage}`);
    }
}

/**
 * DOM要素の参照を取得する関数
 * @returns {DomElements} DOM要素の参照
 */
function getDomElements(): DomElements {
    return {
        passwordOutput: document.getElementById("password-output") as HTMLElement | null,
        generateButton: document.getElementById("generate-button") as HTMLButtonElement | null,
        copyButton: document.getElementById("copy-button") as HTMLButtonElement | null,
        passPhrase: document.getElementById("pass-phrase") as HTMLInputElement | null,
        serviceName: document.getElementById("service-name") as HTMLInputElement | null,
        version: document.getElementById("version") as HTMLInputElement | null,
        passwordMode: document.getElementById("password-mode") as HTMLSelectElement | null,
        passwordLength: document.getElementById("password-length") as HTMLInputElement | null,
        lengthValue: document.getElementById("length-value") as HTMLElement | null,
        // エラー要素
        passPhraseError: document.getElementById("pass-phrase-error") as HTMLElement | null,
        serviceNameError: document.getElementById("service-name-error") as HTMLElement | null,
        versionError: document.getElementById("version-error") as HTMLElement | null,
        passwordModeError: document.getElementById("password-mode-error") as HTMLElement | null,
        passwordLengthError: document.getElementById("password-length-error") as HTMLElement | null,
        fatalError: document.getElementById("fatal-error") as HTMLElement | null,
        fatalErrorMessage: document.getElementById("fatal-error-message") as HTMLElement | null,
    };
}

/**
 * エラーハンドリング関数を作成
 * @param {DomElements} elements - DOM要素の参照
 * @returns {ErrorHandlers} エラーハンドリング関数
 */
function createErrorHandlers(elements: DomElements): ErrorHandlers {
    /**
     * エラーメッセージを設定する（表示または非表示）
     * @param {HTMLElement | null} element - エラーメッセージ要素
     * @param {string | ""} message - 表示するエラーメッセージ（空文字列の場合は非表示）
     */
    const setError = (element: HTMLElement | null, message: "" | string): void => {
        if (!element) return;

        if (message === "") {
            element.textContent = "";
            element.classList.remove("show");
        } else {
            element.textContent = message;
            element.classList.add("show");
        }
    };

    /**
     * 復帰不可能なエラーを表示する
     * @param {string} errorMessage - エラーメッセージ
     */
    const showFatalError = (errorMessage: string): void => {
        // エラーをコンソールに記録
        console.error("Fatal error:", errorMessage);

        if (!elements.fatalError || !elements.fatalErrorMessage) return;

        // 致命的エラーメッセージを表示
        elements.fatalErrorMessage.textContent = `致命的エラー: ${errorMessage}`;
        elements.fatalError.classList.add("show", "fatal");

        // 入力フィールドを無効化
        if (elements.passPhrase) elements.passPhrase.disabled = true;
        if (elements.serviceName) elements.serviceName.disabled = true;
        if (elements.version) elements.version.disabled = true;
        if (elements.passwordMode) elements.passwordMode.disabled = true;
        if (elements.passwordLength) elements.passwordLength.disabled = true;
        if (elements.generateButton) elements.generateButton.disabled = true;
    };

    return { setError, showFatalError };
}

/**
 * WASMから呼び出される関数をグローバルスコープに割り当て
 * @param {DomElements} elements - DOM要素の参照
 * @param {ErrorHandlers} errorHandlers - エラーハンドリング関数
 */
function registerWasmCallbacks(elements: DomElements, errorHandlers: ErrorHandlers): void {
    /**
     * 生成されたパスワードを表示する
     * @param {string} password - 生成されたパスワード
     */
    const draw_generated_password = (password: string): void => {
        if (elements.passwordOutput) {
            elements.passwordOutput.textContent = password;
        }
    };

    /**
     * パスフレーズのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_pass_phrase_error = (errorMessage: string | null): void => {
        errorHandlers.setError(elements.passPhraseError, errorMessage || "");
    };

    /**
     * サービス名のエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_service_name_error = (errorMessage: string | null): void => {
        errorHandlers.setError(elements.serviceNameError, errorMessage || "");
    };

    /**
     * バージョンのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_version_error = (errorMessage: string | null): void => {
        errorHandlers.setError(elements.versionError, errorMessage || "");
    };

    /**
     * パスワードモードのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_password_mode_error = (errorMessage: string | null): void => {
        errorHandlers.setError(elements.passwordModeError, errorMessage || "");
    };

    /**
     * パスワード長のエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_password_length_error = (errorMessage: string | null): void => {
        errorHandlers.setError(elements.passwordLengthError, errorMessage || "");
    };

    // グローバルスコープに割り当て
    (window as any).draw_generated_password = draw_generated_password;
    (window as any).draw_pass_phrase_error = draw_pass_phrase_error;
    (window as any).draw_service_name_error = draw_service_name_error;
    (window as any).draw_version_error = draw_version_error;
    (window as any).draw_password_mode_error = draw_password_mode_error;
    (window as any).draw_password_length_error = draw_password_length_error;
}

/**
 * WASM呼び出しを安全に行うユーティリティ関数
 * @param {() => void} fn - 実行する関数
 * @param {string} errorPrefix - エラーメッセージのプレフィックス
 * @param {(message: string) => void} showFatalError - 致命的エラーを表示する関数
 */
function safeWasmCall(
    fn: () => void,
    errorPrefix: string,
    showFatalError: (message: string) => void,
): void {
    try {
        fn();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showFatalError(`${errorPrefix}: ${errorMessage}`);
    }
}

/**
 * イベントハンドラを宣言的に設定
 * @param {DomElements} elements - DOM要素の参照
 * @param {WasmModule} wasm - WASMモジュール
 * @param {ErrorHandlers} errorHandlers - エラーハンドリング関数
 */
function setupEventHandlers(
    elements: DomElements,
    wasm: WasmModule,
    errorHandlers: ErrorHandlers,
): void {
    // イベントハンドラの設定を宣言的に定義
    const handlers: EventHandlerConfig[] = [
        // パスワード長スライダーの変更イベント
        {
            element: elements.passwordLength,
            event: "input",
            handler: () => {
                if (!elements.passwordLength || !elements.lengthValue) return;

                const length = elements.passwordLength.value;
                elements.lengthValue.textContent = length;

                safeWasmCall(
                    () => wasm.set_password_length(length),
                    "パスワード長設定エラー",
                    errorHandlers.showFatalError,
                );
            },
            condition: !!elements.passwordLength && !!elements.lengthValue,
        },

        // パスフレーズの変更イベント
        {
            element: elements.passPhrase,
            event: "input",
            handler: () => {
                if (!elements.passPhrase) return;

                // 値を一時変数に格納して型チェックを満足させる
                const value = elements.passPhrase.value;
                safeWasmCall(
                    () => wasm.set_pass_phrase(value),
                    "パスフレーズ設定エラー",
                    errorHandlers.showFatalError,
                );
            },
            condition: !!elements.passPhrase,
        },

        // サービス名の変更イベント
        {
            element: elements.serviceName,
            event: "input",
            handler: () => {
                if (!elements.serviceName) return;

                // 値を一時変数に格納して型チェックを満足させる
                const value = elements.serviceName.value;
                safeWasmCall(
                    () => wasm.set_service_name(value),
                    "サービス名設定エラー",
                    errorHandlers.showFatalError,
                );
            },
            condition: !!elements.serviceName,
        },

        // バージョンの変更イベント
        {
            element: elements.version,
            event: "input",
            handler: () => {
                if (!elements.version) return;

                // 値を一時変数に格納して型チェックを満足させる
                const value = elements.version.value;
                safeWasmCall(
                    () => wasm.set_version(value),
                    "バージョン設定エラー",
                    errorHandlers.showFatalError,
                );
            },
            condition: !!elements.version,
        },

        // 生成モードの変更イベント
        {
            element: elements.passwordMode,
            event: "change",
            handler: () => {
                if (!elements.passwordMode) return;

                // 値を一時変数に格納して型チェックを満足させる
                const value = elements.passwordMode.value;
                safeWasmCall(
                    () => wasm.set_password_mode(value),
                    "生成モード設定エラー",
                    errorHandlers.showFatalError,
                );
            },
            condition: !!elements.passwordMode,
        },

        // パスワード生成ボタンのクリックイベント
        {
            element: elements.generateButton,
            event: "click",
            handler: () => {
                safeWasmCall(
                    () => wasm.generate_password(),
                    "パスワード生成エラー",
                    errorHandlers.showFatalError,
                );
            },
            condition: !!elements.generateButton,
        },

        // コピーボタンのクリックイベント
        {
            element: elements.copyButton,
            event: "click",
            handler: () => {
                if (!elements.copyButton || !elements.passwordOutput) return;

                const password = elements.passwordOutput.textContent;

                // パスワードがデフォルトメッセージでない場合のみコピー
                if (
                    password &&
                    password !== "パスワードがここに表示されます" &&
                    password !== "エラーが発生しました"
                ) {
                    navigator.clipboard
                        .writeText(password)
                        .then(() => {
                            // コピー成功時の視覚的フィードバック
                            const originalText = elements.copyButton!.textContent;
                            elements.copyButton!.textContent = "コピーしました！";

                            setTimeout(() => {
                                elements.copyButton!.textContent = originalText;
                            }, 2000);
                        })
                        .catch((err) => {
                            console.error("Failed to copy password:", err);
                        });
                }
            },
            condition: !!elements.copyButton && !!elements.passwordOutput,
        },
    ];

    // 定義に基づいてイベントハンドラを登録
    handlers.forEach(({ element, event, handler, condition }) => {
        if (condition && element) {
            element.addEventListener(event, handler);
        }
    });
}

/**
 * 初期設定をWASMに通知
 * @param {DomElements} elements - DOM要素の参照
 * @param {WasmModule} wasm - WASMモジュール
 * @param {ErrorHandlers} errorHandlers - エラーハンドリング関数
 */
function initializeWasmSettings(
    elements: DomElements,
    wasm: WasmModule,
    errorHandlers: ErrorHandlers,
): void {
    // 初期設定を宣言的に定義
    const initialSettings = [
        {
            element: elements.passPhrase,
            setter: (value: string) => wasm.set_pass_phrase(value),
            errorPrefix: "パスフレーズ初期設定エラー",
        },
        {
            element: elements.serviceName,
            setter: (value: string) => wasm.set_service_name(value),
            errorPrefix: "サービス名初期設定エラー",
        },
        {
            element: elements.version,
            setter: (value: string) => wasm.set_version(value),
            errorPrefix: "バージョン初期設定エラー",
        },
        {
            element: elements.passwordMode,
            setter: (value: string) => wasm.set_password_mode(value),
            errorPrefix: "生成モード初期設定エラー",
        },
        {
            element: elements.passwordLength,
            setter: (value: string) => wasm.set_password_length(value),
            errorPrefix: "パスワード長初期設定エラー",
        },
    ];

    // 定義に基づいて初期設定を適用
    initialSettings.forEach(({ element, setter, errorPrefix }) => {
        if (element && "value" in element && element.value !== undefined) {
            // 値を一時変数に格納して型チェックを満足させる
            const value = element.value;
            safeWasmCall(() => setter(value), errorPrefix, errorHandlers.showFatalError);
        }
    });
}
