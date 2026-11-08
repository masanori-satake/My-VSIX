// 表示型テンプレート: 開いているファイル内の「目印」の残数を下の帯に表示する
const vscode = require('vscode');

let item;

function update() {
const editor = vscode.window.activeTextEditor;
const marker = vscode.workspace.getConfiguration('myWork').get('marker', 'TODO');
if (!editor) { item.text = `$(checklist) ${marker}: -`; return;}
const text = editor.document.getText();
const count = text.split(marker).length - 1;
item.text = `$(checklist) ${marker}: ${count}`;
item.tooltip = `このファイルにある ${marker} の数`;
}

function activate(context) {
item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
item.show();
context.subscriptions.push(item);
context.subscriptions.push(
vscode.window.onDidChangeActiveTextEditor(update),
vscode.workspace.onDidChangeTextDocument(update),
vscode.workspace.onDidChangeConfiguration(update)
);
update();
}

function deactivate() {}
module.exports = { activate, deactivate};
