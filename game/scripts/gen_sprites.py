"""
Kawaii Demon sprite generator for Croisio.
Style: round bodies, big black eyes, small horns, thick outlines, deep saturated colors.
4 types × 3 frames at 4x scale.
"""
from PIL import Image, ImageDraw
import os

OUT = "/home/user/spyke-web/game/assets/sprites"
os.makedirs(OUT, exist_ok=True)

T = (0, 0, 0, 0)

def c(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), a)

def render(grid, pal, scale=4):
    H, W = len(grid), len(grid[0])
    img = Image.new('RGBA', (W*scale, H*scale), T)
    d = ImageDraw.Draw(img)
    for y, row in enumerate(grid):
        for x, v in enumerate(row):
            if v == 0: continue
            d.rectangle([x*scale, y*scale, x*scale+scale-1, y*scale+scale-1], fill=pal[v])
    return img

# palette indices
K=1  # outline black
B=2  # body
L=3  # body light
D=4  # body dark / shadow
W=5  # eye white
P=6  # pupil
G=7  # eye gleam
H=8  # body highlight
A=9  # horn / accent
T=10 # paw/feet
C=11 # cheek blush
E=12 # special (fire, bubble, spark, leaf)
F=13 # special 2

# ══════════════════════════════════════════════════════════
#  IGNÏS  —  fire demon  (deep crimson + orange horns)
# ══════════════════════════════════════════════════════════
IGNIS_PAL = {
    K:c('#111111'), B:c('#C41E0F'), L:c('#E8361E'), D:c('#7A1108'),
    W:c('#FFFFFF'), P:c('#111111'), G:c('#E8F4FF'),
    H:c('#FF5540'), A:c('#FF6600'), T:c('#8B1500'),
    C:c('#FF8077'), E:c('#FF9A00'), F:c('#FFD700'),
}

