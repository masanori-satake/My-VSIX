# tools（裏側）

利用者が直接触るものではありません。Skills とビルド入口から使われます。

- `setup.py`: Skills 正本を Copilot 用／Kiro 用へ機械展開する
- `guards/check_all.py`: 機械ガード（第2層）
- ビルド／VSIX 化の実体（Node の隔離調達を含む）は、pre-commit の Node 環境 hook として作品側の `.pre-commit-config.yaml` から呼ぶ形で実体化する
- 着脱: 作品は「エディタから拡張を削除＋フォルダ削除」、キットは「pre-commit のキャッシュ掃除」で元に戻る
