#!/usr/bin/env python3
"""Quick WCAG contrast audit of the Gomodi palette pairs.

Post-fix (Aug 2026): btn-primary now uses terracotta-dark #8f3e25, text links
and icons use terracotta-dark / gold-dark, success checks #8f6a3e, and the
event pill text is #7a5a30. Old failing pairs (terracotta #c65d3c on light,
gold #d4a574 on light) are gone and documented below for reference.
"""

def lum(h):
    h = h.lstrip("#")
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    def f(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = f(r), f(g), f(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def cr(fg, bg):
    l1, l2 = lum(fg), lum(bg)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)

pairs = [
    ("stone #6b5b50 on cream-light #faf6f0 (body)", "#6b5b50", "#faf6f0"),
    ("stone #6b5b50 on white (card body)", "#6b5b50", "#ffffff"),
    ("stone #6b5b50 on cream #f5ebdd (room tags)", "#6b5b50", "#f5ebdd"),
    ("ink #2a1e18 on cream-light #faf6f0 (headings)", "#2a1e18", "#faf6f0"),
    ("terracotta-dark #8f3e25 on white (btn-primary bg)", "#8f3e25", "#ffffff"),
    ("terracotta-dark #8f3e25 on cream-light (btn label)", "#8f3e25", "#faf6f0"),
    ("terracotta-dark #8f3e25 on tint #f5e3db (leisure pill)", "#8f3e25", "#f5e3db"),
    ("terracotta-dark #8f3e25 on tint #f5e3db (text links)", "#8f3e25", "#f5e3db"),
    ("walnut #4a2e22 on tint #e8ddd6 (corporate pill)", "#4a2e22", "#e8ddd6"),
    ("gold-dark #8f6a3e on white (text-gold-dark icons)", "#8f6a3e", "#ffffff"),
    ("gold-dark #8f6a3e on cream-light (text-gold-dark)", "#8f6a3e", "#faf6f0"),
    ("gold-dark #8f6a3e on gold-tint #f5e8d8 (success check)", "#8f6a3e", "#f5e8d8"),
    ("event pill text #7a5a30 on gold-tint #f5e8d8", "#7a5a30", "#f5e8d8"),
    ("cream-light #faf6f0 on walnut #4a2e22 (WhatsApp)", "#faf6f0", "#4a2e22"),
    ("cream #f5ebdd on walnut #4a2e22 (WhatsApp sub)", "#f5ebdd", "#4a2e22"),
    ("walnut #4a2e22 on cream-light (btn-outline)", "#4a2e22", "#faf6f0"),
    ("cream-light #faf6f0 on terracotta-dark #8f3e25 (btn-primary)", "#faf6f0", "#8f3e25"),
    ("cream/70 ~#d9cdc2 on ink #2a1e18 (footer body)", "#d9cdc2", "#2a1e18"),
    ("cream/60 ~#c4b6a8 on walnut #4a2e22 (WhatsApp tiny)", "#c4b6a8", "#4a2e22"),
    ("gold-light #e8c9a5 on ink #2a1e18 (footer motto)", "#e8c9a5", "#2a1e18"),
    ("terracotta-dark #8f3e25 on cream-light (nav motto)", "#8f3e25", "#faf6f0"),
    ("ink #2a1e18 on cream-light/90 ~#ece7e1 (nav bg)", "#2a1e18", "#ece7e1"),
    # Historical failures (fixed Aug 2026) — kept for reference:
    # terracotta #c65d3c on cream-light = 3.88:1 (was links/buttons)
    # gold #d4a574 on cream-light = 2.07:1 / on white = 2.23:1 (was checks/icons)
]

print(f"{'pair':<52}{'ratio':>8}  status")
for name, fg, bg in pairs:
    r = cr(fg, bg)
    status = "PASS 4.5" if r >= 4.5 else ("large-only" if r >= 3 else "FAIL")
    print(f"{name:<52}{r:>6.2f}:1  {status}")
