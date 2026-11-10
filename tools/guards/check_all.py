#!/usr/bin/env python3
"""My VSIX 機械ガード（第2層）: 作品フォルダを走査し、約束違反があれば、やさしい言葉で報告する。
使い方: python check_all.py <作品フォルダ>
終了コード: 0 = 問題なし / 1 = 違反あり。Python 標準ライブラリのみ。"""
import json
import pathlib
import re
import sys

SECRET_PATTERNS = [
    (re.compile(r"(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
     "鍵やトークンらしき文字列が埋め込まれています。作品に秘密情報を入れることはできません。"),
    (re.compile(r"ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}"),
     "トークンの形をした文字列が見つかりました。作品に埋め込むことはできません。"),
]
NETWORK_PATTERNS = [
    (re.compile(r"\bfetch\s*\(|XMLHttpRequest|WebSocket|require\(['\"](?:node:)?(?:https?|net|tls)['\"]\)|from ['\"](?:https?|net)['\"]"),
     "外部へ通信する仕組みが使われています。このキットの作品は自分のパソコンの中だけで動きます。"),
]
SHELL_PATTERNS = [
    (re.compile(r"child_process|execSync|spawnSync|\bexec\s*\("),
     "外部のコマンドを実行する仕組みが使われています。安全のため、このキットでは使えません。"),
]
ESCAPE_PATTERNS = [
    (re.compile(r"process\.env\.(HOME|USERPROFILE)|os\.homedir\(\)"),
     "ワークスペースの外を参照する書き方が見つかりました。作品が触れるのはワークスペースとエディタの中だけです。"),
]
SOURCE_EXTS = {".js", ".json", ".ts", ".html"}


def scan_file(path, rel, findings):
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return
    for patterns in (SECRET_PATTERNS, NETWORK_PATTERNS, SHELL_PATTERNS, ESCAPE_PATTERNS):
        for rx, message in patterns:
            if rx.search(text):
                findings.append(f"- {rel}: {message}")


def check_manifest(root, findings):
    pkg = root / "package.json"
    if not pkg.exists():
        findings.append("- package.json がありません。作品の骨格が壊れています。")
        return
    try:
        data = json.loads(pkg.read_text(encoding="utf-8"))
    except Exception:
        findings.append("- package.json が読み取れません。")
        return
    if not isinstance(data, dict):
        findings.append("- package.json の中身が、想定した形（項目の集まり）になっていません。")
        return
    if data.get("dependencies"):
        findings.append("- package.json: 部品（依存パッケージ）が追加されています。このキットでは部品は足さない約束です。")
    engines = data.get("engines")
    if not isinstance(engines, dict) or not engines.get("vscode"):
        findings.append("- package.json: 対象バージョンの指定（engines.vscode）がありません。Kiro で動かない事故を防ぐため必須です。")


def main() -> int:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    findings = []
    check_manifest(root, findings)
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix not in SOURCE_EXTS:
            continue
        rel = path.relative_to(root)
        # tools/ はキット同梱の道具（ガード自身とビルド）なので走査対象外。
        # 判定は作品フォルダからの相対パスだけで行う（置き場所のフォルダ名に影響されないため）
        if {"node_modules", "tools", "dist"} & set(rel.parts):
            continue
        scan_file(path, str(rel), findings)
    if findings:
        print("チェックで止まりました。引っかかったのは次の点です:")
        print("\n".join(findings))
        print("直し方が分からない場合は、AI にそのまま見せてください。代替案と一緒に直します。")
        return 1
    print("チェック: 問題ありませんでした。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
