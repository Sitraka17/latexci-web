# For each font on page 1: does its font dictionary carry a /ToUnicode map?
# Usage: python3 -I scripts/seo-cv/tounicode.py file.pdf  -> JSON list
import json
import sys
from pypdf import PdfReader

page = PdfReader(sys.argv[1]).pages[0]
fonts = page["/Resources"].get("/Font", {})
out = []
for key in fonts:
    f = fonts[key].get_object()
    out.append({"name": str(f.get("/BaseFont", "")).split("+")[-1], "toUnicode": "/ToUnicode" in f})
print(json.dumps(out))
