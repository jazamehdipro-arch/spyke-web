"""
Kawaii Demon sprites for Croisio — 3 evolution stages × 4 types × 3 frames = 36 sprites.
Stage 1 (lv 1-9): cute baby form
Stage 2 (lv 10-19): fiercer adolescent, bigger horns/tail
Stage 3 (lv 20+): full demon form with wings
"""
from PIL import Image, ImageDraw
import os

OUT = "/home/user/spyke-web/game/assets/sprites"
os.makedirs(OUT, exist_ok=True)

_T = (0, 0, 0, 0)

def c(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), a)

def render(grid, pal, scale=4):
    H, W = len(grid), len(grid[0])
    img = Image.new('RGBA', (W*scale, H*scale), _T)
    d = ImageDraw.Draw(img)
    for y, row in enumerate(grid):
        for x, v in enumerate(row):
            if v == 0: continue
            d.rectangle([x*scale, y*scale, x*scale+scale-1, y*scale+scale-1], fill=pal[v])
    return img

K=1; B=2; L=3; D=4; W=5; P=6; G=7; H=8; A=9; T=10; C=11; E=12; F=13

# ══════════════════════════════════════════════════════════
#  IGNÏS  — fire demon
# ══════════════════════════════════════════════════════════
IGNIS_PAL1 = {K:c('#111111'),B:c('#C41E0F'),L:c('#E8361E'),D:c('#7A1108'),W:c('#FFFFFF'),P:c('#111111'),G:c('#E8F4FF'),H:c('#FF5540'),A:c('#FF6600'),T:c('#8B1500'),C:c('#FF8077'),E:c('#FF9A00'),F:c('#FFD700')}
IGNIS_PAL2 = {K:c('#111111'),B:c('#A01208'),L:c('#C42010'),D:c('#600A05'),W:c('#FFFFFF'),P:c('#111111'),G:c('#E8F4FF'),H:c('#E84030'),A:c('#FF8800'),T:c('#6B0A04'),C:c('#FF6060'),E:c('#FF7700'),F:c('#FFB000')}
IGNIS_PAL3 = {K:c('#111111'),B:c('#780A05'),L:c('#A01208'),D:c('#400704'),W:c('#FFFFFF'),P:c('#FF2200'),G:c('#FFE8E8'),H:c('#C01808'),A:c('#FFCC00'),T:c('#400704'),C:c('#FF4444'),E:c('#FF5500'),F:c('#FFE000')}

