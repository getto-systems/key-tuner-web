/**
 * @fileoverview バージョンチェックと最新バージョンへのリダイレクトを担当するモジュール
 *
 * このモジュールは、アプリケーションの現在のバージョンを検出し、より新しいバージョンが
 * 利用可能な場合に自動的にリダイレクトする機能を提供します。セマンティックバージョニング
 * （major.minor.patch）に基づいてバージョン比較を行い、メジャー、マイナー、パッチの
 * 各レベルでのアップデートを検出できます。
 *
 * 主な機能:
 * - URLパスからバージョン情報を抽出
 * - セマンティックバージョンの解析と比較
 * - 新しいバージョンの探索と検出
 * - 最新バージョンへの自動リダイレクト
 */

/**
 * URLまたはLocationのようなpathnameプロパティを持つオブジェクト
 *
 * @example
 * // ブラウザのlocationオブジェクトを使用する例
 * const pathProvider = window.location;
 *
 * // カスタムオブジェクトを使用する例（主にテストケースで使用）
 * const pathProvider = { pathname: '/1.2.3/index.html' };
 */
export interface PathProvider {
    pathname: string;
}

/**
 * セマンティックバージョンを表す型
 *
 * セマンティックバージョニング（SemVer）の仕様に基づいたバージョン情報を表現します。
 * major.minor.patch の形式で、それぞれの数値が特定の意味を持ちます。
 *
 * @property {number} major - メジャーバージョン（互換性のない変更）
 * @property {number} minor - マイナーバージョン（後方互換性のある機能追加）
 * @property {number} patch - パッチバージョン（後方互換性のあるバグ修正）
 *
 * @see https://semver.org/ セマンティックバージョニングの詳細
 */
export interface SemanticVersion {
    major: number;
    minor: number;
    patch: number;
}

/**
 * バージョン存在チェック関数の型定義
 *
 * 指定されたバージョンが実際に存在するかどうかを非同期に確認する関数の型です。
 * 例えば、サーバーにバージョンディレクトリが存在するかをHTTPリクエストで確認するなど。
 *
 * @param {string} version - 存在を確認するバージョン文字列（例: "1.2.3"）
 * @returns {Promise<boolean>} バージョンが存在する場合はtrue、存在しない場合はfalse
 *
 * @example
 * // 実装例: HTTPリクエストでバージョンディレクトリの存在を確認
 * const checkVersionExists: VersionExistenceChecker = async (version) => {
 *   try {
 *     const response = await fetch(`/api/versions/${version}`);
 *     return response.status === 200;
 *   } catch (e) {
 *     return false;
 *   }
 * };
 */
export type VersionExistenceChecker = (version: string) => Promise<boolean>;

/**
 * リダイレクト処理関数の型定義
 *
 * ユーザーを新しいバージョンのURLにリダイレクトするための関数の型です。
 * 実装はアプリケーションの要件に応じて異なる場合があります。
 *
 * @param {string} version - リダイレクト先のバージョン文字列（例: "1.2.3"）
 * @returns {void}
 *
 * @example
 * // 実装例: window.locationを使用したリダイレクト
 * const redirectToVersion: RedirectHandler = (version) => {
 *   const currentPath = window.location.pathname;
 *   const newPath = currentPath.replace(/\/\d+\.\d+\.\d+\//, `/${version}/`);
 *   window.location.href = newPath;
 * };
 */
export type RedirectHandler = (version: string) => void;