IGNIS_F0 = [
  # 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 (18 wide, 18 tall)
    [0, 0, A, K, 0, 0, 0, 0, 0, 0, K, A, 0, 0, 0, 0, 0, 0],  # horns tips
    [0, K, A, A, K, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0],  # horns base
    [0, 0, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],  # head outline top
    [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
    [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
    [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],  # big eyes
    [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],  # pupils + cheek
    [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],  # gleam
    [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
    [0, K, B, B, W, B, B, B, B, B, W, B, B, K, 0, 0, 0, 0],  # fangs
    [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
    [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
    [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
    [0, K, T, B, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],  # stubby arms
    [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, T, K, 0, 0, 0],  # feet
    [0, K, K, 0, 0, 0, K, K, K, 0, 0, 0, K, K, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, E, K, 0, 0, K, E, 0, 0, 0, 0, 0, 0, 0],  # tail fire
    [0, 0, 0, 0, 0, K, E, E, E, E, K, 0, 0, 0, 0, 0, 0, 0],
]

IGNIS_F1 = [  # bounce up (body raised by 1, tail stays)
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
    [0, 0, K, T, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],  # feet raised
    [0, 0, K, T, T, 0, K, B, K, 0, 0, T, T, K, 0, 0, 0, 0],
    [0, 0, 0, K, K, 0, 0, K, 0, 0, 0, K, K, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, E, K, 0, 0, K, E, E, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, K, E, E, E, E, E, K, 0, 0, 0, 0, 0, 0, 0],
]

IGNIS_F2 = [  # happy — wide grin, arms up
    [0, 0, A, K, 0, 0, 0, 0, 0, 0, K, A, 0, 0, 0, 0, 0, 0],
    [0, K, A, A, K, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0],
    [0, 0, K, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
    [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
    [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
    [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
    [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
    [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
    [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
    [0, K, B, K, B, B, B, B, B, B, B, K, B, K, 0, 0, 0, 0],  # wide smile
    [0, K, B, B, K, K, B, B, B, K, K, B, B, K, 0, 0, 0, 0],
    [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
    [K, T, B, B, B, B, B, B, B, B, B, B, B, T, K, 0, 0, 0], # arms raised wide
    [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, T, K, 0, 0, 0],
    [0, K, K, 0, 0, 0, K, B, K, 0, 0, 0, K, K, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, K, K, K, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, E, K, 0, 0, K, E, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, K, E, E, E, E, K, 0, 0, 0, 0, 0, 0, 0],
]

# ══════════════════════════════════════════════════════════
#  NÉMO  —  water demon  (deep navy + teal fins)
# ══════════════════════════════════════════════════════════
NEMO_PAL = {
    K:c('#111111'), B:c('#1A3A8C'), L:c('#2E5FCC'), D:c('#0D1F4D'),
    W:c('#FFFFFF'), P:c('#111111'), G:c('#E8F4FF'),
    H:c('#4477DD'), A:c('#00BBDD'), T:c('#0D2560'),
    C:c('#7799EE'), E:c('#00DDFF'), F:c('#88EEFF'),
}

NEMO_F0 = [
    [0, K, A, A, K, 0, 0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0],  # fin horns
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
    [0, K, T, B, B, K, 0, B, B, 0, K, B, T, K, E, K, 0, 0],  # tentacle tail
    [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, K, E, E, K, 0],
    [0, K, K, 0, 0, 0, K, K, K, 0, 0, 0, K, K, K, E, K, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, K, E, K, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, K, 0, 0, 0],
]

NEMO_F1 = [  # bounce
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

# ══════════════════════════════════════════════════════════
#  SYLVA  —  nature demon  (deep forest green + thorn crown)
# ══════════════════════════════════════════════════════════
SYLVA_PAL = {
    K:c('#111111'), B:c('#1B5E20'), L:c('#2E7D32'), D:c('#0D3311'),
    W:c('#FFFFFF'), P:c('#111111'), G:c('#E8FFE8'),
    H:c('#388E3C'), A:c('#795548'), T:c('#0A2E0D'),
    C:c('#81C784'), E:c('#8BC34A'), F:c('#CDDC39'),
}

SYLVA_F0 = [
    [0, 0, A, K, 0, F, K, 0, K, F, 0, K, A, 0, 0, 0, 0, 0],  # thorn crown
    [0, 0, K, A, K, K, A, K, A, K, K, A, K, 0, 0, 0, 0, 0],
    [0, 0, 0, K, K, K, K, K, K, K, K, K, K, 0, 0, 0, 0, 0],
    [0, 0, K, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0, 0],
    [0, K, B, B, H, B, B, B, B, B, H, B, B, K, 0, 0, 0, 0],
    [0, K, B, W, W, W, B, B, B, W, W, W, B, K, 0, 0, 0, 0],
    [0, K, B, W, P, P, B, C, B, W, P, P, B, K, 0, 0, 0, 0],
    [0, K, B, W, G, P, B, B, B, W, G, P, B, K, 0, 0, 0, 0],
    [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
    [0, K, B, B, B, B, K, B, K, B, B, B, B, K, 0, 0, 0, 0],  # fangs
    [0, 0, K, B, B, K, 0, B, 0, K, B, B, K, 0, 0, 0, 0, 0],
    [0, 0, K, B, D, B, B, B, B, B, D, B, K, 0, 0, 0, 0, 0],
    [0, K, B, B, B, B, B, B, B, B, B, B, B, K, 0, 0, 0, 0],
    [0, K, T, B, B, K, 0, B, B, 0, K, B, T, K, 0, 0, 0, 0],
    [K, T, T, K, 0, 0, K, B, K, 0, 0, K, T, T, K, 0, 0, 0],
    [0, K, K, 0, 0, 0, K, K, K, 0, 0, 0, K, K, 0, 0, 0, 0],
    [0, 0, 0, 0, A, K, A, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # vine tail
    [0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]

SYLVA_F1 = [  # bounce
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

# ══════════════════════════════════════════════════════════
#  ZAPP  —  electric demon  (deep amber + lightning)
# ══════════════════════════════════════════════════════════
ZAPP_PAL = {
    K:c('#111111'), B:c('#CC5500'), L:c('#E87000'), D:c('#8B3400'),
    W:c('#FFFFFF'), P:c('#111111'), G:c('#FFFBE8'),
    H:c('#FF8C00'), A:c('#FFD700'), T:c('#6B2A00'),
    C:c('#FFB347'), E:c('#FFE000'), F:c('#FFFFFF'),
}

ZAPP_F0 = [
    [0, K, A, K, 0, K, A, K, 0, K, A, K, 0, 0, 0, 0, 0, 0],  # spiky static
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
    [0, 0, 0, 0, 0, K, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # lightning tail
    [0, 0, 0, 0, K, A, A, K, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]

ZAPP_F1 = [  # bounce
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

# ── generate ─────────────────────────────────────────────
specs = [
    ('ignis', IGNIS_PAL, [IGNIS_F0, IGNIS_F1, IGNIS_F2]),
    ('nemo',  NEMO_PAL,  [NEMO_F0,  NEMO_F1,  NEMO_F2]),
    ('sylva', SYLVA_PAL, [SYLVA_F0, SYLVA_F1, SYLVA_F2]),
    ('zapp',  ZAPP_PAL,  [ZAPP_F0,  ZAPP_F1,  ZAPP_F2]),
]

for name, pal, frames in specs:
    for i, grid in enumerate(frames):
        img = render(grid, pal, scale=4)
        img.save(f"{OUT}/{name}_f{i}.png")
        print(f"saved {name}_f{i}.png")

# preview sheet on dark bg
SCALE = 4
SW, SH = 18*SCALE, 18*SCALE
GAP = 12
sheet = Image.new('RGBA', (3*(SW+GAP)+GAP, 4*(SH+GAP)+GAP), c('#1a1a2e'))

for row, (name, pal, frames) in enumerate(specs):
    for col, frame in enumerate(frames):
        img = render(frame, pal, scale=SCALE)
        x = GAP + col*(SW+GAP)
        y = GAP + row*(SH+GAP)
        sheet.paste(img, (x, y), img)

sheet.save(f"{OUT}/preview.png")
print("preview saved!")
