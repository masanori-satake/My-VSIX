# 事前準備チェック（キット側の仕組み。作品側の tools/ とは別物）
# テンプレート3型を一時フォルダへコピーし、それぞれ単独のリポジトリとして
# フックの初回実行を行う。目的は2つ:
#   1. 初回だけ必要なダウンロード（Node.js や vsce）を終わらせておく
#   2. テンプレートが実際にビルドできることを確認する
# pre-commit のフックはリポジトリのルートで実行される決まりのため、
# キットの中でテンプレートフォルダから直接実行しても対象はキット全体に
# なってしまう。だから「単独フォルダで実行する」部分をここで自動化する。
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

KIT_ROOT = Path(__file__).resolve().parents[2]
TYPES = ["command", "display", "showcase"]


def run(cmd, cwd):
    # 出力はそのまま画面に出る。ただし外側の pre-commit は、フック成功時に
    # フックの出力を隠す仕様なので、ガイドでは --verbose つきで実行してもらう
    return subprocess.run(cmd, cwd=str(cwd)).returncode


def main() -> int:
    pre_commit = shutil.which("pre-commit")
    if not pre_commit:
        print("pre-commit が見つかりません。事前準備ガイドのステップ2を確認してください。")
        return 1
    failures = []
    for name in TYPES:
        src = KIT_ROOT / "templates" / name
        print(f"--- {name} 型のチェック ---")
        with tempfile.TemporaryDirectory(prefix="my-vsix-prepare-") as td:
            work = Path(td) / name
            shutil.copytree(
                src, work, ignore=shutil.ignore_patterns("dist", ".git", "node_modules")
            )
            run(["git", "init", "-q"], work)
            run(["git", "add", "-A"], work)
            code = run([pre_commit, "run", "--all-files", "--hook-stage", "manual"], work)
        if code == 0:
            print(f"--- {name} 型: OK ---")
        else:
            failures.append(name)
            print(f"--- {name} 型: 止まりました ---")
    if failures:
        print("事前準備チェックで止まった型があります: " + "、".join(failures))
        print("上の表示をそのまま AI に見せてください（直し方を案内します）。")
        return 1
    print("事前準備チェック: すべて Passed です。初回ダウンロードも終わりました。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
