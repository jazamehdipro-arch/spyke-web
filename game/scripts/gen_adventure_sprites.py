#!/usr/bin/env python3
"""Generate pixel-art sprites for the 4 adventure-exclusive creature types.

Draws each creature on a 64x64 grid with flat fills, auto-traces a 1px ink
outline around the silhouette, then upscales x16 (nearest) to 1024x1024 to
match the existing sprite files.
"""
from PIL import Image, ImageDraw

INK = (32, 40, 61, 255)          # retro.ink #20283D
SHADOW = (32, 40, 61, 60)        # soft drop shadow
GRID = 64
OUT = 1024

# Per-type palettes (main / dark / light / glow) — match typeTheme in retro.ts
PAL = {
    'ombra':   {'B': (90, 75, 122, 255),  'D': (58, 48, 80, 255),   'L': (155, 132, 196, 255), 'G': (200, 184, 232, 255)},
    'magma':   {'B': (181, 69, 27, 255),  'D': (122, 44, 14, 255),  'L': (212, 103, 58, 255),  'G': (255, 170, 60, 255)},
    'abyssal': {'B': (26, 68, 102, 255),  'D': (15, 42, 66, 255),   'L': (58, 122, 170, 255),  'G': (136, 204, 238, 255)},
    'sable':   {'B': (200, 155, 60, 255), 'D': (138, 106, 30, 255), 'L': (232, 192, 96, 255),  'G': (255, 230, 150, 255)},
}
WHITE = (255, 248, 220, 255)
BLACK = (24, 22, 30, 255)