/**
 * アプリケーション起動時に最新バージョンチェックを実行する
 *
 * このメソッドは、アプリケーションの起動時に呼び出され、現在のURLパスからバージョン情報を
 * 抽出し、より新しいバージョンが利用可能かどうかを確認します。新しいバージョンが見つかった
 * 場合は、自動的にそのバージョンにリダイレクトします。
 *
 * 処理の流れ:
 * 1. 現在のURLからバージョン情報を抽出
 * 2. バージョン情報が取得できない場合はデフォルトバージョンを使用
 * 3. 最新バージョンを探索
 * 4. 現在のバージョンより新しいバージョンが見つかった場合はリダイレクト
 *
 * @param {PathProvider} currentLocation - 現在のロケーション（URLパス情報を持つオブジェクト）
 * @param {VersionExistenceChecker} versionExistenceChecker - バージョンの存在をチェックする関数
 * @param {RedirectHandler} redirectHandler - リダイレクト処理を行う関数
 * @param {string} defaultVersion - バージョンが取得できなかった場合のデフォルトバージョン
 * @returns {Promise<boolean>} リダイレクトした場合はtrue、しなかった場合はfalse
 *
 * @example
 * // 使用例
 * const checkLatestVersion = async () => {
 *   const result = await checkAndRedirectToLatestVersion(
 *     window.location,
 *     async (version) => {
 *       try {
 *         const response = await fetch(`/${version}/index.html`, { method: 'HEAD' });
 *         return response.ok;
 *       } catch {
 *         return false;
 *       }
 *     },
 *     (version) => {
 *       window.location.href = `/${version}/index.html`;
 *     },
 *     "1.0.0"
 *   );
 *
 *   if (!result) {
 *     console.log("現在最新バージョンを使用しています");
 *   }
 * };
 */
export async function checkAndRedirectToLatestVersion(
    currentLocation: PathProvider,
    versionExistenceChecker: VersionExistenceChecker,
    redirectHandler: RedirectHandler,
    defaultVersion: string,
): Promise<boolean> {
    const currentVersion = extractVersionFromPath(currentLocation);
    // バージョンが取得できなかった場合はデフォルトバージョンを使用
    const versionToUse = currentVersion ?? defaultVersion;

    const latestVersion = await findLatestVersion(versionToUse, versionExistenceChecker);

    if (latestVersion && latestVersion !== versionToUse) {
        performRedirect(latestVersion, redirectHandler);
        return true;
    }

    return false;
}

/**
 * リダイレクト処理を実行する
 *
 * 指定されたバージョンへのリダイレクト処理を実行します。
 * このメソッドは内部的に使用され、実際のリダイレクト処理は
 * 渡されたredirectHandler関数によって行われます。
 *
 * @param {string} targetVersion - リダイレクト先のバージョン
 * @param {RedirectHandler} redirectHandler - リダイレクト処理を行う関数
 * @private
 */
function performRedirect(targetVersion: string, redirectHandler: RedirectHandler): void {
    redirectHandler(targetVersion);
}

/**
 * バージョン文字列をパースしてSemanticVersionオブジェクトに変換する
 *
 * 文字列形式のバージョン（例: "1.2.3"）をSemanticVersionオブジェクトに変換します。
 * 入力が有効なセマンティックバージョン形式でない場合はnullを返します。
 *
 * @param {string} version - バージョン文字列（例: "0.7.0"）
 * @returns {SemanticVersion | null} パースされたバージョン、または無効な形式の場合はnull
 *
 * @example
 * // 有効なバージョン文字列
 * const version = parseVersion("1.2.3");
 * // 結果: { major: 1, minor: 2, patch: 3 }
 *
 * // 無効なバージョン文字列
 * const invalidVersion = parseVersion("1.2");
 * // 結果: null
 */
export function parseVersion(version: string): SemanticVersion | null {
    const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return null;

    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
    };
}

/**
 * SemanticVersionオブジェクトを文字列に変換する
 *
 * SemanticVersionオブジェクトを文字列形式（"major.minor.patch"）に変換します。
 * parseVersion関数の逆の操作を行います。
 *
 * @param {SemanticVersion} version - バージョンオブジェクト
 * @returns {string} バージョン文字列（例: "0.7.0"）
 *
 * @example
 * const versionStr = formatVersion({ major: 1, minor: 2, patch: 3 });
 * // 結果: "1.2.3"
 */
