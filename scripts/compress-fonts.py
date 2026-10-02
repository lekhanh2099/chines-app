#!/usr/bin/env python3
"""
Compress TrueType fonts in public/fonts/*.ttf to WOFF2 using fonttools.
Reduces font payload by ~60% across the application.
"""

import sys
from pathlib import Path

try:
    from fontTools.ttLib.woff2 import compress
except ImportError:
    print("fonttools and brotli are required. Run: pip install fonttools brotli", file=sys.stderr)
    sys.exit(1)

def main():
    root = Path(__file__).resolve().parent.parent
    fonts_dir = root / "public" / "fonts"
    if not fonts_dir.exists():
        print(f"Directory not found: {fonts_dir}", file=sys.stderr)
        sys.exit(1)

    ttf_fonts = list(fonts_dir.glob("*.ttf"))
    if not ttf_fonts:
        print("No .ttf fonts found in public/fonts")
        return

    print(f"Found {len(ttf_fonts)} TTF font files in {fonts_dir}:")
    saved_bytes = 0

    for font in sorted(ttf_fonts):
        out_woff2 = font.with_suffix(".woff2")
        compress(str(font), str(out_woff2))
        ttf_size = font.stat().st_size
        woff2_size = out_woff2.stat().st_size
        saved = ttf_size - woff2_size
        saved_bytes += saved
        reduction = (saved / ttf_size) * 100
        print(f"  {font.name}: {ttf_size / (1024*1024):.2f}MB -> {woff2_size / (1024*1024):.2f}MB (-{reduction:.1f}%)")

    print(f"\nTotal payload reduction: {saved_bytes / (1024*1024):.2f}MB saved!")

if __name__ == "__main__":
    main()
