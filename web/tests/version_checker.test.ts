import { describe, it, expect } from "vitest";
import {
    parseVersion,
    formatVersion,
    generateVersionCandidates,
    findLatestVersion,
    checkAndRedirectToLatestVersion,
    extractVersionFromPath,
    compareVersions,
    replaceVersionInUrl,
    VersionExistenceChecker,
    PathProvider,
} from "../src/js/common/version_checker";

// Function to create a version checker that returns true for specified versions
function initVersionChecker(validVersions: string[]): VersionExistenceChecker {
    return async (version: string): Promise<boolean> => {
        return validVersions.includes(version);
    };
}

describe("Version Checker", () => {
    describe("parseVersion", () => {
        it("正しいバージョン文字列をパースする", () => {
            const version = parseVersion("1.2.3");
            expect(version).toEqual({ major: 1, minor: 2, patch: 3 });
        });

        it("無効なバージョン文字列に対してnullを返す", () => {
            expect(parseVersion("invalid")).toBeNull();
            expect(parseVersion("1.2")).toBeNull();
            expect(parseVersion("1.2.3.4")).toBeNull();
        });
    });

    describe("formatVersion", () => {
        it("バージョンオブジェクトを文字列に変換する", () => {
            const versionStr = formatVersion({ major: 1, minor: 2, patch: 3 });
            expect(versionStr).toBe("1.2.3");
        });
    });

    describe("compareVersions", () => {
        it("バージョンを正しく比較する", () => {
            expect(compareVersions({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 2, patch: 3 })).toBe(0);
            expect(compareVersions({ major: 2, minor: 0, patch: 0 }, { major: 1, minor: 9, patch: 9 })).toBe(1);
            expect(compareVersions({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 3, patch: 0 })).toBe(-1);
        });
    });

    describe("generateVersionCandidates", () => {
        it("現在のバージョンから次のバージョン候補を生成する", () => {
            const currentVersion = { major: 1, minor: 2, patch: 3 };
            const nextVersions = generateVersionCandidates(currentVersion);

            expect(nextVersions).toEqual([
                { major: 2, minor: 0, patch: 0 }, // メジャーバージョンアップ
                { major: 1, minor: 3, patch: 0 }, // マイナーバージョンアップ
                { major: 1, minor: 2, patch: 4 }, // パッチバージョンアップ
            ]);
        });
    });

    describe("initVersionChecker", () => {
        it("指定したバージョンが存在する場合はtrueを返す", async () => {
            const versionChecker = initVersionChecker(["1.0.0", "2.0.0"]);

            const exists = await versionChecker("1.0.0");
            expect(exists).toBe(true);
        });

        it("指定したバージョンが存在しない場合はfalseを返す", async () => {
            const versionChecker = initVersionChecker(["1.0.0", "2.0.0"]);

            const exists = await versionChecker("3.0.0");
            expect(exists).toBe(false);
        });
    });

    describe("findLatestVersion", () => {
        it("より新しいバージョンが見つかった場合はそのバージョンを返す", async () => {
            // 1.0.0のみが存在するバージョンチェッカーを作成
            const versionChecker = initVersionChecker(["1.0.0"]);

            const latestVersion = await findLatestVersion("0.7.0", versionChecker);
            expect(latestVersion).toBe("1.0.0");
        });

        it("現在のバージョンが最新の場合はnullを返す", async () => {
            // 存在するバージョンがないバージョンチェッカーを作成
            const versionChecker = initVersionChecker([]);

            const latestVersion = await findLatestVersion("0.7.0", versionChecker);
            expect(latestVersion).toBeNull();
        });

        it("複数のバージョンが存在する場合は最新のバージョンを返す", async () => {
            // 複数のバージョンが存在するバージョンチェッカーを作成
            const versionChecker = initVersionChecker([
                "2.0.0",
                "1.2.0",
                "1.1.0",
                "1.0.0",
                "0.5.0",
                "0.4.0",
            ]);

            const latestVersion = await findLatestVersion("0.4.0", versionChecker);
            expect(latestVersion).toBe("2.0.0");
        });
    });

    describe("checkAndRedirectToLatestVersion", () => {
        it("より新しいバージョンが見つかった場合はリダイレクトしてtrueを返す", async () => {
            // 1.0.0のみが存在するバージョンチェッカーを作成
            const versionChecker = initVersionChecker(["1.0.0"]);
            let href = "";
            
            const pathProvider: PathProvider = {
                pathname: "/0.7.0/index.html",
            };

            const redirected = await checkAndRedirectToLatestVersion({
                currentLocation: pathProvider,
                versionExistenceChecker: versionChecker,
                redirectHandler: (version) => {
                    href = `https://key-tuner.getto.systems/${version}/index.html`;
                },
                defaultVersion: "0.7.0"
            });
            
            expect(redirected).toBe(true);
            expect(href).toBe("https://key-tuner.getto.systems/1.0.0/index.html");
        });

        it("現在のバージョンが最新の場合はリダイレクトせずfalseを返す", async () => {
            // 存在するバージョンがないバージョンチェッカーを作成
            const versionChecker = initVersionChecker([]);
            let href = "";
            
            const pathProvider: PathProvider = {
                pathname: "/0.7.0/index.html",
            };

            const redirected = await checkAndRedirectToLatestVersion({
                currentLocation: pathProvider,
                versionExistenceChecker: versionChecker,
                redirectHandler: (version) => {
                    href = `https://key-tuner.getto.systems/${version}/index.html`;
                },
                defaultVersion: "0.7.0"
            });
            
            expect(redirected).toBe(false);
            expect(href).toBe("");
        });
    });

    describe("extractVersionFromPath", () => {
        it("パスからバージョンを正しく抽出する", () => {
            // pathnameプロパティを持つオブジェクトを作成
            const pathProvider = {
                pathname: "/0.7.0/index.html",
            };

            const version = extractVersionFromPath(pathProvider);
            expect(version).toBe("0.7.0");
        });

        it("パスにバージョンがない場合はnullを返す", () => {
            // バージョンがないパス
            const pathProvider = {
                pathname: "/index.html",
            };

            const version = extractVersionFromPath(pathProvider);
            expect(version).toBeNull(); // バージョンが見つからない場合はnull
        });
    });

    describe("replaceVersionInUrl", () => {
        it("URLのバージョン部分を正しく置換する", () => {
            const currentUrl = "https://example.com/1.2.3/index.html";
            const newVersion = "2.0.0";
            
            const newUrl = replaceVersionInUrl(currentUrl, newVersion);
            expect(newUrl).toBe("https://example.com/2.0.0/index.html");
        });

        it("複雑なURLでもバージョン部分を正しく置換する", () => {
            const currentUrl = "https://key-tuner.getto.systems/0.7.0/index.html?param=value#hash";
            const newVersion = "1.0.0";
            
            const newUrl = replaceVersionInUrl(currentUrl, newVersion);
            expect(newUrl).toBe("https://key-tuner.getto.systems/1.0.0/index.html?param=value#hash");
        });

        it("URLにバージョン部分がない場合はnullを返す", () => {
            const currentUrl = "https://example.com/index.html";
            const newVersion = "2.0.0";
            
            const newUrl = replaceVersionInUrl(currentUrl, newVersion);
            expect(newUrl).toBeNull();
        });

        it("バージョンパターンが複数ある場合は最初のパターンのみを置換する", () => {
            const currentUrl = "https://example.com/1.2.3/docs/4.5.6/index.html";
            const newVersion = "2.0.0";
            
            const newUrl = replaceVersionInUrl(currentUrl, newVersion);
            expect(newUrl).toBe("https://example.com/2.0.0/docs/4.5.6/index.html");
        });
    });
});
