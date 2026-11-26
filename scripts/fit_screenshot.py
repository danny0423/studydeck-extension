"""把任意截圖放進 1280x800 的底圖正中間（商店截圖只收 1280x800 或 640x400）。

用法：python3 scripts/fit_screenshot.py 截圖.png
結果：store-assets/screenshot-1280x800.png（太大會等比例縮小，不會變形）
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "store-assets" / "screenshot-1280x800.png"
W, H = 1280, 800
BG = (240, 253, 250)


def main():
    if len(sys.argv) != 2:
        sys.exit("用法：python3 scripts/fit_screenshot.py 截圖.png")
    shot = Image.open(sys.argv[1]).convert("RGB")
    shot.thumbnail((W - 80, H - 80), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), BG)
    canvas.paste(shot, ((W - shot.width) // 2, (H - shot.height) // 2))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
