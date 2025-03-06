// 致命的エラー処理を担当するモジュール

// 致命的エラー要素の型定義
export interface FatalErrorElements {
    fatalError: HTMLElement | null;
    fatalErrorMessage: HTMLElement | null;
}

// 致命的エラーハンドラの型定義
export interface FatalErrorHandler<T> {
    setElements(elements: T): void;
    show(errorMessage: string): void;
}

/**
 * 致命的エラーハンドラを作成
 * @param {FatalErrorElements} fatalErrorElements - 致命的エラー要素の参照
 * @param {(elements: T) => void} disableFields - 要素を無効化する関数
 * @returns {FatalErrorHandler<T>} 致命的エラーハンドラ
 */
export function createFatalErrorHandler<T>(
    fatalErrorElements: FatalErrorElements,
    disableFields: (elements: T) => void,
): FatalErrorHandler<T> {
    // 内部で保持する要素の参照
    let elements: T | null = null;

    return {
        /**
         * エラー表示用の要素を設定する
         * @param {T} newElements - 要素の参照
         */
        setElements(newElements: T): void {
            // 渡された要素を内部変数に保存
            elements = newElements;
        },

        /**
         * 復帰不可能なエラーを表示する
         * @param {string} errorMessage - エラーメッセージ
         */
        show(errorMessage: string): void {
            // エラーをコンソールに記録
            console.error("Fatal error:", errorMessage);

            if (!fatalErrorElements.fatalError || !fatalErrorElements.fatalErrorMessage) return;

            // 致命的エラーメッセージを表示
            fatalErrorElements.fatalErrorMessage.textContent = `致命的エラー: ${errorMessage}`;
            fatalErrorElements.fatalError.classList.add("show", "fatal");

            // elementsが設定されている場合のみ入力フィールドを無効化
            if (elements) {
                disableFields(elements);
            }
        },
    };
}
