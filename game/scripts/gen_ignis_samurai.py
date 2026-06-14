"""
Ignis Samourai — pixel art sprites for Croisio.
3 stages × 3 animation frames = 9 PNGs.
Stage 1 (lv1-9)  : baby lizard with kabuto helmet
Stage 2 (lv10-19): teen with kabuto + do (chest armor)
Stage 3 (lv20+)  : full samurai, fire on helmet, sword, war stance
"""
from PIL import Image, ImageDraw
import os

OUT   = "/home/user/spyke-web/game/assets/sprites"
SC    = 5     # each virtual pixel = 5×5 real pixels
VSZ   = 20    # virtual canvas 20×20
PX    = VSZ * SC  # 100×100 output

# ── palette ──────────────────────────────────────────────
BD  = (190, 25, 10, 255)   # body dark red
BM  = (218, 55, 18, 255)   # body mid red
BL  = (245, 90, 35, 255)   # body highlight
OG  = (248, 142, 12, 255)  # orange belly
OL  = (255, 180, 60, 255)  # light orange belly
SP  = (205, 165, 0, 255)   # gold spots
GD  = (255, 210, 0, 255)   # gold trim
GD2 = (185, 148, 0, 255)   # dark gold
BK  = (18, 18, 18, 255)    # black armor
DG  = (48, 38, 22, 255)    # dark brown armor
AG  = (68, 58, 35, 255)    # armor highlight
EE  = (6, 6, 6, 255)       # eye pupil
EW  = (252, 242, 195, 255) # eye sclera / whites
FL  = (255, 62, 0, 255)    # flame hot
FM  = (255, 155, 0, 255)   # flame mid
FT  = (255, 220, 50, 255)  # flame tip
SL  = (205, 218, 228, 255) # blade silver
SH  = (140, 155, 165, 255) # blade shadow
T   = (0, 0, 0, 0)         # transparent

os.makedirs(OUT, exist_ok=True)


# ── drawing helpers ───────────────────────────────────────
def canvas():
    return Image.new("RGBA", (PX, PX), T)

def p(n):
    return int(n * SC)

def r(d, x, y, w, h, c):
    d.rectangle([p(x), p(y), p(x+w)-1, p(y+h)-1], fill=c)

def e(d, x, y, w, h, c):
    d.ellipse([p(x), p(y), p(x+w)-1, p(y+h)-1], fill=c)

def dot(d, x, y, c, sz=1):
    r(d, x, y, sz, sz, c)

def tri(d, pts, c):
    d.polygon([(p(x), p(y)) for x, y in pts], fill=c)


# ── STAGE 1 — Baby with kabuto ────────────────────────────
def stage1(dy=0):
    img = canvas()
    d = ImageDraw.Draw(img)

    # tail (behind body, left)
    tri(d, [(1, 15+dy), (4, 13+dy), (5, 15+dy), (2, 17+dy)], BD)

    # body
    e(d, 5, 11+dy, 10, 7, BM)
    # belly
    e(d, 7, 12+dy,  6, 5, OG)
    e(d, 8, 13+dy,  4, 3, OL)
    # spots
    dot(d,  6, 13+dy, SP)
    dot(d, 13, 13+dy, SP)
    dot(d,  8, 15+dy, SP)

    # head
    e(d, 6, 7+dy, 8, 6, BM)
    # snout
    e(d, 8, 10+dy, 4, 2, BD)

    # kabuto (helmet) – black shell
    e(d, 5, 3+dy, 10, 6, BK)
    # gold rim line
    r(d, 5, 7+dy, 10, 1, GD2)
    # kuwagata (golden v-horn pair)
    tri(d, [(9, 3+dy), (9, 0+dy), (10, 0+dy), (10, 3+dy)], GD)
    tri(d, [(10,3+dy), (11, 0+dy),(12, 0+dy), (11, 3+dy)], GD)

    # eyes
    dot(d,  8,  9+dy, EW)
    dot(d, 11,  9+dy, EW)
    dot(d,  8,  9+dy, EE)
    dot(d, 11,  9+dy, EE)

    # arms
    e(d, 4, 13+dy, 2, 2, BD)
    e(d,14, 13+dy, 2, 2, BD)

    # legs
    r(d, 7, 17+dy, 2, 2, BD)
    r(d,11, 17+dy, 2, 2, BD)

    return img


