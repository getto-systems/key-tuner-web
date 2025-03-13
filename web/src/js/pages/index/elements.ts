// DOM要素の取得を担当するモジュール

import {
    FatalErrorElements,
    FatalErrorHandler,
    createFatalErrorHandler,
} from "../../common/fatal_error";

// ラジオボタングループのラッパー型
export interface RadioButtonGroup {
    elements: NodeListOf<HTMLInputElement>;
    value: string;
    disabled: boolean;
}

// DOM要素の型定義
export interface DomElements {
    passwordOutput: HTMLElement;
    generateButton: HTMLButtonElement;
    copyButton: HTMLButtonElement;
    passPhrase: HTMLInputElement;
    serviceName: HTMLInputElement;
    version: HTMLInputElement;
    passwordMode: RadioButtonGroup;
    passwordLength: HTMLInputElement;
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
export function initDomElements(): {
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
export function getFatalErrorElements(): FatalErrorElements {
    return {
        fatalError: document.getElementById("fatal-error") as HTMLElement | null,
        fatalErrorMessage: document.getElementById("fatal-error-message") as HTMLElement | null,
    };
}

/**
 * DOM要素の参照を取得する関数
 * @returns {DomElements | null} DOM要素の参照、一つでも要素が見つからない場合はnull
 */
export function getDomElements(): DomElements | null {
    const passwordOutput = document.getElementById("password-output") as HTMLElement | null;
    const generateButton = document.getElementById("generate-button") as HTMLButtonElement | null;
    const copyButton = document.getElementById("copy-button") as HTMLButtonElement | null;
    const passPhrase = document.getElementById("pass-phrase") as HTMLInputElement | null;
    const serviceName = document.getElementById("service-name") as HTMLInputElement | null;
    const version = document.getElementById("version") as HTMLInputElement | null;
    // ラジオボタングループの取得
    const passwordModeElements = document.getElementsByName(
        "password-mode",
    ) as NodeListOf<HTMLInputElement>;

    // ラジオボタングループのラッパーオブジェクトを作成
    const passwordMode: RadioButtonGroup | null =
        passwordModeElements.length > 0
            ? {
                  elements: passwordModeElements,
                  get value() {
                      const elements = Array.from(this.elements) as HTMLInputElement[];
                      const checked = elements.find((el) => el.checked);
                      return checked ? checked.value : "";
                  },
                  set disabled(isDisabled: boolean) {
                      const elements = Array.from(this.elements) as HTMLInputElement[];
                      elements.forEach((el) => {
                          el.disabled = isDisabled;
                      });
                  },
              }
            : null;
    const passwordLength = document.getElementById("password-length") as HTMLInputElement | null;
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
export function disableInputFields(elements: DomElements): void {
    elements.passPhrase.disabled = true;
    elements.serviceName.disabled = true;
    elements.version.disabled = true;
    elements.passwordMode.disabled = true;
    elements.passwordLength.disabled = true;
    elements.generateButton.disabled = true;
}
