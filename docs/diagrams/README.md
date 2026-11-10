# diagrams フォルダ

`docs/inside.md` で使うダイアグラムの置き場です。各図は、表示用の PNG と、元データの Mermaid ファイル（.mmd）の組になっています。本文には PNG を表示し、その直下に Mermaid のコードを折りたたんで置いています（配布先の Bitbucket では Mermaid が図として表示されないため）。

## 図を直すとき

1. 対応する `.mmd` を直す（本文の折りたたみの中のコードも同じ内容に揃える）
2. PNG を作り直す。Mermaid CLI（mmdc）が使える環境で:

```
mmdc -i d1-overview.mmd -o d1-overview.png -b white -s 2
```

3. PNG はバイナリのため、GitHub への反映は通常の git push で行う（コネクタ経由では送れない）
