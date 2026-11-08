#!/usr/bin/env python3
"""My VSIX セットアップ: Skills 正本（skills/）を Copilot 用／Kiro 用の配置先へ機械展開する。
使い方: python tools/setup.py <展開先フォルダ> [--version X.Y.Z]
my-vsix-setup スキル自身はブートストラップ配置のため対象に含めない。"""
import pathlib
import shutil
import sys

KIT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {"my-vsix-setup"}


def deploy(target: pathlib.Path, version: str) -> None:
    src_root = KIT_ROOT / "skills"
    for dest_rel in (pathlib.Path(".github/skills"), pathlib.Path(".kiro/skills")):
        for skill_dir in sorted(src_root.iterdir()):
            if not skill_dir.is_dir() or skill_dir.name in SKIP:
                continue
            dest = target / dest_rel / skill_dir.name
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(skill_dir, dest)
            (dest / ".kit-version").write_text(version + "\n", encoding="utf-8")
        print(f"展開しました: {target / dest_rel}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ver = "0.1.0"
    if "--version" in sys.argv:
        ver = sys.argv[sys.argv.index("--version") + 1]
    deploy(pathlib.Path(args[0] if args else "."), ver)
