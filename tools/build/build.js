// ビルド入口の後段: 構文チェック → VSIX 化。
// pre-commit の Node 仮想環境から呼ばれる（vsce はその環境に固定版が入っている）。
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const isWin = process.platform === "win32";

function run(cmd, args) {
  return spawnSync(cmd, args, { stdio: "inherit", shell: isWin });
}

// 1) 構文チェック（作品の全 JS ファイルが対象。同梱の道具と生成物は除く）
const SKIP_DIRS = new Set(["node_modules", "tools", "dist", ".git"]);
function collectJs(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) collectJs(full, out);
    } else if (ent.isFile() && ent.name.endsWith(".js")) {
      out.push(full);
    }
  }
  return out;
}
const jsFiles = collectJs(root, []).sort();
let syntaxFailed = false;
for (const file of jsFiles) {
  const check = run("node", ["--check", file]);
  if (check.status !== 0) {
    console.log("構文チェックで止まりました: " + path.relative(root, file) + " の書き方を確認してください。");
    syntaxFailed = true;
  }
}
if (syntaxFailed) {
  process.exit(1);
}
if (jsFiles.length > 0) {
  console.log("構文チェック: OK（" + jsFiles.length + " ファイル）");
}

// 2) VSIX 化
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const pkg = run("vsce", ["package", "--out", "dist"]);
if (pkg.status !== 0) {
  console.log("VSIX 化に失敗しました。上の表示を確認してください。");
  process.exit(pkg.status || 1);
}
const produced = fs.readdirSync(path.join(root, "dist")).filter((f) => f.endsWith(".vsix"));
if (produced.length > 0) {
  console.log("VSIX を作りました: dist/" + produced[produced.length - 1]);
}
