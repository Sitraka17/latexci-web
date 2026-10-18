# Crop a rendered test page to its ink plus a constant white margin, so the
# figures on the guide pages have no empty paper below the text, then print
# the final size as JSON (the page sets width/height on the <img>).
# Usage: python3 -I scripts/seo-cv/trim.py page.png [margin_px|0 = no crop]
import json
import sys
from PIL import Image, ImageChops

path = sys.argv[1]
pad = int(sys.argv[2]) if len(sys.argv) > 2 else 28
img = Image.open(path).convert("RGB")
if pad > 0:
    box = ImageChops.difference(img, Image.new("RGB", img.size, (255, 255, 255))).getbbox()
    if box:
        l, t, r, b = box
        out = Image.new("RGB", (r - l + 2 * pad, b - t + 2 * pad), (255, 255, 255))
        out.paste(img.crop(box), (pad, pad))
        img = out
        img.save(path, optimize=True)
print(json.dumps({"width": img.width, "height": img.height}))
