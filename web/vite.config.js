import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // ルートディレクトリを指定
  root: 'src',
  
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
  server: {
    port: 3000,
    open: true,
  },
  // WebAssemblyのサポートを有効化
  optimizeDeps: {
    exclude: ['./js/wasm_artifacts/pkg/key_tuner_web.js'],
  },
});