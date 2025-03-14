// バージョンチェックと最新バージョンへのリダイレクトを担当するモジュール

/**
 * URLまたはLocationのようなpathnameプロパティを持つオブジェクト
 */
export interface PathProvider {
    pathname: string;
}

/**
 * アプリケーション起動時に最新バージョンチェックを実行する
 * @param {PathProvider} currentLocation - 現在のロケーション（URLパス情報を持つオブジェクト）
 * @param {(version: string) => Promise<boolean>} versionChecker - バージョンの存在をチェックする関数
 * @param {(version: string) => void} redirect - リダイレクト処理を行う関数
 * @param {string} defaultVersion - バージョンが取得できなかった場合のデフォルトバージョン
 * @returns {Promise<boolean>} リダイレクトした場合はtrue、しなかった場合はfalse
 */
export function checkAndRedirectToLatestVersion(
    currentLocation: PathProvider,
    versionChecker: (version: string) => Promise<boolean>,
    redirect: (version: string) => void,
    defaultVersion: string,
): Promise<boolean> {
    const currentVersion = extractVersionFromPath(currentLocation);
    // バージョンが取得できなかった場合はデフォルトバージョンを使用
    const versionToUse = currentVersion ?? defaultVersion;
    return redirectToLatestVersion(versionToUse, versionChecker, redirect);
}

/**
 * 最新バージョンが存在する場合、そのURLにリダイレクトする
 * @param {string} currentVersion - 現在のバージョン文字列
 * @param {(version: string) => Promise<boolean>} versionChecker - バージョンの存在をチェックする関数
 * @param {(version: string) => void} redirect - リダイレクト処理を行う関数
 * @returns {Promise<boolean>} リダイレクトした場合はtrue、しなかった場合はfalse
 */
export async function redirectToLatestVersion(
    currentVersion: string,
    versionChecker: (version: string) => Promise<boolean>,
    redirect: (version: string) => void,
): Promise<boolean> {
    const latestVersion = await findLatestVersion(currentVersion, versionChecker);

    if (latestVersion && latestVersion !== currentVersion) {
        redirect(latestVersion);
        return true;
    }

    return false;
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
 * 現在のバージョンから次の可能性のあるバージョンを生成する
 * @param {SemanticVersion} currentVersion - 現在のバージョン
 * @returns {SemanticVersion[]} 可能性のある次のバージョンの配列（メジャー、マイナー、パッチの順）
 */
export function generateNextVersions(currentVersion: SemanticVersion): SemanticVersion[] {
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
 * 最新のデプロイされたバージョンを見つける
 * @param {string} currentVersionStr - 現在のバージョン文字列
 * @param {(version: string) => Promise<boolean>} versionChecker - バージョンの存在をチェックする関数
 * @returns {Promise<string | null>} 最新のバージョン、または現在のバージョンが最新の場合はnull
 */
export async function findLatestVersion(
    currentVersionStr: string,
    versionChecker: (version: string) => Promise<boolean>,
): Promise<string | null> {
    const currentVersion = parseVersion(currentVersionStr);
    if (!currentVersion) {
        return null;
    }

    let latestVersion = currentVersion;
    let foundNewer = false;

    // 次の可能性のあるバージョンをチェック
    const checkVersion = async (version: SemanticVersion): Promise<boolean> => {
        const versionStr = formatVersion(version);
        const exists = await versionChecker(versionStr);

        if (exists) {
            latestVersion = version;
            return true;
        }
        return false;
    };

    // 最初のチェック
    let nextVersions = generateNextVersions(currentVersion);
    for (const version of nextVersions) {
        if (await checkVersion(version)) {
            foundNewer = true;

            // 見つかったバージョンから次のバージョンをチェック（再帰的に）
            let newerVersion = version;
            let continueChecking = true;

            while (continueChecking) {
                const newerVersions = generateNextVersions(newerVersion);
                continueChecking = false;

                for (const v of newerVersions) {
                    if (await checkVersion(v)) {
                        newerVersion = v;
                        latestVersion = v;
                        continueChecking = true;
                        break;
                    }
                }
            }

            break;
        }
    }

    return foundNewer ? formatVersion(latestVersion) : null;
}

/**
 * 現在のURLからバージョンを取得する
 * @param {PathProvider} currentUrl - pathnameプロパティを持つオブジェクト
 * @returns {string | null} バージョン文字列、または解析に失敗した場合はnull
 */
export function extractVersionFromPath(currentUrl: PathProvider): string | null {
    // pathnameからバージョンを抽出
    // /1.2.3/index.html のようなパスからバージョンを抽出
    const versionMatch = currentUrl.pathname.match(/\/([0-9]+\.[0-9]+\.[0-9]+)\//);

    if (versionMatch && versionMatch[1]) {
        const version = versionMatch[1];

        // バージョン形式の検証
        if (!parseVersion(version)) {
            return null;
        }

        return version;
    }

    // URLからバージョンを抽出できなかった場合はnull
    return null;
}
