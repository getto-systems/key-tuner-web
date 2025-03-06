// DOM操作を担当するモジュール

import { WasmModule } from "../wasm/index";

/**
 * DOM要素のセットアップとイベントハンドラの登録
 * @param {() => Promise<WasmModule>} initWasm - WASMモジュールを初期化する関数
 */
export function setupDom(initWasm: () => WasmModule): void {
    // DOM要素の参照を取得
    const passwordOutput = document.getElementById("password-output") as HTMLElement | null;
    const generateButton = document.getElementById("generate-button") as HTMLButtonElement | null;
    const copyButton = document.getElementById("copy-button") as HTMLButtonElement | null;
    const passPhrase = document.getElementById("pass-phrase") as HTMLInputElement | null;
    const serviceName = document.getElementById("service-name") as HTMLInputElement | null;
    const version = document.getElementById("version") as HTMLInputElement | null;
    const passwordMode = document.getElementById("password-mode") as HTMLSelectElement | null;
    const passwordLength = document.getElementById("password-length") as HTMLInputElement | null;
    const lengthValue = document.getElementById("length-value") as HTMLElement | null;

    // エラーメッセージ要素の参照を取得
    const passPhraseError = document.getElementById("pass-phrase-error") as HTMLElement | null;
    const serviceNameError = document.getElementById("service-name-error") as HTMLElement | null;
    const versionError = document.getElementById("version-error") as HTMLElement | null;
    const passwordModeError = document.getElementById("password-mode-error") as HTMLElement | null;
    const passwordLengthError = document.getElementById(
        "password-length-error",
    ) as HTMLElement | null;
    const fatalError = document.getElementById("fatal-error") as HTMLElement | null;
    const fatalErrorMessage = document.getElementById("fatal-error-message") as HTMLElement | null;

    /**
     * エラーメッセージを設定する（表示または非表示）
     * @param {HTMLElement | null} element - エラーメッセージ要素
     * @param {string | ""} message - 表示するエラーメッセージ（空文字列の場合は非表示）
     */
    function setError(element: HTMLElement | null, message: "" | string): void {
        if (!element) return;

        if (message === "") {
            element.textContent = "";
            element.classList.remove("show");
        } else {
            element.textContent = message;
            element.classList.add("show");
        }
    }

    /**
     * 復帰不可能なエラーを表示する
     * @param {string} errorMessage - エラーメッセージ
     */
    function showFatalError(errorMessage: string): void {
        // エラーをコンソールに記録
        console.error("Fatal error:", errorMessage);

        if (!fatalError || !fatalErrorMessage) return;

        // 致命的エラーメッセージを表示
        fatalErrorMessage.textContent = `致命的エラー: ${errorMessage}`;
        fatalError.classList.add("show", "fatal");

        // 入力フィールドを無効化
        if (passPhrase) passPhrase.disabled = true;
        if (serviceName) serviceName.disabled = true;
        if (version) version.disabled = true;
        if (passwordMode) passwordMode.disabled = true;
        if (passwordLength) passwordLength.disabled = true;
        if (generateButton) generateButton.disabled = true;
    }

    /**
     * 生成されたパスワードを表示する
     * @param {string} password - 生成されたパスワード
     */
    function draw_generated_password(password: string): void {
        if (passwordOutput) {
            passwordOutput.textContent = password;
        }
    }

    /**
     * パスフレーズのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    function draw_pass_phrase_error(errorMessage: string | null): void {
        setError(passPhraseError, errorMessage || "");
    }

    /**
     * サービス名のエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    function draw_service_name_error(errorMessage: string | null): void {
        setError(serviceNameError, errorMessage || "");
    }

    /**
     * バージョンのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    function draw_version_error(errorMessage: string | null): void {
        setError(versionError, errorMessage || "");
    }

    /**
     * パスワードモードのエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    function draw_password_mode_error(errorMessage: string | null): void {
        setError(passwordModeError, errorMessage || "");
    }

    /**
     * パスワード長のエラーを表示する
     * @param {string | null} errorMessage - エラーメッセージ
     */
    function draw_password_length_error(errorMessage: string | null): void {
        setError(passwordLengthError, errorMessage || "");
    }

    // WASMから呼び出される関数をグローバルスコープに割り当て
    (window as any).draw_generated_password = draw_generated_password;
    (window as any).draw_pass_phrase_error = draw_pass_phrase_error;
    (window as any).draw_service_name_error = draw_service_name_error;
    (window as any).draw_version_error = draw_version_error;
    (window as any).draw_password_mode_error = draw_password_mode_error;
    (window as any).draw_password_length_error = draw_password_length_error;

    try {
        // WASMモジュールを初期化
        const wasm = initWasm();

        // パスワード長スライダーの変更イベント
        if (passwordLength && lengthValue) {
            passwordLength.addEventListener("input", () => {
                const length = passwordLength.value;
                lengthValue.textContent = length;

                // WASMに設定を通知
                try {
                    wasm.set_password_length(length);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    showFatalError(`パスワード長設定エラー: ${errorMessage}`);
                }
            });
        }

        // パスフレーズの変更イベント
        if (passPhrase) {
            passPhrase.addEventListener("input", () => {
                try {
                    wasm.set_pass_phrase(passPhrase.value);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    showFatalError(`パスフレーズ設定エラー: ${errorMessage}`);
                }
            });
        }

        // サービス名の変更イベント
        if (serviceName) {
            serviceName.addEventListener("input", () => {
                try {
                    wasm.set_service_name(serviceName.value);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    showFatalError(`サービス名設定エラー: ${errorMessage}`);
                }
            });
        }

        // バージョンの変更イベント
        if (version) {
            version.addEventListener("input", () => {
                try {
                    wasm.set_version(version.value);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    showFatalError(`バージョン設定エラー: ${errorMessage}`);
                }
            });
        }

        // 生成モードの変更イベント
        if (passwordMode) {
            passwordMode.addEventListener("change", () => {
                try {
                    wasm.set_password_mode(passwordMode.value);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    showFatalError(`生成モード設定エラー: ${errorMessage}`);
                }
            });
        }

        // パスワード生成ボタンのクリックイベント
        if (generateButton) {
            generateButton.addEventListener("click", () => {
                try {
                    // WASMからパスワードを生成
                    wasm.generate_password();
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    showFatalError(`パスワード生成エラー: ${errorMessage}`);
                }
            });
        }

        // コピーボタンのクリックイベント
        if (copyButton && passwordOutput) {
            copyButton.addEventListener("click", () => {
                const password = passwordOutput.textContent;

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
                            const originalText = copyButton.textContent;
                            copyButton.textContent = "コピーしました！";

                            setTimeout(() => {
                                copyButton.textContent = originalText;
                            }, 2000);
                        })
                        .catch((err) => {
                            console.error("Failed to copy password:", err);
                        });
                }
            });
        }

        // 初期設定をWASMに通知
        if (passPhrase) wasm.set_pass_phrase(passPhrase.value);
        if (serviceName) wasm.set_service_name(serviceName.value);
        if (version) wasm.set_version(version.value);
        if (passwordMode) wasm.set_password_mode(passwordMode.value);
        if (passwordLength) wasm.set_password_length(passwordLength.value);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to initialize settings:", error);
        showFatalError(`初期化エラー: ${errorMessage}`);
    }
}
