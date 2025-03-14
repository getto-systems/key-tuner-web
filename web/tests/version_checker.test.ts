import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    parseVersion,
    formatVersion,
    generateNextVersions,
    checkVersionExists,
    findLatestVersion,
    redirectToLatestVersion,
} from "../src/js/common/version_checker";

describe("Version Checker", () => {
    // fetchのモック
    beforeEach(() => {
        // グローバルオブジェクトのモック
        vi.stubGlobal("fetch", vi.fn());
        vi.stubGlobal("window", {
            location: {
                href: "https://key-tuner.getto.systems/0.7.0/index.html",
            },
        });
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

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

    describe("generateNextVersions", () => {
        it("現在のバージョンから次のバージョンを生成する", () => {
            const currentVersion = { major: 1, minor: 2, patch: 3 };
            const nextVersions = generateNextVersions(currentVersion);

            expect(nextVersions).toEqual([
                { major: 2, minor: 0, patch: 0 }, // メジャーバージョンアップ
                { major: 1, minor: 3, patch: 0 }, // マイナーバージョンアップ
                { major: 1, minor: 2, patch: 4 }, // パッチバージョンアップ
            ]);
        });
    });

    describe("checkVersionExists", () => {
        it("バージョンが存在する場合はtrueを返す", async () => {
            (fetch as any).mockResolvedValue({
                ok: true,
            });

            const exists = await checkVersionExists("1.0.0");
            expect(exists).toBe(true);
            expect(fetch).toHaveBeenCalledWith("https://key-tuner.getto.systems/1.0.0/index.html", {
                method: "HEAD",
            });
        });

        it("バージョンが存在しない場合はfalseを返す", async () => {
            (fetch as any).mockResolvedValue({
                ok: false,
            });

            const exists = await checkVersionExists("1.0.0");
            expect(exists).toBe(false);
        });

        it("エラーが発生した場合はfalseを返す", async () => {
            (fetch as any).mockRejectedValue(new Error("Network error"));

            const exists = await checkVersionExists("1.0.0");
            expect(exists).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe("findLatestVersion", () => {
        it("より新しいバージョンが見つかった場合はそのバージョンを返す", async () => {
            // 最初のチェック: メジャーバージョンアップが存在する
            (fetch as any).mockResolvedValueOnce({
                ok: true,
            });
            // 次のチェック: さらに新しいバージョンは存在しない
            (fetch as any).mockResolvedValueOnce({
                ok: false,
            });
            (fetch as any).mockResolvedValueOnce({
                ok: false,
            });
            (fetch as any).mockResolvedValueOnce({
                ok: false,
            });

            const latestVersion = await findLatestVersion("0.7.0");
            expect(latestVersion).toBe("1.0.0");
        });

        it("現在のバージョンが最新の場合はnullを返す", async () => {
            // すべてのチェックで新しいバージョンは見つからない
            (fetch as any).mockResolvedValue({
                ok: false,
            });

            const latestVersion = await findLatestVersion("0.7.0");
            expect(latestVersion).toBeNull();
        });
    });

    describe("redirectToLatestVersion", () => {
        it("より新しいバージョンが見つかった場合はリダイレクトしてtrueを返す", async () => {
            // モックバージョンファインダー関数
            const mockVersionFinder = vi.fn().mockResolvedValue("1.0.0");

            const redirected = await redirectToLatestVersion("0.7.0", mockVersionFinder);
            expect(redirected).toBe(true);
            expect(window.location.href).toBe("https://key-tuner.getto.systems/1.0.0/index.html");
        });

        it("現在のバージョンが最新の場合はリダイレクトせずfalseを返す", async () => {
            // モックバージョンファインダー関数
            const mockVersionFinder = vi.fn().mockResolvedValue(null);

            const redirected = await redirectToLatestVersion("0.7.0", mockVersionFinder);
            expect(redirected).toBe(false);
            expect(window.location.href).toBe("https://key-tuner.getto.systems/0.7.0/index.html");
        });
    });
});
