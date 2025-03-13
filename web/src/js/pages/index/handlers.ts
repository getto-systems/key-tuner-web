// イベントハンドラとWASMコールバックを担当するモジュール

import { KeyTunerWasm } from "../../wasm_artifacts/key-tuner-wasm";
import { DomElements } from "./elements";

/**
 * WASMから呼び出される関数をグローバルスコープに割り当て
 * @param {DomElements} elements - DOM要素の参照
 */
export function registerWasmCallbacks(elements: DomElements): void {
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
    };
}

/**
 * イベントハンドラを宣言的に設定
 * @param {DomElements} elements - DOM要素の参照
 * @param {KeyTunerWasm} wasm - KeyTunerWasm
 */
export function setupEventHandlers(elements: DomElements, wasm: KeyTunerWasm): void {
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

                wasm.set_password_length(length);
            },
        },

        // パスフレーズの変更イベント
        {
            element: elements.passPhrase,
            event: "input",
            handler: () => {
                wasm.set_pass_phrase(elements.passPhrase.value);
            },
        },

        // サービス名の変更イベント
        {
            element: elements.serviceName,
            event: "input",
            handler: () => {
                wasm.set_service_name(elements.serviceName.value);
            },
        },

        // バージョンの変更イベント
        {
            element: elements.version,
            event: "input",
            handler: () => {
                wasm.set_version(elements.version.value);
            },
        },

        // 生成モードの変更イベント（ラジオボタン）は個別に設定

        // パスワード生成ボタンのクリックイベント
        {
            element: elements.generateButton,
            event: "click",
            handler: () => {
                wasm.generate_password();
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

    // ラジオボタンのイベントハンドラを設定
    setupRadioButtonHandlers(elements, wasm);
}

/**
 * ラジオボタンのイベントハンドラを設定
 * @param {DomElements} elements - DOM要素の参照
 * @param {KeyTunerWasm} wasm - KeyTunerWasm
 */
function setupRadioButtonHandlers(elements: DomElements, wasm: KeyTunerWasm): void {
    // パスワードモードのラジオボタン
    const radioElements = Array.from(elements.passwordMode.elements) as HTMLInputElement[];
    
    // 各ラジオボタンに変更イベントを設定
    radioElements.forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.checked) {
                wasm.set_password_mode(radio.value);
            }
        });
    });
}

/**
 * 初期設定をWASMに通知
 * @param {DomElements} elements - DOM要素の参照
 * @param {KeyTunerWasm} wasm - KeyTunerWasm
 */
export function sendInitialValueToWasm(elements: DomElements, wasm: KeyTunerWasm): void {
    // WASM初期設定項目
    interface InitialValue {
        value: string;
        setter: (value: string) => void;
    }

    // 初期設定を宣言的に定義
    const initialValues: InitialValue[] = [
        {
            value: elements.passPhrase.value,
            setter: (value: string) => wasm.set_pass_phrase(value),
        },
        {
            value: elements.serviceName.value,
            setter: (value: string) => wasm.set_service_name(value),
        },
        {
            value: elements.version.value,
            setter: (value: string) => wasm.set_version(value),
        },
        {
            value: elements.passwordMode.value,
            setter: (value: string) => wasm.set_password_mode(value),
        },
        {
            value: elements.passwordLength.value,
            setter: (value: string) => wasm.set_password_length(value),
        },
    ];

    // 定義に基づいて初期設定を適用
    initialValues.forEach(({ value, setter }) => {
        setter(value);
    });
}
