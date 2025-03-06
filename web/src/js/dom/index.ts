// DOM操作を担当するモジュール

import { WasmModule } from "../wasm/index";
import { FatalErrorElements, FatalErrorHandler, createFatalErrorHandler } from "./error";
import { WasmCall, initWasmCall } from "./wasm";

/**
 * DOM要素のセットアップとイベントハンドラの登録
 * @param {() => WasmModule} initWasm - WASMモジュールを初期化する関数
 */
export function setupDom(initWasm: () => WasmModule): void {
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
        const wasmCall = initWasmCall(initWasm(), fatalError);

        // イベントハンドラを宣言的に設定
        setupEventHandlers(elements, wasmCall);

        // 初期設定をWASMに通知
        sendInitialValueToWasm(elements, wasmCall);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to initialize settings:", error);
        fatalError.show(`初期化エラー: ${errorMessage}`);
    }
}

// DOM要素の型定義
interface DomElements {
    passwordOutput: HTMLElement;
    generateButton: HTMLButtonElement;
    copyButton: HTMLButtonElement;
    passPhrase: HTMLInputElement;
    serviceName: HTMLInputElement;
    version: HTMLInputElement;
    passwordMode: HTMLSelectElement;
    passwordLength: HTMLInputElement;
    lengthValue: HTMLElement;
    // エラー要素
    passPhraseError: HTMLElement;
    serviceNameError: HTMLElement;
    versionError: HTMLElement;
    passwordModeError: HTMLElement;
    passwordLengthError: HTMLElement;
}

/**
 * DOM要素とエラーハンドラを初期化する関数
 * @returns DOM要素と致命的エラーハンドラを含むオブジェクト、または初期化失敗時はnull
 */
function initDomElements(): {
    elements: DomElements;
    fatalError: FatalErrorHandler<DomElements>;
} | null {
    // 致命的エラー要素の参照を取得
    const fatalErrorElements = getFatalErrorElements();
    const fatalError = createFatalErrorHandler(fatalErrorElements, disableInputFields);

    // DOM要素の参照を取得
    const elements = getDomElements();

    // DOM要素が取得できなかった場合は致命的エラーを表示して終了
    if (elements === null) {
        fatalError.show("必要なDOM要素が見つかりませんでした");
        return null;
    }

    // 致命的エラーハンドラに要素を設定
    fatalError.setElements(elements);

    return { elements, fatalError };
}

/**
 * 致命的エラー要素の参照を取得する関数
 * @returns {FatalErrorElements} 致命的エラー要素の参照
 */
function getFatalErrorElements(): FatalErrorElements {
    return {
        fatalError: document.getElementById("fatal-error") as HTMLElement | null,
        fatalErrorMessage: document.getElementById("fatal-error-message") as HTMLElement | null,
    };
}

/**
 * DOM要素の参照を取得する関数
 * @returns {DomElements | null} DOM要素の参照、一つでも要素が見つからない場合はnull
 */
function getDomElements(): DomElements | null {
    const passwordOutput = document.getElementById("password-output") as HTMLElement | null;
    const generateButton = document.getElementById("generate-button") as HTMLButtonElement | null;
    const copyButton = document.getElementById("copy-button") as HTMLButtonElement | null;
    const passPhrase = document.getElementById("pass-phrase") as HTMLInputElement | null;
    const serviceName = document.getElementById("service-name") as HTMLInputElement | null;
    const version = document.getElementById("version") as HTMLInputElement | null;
    const passwordMode = document.getElementById("password-mode") as HTMLSelectElement | null;
    const passwordLength = document.getElementById("password-length") as HTMLInputElement | null;
    const lengthValue = document.getElementById("length-value") as HTMLElement | null;
    // エラー要素
    const passPhraseError = document.getElementById("pass-phrase-error") as HTMLElement | null;
    const serviceNameError = document.getElementById("service-name-error") as HTMLElement | null;
    const versionError = document.getElementById("version-error") as HTMLElement | null;
    const passwordModeError = document.getElementById("password-mode-error") as HTMLElement | null;
    const passwordLengthError = document.getElementById(
        "password-length-error",
    ) as HTMLElement | null;

    // 一つでも要素が見つからない場合はnullを返す
    if (
        !passwordOutput ||
        !generateButton ||
        !copyButton ||
        !passPhrase ||
        !serviceName ||
        !version ||
        !passwordMode ||
        !passwordLength ||
        !lengthValue ||
        !passPhraseError ||
        !serviceNameError ||
        !versionError ||
        !passwordModeError ||
        !passwordLengthError
    ) {
        return null;
    }

    return {
        passwordOutput,
        generateButton,
        copyButton,
        passPhrase,
        serviceName,
        version,
        passwordMode,
        passwordLength,
        lengthValue,
        // エラー要素
        passPhraseError,
        serviceNameError,
        versionError,
        passwordModeError,
        passwordLengthError,
    };
}

/**
 * 入力フィールドを無効化する関数
 * @param {DomElements} elements - DOM要素の参照
 */
function disableInputFields(elements: DomElements): void {
    elements.passPhrase.disabled = true;
    elements.serviceName.disabled = true;
    elements.version.disabled = true;
    elements.passwordMode.disabled = true;
    elements.passwordLength.disabled = true;
    elements.generateButton.disabled = true;
}

/**
 * WASMから呼び出される関数をグローバルスコープに割り当て
 * @param {DomElements} elements - DOM要素の参照
 */
