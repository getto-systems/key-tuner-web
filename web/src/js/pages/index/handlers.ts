// イベントハンドラとWASMコールバックを担当するモジュール

import { KeyTunerWasm } from "../../wasm_artifacts/key_tuner_wasm";
import { FatalErrorHandler } from "../../common/fatal_error";
import { DomElements } from "./elements";

/**
 * WASMから呼び出される関数をグローバルスコープに割り当て
 * @param {DomElements} elements - DOM要素の参照
 * @param {FatalErrorHandler<DomElements>} fatalError - 致命的エラーハンドラ
 */
export function registerWasmCallbacks(
    elements: DomElements,
    fatalError: FatalErrorHandler<DomElements>,
): void {
    /**
     * 生成されたパスワードを表示する
     * @param {string} password - 生成されたパスワード
     */
    const draw_generated_password = (password: string): void => {
        if (password === "") {
            // 空文字列の場合、パスワード出力を隠してプレースホルダーを表示
            elements.passwordOutput.style.display = "none";
            elements.passwordPlaceholder.style.display = "block";
        } else {
            // パスワードがある場合、パスワード出力を表示してプレースホルダーを隠す
            elements.passwordOutput.textContent = password;
            elements.passwordOutput.style.display = "block";
            elements.passwordPlaceholder.style.display = "none";
        }
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

    /**
     * 生成されたパスワードをクリップボードに貼り付ける
     * @param {string} password - クリップボードにコピーするパスワード
     */
    const paste_generated_password_to_clipboard = (password: string): void => {
        navigator.clipboard
            .writeText(password)
            .then(() => {
                // コピー成功時の視覚的フィードバック
                // コピーボタンを非表示にし、コピーしましたボタンを表示する
                elements.copyButton.style.display = "none";
                elements.copiedButton.style.display = "inline-block";

                setTimeout(() => {
                    // 2秒後に元の状態に戻す
                    elements.copyButton.style.display = "inline-block";
                    elements.copiedButton.style.display = "none";
                }, 2000);
            })
            .catch((err) => {
                fatalError.show("パスワードのコピーに失敗しました");
            });
    };

    // 名前空間に割り当て
    // 現状、この方法以外では wasm 側に js のメソッドを公開する方法がない
    // 名前の衝突が起こりにくいような名前で登録を行う
    (window as any).__KEY_TUNER_WASM_BRIDGE__ = (window as any).__KEY_TUNER_WASM_BRIDGE__ || {
        draw_generated_password,
        draw_pass_phrase_error,
        draw_service_name_error,
        draw_version_error,
        draw_password_mode_error,
        draw_password_length_error,
        paste_generated_password_to_clipboard,
    };

    /**
     * エラーメッセージを設定する（表示または非表示）
     * @param {HTMLElement} element - エラーメッセージ要素
     * @param {string | ""} message - 表示するエラーメッセージ（空文字列の場合は非表示）
     */
    function setError(element: HTMLElement, message: "" | string | null): void {
        if (message === "") {
            element.textContent = "";
            element.classList.remove("show");
        } else {
            element.textContent = message === null ? "不明なエラー" : message;
            element.classList.add("show");
        }
    }
}

// イベントハンドラの設定項目
interface EventHandlerConfig<T extends HTMLElement> {
    element: T;
    event: string;
    handler: (element: T) => void;
}

/**
 * イベントハンドラを宣言的に設定
 * @param {DomElements} elements - DOM要素の参照
 * @param {KeyTunerWasm} wasm - KeyTunerWasm
 * @param {FatalErrorHandler<DomElements>} fatalError - 致命的エラーハンドラ
 */
export function setupEventHandlers(
    elements: DomElements,
    wasm: KeyTunerWasm,
    fatalError: FatalErrorHandler<DomElements>,
): void {
    // HTMLInputElement のハンドラー
    register([
        // パスワード長の変更イベント
        {
            element: elements.passwordLength,
            event: "input",
            handler: (input: HTMLInputElement) => {
                safeWasmCall(
                    () => wasm.set_password_length(input.value),
                    "パスワード長の設定に失敗しました",
                    fatalError,
                );
            },
        },
        // パスワード長のフォーカスイベント
        {
            element: elements.passwordLength,
            event: "focus",
            handler: (input: HTMLInputElement) => {
                input.select(); // テキストを全選択
            },
        },

        // パスフレーズの変更イベント
        {
            element: elements.passPhrase,
            event: "input",
            handler: (input: HTMLInputElement) => {
                safeWasmCall(
                    () => wasm.set_pass_phrase(input.value),
                    "パスフレーズの設定に失敗しました",
                    fatalError,
                );
            },
        },
        // パスフレーズのフォーカスイベント
        {
            element: elements.passPhrase,
            event: "focus",
            handler: (input: HTMLInputElement) => {
                input.select(); // テキストを全選択
            },
        },

        // サービス名の変更イベント
        {
            element: elements.serviceName,
            event: "input",
            handler: (input: HTMLInputElement) => {
                safeWasmCall(
                    () => wasm.set_service_name(input.value),
                    "サービス名の設定に失敗しました",
                    fatalError,
                );
            },
        },
        // サービス名のフォーカスイベント
        {
            element: elements.serviceName,
            event: "focus",
            handler: (input: HTMLInputElement) => {
                input.select(); // テキストを全選択
            },
        },

        // バージョンの変更イベント
        {
            element: elements.version,
            event: "input",
            handler: (input: HTMLInputElement) => {
                safeWasmCall(
                    () => wasm.set_version(input.value),
                    "バージョンの設定に失敗しました",
                    fatalError,
                );
            },
        },
        // バージョンのフォーカスイベント
        {
            element: elements.version,
            event: "focus",
            handler: (input: HTMLInputElement) => {
                input.select(); // テキストを全選択
            },
        },
    ]);

    // ラジオボタンのイベントハンドラ
    register(
        Array.from(elements.passwordMode.elements).map((radio) => ({
            element: radio,
            event: "change",
            handler: (radioInput: HTMLInputElement) => {
                if (radioInput.checked) {
                    safeWasmCall(
                        () => wasm.set_password_mode(radioInput.value),
                        "パスワードモードの設定に失敗しました",
                        fatalError,
                    );
                }
            },
        })),
    );

    // HTMLButtonElement のハンドラー
    register([
        // パスワード生成ボタンのクリックイベント
        {
            element: elements.generateButton,
            event: "click",
            handler: (button: HTMLButtonElement) => {
                safeWasmCall(
                    () => wasm.generate_password(),
                    "パスワードの生成に失敗しました",
                    fatalError,
                );
            },
        },

        // コピーボタンのクリックイベント
        {
            element: elements.copyButton,
            event: "click",
            handler: (button: HTMLButtonElement) => {
                // WASMのcopy_generated_password関数を使用
                safeWasmCall(
                    () => wasm.copy_generated_password(),
                    "パスワードのコピーに失敗しました",
                    fatalError,
                );
            },
        },
    ]);

    /**
     * イベントハンドラを要素に登録する
     * @template T HTMLElementを継承した型
     * @param {Array<EventHandlerConfig<T>>} handlers - 登録するイベントハンドラの設定配列
     */
    function register<T extends HTMLElement>(handlers: Array<EventHandlerConfig<T>>): void {
        handlers.forEach(({ element, event, handler }) => {
            element.addEventListener(event, () => {
                // 型安全のために同じ要素を渡す
                handler(element);
            });
        });
    }
}

/**
 * 初期設定をWASMに通知
 * @param {DomElements} elements - DOM要素の参照
 * @param {KeyTunerWasm} wasm - KeyTunerWasm
 * @param {FatalErrorHandler<DomElements>} fatalError - 致命的エラーハンドラ
 */
export function sendInitialValueToWasm(
    elements: DomElements,
    wasm: KeyTunerWasm,
    fatalError: FatalErrorHandler<DomElements>,
): void {
    // WASM初期設定項目
    interface InitialValue {
        setter: () => void;
        errorMessage: string;
    }

    // 初期設定を宣言的に定義
    const initialValues: InitialValue[] = [
        {
            setter: () => wasm.set_pass_phrase(elements.passPhrase.value),
            errorMessage: "パスフレーズの初期設定に失敗しました",
        },
        {
            setter: () => wasm.set_service_name(elements.serviceName.value),
            errorMessage: "サービス名の初期設定に失敗しました",
        },
        {
            setter: () => wasm.set_version(elements.version.value),
            errorMessage: "バージョンの初期設定に失敗しました",
        },
        {
            setter: () => wasm.set_password_mode(elements.passwordMode.value),
            errorMessage: "パスワードモードの初期設定に失敗しました",
        },
        {
            setter: () => wasm.set_password_length(elements.passwordLength.value),
            errorMessage: "パスワード長の初期設定に失敗しました",
        },
    ];

    // 定義に基づいて初期設定を適用
    initialValues.forEach(({ setter, errorMessage }) => {
        safeWasmCall(setter, errorMessage, fatalError);
    });
}

/**
 * WASM関数呼び出しのエラーを処理する
 * @param {Function} wasmFn - 呼び出すWASM関数
 * @param {string} errorMessage - エラー発生時に表示するメッセージ
 * @param {FatalErrorHandler<DomElements>} fatalError - 致命的エラーハンドラ
 * @returns {boolean} 関数の実行が成功したかどうか
 */
function safeWasmCall(
    wasmFn: () => void,
    errorMessage: string,
    fatalError: FatalErrorHandler<DomElements>,
): boolean {
    try {
        wasmFn();
        return true;
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        // 致命的エラーハンドラを使用してエラーを表示
        fatalError.show(errorMessage);
        return false;
    }
}
