"""把 src/ 打包成上架用的 zip。

用法：python3 scripts/pack.py
結果：dist/studydeck-extension-<版本>.zip（manifest.json 在 zip 最外層，商店才讀得到）
"""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DIST = ROOT / "dist"


def main():
    version = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))["version"]
    DIST.mkdir(exist_ok=True)
    out = DIST / f"studydeck-extension-{version}.zip"
    files = sorted(
        p for p in SRC.rglob("*")
        if p.is_file() and not any(part.startswith(".") for part in p.relative_to(SRC).parts)
    )
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in files:
            zf.write(p, p.relative_to(SRC).as_posix())
    print(out)


if __name__ == "__main__":
    main()