function registerWasmCallbacks(elements: DomElements): void {
    /**
     * エラーメッセージを設定する（表示または非表示）
     * @param {HTMLElement} element - エラーメッセージ要素
     * @param {string | ""} message - 表示するエラーメッセージ（空文字列の場合は非表示）
     */
    const setError = (element: HTMLElement, message: "" | string | null): void => {
        if (message === "") {
            element.textContent = "";
            element.classList.remove("show");
        } else {
            element.textContent = message === null ? "不明なエラー" : message;
            element.classList.add("show");
        }
    };

    /**
     * 生成されたパスワードを表示する
     * @param {string} password - 生成されたパスワード
     */
    const draw_generated_password = (password: string): void => {
        elements.passwordOutput.textContent = password;
    };

    /**
     * パスフレーズのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_pass_phrase_error = (errorMessage: string | null): void => {
        setError(elements.passPhraseError, errorMessage);
    };

    /**
     * サービス名のエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_service_name_error = (errorMessage: string | null): void => {
        setError(elements.serviceNameError, errorMessage);
    };

    /**
     * バージョンのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_version_error = (errorMessage: string | null): void => {
        setError(elements.versionError, errorMessage);
    };

    /**
     * パスワードモードのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_password_mode_error = (errorMessage: string | null): void => {
        setError(elements.passwordModeError, errorMessage);
    };

    /**
     * パスワード長のエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    const draw_password_length_error = (errorMessage: string | null): void => {
        setError(elements.passwordLengthError, errorMessage);
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
 * イベントハンドラを宣言的に設定
 * @param {DomElements} elements - DOM要素の参照
 * @param {WasmCall} wasmCall - WASM呼び出し関数
 */
function setupEventHandlers(elements: DomElements, wasmCall: WasmCall): void {
    // イベントハンドラの設定項目
    interface EventHandlerConfig {
        element: HTMLElement;
        event: string;
        handler: () => void;
    }

    // イベントハンドラの設定を宣言的に定義
    const handlers: EventHandlerConfig[] = [
        // パスワード長スライダーの変更イベント
        {
            element: elements.passwordLength,
            event: "input",
            handler: () => {
                const length = elements.passwordLength.value;
                elements.lengthValue.textContent = length;

                wasmCall((wasm) => wasm.set_password_length(length), "パスワード長設定エラー");
            },
        },

        // パスフレーズの変更イベント
        {
            element: elements.passPhrase,
            event: "input",
            handler: () => {
                // 値を一時変数に格納して型チェックを満足させる
                const value = elements.passPhrase.value;
                wasmCall((wasm) => wasm.set_pass_phrase(value), "パスフレーズ設定エラー");
            },
        },

        // サービス名の変更イベント
        {
            element: elements.serviceName,
            event: "input",
            handler: () => {
                // 値を一時変数に格納して型チェックを満足させる
                const value = elements.serviceName.value;
                wasmCall((wasm) => wasm.set_service_name(value), "サービス名設定エラー");
            },
        },

        // バージョンの変更イベント
        {
            element: elements.version,
            event: "input",
            handler: () => {
                // 値を一時変数に格納して型チェックを満足させる
                const value = elements.version.value;
                wasmCall((wasm) => wasm.set_version(value), "バージョン設定エラー");
            },
        },

        // 生成モードの変更イベント
        {
            element: elements.passwordMode,
            event: "change",
            handler: () => {
                // 値を一時変数に格納して型チェックを満足させる
                const value = elements.passwordMode.value;
                wasmCall((wasm) => wasm.set_password_mode(value), "生成モード設定エラー");
            },
        },

        // パスワード生成ボタンのクリックイベント
        {
            element: elements.generateButton,
            event: "click",
            handler: () => {
                wasmCall((wasm) => wasm.generate_password(), "パスワード生成エラー");
            },
        },

        // コピーボタンのクリックイベント
        {
            element: elements.copyButton,
            event: "click",
            handler: () => {
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
                            const originalText = elements.copyButton.textContent;
                            elements.copyButton.textContent = "コピーしました！";

                            setTimeout(() => {
                                elements.copyButton.textContent = originalText;
                            }, 2000);
                        })
                        .catch((err) => {
                            console.error("Failed to copy password:", err);
                        });
                }
            },
        },
    ];

    // 定義に基づいてイベントハンドラを登録
    handlers.forEach(({ element, event, handler }) => {
        element.addEventListener(event, handler);
    });
}

/**
 * 初期設定をWASMに通知
 * @param {DomElements} elements - DOM要素の参照
 * @param {WasmCall} wasmCall - WASM呼び出し関数
 */
function sendInitialValueToWasm(elements: DomElements, wasmCall: WasmCall): void {
    // WASM初期設定項目
    interface InitialValue {
        value: string;
        setter: (wasm: WasmModule, value: string) => void;
        errorPrefix: string;
    }

    // 初期設定を宣言的に定義
    const initialValues: InitialValue[] = [
        {
            value: elements.passPhrase.value,
            setter: (wasm: WasmModule, value: string) => wasm.set_pass_phrase(value),
            errorPrefix: "パスフレーズ初期設定エラー",
        },
        {
            value: elements.serviceName.value,
            setter: (wasm: WasmModule, value: string) => wasm.set_service_name(value),
            errorPrefix: "サービス名初期設定エラー",
        },
        {
            value: elements.version.value,
            setter: (wasm: WasmModule, value: string) => wasm.set_version(value),
            errorPrefix: "バージョン初期設定エラー",
        },
        {
            value: elements.passwordMode.value,
            setter: (wasm: WasmModule, value: string) => wasm.set_password_mode(value),
            errorPrefix: "生成モード初期設定エラー",
        },
        {
            value: elements.passwordLength.value,
            setter: (wasm: WasmModule, value: string) => wasm.set_password_length(value),
            errorPrefix: "パスワード長初期設定エラー",
        },
    ];

    // 定義に基づいて初期設定を適用
    initialValues.forEach(({ value, setter, errorPrefix }) => {
        wasmCall((wasm) => setter(wasm, value), errorPrefix);
    });
}
