// バージョンチェックと最新バージョンへのリダイレクトを担当するモジュール

/**
 * URLまたはLocationのようなpathnameプロパティを持つオブジェクト
 */
export interface PathProvider {
    pathname: string;
}

/**
 * セマンティックバージョンを表す型
 */
export interface SemanticVersion {
    major: number;
    minor: number;
    patch: number;
}

/**
 * バージョン存在チェック関数の型定義
 */
export type VersionExistenceChecker = (version: string) => Promise<boolean>;

/**
 * リダイレクト処理関数の型定義
 */
export type RedirectHandler = (version: string) => void;

/**
 * アプリケーション起動時に最新バージョンチェックを実行する
 * @param {PathProvider} currentLocation - 現在のロケーション（URLパス情報を持つオブジェクト）
 * @param {VersionExistenceChecker} versionExistenceChecker - バージョンの存在をチェックする関数
 * @param {RedirectHandler} redirectHandler - リダイレクト処理を行う関数
 * @param {string} defaultVersion - バージョンが取得できなかった場合のデフォルトバージョン
 * @returns {Promise<boolean>} リダイレクトした場合はtrue、しなかった場合はfalse
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
 * @param {string} targetVersion - リダイレクト先のバージョン
 * @param {RedirectHandler} redirectHandler - リダイレクト処理を行う関数
 */
function performRedirect(targetVersion: string, redirectHandler: RedirectHandler): void {
    redirectHandler(targetVersion);
}

/**
 * バージョン文字列をパースしてSemanticVersionオブジェクトに変換する
 * @param {string} version - バージョン文字列（例: "0.7.0"）
 * @returns {SemanticVersion | null} パースされたバージョン、または無効な形式の場合はnull
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
 * @param {SemanticVersion} version - バージョンオブジェクト
 * @returns {string} バージョン文字列（例: "0.7.0"）
 */
export function formatVersion(version: SemanticVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * 2つのセマンティックバージョンを比較する
 * @param {SemanticVersion} v1 - 比較対象のバージョン1
 * @param {SemanticVersion} v2 - 比較対象のバージョン2
 * @returns {number} v1がv2より大きい場合は1、等しい場合は0、小さい場合は-1
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
 * @param {SemanticVersion} currentVersion - 現在のバージョン
 * @returns {SemanticVersion[]} 可能性のある次のバージョンの配列（メジャー、マイナー、パッチの順）
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
 * @param {SemanticVersion} version - チェックするバージョン
 * @param {VersionExistenceChecker} versionExistenceChecker - バージョンの存在をチェックする関数
 * @returns {Promise<boolean>} バージョンが存在する場合はtrue、存在しない場合はfalse
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
 * @param {string} currentVersionStr - 現在のバージョン文字列
 * @param {VersionExistenceChecker} versionExistenceChecker - バージョンの存在をチェックする関数
 * @returns {Promise<string | null>} 最新のバージョン、または現在のバージョンが最新の場合はnull
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
 * @param {SemanticVersion} startVersion - 探索を開始するバージョン
 * @param {VersionExistenceChecker} versionExistenceChecker - バージョンの存在をチェックする関数
 * @returns {Promise<SemanticVersion | null>} 見つかった最新バージョン、または見つからなかった場合はnull
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
 * @param {PathProvider} currentUrl - pathnameプロパティを持つオブジェクト
 * @returns {string | null} バージョン文字列、または解析に失敗した場合はnull
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
