"""產生 extension 圖示（16/48/128）、商店圖示（128x128 含透明邊）和商店宣傳圖（440x280）。

用法：python3 scripts/make_assets.py
需要：Pillow；圖示來源是 StudyDeck 網站的 icon-512.png（../quizlet），宣傳圖的中文字要有 Noto Sans CJK 字型
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / "quizlet" / "frontend" / "public" / "icons" / "icon-512.png"
ICON_DIR = ROOT / "src" / "icons"
STORE_DIR = ROOT / "store-assets"

CJK_FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
CJK_TC_INDEX = 3  # .ttc 裡第 3 個是正體中文（TC）
BG = (240, 253, 250)
TEXT = (19, 78, 74)
ACCENT = (15, 118, 110)


def make_icons(src):
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    for size in (16, 48, 128):
        src.resize((size, size), Image.LANCZOS).save(ICON_DIR / f"icon{size}.png")


def make_store_icon(src):
    """商店圖示：128x128，圖案 96x96、四周留 16px 透明邊（Chrome Web Store 圖片規範）。"""
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    canvas.alpha_composite(src.resize((96, 96), Image.LANCZOS), (16, 16))
    canvas.save(STORE_DIR / "icon-128x128.png")


def make_promo(src):
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    w, h = 440, 280
    img = Image.new("RGBA", (w, h), BG + (255,))
    img.alpha_composite(src.resize((150, 150), Image.LANCZOS), (34, (h - 150) // 2))
    d = ImageDraw.Draw(img)
    title = ImageFont.truetype(CJK_FONT, 34, index=CJK_TC_INDEX)
    sub = ImageFont.truetype(CJK_FONT, 18, index=CJK_TC_INDEX)
    x = 206
    d.text((x, 70), "StudyDeck", font=title, fill=ACCENT)
    d.text((x, 114), "單字收集", font=title, fill=TEXT)
    d.text((x, 172), "選字 → 右鍵", font=sub, fill=TEXT)
    d.text((x, 198), "加到待學習", font=sub, fill=TEXT)
    img.convert("RGB").save(STORE_DIR / "promo-440x280.png")


def main():
    src = Image.open(SOURCE).convert("RGBA")
    make_icons(src)
    make_store_icon(src)
    make_promo(src)
    print(f"圖示：{ICON_DIR}")
    print(f"商店圖示：{STORE_DIR / 'icon-128x128.png'}")
    print(f"宣傳圖：{STORE_DIR / 'promo-440x280.png'}")


if __name__ == "__main__":
    main()
