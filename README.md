# key-tuner

安全なパスワードを生成するツール

## 概要

Key Tunerは、Rust/WebAssemblyを使用した安全なパスワード生成ツールです。フロントエンドはViteを使用し、バックエンドのロジックはRustで実装されています。

## 特徴

- Rustによる高速で安全なパスワード生成
- WebAssemblyによるブラウザでの実行
- カスタマイズ可能なパスワード設定
  - 長さの調整
  - 大文字/小文字/数字/記号の含有設定
- シンプルで使いやすいUI

## プロジェクト構成

```
key-tuner/
├── crates/                     # Rustのクレート群
│   ├── core/                   # コアロジック（パスワード生成など）
│   └── web/                    # Web向けWASM実装
├── web/                        # Webフロントエンド
│   ├── public/                 # 静的ファイル
│   ├── src/                    # ソースコード
│   │   ├── assets/            # 画像、フォントなど
│   │   ├── js/                # JavaScriptコード
│   │   ├── styles/            # CSSファイル
│   │   └── index.html         # メインHTML
│   └── tests/                  # フロントエンドテスト
└── scripts/                    # ビルド・デプロイスクリプト
```

## 開発環境のセットアップ

### 必要なツール

- [Rust](https://www.rust-lang.org/) (1.70.0以上)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- [Node.js](https://nodejs.org/) (18.x以上)
- [npm](https://www.npmjs.com/) (9.x以上)

### セットアップ手順

1. リポジトリをクローン

```bash
git clone https://github.com/yourusername/key-tuner.git
cd key-tuner
```

2. 依存関係をインストール

```bash
npm install
```

3. WASMをビルド

```bash
npm run build:wasm
```

4. 開発サーバーを起動

```bash
npm run dev
```

これで http://localhost:3000 でアプリケーションにアクセスできます。

## ビルド方法

本番用ビルドを作成するには:

```bash
npm run build
```

ビルド結果は `web/dist` ディレクトリに出力されます。

## テスト

テストを実行するには:

```bash
npm run test
```

これにより、RustとJavaScriptの両方のテストが実行されます。

## ライセンス

key-tunerは[MIT](LICENSE)ライセンスの下で公開されています。

Copyright &copy; since 2025 shun@getto.systems