IGNIS_F0 = [
  [0, 0, A, K, 0, 0, 0, 0, 0, 0, K, A, 0, 0, 0, 0, 0, 0],
  [0, K, A, A, K, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0],
  [0, 0, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, W, B, B, B, B, B, W, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, T, B, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],
  [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, T, K, 0, 0, 0],
  [0, K, K, 0, 0, 0, K, K, K, 0, 0, 0, K, K, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, E, K, 0, 0, K, E, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, K, E, E, E, E, K, 0, 0, 0, 0, 0, 0, 0],
]
IGNIS_F1 = [
  [0, 0, A, K, 0, 0, 0, 0, 0, 0, K, A, 0, 0, 0, 0, 0, 0],
  [0, K, A, A, K, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0],
  [0, 0, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, W, B, B, B, B, B, W, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, T, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],
  [0, 0, K, T, T, 0, K, B, K, 0, 0, T, T, K, 0, 0, 0, 0],
  [0, 0, 0, K, K, 0, 0, K, 0, 0, 0, K, K, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, E, K, 0, 0, K, E, E, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, K, E, E, E, E, E, K, 0, 0, 0, 0, 0, 0, 0],
]
IGNIS_F2 = [
  [0, 0, A, K, 0, 0, 0, 0, 0, 0, K, A, 0, 0, 0, 0, 0, 0],
  [0, K, A, A, K, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0],
  [0, 0, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, K, B, B, B, B, B, B, B, K, B, K, 0, 0, 0, 0],
  [0, K, B, B, K, K, B, B, B, K, K, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [K, T, B, B, B, B, B, B, B, B, B, B, B, T, K, 0, 0, 0],
  [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, T, K, 0, 0, 0],
  [0, K, K, 0, 0, 0, K, B, K, 0, 0, 0, K, K, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, K, K, K, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, E, K, 0, 0, K, E, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, K, E, E, E, E, K, 0, 0, 0, 0, 0, 0, 0],
]

# Stage 2: taller 3-tip horns, darker body, fiercer frown, bigger tail
IGNIS_E2_F0 = [
  [0, K, A, K, 0, 0, K, 0, 0, K, A, K, 0, 0, 0, 0, 0, 0],  # 3 horn tips
  [K, A, A, A, K, K, A, K, K, A, A, A, K, 0, 0, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, K, 0, 0, 0, 0],  # no cheek = fiercer
  [K, B, B, K, P, G, B, B, B, K, P, G, B, K, 0, 0, 0, 0],  # slanted angry brow
  [K, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, W, B, B, K, B, B, W, B, B, K, 0, 0, 0, 0],  # fang in middle
  [0, K, B, B, B, B, K, B, K, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, D, D, B, B, B, B, B, D, D, K, 0, 0, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, T, B, B, K, 0, B, B, 0, K, B, T, T, K, 0, 0, 0, 0],
  [K, T, T, K, 0, K, B, B, K, 0, K, T, T, K, 0, 0, 0, 0],
  [0, K, K, 0, K, E, K, K, K, E, K, K, K, 0, 0, 0, 0, 0],
  [0, 0, E, K, E, E, 0, 0, 0, E, E, K, E, 0, 0, 0, 0, 0],  # bigger fire tail
  [0, 0, K, E, E, E, F, F, F, E, E, K, 0, 0, 0, 0, 0, 0],
]
IGNIS_E2_F1 = [
  [0, K, A, K, 0, 0, K, 0, 0, K, A, K, 0, 0, 0, 0, 0, 0],
  [K, A, A, A, K, K, A, K, K, A, A, A, K, 0, 0, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, K, 0, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, K, 0, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, W, B, B, K, B, B, W, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, K, B, K, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, D, D, B, B, B, B, B, D, D, K, 0, 0, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, T, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0, 0],
  [0, K, T, T, 0, K, B, B, K, T, T, K, 0, 0, 0, 0, 0, 0],
  [0, 0, K, K, K, E, K, K, K, E, K, K, 0, 0, 0, 0, 0, 0],
  [0, E, K, E, E, E, 0, 0, E, E, E, K, E, 0, 0, 0, 0, 0],
  [0, K, E, E, E, E, F, F, E, E, E, E, K, 0, 0, 0, 0, 0],
]
IGNIS_E2_F2 = [
  [0, K, A, K, 0, 0, K, 0, 0, K, A, K, 0, 0, 0, 0, 0, 0],
  [K, A, A, A, K, K, A, K, K, A, A, A, K, 0, 0, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [K, B, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [K, B, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, K, B, B, B, B, B, B, B, K, B, K, 0, 0, 0, 0],
  [K, B, B, B, K, K, B, B, B, K, K, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [K, T, B, B, B, B, B, B, B, B, B, B, B, T, K, 0, 0, 0],
  [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, T, K, 0, 0, 0],
  [0, K, K, 0, 0, 0, K, K, K, 0, 0, 0, K, K, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, K, E, K, K, E, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, E, K, E, E, E, 0, E, E, E, K, E, 0, 0, 0, 0, 0],
  [0, 0, K, E, E, E, F, F, F, E, E, K, 0, 0, 0, 0, 0, 0],
]

# Stage 3: wings, fire crown, red-glowing pupils
IGNIS_E3_F0 = [
  [0, F, A, K, 0, F, A, K, A, F, 0, K, A, F, 0, 0, 0, 0],  # fire crown
  [K, A, A, A, K, A, A, A, A, A, K, A, A, A, K, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, W, B, K, B, K, B, W, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, K, 0, B, 0, K, B, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, K, T, B, K, 0, B, B, 0, K, B, T, K, E, E, K, 0, 0],  # wings
  [E, K, T, K, 0, K, B, B, K, 0, T, K, E, E, E, K, 0, 0],
  [K, E, K, 0, K, E, K, K, K, E, K, 0, K, E, E, K, 0, 0],
  [K, E, E, K, E, E, 0, 0, 0, E, E, K, E, E, K, 0, 0, 0],
  [0, K, E, E, E, F, F, F, F, F, E, E, E, K, 0, 0, 0, 0],
]
IGNIS_E3_F1 = [
  [0, F, A, K, 0, F, A, K, A, F, 0, K, A, F, 0, 0, 0, 0],
  [K, A, A, A, K, A, A, A, A, A, K, A, A, A, K, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, W, B, K, B, K, B, W, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, K, 0, B, 0, K, B, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, K, T, K, 0, B, B, B, B, 0, T, K, E, E, K, 0, 0, 0],
  [E, K, T, T, K, B, B, B, B, T, T, K, E, E, E, K, 0, 0],
  [K, E, K, K, K, E, K, K, K, E, K, K, K, E, E, K, 0, 0],
  [K, E, E, K, E, E, 0, 0, 0, E, E, K, E, E, K, 0, 0, 0],
  [0, K, E, E, E, F, F, F, F, F, E, E, E, K, 0, 0, 0, 0],
]
IGNIS_E3_F2 = [
  [0, F, A, K, 0, F, A, K, A, F, 0, K, A, F, 0, 0, 0, 0],
  [K, A, A, A, K, A, A, A, A, A, K, A, A, A, K, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, C, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, W, G, P, B, B, B, W, G, P, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, K, B, B, B, B, B, B, B, K, B, B, K, 0, 0, 0],
  [K, B, B, B, K, K, B, B, B, K, K, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, T, B, B, B, B, B, B, B, B, B, B, B, T, E, K, 0, 0],
  [E, K, T, T, K, 0, K, B, K, 0, K, T, T, K, E, K, 0, 0],
  [K, E, K, K, 0, 0, K, K, K, 0, 0, K, K, E, E, K, 0, 0],
  [K, E, E, K, 0, 0, 0, 0, 0, 0, 0, K, E, E, K, 0, 0, 0],
  [0, K, E, E, K, E, E, 0, E, E, K, E, E, K, 0, 0, 0, 0],
  [0, 0, K, E, E, E, F, F, F, E, E, E, K, 0, 0, 0, 0, 0],
]

# ══════════════════════════════════════════════════════════
#  NÉMO  — water demon
# ══════════════════════════════════════════════════════════
NEMO_PAL1 = {K:c('#111111'),B:c('#1A3A8C'),L:c('#2E5FCC'),D:c('#0D1F4D'),W:c('#FFFFFF'),P:c('#111111'),G:c('#E8F4FF'),H:c('#4477DD'),A:c('#00BBDD'),T:c('#0D2560'),C:c('#7799EE'),E:c('#00DDFF'),F:c('#88EEFF')}
NEMO_PAL2 = {K:c('#111111'),B:c('#0F2860'),L:c('#1A3A8C'),D:c('#07112E'),W:c('#FFFFFF'),P:c('#111111'),G:c('#E8F4FF'),H:c('#2255BB'),A:c('#0099BB'),T:c('#070F30'),C:c('#5577CC'),E:c('#00BBEE'),F:c('#44DDFF')}
NEMO_PAL3 = {K:c('#111111'),B:c('#071840'),L:c('#0F2860'),D:c('#040D20'),W:c('#FFFFFF'),P:c('#00AAFF'),G:c('#EEFFFF'),H:c('#103070'),A:c('#00FFEE'),T:c('#040D20'),C:c('#3355AA'),E:c('#00EEFF'),F:c('#AAFFFF')}

NEMO_F0 = [
  [0, K, A, A, K, 0, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0],
  [0, K, A, A, K, K, K, K, K, K, K, A, A, K, 0, 0, 0, 0],
  [0, 0, K, K, B, B, B, B, B, B, B, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, T, B, B, K, 0, B, B, 0, K, B, T, K, E, K, 0, 0],
  [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, K, E, E, K, 0],
  [0, K, K, 0, 0, 0, K, K, K, 0, 0, 0, K, K, K, E, K, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, K, E, K, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, K, 0, 0, 0],
]
NEMO_F1 = [
  [0, K, A, A, K, 0, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0],
  [0, K, A, A, K, K, K, K, K, K, K, A, A, K, 0, 0, 0, 0],
  [0, 0, K, K, B, B, B, B, B, B, B, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, T, B, K, 0, B, B, 0, K, B, K, E, K, 0, 0, 0],
  [0, 0, K, T, T, 0, K, B, K, 0, T, T, K, E, E, K, 0, 0],
  [0, 0, 0, K, K, 0, 0, K, 0, 0, K, K, K, K, E, K, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, K, E, K, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, K, 0, 0, 0, 0],
]
NEMO_F2 = NEMO_F0

NEMO_E2_F0 = [
  [0, K, A, A, K, 0, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0],
  [K, A, A, A, K, K, K, K, K, K, K, A, A, A, K, 0, 0, 0],  # wider fins
  [K, A, K, K, B, B, B, B, B, B, B, K, K, A, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],  # fierce no cheek
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, D, D, B, B, B, B, B, D, D, B, K, 0, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, T, B, B, K, 0, B, B, 0, K, B, T, K, E, K, 0, 0, 0],
  [K, T, T, K, 0, K, B, B, K, 0, K, T, K, E, E, K, 0, 0],
  [0, K, K, 0, K, E, K, K, K, E, K, K, K, E, E, K, 0, 0],
  [0, E, K, E, E, K, 0, 0, 0, K, E, E, K, E, K, 0, 0, 0],  # longer tentacles
  [0, K, E, E, K, 0, 0, 0, 0, 0, K, E, E, K, 0, 0, 0, 0],
]
NEMO_E2_F1 = [
  [0, K, A, A, K, 0, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0],
  [K, A, A, A, K, K, K, K, K, K, K, A, A, A, K, 0, 0, 0],
  [K, A, K, K, B, B, B, B, B, B, B, K, K, A, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, D, D, B, B, B, B, B, D, D, B, K, 0, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [0, K, T, B, K, 0, B, B, 0, K, B, T, K, E, K, 0, 0, 0],
  [0, K, T, T, 0, K, B, B, K, T, T, K, E, E, K, 0, 0, 0],
  [0, 0, K, K, K, E, K, K, K, E, K, K, E, E, K, 0, 0, 0],
  [0, E, K, E, E, K, 0, 0, 0, K, E, E, K, E, K, 0, 0, 0],
  [0, K, E, E, K, 0, 0, 0, 0, 0, K, E, E, K, 0, 0, 0, 0],
]
NEMO_E2_F2 = NEMO_E2_F0

NEMO_E3_F0 = [
  [K, A, A, K, A, K, 0, 0, 0, K, A, K, A, A, K, 0, 0, 0],  # tall double fins
  [K, A, A, K, A, K, K, K, K, K, A, K, A, A, K, 0, 0, 0],
  [K, A, K, K, B, B, B, B, B, B, B, K, K, A, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, K, T, B, K, B, B, B, B, K, B, T, K, E, E, K, 0, 0],
  [E, K, T, K, E, B, B, B, B, E, K, T, K, E, E, K, 0, 0],
  [K, E, K, E, E, K, K, K, K, E, E, K, E, E, E, K, 0, 0],
  [K, E, E, E, K, E, E, 0, E, E, K, E, E, E, K, 0, 0, 0],
  [0, K, E, E, E, F, F, F, F, F, E, E, E, K, 0, 0, 0, 0],
]
NEMO_E3_F1 = [
  [K, A, A, K, A, K, 0, 0, 0, K, A, K, A, A, K, 0, 0, 0],
  [K, A, A, K, A, K, K, K, K, K, A, K, A, A, K, 0, 0, 0],
  [K, A, K, K, B, B, B, B, B, B, B, K, K, A, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, K, T, K, E, B, B, B, B, E, T, K, E, E, K, 0, 0, 0],
  [E, K, T, T, K, B, B, B, B, K, T, T, K, E, E, K, 0, 0],
  [K, E, K, K, K, E, K, K, K, E, K, K, K, E, E, K, 0, 0],
  [K, E, E, E, K, E, E, 0, E, E, K, E, E, E, K, 0, 0, 0],
  [0, K, E, E, E, F, F, F, F, F, E, E, E, K, 0, 0, 0, 0],
]
NEMO_E3_F2 = NEMO_E3_F0

# ══════════════════════════════════════════════════════════
#  SYLVA  — nature demon
# ══════════════════════════════════════════════════════════
SYLVA_PAL1 = {K:c('#111111'),B:c('#1B5E20'),L:c('#2E7D32'),D:c('#0D3311'),W:c('#FFFFFF'),P:c('#111111'),G:c('#E8FFE8'),H:c('#388E3C'),A:c('#795548'),T:c('#0A2E0D'),C:c('#81C784'),E:c('#8BC34A'),F:c('#CDDC39')}
SYLVA_PAL2 = {K:c('#111111'),B:c('#104010'),L:c('#1B5E20'),D:c('#082008'),W:c('#FFFFFF'),P:c('#111111'),G:c('#E8FFE8'),H:c('#2D6A30'),A:c('#5D3A28'),T:c('#061406'),C:c('#66BB6A'),E:c('#6B9E30'),F:c('#A8C820')}
SYLVA_PAL3 = {K:c('#111111'),B:c('#082808'),L:c('#104010'),D:c('#041404'),W:c('#FFFFFF'),P:c('#00CC44'),G:c('#EEFFEE'),H:c('#186020'),A:c('#4E2C1E'),T:c('#041004'),C:c('#44AA44'),E:c('#558B2F'),F:c('#F9A825')}

SYLVA_F0 = [
  [0, 0, A, K, 0, F, K, 0, K, F, 0, K, A, 0, 0, 0, 0, 0],
  [0, 0, K, A, K, K, A, K, A, K, K, A, K, 0, 0, 0, 0, 0],
  [0, 0, 0, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, K, B, K, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, K, 0, B, 0, K, B, B, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, T, B, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],
  [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, T, K, 0, 0, 0],
  [0, K, K, 0, 0, 0, K, K, K, 0, 0, 0, K, K, 0, 0, 0, 0],
  [0, 0, 0, 0, A, K, A, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
SYLVA_F1 = [
  [0, 0, A, K, 0, F, K, 0, K, F, 0, K, A, 0, 0, 0, 0, 0],
  [0, 0, K, A, K, K, A, K, A, K, K, A, K, 0, 0, 0, 0, 0],
  [0, 0, 0, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, K, B, K, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, K, 0, B, 0, K, B, B, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, T, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],
  [0, 0, K, T, T, 0, K, B, K, 0, T, T, K, 0, 0, 0, 0, 0],
  [0, 0, 0, K, K, 0, 0, K, 0, 0, K, K, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, A, K, A, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
SYLVA_F2 = SYLVA_F0

SYLVA_E2_F0 = [
  [0, F, A, K, F, F, K, 0, K, F, F, K, A, F, 0, 0, 0, 0],  # denser thorn crown
  [F, K, A, K, K, A, K, K, K, A, K, K, A, K, F, 0, 0, 0],
  [K, A, K, K, K, K, K, K, K, K, K, K, K, A, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, K, B, B, B, K, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, K, 0, B, B, B, 0, K, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, T, B, B, K, 0, B, B, 0, K, B, T, T, K, 0, 0, 0, 0],
  [K, T, T, K, 0, K, B, B, K, 0, K, T, T, K, 0, 0, 0, 0],
  [0, K, K, 0, K, E, K, K, K, E, K, K, K, 0, 0, 0, 0, 0],
  [0, E, K, A, K, A, A, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # vine tail
  [0, K, E, K, A, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
SYLVA_E2_F1 = [
  [0, F, A, K, F, F, K, 0, K, F, F, K, A, F, 0, 0, 0, 0],
  [F, K, A, K, K, A, K, K, K, A, K, K, A, K, F, 0, 0, 0],
  [K, A, K, K, K, K, K, K, K, K, K, K, K, A, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, K, B, B, B, K, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, K, 0, B, B, B, 0, K, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [0, K, T, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0, 0],
  [0, K, T, T, 0, K, B, B, K, T, T, K, 0, 0, 0, 0, 0, 0],
  [0, 0, K, K, K, E, K, K, K, E, K, K, 0, 0, 0, 0, 0, 0],
  [0, E, K, A, K, A, A, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, K, E, K, A, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
SYLVA_E2_F2 = SYLVA_E2_F0

SYLVA_E3_F0 = [
  [F, F, A, K, F, F, K, F, K, F, F, K, A, F, F, 0, 0, 0],  # massive crown
  [K, A, A, K, A, A, K, A, K, A, A, K, A, A, K, 0, 0, 0],
  [K, A, K, K, K, K, K, K, K, K, K, K, K, A, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, K, B, B, B, K, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, K, 0, B, B, B, 0, K, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, K, T, B, K, B, B, B, B, K, B, T, K, E, E, K, 0, 0],  # leaf wings
  [E, K, T, K, E, B, B, B, B, E, K, T, K, E, E, K, 0, 0],
  [K, E, K, E, E, K, K, K, K, E, E, K, E, E, E, K, 0, 0],
  [K, E, E, E, K, A, A, 0, A, A, K, E, E, E, K, 0, 0, 0],
  [0, K, E, K, A, A, K, 0, K, A, A, K, E, K, 0, 0, 0, 0],
]
SYLVA_E3_F1 = [
  [F, F, A, K, F, F, K, F, K, F, F, K, A, F, F, 0, 0, 0],
  [K, A, A, K, A, A, K, A, K, A, A, K, A, A, K, 0, 0, 0],
  [K, A, K, K, K, K, K, K, K, K, K, K, K, A, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, K, B, B, B, K, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, K, 0, B, B, B, 0, K, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, K, T, K, E, B, B, B, B, E, T, K, E, E, K, 0, 0, 0],
  [E, K, T, T, K, B, B, B, B, K, T, T, K, E, E, K, 0, 0],
  [K, E, K, K, K, E, K, K, K, E, K, K, K, E, E, K, 0, 0],
  [K, E, E, E, K, A, A, 0, A, A, K, E, E, E, K, 0, 0, 0],
  [0, K, E, K, A, A, K, 0, K, A, A, K, E, K, 0, 0, 0, 0],
]
SYLVA_E3_F2 = SYLVA_E3_F0

# ══════════════════════════════════════════════════════════
#  ZAPP  — electric demon
# ══════════════════════════════════════════════════════════
ZAPP_PAL1 = {K:c('#111111'),B:c('#CC5500'),L:c('#E87000'),D:c('#8B3400'),W:c('#FFFFFF'),P:c('#111111'),G:c('#FFFBE8'),H:c('#FF8C00'),A:c('#FFD700'),T:c('#6B2A00'),C:c('#FFB347'),E:c('#FFE000'),F:c('#FFFFFF')}
ZAPP_PAL2 = {K:c('#111111'),B:c('#AA4400'),L:c('#CC5500'),D:c('#6B2A00'),W:c('#FFFFFF'),P:c('#111111'),G:c('#FFFBE8'),H:c('#DD7700'),A:c('#FFBB00'),T:c('#4A1E00'),C:c('#EE9933'),E:c('#FFCC00'),F:c('#FFFFFF')}
ZAPP_PAL3 = {K:c('#111111'),B:c('#7A3000'),L:c('#AA4400'),D:c('#4A1E00'),W:c('#FFFFFF'),P:c('#FFAA00'),G:c('#FFFFE0'),H:c('#BB5500'),A:c('#FFEE00'),T:c('#2A1000'),C:c('#FF8800'),E:c('#FFDD00'),F:c('#FFFFFF')}

ZAPP_F0 = [
  [0, K, A, K, 0, K, A, K, 0, K, A, K, 0, 0, 0, 0, 0, 0],
  [0, K, A, A, K, A, A, A, A, A, A, K, 0, 0, 0, 0, 0, 0],
  [0, 0, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, T, B, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],
  [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, T, K, 0, 0, 0],
  [0, K, K, 0, 0, 0, K, K, K, 0, 0, 0, K, K, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, K, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
ZAPP_F1 = [
  [0, K, A, A, K, A, A, A, A, A, A, K, 0, 0, 0, 0, 0, 0],
  [0, 0, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
  [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
  [0, K, B, W, P, P, B, B, B, W, P, P, B, K, 0, 0, 0, 0],
  [0, K, B, W, G, P, B, C, B, W, G, P, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
  [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [0, 0, K, T, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],
  [0, 0, K, T, T, 0, K, B, K, 0, T, T, K, 0, 0, 0, 0, 0],
  [0, 0, 0, K, K, 0, 0, K, 0, 0, K, K, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, K, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
ZAPP_F2 = ZAPP_F0

ZAPP_E2_F0 = [
  [K, A, K, 0, K, A, K, 0, K, A, K, 0, K, A, K, 0, 0, 0],  # wider spiky hair
  [K, A, A, K, A, A, A, A, A, A, A, K, A, A, K, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, T, B, B, K, 0, B, B, 0, K, B, T, T, K, 0, 0, 0, 0],
  [K, T, T, K, 0, K, B, B, K, 0, K, T, T, K, 0, 0, 0, 0],
  [0, K, K, 0, K, E, K, K, K, E, K, K, K, 0, 0, 0, 0, 0],
  [0, E, K, A, K, A, 0, 0, 0, A, K, A, K, E, 0, 0, 0, 0],  # bigger lightning
  [0, K, E, A, A, K, 0, 0, 0, K, A, A, E, K, 0, 0, 0, 0],
]
ZAPP_E2_F1 = [
  [K, A, K, 0, K, A, K, 0, K, A, K, 0, K, A, K, 0, 0, 0],
  [K, A, A, K, A, A, A, A, A, A, A, K, A, A, K, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [0, K, T, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0, 0],
  [0, K, T, T, 0, K, B, B, K, T, T, K, 0, 0, 0, 0, 0, 0],
  [0, 0, K, K, K, E, K, K, K, E, K, K, 0, 0, 0, 0, 0, 0],
  [0, E, K, A, K, A, 0, 0, 0, A, K, A, K, E, 0, 0, 0, 0],
  [0, K, E, A, A, K, 0, 0, 0, K, A, A, E, K, 0, 0, 0, 0],
]
ZAPP_E2_F2 = ZAPP_E2_F0

ZAPP_E3_F0 = [
  [A, K, A, K, A, K, A, K, A, K, A, K, A, K, A, K, 0, 0],  # full plasma crown
  [K, A, A, K, A, A, K, A, K, A, A, K, A, A, K, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, K, T, B, K, B, B, B, B, K, B, T, K, E, E, K, 0, 0],  # electric wings
  [E, K, T, K, E, B, B, B, B, E, K, T, K, E, E, K, 0, 0],
  [K, E, K, E, E, K, K, K, K, E, E, K, E, E, E, K, 0, 0],
  [K, E, E, K, A, K, 0, 0, 0, K, A, K, E, E, K, 0, 0, 0],
  [0, K, E, A, A, K, 0, 0, 0, K, A, A, E, K, 0, 0, 0, 0],
]
ZAPP_E3_F1 = [
  [A, K, A, K, A, K, A, K, A, K, A, K, A, K, A, K, 0, 0],
  [K, A, A, K, A, A, K, A, K, A, A, K, A, A, K, 0, 0, 0],
  [0, K, K, K, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0],
  [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
  [K, B, B, B, H, B, B, B, B, B, H, B, B, B, K, 0, 0, 0],
  [K, B, B, W, W, W, B, B, B, W, W, W, B, B, K, 0, 0, 0],
  [K, B, B, W, P, P, B, B, B, W, P, P, B, B, K, 0, 0, 0],
  [K, B, B, K, P, G, B, B, B, K, P, G, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [K, B, B, D, D, B, B, B, B, B, D, D, B, B, K, 0, 0, 0],
  [K, B, B, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0],
  [E, K, T, K, E, B, B, B, B, E, T, K, E, E, K, 0, 0, 0],
  [E, K, T, T, K, B, B, B, B, K, T, T, K, E, E, K, 0, 0],
  [K, E, K, K, K, E, K, K, K, E, K, K, K, E, E, K, 0, 0],
  [K, E, E, K, A, K, 0, 0, 0, K, A, K, E, E, K, 0, 0, 0],
  [0, K, E, A, A, K, 0, 0, 0, K, A, A, E, K, 0, 0, 0, 0],
]
ZAPP_E3_F2 = ZAPP_E3_F0

# ── generate all 36 sprites ──────────────────────────────
specs = [
  ('ignis', [
    (IGNIS_PAL1, [IGNIS_F0,    IGNIS_F1,    IGNIS_F2]),
    (IGNIS_PAL2, [IGNIS_E2_F0, IGNIS_E2_F1, IGNIS_E2_F2]),
    (IGNIS_PAL3, [IGNIS_E3_F0, IGNIS_E3_F1, IGNIS_E3_F2]),
  ]),
  ('nemo', [
    (NEMO_PAL1, [NEMO_F0,    NEMO_F1,    NEMO_F2]),
    (NEMO_PAL2, [NEMO_E2_F0, NEMO_E2_F1, NEMO_E2_F2]),
    (NEMO_PAL3, [NEMO_E3_F0, NEMO_E3_F1, NEMO_E3_F2]),
  ]),
  ('sylva', [
    (SYLVA_PAL1, [SYLVA_F0,    SYLVA_F1,    SYLVA_F2]),
    (SYLVA_PAL2, [SYLVA_E2_F0, SYLVA_E2_F1, SYLVA_E2_F2]),
    (SYLVA_PAL3, [SYLVA_E3_F0, SYLVA_E3_F1, SYLVA_E3_F2]),
  ]),
  ('zapp', [
    (ZAPP_PAL1, [ZAPP_F0,    ZAPP_F1,    ZAPP_F2]),
    (ZAPP_PAL2, [ZAPP_E2_F0, ZAPP_E2_F1, ZAPP_E2_F2]),
    (ZAPP_PAL3, [ZAPP_E3_F0, ZAPP_E3_F1, ZAPP_E3_F2]),
  ]),
]

STAGE_PREFIX = ['', '_e2', '_e3']

for name, stages in specs:
    for stage_idx, (pal, frames) in enumerate(stages):
        sfx = STAGE_PREFIX[stage_idx]
        for fi, grid in enumerate(frames):
            img = render(grid, pal, scale=4)
            fname = f"{name}{sfx}_f{fi}.png"
            img.save(f"{OUT}/{fname}")
            print(f"saved {fname}")

# preview sheet: 4 rows (types) × 9 cols (3 stages × 3 frames)
SCALE = 4
SW, SH = 18*SCALE, 18*SCALE
GAP = 8
COLS, ROWS = 9, 4
sheet = Image.new('RGBA', (COLS*(SW+GAP)+GAP, ROWS*(SH+GAP)+GAP), c('#1a1a2e'))

for row, (name, stages) in enumerate(specs):
    col = 0
    for pal, frames in stages:
        for frame in frames:
            img = render(frame, pal, scale=SCALE)
            x = GAP + col*(SW+GAP)
            y = GAP + row*(SH+GAP)
            sheet.paste(img, (x, y), img)
            col += 1

sheet.save(f"{OUT}/preview.png")
print("preview saved!")
