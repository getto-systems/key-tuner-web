import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // テスト環境の設定
    environment: 'node',
    // テストファイルのパターン
    include: ['tests/**/*.test.ts'],
    // グローバルなテストセットアップ
    globals: true,
    // テストのタイムアウト設定（ミリ秒）
    testTimeout: 10000,
    // カバレッジの設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});