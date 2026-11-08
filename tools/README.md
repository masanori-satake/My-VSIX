# tools（裏側）

利用者が直接触るものではありません。作る作業の裏側で、Skills やビルドの仕組みが使います。

- `setup.py`: Skills 正本を Copilot 用／Kiro 用へ機械展開する
- `guards/check_all.py`: 機械ガード（第2層）
- `build/build.js`: 構文チェックと VSIX 化。作品側の `.pre-commit-config.yaml` が Node 仮想環境（vsce を固定版で自動調達）から呼ぶ
- 着脱: 作品は「エディタから拡張を削除＋フォルダ削除」、キットは「pre-commit のキャッシュ掃除」で元に戻る
