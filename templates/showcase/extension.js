// 魅せるパネル型テンプレート: 同梱の cheat-sheet.json をカード表示する（読み取り専用・ローカルのみ）
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
const cmd = vscode.commands.registerCommand('myWork.openCheatSheet', () => {
const dataPath = path.join(context.extensionPath, 'cheat-sheet.json');
let entries = [];
try { entries = JSON.parse(fs.readFileSync(dataPath, 'utf8'));} catch (e) { /* 空で表示 */}
const panel = vscode.window.createWebviewPanel(
'myWorkCheatSheet', '自分のチートシート', vscode.ViewColumn.One, {}
);
const cards = entries.map((e) =>
`<div class="card"><h2>${e.title}</h2><pre>${e.body}</pre></div>`).join('');
panel.webview.html = `<!DOCTYPE html><html><body>
<style>body{font-family:sans-serif}.card{border:1px solid #888;border-radius:8px;padding:12px;margin:8px}pre{white-space:pre-wrap}</style>
${cards || '<p>まだ項目がありません。cheat-sheet.json に自分の言葉で足してください。</p>'}
</body></html>`;
});
context.subscriptions.push(cmd);
}

function deactivate() {}
module.exports = { activate, deactivate};
