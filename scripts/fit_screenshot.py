"""把任意截圖放進 1280x800 的底圖正中間（商店截圖只收 1280x800 或 640x400）。

用法：python3 scripts/fit_screenshot.py raw-screenshots/<你的檔名>.png
結果：store-assets/screenshot-1280x800.png（等比例縮放、不會變形；太小的圖最多放大 2 倍）

原始截圖放 raw-screenshots/（git 不追蹤）。商店截圖是公開的，不能拍到網址列、書籤列、真的 StudyDeck 網址、帳號名稱。
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "store-assets" / "screenshot-1280x800.png"
W, H = 1280, 800
BG = (240, 253, 250)
MAX_UPSCALE = 2


def main():
    if len(sys.argv) != 2:
        sys.exit("用法：python3 scripts/fit_screenshot.py raw-screenshots/<你的檔名>.png")
    src = Path(sys.argv[1])
    if not src.is_file():
        sys.exit(f"找不到 {src}。先把截圖放進 raw-screenshots/，再把指令裡的檔名換成真的檔名。")
    shot = Image.open(src).convert("RGB")
    # 縮放到能放進底圖（四周留 40px）；popup 這種小圖最多放大 2 倍，再大字會糊
    scale = min((W - 80) / shot.width, (H - 80) / shot.height, MAX_UPSCALE)
    shot = shot.resize((round(shot.width * scale), round(shot.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), BG)
    canvas.paste(shot, ((W - shot.width) // 2, (H - shot.height) // 2))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