export function formatVersion(version: SemanticVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * 2つのセマンティックバージョンを比較する
 *
 * 2つのSemanticVersionオブジェクトを比較し、どちらが新しいかを判定します。
 * 比較は以下の優先順位で行われます:
 * 1. メジャーバージョン
 * 2. マイナーバージョン
 * 3. パッチバージョン
 *
 * @param {SemanticVersion} v1 - 比較対象のバージョン1
 * @param {SemanticVersion} v2 - 比較対象のバージョン2
 * @returns {number} v1がv2より大きい場合は1、等しい場合は0、小さい場合は-1
 *
 * @example
 * // v1 > v2
 * compareVersions({ major: 2, minor: 0, patch: 0 }, { major: 1, minor: 9, patch: 9 });
 * // 結果: 1
 *
 * // v1 < v2
 * compareVersions({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 3, patch: 0 });
 * // 結果: -1
 *
 * // v1 === v2
 * compareVersions({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 2, patch: 3 });
 * // 結果: 0
 */
export function compareVersions(v1: SemanticVersion, v2: SemanticVersion): number {
    if (v1.major !== v2.major) {
        return v1.major > v2.major ? 1 : -1;
    }

    if (v1.minor !== v2.minor) {
        return v1.minor > v2.minor ? 1 : -1;
    }

    if (v1.patch !== v2.patch) {
        return v1.patch > v2.patch ? 1 : -1;
    }

    return 0; // バージョンが等しい
}

/**
 * 現在のバージョンから次の可能性のあるバージョン候補を生成する
 *
 * 現在のバージョンから、次に可能性のあるバージョンの候補を生成します。
 * 以下の3つの候補を生成します:
 * 1. メジャーバージョンアップ (major+1, minor=0, patch=0)
 * 2. マイナーバージョンアップ (major, minor+1, patch=0)
 * 3. パッチバージョンアップ (major, minor, patch+1)
 *
 * この関数は最新バージョンを探索する際に使用されます。
 *
 * @param {SemanticVersion} currentVersion - 現在のバージョン
 * @returns {SemanticVersion[]} 可能性のある次のバージョンの配列（メジャー、マイナー、パッチの順）
 *
 * @example
 * const candidates = generateVersionCandidates({ major: 1, minor: 2, patch: 3 });
 * // 結果: [
 * //   { major: 2, minor: 0, patch: 0 },  // メジャーバージョンアップ
 * //   { major: 1, minor: 3, patch: 0 },  // マイナーバージョンアップ
 * //   { major: 1, minor: 2, patch: 4 }   // パッチバージョンアップ
 * // ]
 */
export function generateVersionCandidates(currentVersion: SemanticVersion): SemanticVersion[] {
    return [
        // メジャーバージョンアップ
        {
            major: currentVersion.major + 1,
            minor: 0,
            patch: 0,
        },
        // マイナーバージョンアップ
        {
            major: currentVersion.major,
            minor: currentVersion.minor + 1,
            patch: 0,
        },
        // パッチバージョンアップ
        {
            major: currentVersion.major,
            minor: currentVersion.minor,
            patch: currentVersion.patch + 1,
        },
    ];
}

/**
 * 指定されたバージョンが存在するかチェックする
 *
 * SemanticVersionオブジェクトを文字列に変換し、指定されたチェック関数を使用して
 * そのバージョンが実際に存在するかどうかを確認します。
 *
 * この関数は内部的に使用され、バージョン探索アルゴリズムの一部として機能します。
 *
 * @param {SemanticVersion} version - チェックするバージョン
 * @param {VersionExistenceChecker} versionExistenceChecker - バージョンの存在をチェックする関数
 * @returns {Promise<boolean>} バージョンが存在する場合はtrue、存在しない場合はfalse
 * @private
 */
async function checkVersionExists(
    version: SemanticVersion,
    versionExistenceChecker: VersionExistenceChecker,
): Promise<boolean> {
    const versionStr = formatVersion(version);
    return await versionExistenceChecker(versionStr);
}

/**
 * 最新のデプロイされたバージョンを見つける
 *
 * 現在のバージョンを基準に、より新しいバージョンが存在するかどうかを確認します。
 * 存在する場合は、最新のバージョン文字列を返します。現在のバージョンが最新の場合はnullを返します。
 *
 * この関数は、findHighestExistingVersion関数を使用して最新バージョンを探索し、
 * 見つかったバージョンと現在のバージョンを比較します。
 *
 * @param {string} currentVersionStr - 現在のバージョン文字列
 * @param {VersionExistenceChecker} versionExistenceChecker - バージョンの存在をチェックする関数
 * @returns {Promise<string | null>} 最新のバージョン、または現在のバージョンが最新の場合はnull
 *
 * @example
 * // 最新バージョンを確認
 * const latestVersion = await findLatestVersion("1.2.3", async (version) => {
 *   // バージョンの存在確認ロジック
 *   return await checkIfVersionExists(version);
 * });
 *
 * if (latestVersion) {
 *   console.log(`新しいバージョンが利用可能です: ${latestVersion}`);
 * } else {
 *   console.log("現在のバージョンが最新です");
 * }
 */
export async function findLatestVersion(
    currentVersionStr: string,
    versionExistenceChecker: VersionExistenceChecker,
): Promise<string | null> {
    const currentVersion = parseVersion(currentVersionStr);
    if (!currentVersion) {
        return null;
    }

    // 最新バージョンを探索する
    const latestVersion = await findHighestExistingVersion(currentVersion, versionExistenceChecker);

    // 現在のバージョンと最新バージョンを比較
    if (latestVersion && compareVersions(latestVersion, currentVersion) > 0) {
        return formatVersion(latestVersion);
    }

    return null; // 現在のバージョンが最新
}

/**
 * 存在する最も高いバージョンを探索する
 *
 * 指定されたバージョンから始めて、存在する最も高いバージョンを探索します。
 * 探索アルゴリズムは以下のステップで動作します:
 * 1. 現在のバージョンから次の候補バージョンを生成（メジャー、マイナー、パッチの順）
 * 2. 各候補が存在するかチェック
 * 3. 存在する候補が見つかった場合、その候補を新しい現在のバージョンとして設定し、ステップ1に戻る
 * 4. 存在する候補が見つからなかった場合、探索を終了
 *
 * この関数は内部的に使用され、バージョン探索の中核ロジックを提供します。
 *
 * @param {SemanticVersion} startVersion - 探索を開始するバージョン
 * @param {VersionExistenceChecker} versionExistenceChecker - バージョンの存在をチェックする関数
 * @returns {Promise<SemanticVersion | null>} 見つかった最新バージョン、または見つからなかった場合はnull
 * @private
 */
async function findHighestExistingVersion(
    startVersion: SemanticVersion,
    versionExistenceChecker: VersionExistenceChecker,
): Promise<SemanticVersion | null> {
    let highestVersion: SemanticVersion | null = null;
    let currentCheckVersion = startVersion;

    // 探索を続ける限り繰り返す
    let continueSearch = true;

    while (continueSearch) {
        continueSearch = false;

        // 次のバージョン候補を生成
        const candidates = generateVersionCandidates(currentCheckVersion);

        // 各候補をチェック
        for (const candidate of candidates) {
            if (await checkVersionExists(candidate, versionExistenceChecker)) {
                // 存在するバージョンが見つかった場合
                highestVersion = candidate;
                currentCheckVersion = candidate;
                continueSearch = true;
                break; // 次の候補セットへ
            }
        }
    }

    return highestVersion;
}

/**
 * 現在のURLからバージョンを取得する
 *
 * URLパスからセマンティックバージョン文字列を抽出します。
 * 正規表現を使用して、パス内の "/x.y.z/" 形式のバージョン部分を検出します。
 *
 * @param {PathProvider} currentUrl - pathnameプロパティを持つオブジェクト
 * @returns {string | null} バージョン文字列、または解析に失敗した場合はnull
 *
 * @example
 * // URLからバージョンを抽出
 * const version = extractVersionFromPath({ pathname: '/1.2.3/index.html' });
 * // 結果: "1.2.3"
 *
 * // バージョンが含まれていない場合
 * const noVersion = extractVersionFromPath({ pathname: '/index.html' });
 * // 結果: null
 */
export function extractVersionFromPath(currentUrl: PathProvider): string | null {
    // pathnameからバージョンを抽出
    // /1.2.3/index.html のようなパスからバージョンを抽出
    const versionRegex = /\/([0-9]+\.[0-9]+\.[0-9]+)\//;
    const versionMatch = currentUrl.pathname.match(versionRegex);

    if (versionMatch && versionMatch[1]) {
        return versionMatch[1];
    }

    return null;
}