# ── STAGE 2 — Teen with armor ────────────────────────────
def stage2(dy=0):
    img = canvas()
    d = ImageDraw.Draw(img)

    # tail
    tri(d, [(1, 15+dy), (5, 12+dy), (6, 16+dy), (2, 17+dy)], BD)

    # body (bigger)
    e(d, 4, 11+dy, 12, 8, BM)
    # belly
    e(d, 6, 12+dy,  8, 6, OG)
    e(d, 7, 13+dy,  6, 4, OL)
    # spots
    dot(d,  5, 14+dy, SP)
    dot(d, 14, 13+dy, SP)
    dot(d,  7, 16+dy, SP)
    dot(d, 12, 16+dy, SP)

    # head (slightly bigger)
    e(d, 6, 6+dy, 9, 7, BM)
    e(d, 8, 10+dy, 5, 3, BD)  # snout

    # kabuto – bigger, more elaborate
    e(d, 5, 2+dy, 11, 7, BK)
    # side flaps (fukigaeshi)
    e(d, 3, 5+dy, 3, 3, BK)
    e(d,14, 5+dy, 3, 3, BK)
    # gold accents on helmet
    r(d, 5, 7+dy, 11, 1, GD)
    dot(d, 6, 4+dy, GD2)
    dot(d,13, 4+dy, GD2)
    # kuwagata horns
    tri(d, [(9, 2+dy), (8, 0+dy), (9, 0+dy), (10, 2+dy)], GD)
    tri(d, [(10,2+dy), (11, 0+dy),(12, 0+dy), (11, 2+dy)], GD)

    # do (chest plate)
    r(d, 5, 13+dy, 10, 3, BK)
    r(d, 6, 13+dy,  8, 2, DG)
    dot(d, 9, 14+dy, GD, 2)   # chest mon (family crest)

    # eyes (fiercer — thinner slant)
    dot(d,  8,  9+dy, EW)
    dot(d, 12,  9+dy, EW)
    dot(d,  9,  9+dy, EE)
    dot(d, 13,  9+dy, EE)

    # arms
    e(d, 3, 13+dy, 2, 3, BD)
    e(d,15, 13+dy, 2, 3, BD)

    # legs
    r(d, 6, 18+dy, 3, 2, BD)
    r(d,11, 18+dy, 3, 2, BD)

    return img


# ── STAGE 3 — Full samurai, fire, sword ──────────────────
def stage3(dy=0):
    img = canvas()
    d = ImageDraw.Draw(img)

    # tail (bigger, swept back)
    tri(d, [(0, 14+dy), (5, 11+dy), (6, 15+dy), (1, 17+dy)], BD)

    # body
    e(d, 4, 10+dy, 12, 9, BM)
    # belly
    e(d, 6, 11+dy,  8, 7, OG)
    e(d, 7, 12+dy,  6, 5, OL)
    # spots
    dot(d,  5, 12+dy, SP)
    dot(d, 14, 12+dy, SP)
    dot(d,  6, 15+dy, SP)
    dot(d, 13, 16+dy, SP)

    # head
    e(d, 5, 5+dy, 10, 7, BM)
    e(d, 7,  9+dy, 6, 3, BD)  # snout

    # full kabuto with mengu (face guard)
    e(d, 4, 1+dy, 12, 7, BK)
    # side flaps
    e(d, 2, 4+dy, 4, 4, BK)
    e(d,14, 4+dy, 4, 4, BK)
    # gold trim
    r(d, 4, 7+dy, 12, 1, GD)
    r(d, 2, 6+dy,  2, 1, GD2)
    r(d,16, 6+dy,  2, 1, GD2)
    # fire on helmet crest (instead of horn)
    tri(d, [(10,1+dy), (9,-2+dy), (10,-3+dy), (11,-2+dy), (12,1+dy)], FL)
    tri(d, [(10,0+dy), (9,-1+dy), (10,-2+dy), (11,-1+dy), (12,0+dy)], FM)
    dot(d, 10, -1+dy, FT)

    # full do + kusazuri (chest + skirt armor)
    r(d, 4, 13+dy, 12, 4, BK)   # chest plate
    r(d, 5, 13+dy, 10, 3, DG)   # chest inner
    dot(d, 9, 14+dy, GD, 2)     # crest
    # kusazuri (armor skirt strips)
    for sx in [4, 7, 10, 13]:
        r(d, sx, 17+dy, 3, 2, BK)
        r(d, sx+1, 17+dy, 1, 2, DG)

    # eyes (narrowed battle look)
    r(d,  8,  8+dy, 2, 1, EW)
    r(d, 11,  8+dy, 2, 1, EW)
    dot(d,  9,  8+dy, EE)
    dot(d, 12,  8+dy, EE)

    # left arm (holding sword)
    r(d, 3, 13+dy, 2, 4, BD)
    r(d, 2, 17+dy, 1, 1, BD)   # hand
    # katana (sword) – diagonal line
    tri(d, [
        (3, 18+dy), (2, 14+dy), (3, 14+dy), (4, 18+dy)
    ], SH)
    tri(d, [
        (3, 17+dy), (2, 13+dy), (3, 13+dy), (4, 17+dy)
    ], SL)
    dot(d, 2, 13+dy, GD)   # tsuba (guard)

    # right arm
    r(d,15, 13+dy, 2, 3, BD)

    # legs
    r(d, 6, 18+dy, 3, 2, BD)
    r(d,11, 18+dy, 3, 2, BD)

    # shoulder fire (left pauldron flame)
    dot(d, 4, 12+dy, FM)
    dot(d, 3, 11+dy, FL)
    dot(d, 4, 11+dy, FM)
    dot(d, 4, 10+dy, FT)

    return img


# ── generate frames ───────────────────────────────────────
STAGES = [
    (stage1, "ignis",    [0, -1, -2]),
    (stage2, "ignis_e2", [0, -1, -2]),
    (stage3, "ignis_e3", [0, -1, -2]),
]

print("Génération des sprites Ignis Samouraï…")
for fn, prefix, offsets in STAGES:
    for fi, dy in enumerate(offsets):
        img = fn(dy)
        name = f"{prefix}_f{fi}.png"
        img.save(os.path.join(OUT, name))
        print(f"  ✓ {name}")

print("\nDone — recharge Expo pour voir les nouveaux sprites ignis !")
