// バージョンチェックと最新バージョンへのリダイレクトを担当するモジュール

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
 * @param {string} versionStr - バージョン文字列（例: "0.7.0"）
 * @returns {SemanticVersion | null} パースされたバージョン、または無効な形式の場合はnull
 */
export function parseVersion(versionStr: string): SemanticVersion | null {
    const match = versionStr.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return null;

    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10)
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
            patch: 0 
        },
        // マイナーバージョンアップ
        { 
            major: currentVersion.major, 
            minor: currentVersion.minor + 1, 
            patch: 0 
        },
        // パッチバージョンアップ
        { 
            major: currentVersion.major, 
            minor: currentVersion.minor, 
            patch: currentVersion.patch + 1 
        }
    ];
}

/**
 * 指定されたバージョンのデプロイが存在するかチェックする
 * @param {string} version - チェックするバージョン
 * @returns {Promise<boolean>} デプロイが存在する場合はtrue
 */
export async function checkVersionExists(version: string): Promise<boolean> {
    try {
        const url = `https://key-tuner.getto.systems/${version}/index.html`;
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error(`バージョン ${version} のチェック中にエラーが発生しました:`, error);
        return false;
    }
}

/**
 * 最新のデプロイされたバージョンを見つける
 * @param {string} currentVersionStr - 現在のバージョン文字列
 * @returns {Promise<string | null>} 最新のバージョン、または現在のバージョンが最新の場合はnull
 */
export async function findLatestVersion(currentVersionStr: string): Promise<string | null> {
    const currentVersion = parseVersion(currentVersionStr);
    if (!currentVersion) {
        console.error('現在のバージョンの解析に失敗しました:', currentVersionStr);
        return null;
    }

    let latestVersion = currentVersion;
    let foundNewer = false;

    // 次の可能性のあるバージョンをチェック
    const checkVersion = async (version: SemanticVersion): Promise<boolean> => {
        const versionStr = formatVersion(version);
        const exists = await checkVersionExists(versionStr);
        
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
 * 最新バージョンが存在する場合、そのURLにリダイレクトする
 * @param {string} currentVersionStr - 現在のバージョン文字列
 * @param {(version: string) => Promise<string | null>} versionFinder - バージョン検索関数（テスト用）
 * @returns {Promise<boolean>} リダイレクトした場合はtrue、しなかった場合はfalse
 */
export async function redirectToLatestVersion(
    currentVersionStr: string,
    versionFinder: (version: string) => Promise<string | null> = findLatestVersion
): Promise<boolean> {
    try {
        const latestVersion = await versionFinder(currentVersionStr);
        
        if (latestVersion && latestVersion !== currentVersionStr) {
            const newUrl = `https://key-tuner.getto.systems/${latestVersion}/index.html`;
            console.log(`新しいバージョンが見つかりました: ${latestVersion}、リダイレクトします...`);
            window.location.href = newUrl;
            return true;
        }
        
        console.log('現在のバージョンが最新です:', currentVersionStr);
        return false;
    } catch (error) {
        console.error('バージョンチェック中にエラーが発生しました:', error);
        return false;
    }
}

/**
 * .release-versionファイルからバージョンを取得する
 * @returns {Promise<string>} バージョン文字列
 */
export async function fetchCurrentVersion(): Promise<string> {
    try {
        const response = await fetch('.release-version');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const version = text.trim();
        
        // バージョン形式の検証
        if (!parseVersion(version)) {
            throw new Error(`無効なバージョン形式: ${version}`);
        }
        
        return version;
    } catch (error) {
        console.error('バージョンファイルの取得に失敗しました:', error);
        // デフォルトバージョンを返す
        return '0.7.0';
    }
}

/**
 * アプリケーション起動時に最新バージョンチェックを実行する
 */
export async function checkAndRedirectToLatestVersion(): Promise<void> {
    try {
        const currentVersion = await fetchCurrentVersion();
        await redirectToLatestVersion(currentVersion);
    } catch (error) {
        console.error('バージョンチェック処理中にエラーが発生しました:', error);
    }
}