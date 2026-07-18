# Forge Glyph Families

The renderer recognises these families:

| Family | Purpose |
| --- | --- |
| space | Empty cells that preserve alignment. |
| ASCII | Basic Latin letters, numbers and punctuation. |
| box drawing | Borders and line geometry. |
| Unicode | Non-ASCII text without a more specific family. |
| emoji | Extended pictographic graphemes. |
| pixel circles | Coloured circle glyphs commonly used in pixel flags. |
| hearts | Heart and heart-emoji variants. |
| decorative symbols | Stars, diamonds, flowers and banner ornaments. |

Classification is separate from painting. Every classified grapheme receives exactly one logical grid cell. Family calibration can scale or offset the paint within that cell, but neighbouring cells retain their original columns. The source artwork string remains untouched for copying and studio view.