def canvas():
    img = Image.new('RGBA', (GRID, GRID), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def outline(img):
    """Erode silhouette edge to ink: any opaque pixel touching transparency."""
    px = img.load()
    edge = []
    for y in range(GRID):
        for x in range(GRID):
            if px[x, y][3] == 0:
                continue
            if px[x, y][3] < 255:  # skip soft shadow
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if nx < 0 or ny < 0 or nx >= GRID or ny >= GRID or px[nx, ny][3] < 255:
                    edge.append((x, y))
                    break
    for x, y in edge:
        px[x, y] = INK
    return img


def drop_shadow(d, cx, w, y=58):
    d.ellipse([cx - w, y, cx + w, y + 3], fill=SHADOW)


def eyes_cute(d, lx, rx, y, glow):
    """Round glowing eyes with white sparkle."""
    for ex in (lx, rx):
        d.rectangle([ex, y, ex + 3, y + 4], fill=BLACK)
        d.rectangle([ex + 1, y + 1, ex + 2, y + 3], fill=glow)
        d.point((ex + 1, y + 1), fill=WHITE)


def eyes_fierce(d, lx, rx, y, glow):
    """Slanted angry eyes."""
    d.polygon([(lx, y + 1), (lx + 5, y), (lx + 5, y + 4), (lx, y + 4)], fill=BLACK)
    d.polygon([(rx + 5, y + 1), (rx, y), (rx, y + 4), (rx + 5, y + 4)], fill=BLACK)
    d.rectangle([lx + 2, y + 1, lx + 4, y + 3], fill=glow)
    d.rectangle([rx + 1, y + 1, rx + 3, y + 3], fill=glow)
    d.point((lx + 2, y + 1), fill=WHITE)
    d.point((rx + 1, y + 1), fill=WHITE)


# ──────────────────────────────────────────────────────────────
# OMBRA — bête des ombres (loup spectral)
# ──────────────────────────────────────────────────────────────
def ombra(stage):
    p = PAL['ombra']
    img, d = canvas()
    drop_shadow(d, 32, 16 + stage * 2)

    grow = stage * 2  # bigger silhouette per evolution

    # tail (bushy, swept left)
    d.polygon([(10 - grow, 44), (4 - grow, 34 - grow), (12 - grow, 30), (20, 42), (18, 50)], fill=p['D'])
    d.polygon([(8 - grow, 38), (12 - grow, 32), (17, 40)], fill=p['B'])

    # body (sitting)
    d.ellipse([20, 36 - grow, 44, 58], fill=p['B'])
    d.ellipse([24, 44, 40, 57], fill=p['D'])  # belly shade
    d.ellipse([26, 42 - grow // 2, 38, 52], fill=p['L'])  # chest fluff

    # front paws
    d.rectangle([23, 52, 28, 58], fill=p['B'])
    d.rectangle([36, 52, 41, 58], fill=p['B'])

    # head (big, chibi)
    hr = 13 + grow
    d.ellipse([32 - hr, 24 - hr, 32 + hr, 24 + hr - 2], fill=p['B'])
    # cheek fluff spikes
    d.polygon([(32 - hr, 24), (32 - hr - 3, 28), (32 - hr + 2, 30)], fill=p['B'])
    d.polygon([(32 + hr, 24), (32 + hr + 3, 28), (32 + hr - 2, 30)], fill=p['B'])
    # muzzle
    d.ellipse([26, 26, 38, 35], fill=p['L'])
    d.rectangle([31, 28, 33, 30], fill=BLACK)  # nose

    # ears (tall pointed)
    eh = 10 + stage * 2
    d.polygon([(20 - grow, 16 - grow), (15 - grow, 16 - grow - eh), (26 - grow, 10 - grow)], fill=p['B'])
    d.polygon([(44 + grow, 16 - grow), (49 + grow, 16 - grow - eh), (38 + grow, 10 - grow)], fill=p['B'])
    d.polygon([(20 - grow, 14 - grow), (18 - grow, 14 - grow - eh + 4), (24 - grow, 11 - grow)], fill=p['D'])
    d.polygon([(44 + grow, 14 - grow), (46 + grow, 14 - grow - eh + 4), (40 + grow, 11 - grow)], fill=p['D'])

    # eyes
    if stage == 1:
        eyes_cute(d, 24, 36, 18, p['G'])
    else:
        eyes_fierce(d, 23, 36, 18, p['G'])

    # e3: shadow horns + floating wisps
    if stage >= 3:
        d.polygon([(24, 8), (20, 0), (28, 5)], fill=p['D'])
        d.polygon([(40, 8), (44, 0), (36, 5)], fill=p['D'])
    if stage >= 2:
        for wx, wy in ((8, 18), (56, 22), (12, 8), (52, 6)):
            d.rectangle([wx, wy, wx + 1, wy + 1], fill=p['G'])

    return outline(img)


# ──────────────────────────────────────────────────────────────
# MAGMA — titan volcanique (golem trapu)
# ──────────────────────────────────────────────────────────────
def magma(stage):
    p = PAL['magma']
    img, d = canvas()
    drop_shadow(d, 32, 17 + stage * 2)

    grow = stage * 2

    # legs (stumpy)
    d.rectangle([20 - grow // 2, 50, 28, 58], fill=p['D'])
    d.rectangle([36, 50, 44 + grow // 2, 58], fill=p['D'])

    # body (boulder)
    d.ellipse([16 - grow, 30 - grow, 48 + grow, 56], fill=p['B'])
    d.ellipse([22 - grow // 2, 40, 42 + grow // 2, 55], fill=p['D'])  # lower shade

    # lava cracks on body (bright zigzag)
    crack = p['G']
    d.line([(26, 38), (29, 42), (27, 46), (30, 50)], fill=crack, width=1)
    d.line([(37, 37), (35, 41), (38, 45)], fill=crack, width=1)
    if stage >= 2:
        d.line([(20, 40), (22, 44), (20, 48)], fill=crack, width=1)
        d.line([(43, 40), (41, 45), (44, 49)], fill=crack, width=1)

    # arms (chunky, hanging)
    d.ellipse([10 - grow, 32 - grow // 2, 20 - grow // 2, 50], fill=p['B'])
    d.ellipse([44 + grow // 2, 32 - grow // 2, 54 + grow, 50], fill=p['B'])
    d.ellipse([11 - grow, 44, 19 - grow // 2, 51], fill=p['D'])  # fists
    d.ellipse([45 + grow // 2, 44, 53 + grow, 51], fill=p['D'])

    # head (rocky block, sunk into shoulders)
    d.rounded_rectangle([21, 10 - grow, 43, 32 - grow // 2], radius=6, fill=p['B'])
    d.rectangle([21, 12 - grow, 43, 16 - grow], fill=p['D'])  # heavy brow

    # horns
    if stage == 1:
        d.polygon([(31, 11 - grow), (33, 11 - grow), (32, 4 - grow)], fill=p['L'])
    else:
        d.polygon([(24, 11 - grow), (27, 11 - grow), (24, 2 - grow)], fill=p['L'])
        d.polygon([(40, 11 - grow), (37, 11 - grow), (40, 2 - grow)], fill=p['L'])
    if stage >= 3:
        d.polygon([(31, 10 - grow), (33, 10 - grow), (32, 1 - grow)], fill=p['G'])

    # eyes (lava glow under brow)
    if stage == 1:
        eyes_cute(d, 25, 35, 19 - grow, p['G'])
    else:
        eyes_fierce(d, 24, 35, 19 - grow, p['G'])
    # mouth crack
    d.line([(28, 27 - grow // 2), (32, 28 - grow // 2), (36, 27 - grow // 2)], fill=INK, width=1)

    # e3: magma vents on shoulders
    if stage >= 3:
        for vx in (14 - grow, 46 + grow):
            d.polygon([(vx, 32), (vx + 4, 32), (vx + 2, 26)], fill=p['G'])

    return outline(img)


# ──────────────────────────────────────────────────────────────
# ABYSSAL — kraken des profondeurs (pieuvre)
# ──────────────────────────────────────────────────────────────
def abyssal(stage):
    p = PAL['abyssal']
    img, d = canvas()
    drop_shadow(d, 32, 18 + stage)

    grow = stage * 2

    # tentacles (wavy, fanned under the head)
    n = 4 + stage  # 5 / 6 / 7 tentacles
    span = 22 + grow * 2
    for i in range(n):
        t = i / (n - 1)
        bx = 32 - span // 2 + int(t * span)
        sway = (-1) ** i * (2 + stage)
        d.ellipse([bx - 3, 40, bx + 3, 52], fill=p['B'])
        d.ellipse([bx - 2 + sway, 48, bx + 2 + sway, 58], fill=p['B'])
        d.ellipse([bx - 1 + sway, 53, bx + 1 + sway, 57], fill=p['L'])  # tip sucker

    # head (large dome)
    hr = 16 + grow
    d.ellipse([32 - hr, 26 - hr, 32 + hr, 26 + hr], fill=p['B'])
    d.ellipse([32 - hr + 3, 26 - hr + 2, 32 + hr - 3, 26], fill=p['L'])  # crown sheen
    d.ellipse([32 - hr + 6, 34, 32 + hr - 6, 26 + hr - 2], fill=p['D'])  # chin shade

    # spots
    for sx, sy in ((22, 14), (40, 12), (30, 9), (45, 20), (18, 22)):
        d.rectangle([sx, sy, sx + 1, sy + 1], fill=p['G'])

    # eyes (big, luminous)
    if stage == 1:
        for ex in (22, 36):
            d.ellipse([ex, 21, ex + 6, 29], fill=BLACK)
            d.rectangle([ex + 1, 23, ex + 4, 27], fill=p['G'])
            d.rectangle([ex + 1, 22, ex + 2, 24], fill=WHITE)
    else:
        eyes_fierce(d, 22, 37, 23, p['G'])

    # mouth (tiny w)
    d.point((31, 31), fill=INK)
    d.point((33, 31), fill=INK)

    # e2: fin crest / e3: spiked crown
    if stage == 2:
        d.polygon([(32, 26 - hr + 1), (27, 26 - hr - 6), (37, 26 - hr - 6)], fill=p['L'])
    if stage >= 3:
        for cx_, h in ((22, 6), (32, 10), (42, 6)):
            d.polygon([(cx_ - 3, 26 - hr + 2), (cx_ + 3, 26 - hr + 2), (cx_, 26 - hr - h)], fill=p['L'])

    return outline(img)


# ──────────────────────────────────────────────────────────────
# SABLE — chasseur des sables (fennec)
# ──────────────────────────────────────────────────────────────
def sable(stage):
    p = PAL['sable']
    img, d = canvas()
    drop_shadow(d, 32, 15 + stage * 2)

    grow = stage * 2

    # tail (curled, light tip)
    d.ellipse([42, 40 - grow, 56 + grow // 2, 52], fill=p['B'])
    d.ellipse([50, 40 - grow, 57 + grow // 2, 47], fill=p['L'])

    # body (small, sitting)
    d.ellipse([22, 38 - grow // 2, 42, 58], fill=p['B'])
    d.ellipse([26, 44, 38, 57], fill=p['L'])  # belly

    # paws
    d.rectangle([24, 53, 29, 58], fill=p['B'])
    d.rectangle([35, 53, 40, 58], fill=p['B'])

    # head
    hr = 12 + grow
    d.ellipse([32 - hr, 26 - hr, 32 + hr, 26 + hr - 3], fill=p['B'])
    # muzzle
    d.ellipse([27, 26, 37, 34], fill=p['L'])
    d.rectangle([31, 27, 33, 29], fill=BLACK)

    # HUGE fennec ears
    eh = 16 + stage * 3
    d.polygon([(22 - grow, 18 - grow), (12 - grow, 18 - grow - eh), (30 - grow // 2, 12 - grow)], fill=p['B'])
    d.polygon([(42 + grow, 18 - grow), (52 + grow, 18 - grow - eh), (34 + grow // 2, 12 - grow)], fill=p['B'])
    d.polygon([(22 - grow, 16 - grow), (15 - grow, 16 - grow - eh + 5), (27 - grow // 2, 13 - grow)], fill=p['D'])
    d.polygon([(42 + grow, 16 - grow), (49 + grow, 16 - grow - eh + 5), (37 + grow // 2, 13 - grow)], fill=p['D'])

    # eyes
    if stage == 1:
        eyes_cute(d, 25, 36, 19, p['G'])
    else:
        eyes_fierce(d, 24, 36, 19, p['G'])

    # e2: gold pharaoh collar / e3: + headdress jewel sitting on the head
    if stage >= 2:
        d.rectangle([24, 38, 40, 41], fill=p['G'])
        d.point((32, 42), fill=p['G'])
    if stage >= 3:
        top = 26 - hr
        d.rectangle([28, top - 3, 36, top + 3], fill=p['G'])
        d.rectangle([30, top - 6, 34, top - 3], fill=(59, 110, 168, 255))  # lapis jewel

    return outline(img)


# ──────────────────────────────────────────────────────────────
BUILDERS = {'ombra': ombra, 'magma': magma, 'abyssal': abyssal, 'sable': sable}
SUFFIX = {1: 'e1_clean', 2: 'e2_f1', 3: 'e3_f1'}


def main():
    import os
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sprites')
    for name, fn in BUILDERS.items():
        for stage in (1, 2, 3):
            img = fn(stage)
            big = img.resize((OUT, OUT), Image.NEAREST)
            path = os.path.join(out_dir, f'{name}_{SUFFIX[stage]}.png')
            big.save(path)
            print('wrote', path)

    # preview montage (small, for quick visual check)
    montage = Image.new('RGBA', (GRID * 3 * 4, GRID), (244, 231, 196, 255))
    x = 0
    for name, fn in BUILDERS.items():
        for stage in (1, 2, 3):
            montage.paste(fn(stage), (x, 0), fn(stage))
            x += GRID
    montage.resize((GRID * 3 * 4 * 4, GRID * 4), Image.NEAREST).save('/tmp/sprites_preview.png')
    print('wrote /tmp/sprites_preview.png')


if __name__ == '__main__':
    main()
