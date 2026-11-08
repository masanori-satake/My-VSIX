#!/usr/bin/env python3
"""My VSIX 機械ガード（第2層）: 作品フォルダを走査し、約束違反があれば平たい言葉で報告する。
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
    if data.get("dependencies"):
        findings.append("- package.json: 部品（依存パッケージ）が追加されています。このキットでは部品は足さない約束です。")
    if not data.get("engines", {}).get("vscode"):
        findings.append("- package.json: 対象バージョンの指定（engines.vscode）がありません。Kiro で動かない事故を防ぐため必須です。")


def main() -> int:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    findings = []
    check_manifest(root, findings)
    for path in sorted(root.rglob("*")):
        if path.is_file() and path.suffix in SOURCE_EXTS and "node_modules" not in path.parts:
            scan_file(path, str(path.relative_to(root)), findings)
    if findings:
        print("機械ガードで止まりました。理由は次のとおりです:")
        print("\n".join(findings))
        print("直し方が分からない場合は、AI にそのまま見せてください。代替案と一緒に直します。")
        return 1
    print("機械ガード: 問題ありませんでした。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
