# tools/build

作品プロジェクトのビルド入口（`.pre-commit-config.yaml`）で使う置き場です。

## 仕組み
- 作品側のフック定義が `language: node` の仮想環境を作り、`additional_dependencies` で `@vscode/vsce` をバージョン固定表の版で入れる（Node 本体も仮想環境側が調達する。システムに Node を入れない、というキットの約束どおり）
- その環境から `build.js` が呼ばれ、構文チェック（`node --check`）→ VSIX 化（`dist/` へ出力）の順に実行する
- 機械ガードは別フック（Python 仮想環境）で先に走る
- 作品プロジェクトには、このフォルダごとコピーして使う（フックの entry が相対パスで参照するため）
