// ビルド入口の後段: 構文チェック → VSIX 化。
// pre-commit の Node 隔離環境から呼ばれる（vsce はその環境に固定版が入っている）。
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const isWin = process.platform === "win32";

function run(cmd, args) {
  return spawnSync(cmd, args, { stdio: "inherit", shell: isWin });
}

// 1) 構文チェック
const entryFile = path.join(root, "extension.js");
if (fs.existsSync(entryFile)) {
  const check = run("node", ["--check", entryFile]);
  if (check.status !== 0) {
    console.log("構文チェックで止まりました。extension.js の書き方を確認してください。");
    process.exit(check.status || 1);
  }
  console.log("構文チェック: OK");
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
