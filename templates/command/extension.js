// コマンド型テンプレート: 定型句をカーソル位置に挿入する
const vscode = require('vscode');

function activate(context) {
const cmd = vscode.commands.registerCommand('myWork.insertPhrase', async () => {
const editor = vscode.window.activeTextEditor;
if (!editor) { return;}
const phrases = vscode.workspace.getConfiguration('myWork').get('phrases', []);
if (phrases.length === 0) { return;}
const pick = phrases.length === 1
? phrases[0]
: await vscode.window.showQuickPick(phrases, { placeHolder: '挿入する定型句'});
if (!pick) { return;}
await editor.edit((b) => b.insert(editor.selection.active, pick));
});
context.subscriptions.push(cmd);
}

function deactivate() {}
module.exports = { activate, deactivate};
