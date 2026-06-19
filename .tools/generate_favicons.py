from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "frontend" / "src" / "assets" / "images" / "favicon.png"
OUT_DIR = ROOT / "frontend" / "public"
OUT_DIR.mkdir(parents=True, exist_ok=True)

if not SRC.exists():
    raise SystemExit(f"Source favicon not found: {SRC}")

img = Image.open(SRC).convert("RGBA")

# remove transparent border to maximize visible logo area
def trim_transparent(im):
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    alpha = im.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def fit_square(im, size):
    im = im.copy()
    im = trim_transparent(im)
    im.thumbnail((size, size), Image.LANCZOS)
    new = Image.new("RGBA", (size, size), (0,0,0,0))
    nw, nh = im.size
    new.paste(im, ((size - nw) // 2, (size - nh) // 2), im)
    return new

sizes = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "favicon-180x180.png": 180,
    "favicon.png": 256,
}

for name, s in sizes.items():
    out = OUT_DIR / name
    fit_square(img, s).save(out, format="PNG")
    print(f"Saved {out}")

ico_path = OUT_DIR / "favicon.ico"
print(f"Generating {ico_path}")
ico_sizes = [(16,16),(32,32),(48,48),(64,64),(128,128)]
fit_sq_images = [fit_square(img, s[0]) for s in ico_sizes]
fit_sq_images[0].save(ico_path, format="ICO", sizes=ico_sizes)
print("Done")
