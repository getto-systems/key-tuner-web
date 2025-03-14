import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Read version from .release-version file
const version = fs.readFileSync(resolve(__dirname, '../.release-version'), 'utf-8').trim();

export default defineConfig({
  // ルートディレクトリを指定
  root: 'src',

  publicDir: resolve(__dirname, 'public'),

  // vite-plugin-wasm-packを使用せず、直接WebAssemblyモジュールをインポート
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: '../dist',
  },
  // Set base path for assets to include version
  base: `/${version}/`,
  server: {
    port: 3000,
    open: true,
  },
  // WebAssemblyのサポートを有効化
  optimizeDeps: {
    exclude: ['./js/wasm_artifacts/pkg/key_tuner_web.js'],
  },
});