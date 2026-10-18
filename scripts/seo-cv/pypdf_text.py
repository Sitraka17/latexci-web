# Second extractor for the CV guide experiments: pypdf's extract_text(),
# which follows the content-stream order and the fonts' ToUnicode maps or
# encodings. Usage: python3 -I scripts/seo-cv/pypdf_text.py file.pdf
import sys
from pypdf import PdfReader

reader = PdfReader(sys.argv[1])
sys.stdout.write(reader.pages[0].extract_text())
