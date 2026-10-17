"""Generate a visual mockup of the Croisio game screens (no browser needed)."""
from PIL import Image, ImageDraw, ImageFont

# ---- palette ----
BG        = (248, 247, 255)
WHITE     = (255, 255, 255)
INK       = (26, 26, 46)
GREY       = (153, 153, 153)
LIGHTGREY = (240, 240, 240)
PURPLE    = (168, 85, 247)
FLAME     = (255, 107, 53)
RED       = (255, 107, 107)
YELLOW    = (255, 217, 61)
GREEN     = (107, 203, 119)

PHONE_W, PHONE_H = 380, 800
GAP = 40

def font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except OSError:
            continue
    return ImageFont.load_default()

def rounded(draw, box, r, fill):
    draw.rounded_rectangle(box, radius=r, fill=fill)

def shadow_card(img, box, r=20, fill=WHITE):
    d = ImageDraw.Draw(img)
    rounded(d, box, r, fill)

def text_center(d, cx, y, txt, fnt, fill):
    w = d.textlength(txt, font=fnt)
    d.text((cx - w / 2, y), txt, font=fnt, fill=fill)

def bar(d, x, y, w, h, pct, color):
    rounded(d, [x, y, x + w, y + h], h // 2, LIGHTGREY)
    fw = int(w * pct)
    if fw > h:
        rounded(d, [x, y, x + fw, y + h], h // 2, color)

# ---------------- Screen 1: Home ----------------
def screen_home():
    img = Image.new("RGB", (PHONE_W, PHONE_H), BG)
    d = ImageDraw.Draw(img)
    d.text((24, 30), "Croisio", font=font(34, True), fill=INK)
    d.text((24, 74), "Ta créature t'attend", font=font(15), fill=GREY)

    # aura + creature
    cx = PHONE_W // 2
    d.ellipse([cx - 90, 150, cx + 90, 330], fill=(255, 107, 53, 30))
    d.ellipse([cx - 90, 150, cx + 90, 330], fill=(255, 233, 220))
    text_center(d, cx, 175, "🦊", font(110), INK)
    text_center(d, cx, 320, "😊", font(34), INK)
    text_center(d, cx, 365, "Ignis", font(24, True), INK)
    # level badge
    rounded(d, [cx - 42, 405, cx + 42, 435], 15, FLAME)
    text_center(d, cx, 410, "Niv. 5", font(14, True), WHITE)

    # stats card
    shadow_card(img, [16, 460, PHONE_W - 16, 620])
    d = ImageDraw.Draw(img)
    stats = [("🍖", "Faim", 0.7, RED), ("⭐", "Bonheur", 0.85, YELLOW),
             ("⚡", "Énergie", 0.6, GREEN)]
    y = 480
    for icon, label, pct, color in stats:
        d.text((30, y), icon, font=font(16), fill=INK)
        d.text((56, y + 1), label, font=font(13), fill=GREY)
        bar(d, 130, y + 4, 180, 9, pct, color)
        d.text((320, y), str(int(pct * 100)), font=font(12), fill=GREY)
        y += 34
    d.line([30, y + 2, PHONE_W - 30, y + 2], fill=LIGHTGREY, width=1)
    d.text((30, y + 12), "XP", font=font(13, True), fill=PURPLE)
    bar(d, 130, y + 16, 180, 9, 0.45, PURPLE)
    d.text((318, y + 12), "45/100", font=font(11), fill=GREY)

    # action buttons
    labels = [("🍖", "Nourrir"), ("🎮", "Jouer"), ("💤", "Dormir")]
    bw = (PHONE_W - 32 - 20) // 3
    bx = 16
    for icon, label in labels:
        shadow_card(img, [bx, 650, bx + bw, 730], r=16)
        d = ImageDraw.Draw(img)
        text_center(d, bx + bw / 2, 665, icon, font(26), INK)
        text_center(d, bx + bw / 2, 702, label, font(12, True), INK)
        bx += bw + 10

    tab_bar(img, active=0)
    return img

# ---------------- Screen 2: Crossings ----------------
def screen_crossings():
    img = Image.new("RGB", (PHONE_W, PHONE_H), BG)
    d = ImageDraw.Draw(img)
    d.text((24, 30), "Croisements", font=font(34, True), fill=INK)
    d.text((24, 74), "3 rencontres", font=font(15), fill=GREY)

    cards = [
        ("💧", "Léa", "Aqua • 🤝 Amical", "il y a 12min", "+20 XP", (78, 205, 196)),
        ("⚡", "Tom", "Volt • ⚔️ Combat", "il y a 2h", "+35 XP", (255, 217, 61)),
        ("🌿", "Sara", "Fern • 🎁 Cadeau", "il y a 5h", "+15 XP", (69, 182, 73)),
    ]
    y = 115
    for emoji, name, sub, time, xp, color in cards:
        shadow_card(img, [16, y, PHONE_W - 16, y + 86], r=16)
        d = ImageDraw.Draw(img)
        tint = tuple(int(c + (255 - c) * 0.8) for c in color)
        d.ellipse([32, y + 17, 84, y + 69], fill=tint)
        text_center(d, 58, y + 27, emoji, font(28), INK)
        d.text((100, y + 18), name, font=font(15, True), fill=INK)
        d.text((100, y + 40), sub, font=font(12), fill=GREY)
        tw = d.textlength(time, font=font(12))
        d.text((PHONE_W - 32 - tw, y + 18), time, font=font(12), fill=GREY)
        xw = d.textlength(xp, font=font(13, True))
        d.text((PHONE_W - 32 - xw, y + 44), xp, font=font(13, True), fill=PURPLE)
        y += 96

    tab_bar(img, active=1)
    return img

# ---------------- Screen 3: Onboarding ----------------
def screen_onboarding():
    img = Image.new("RGB", (PHONE_W, PHONE_H), BG)
    d = ImageDraw.Draw(img)
    text_center(d, PHONE_W / 2, 70, "Croisio", font(40, True), INK)
    text_center(d, PHONE_W / 2, 120, "Élève ta créature, croise le monde.", font(14), GREY)
    d.text((28, 190), "Choisis ta créature", font=font(22, True), fill=INK)

    creatures = [
        ("🔥", "Flamme", "Ardent et courageux", FLAME, True),
        ("💧", "Aqua", "Calme et mystérieux", (78, 205, 196), False),
        ("🌿", "Nature", "Sage et endurant", (69, 182, 73), False),
        ("⚡", "Étincelle", "Rapide et espiègle", YELLOW, False),
    ]
    cw, ch = 158, 150
    positions = [(20, 240), (202, 240), (20, 410), (202, 410)]
    for (emoji, label, desc, color, sel), (x, y) in zip(creatures, positions):
        shadow_card(img, [x, y, x + cw, y + ch], r=16)
        d = ImageDraw.Draw(img)
        if sel:
            d.rounded_rectangle([x, y, x + cw, y + ch], radius=16, outline=color, width=3)
        text_center(d, x + cw / 2, y + 22, emoji, font(44), INK)
        text_center(d, x + cw / 2, y + 85, label, font(16, True), color if sel else INK)
        text_center(d, x + cw / 2, y + 110, desc, font(10), GREY)

    rounded(d, [24, 600, PHONE_W - 24, 658], 16, INK)
    text_center(d, PHONE_W / 2, 617, "Commencer !", font(17, True), WHITE)
    return img

def tab_bar(img, active=0):
    d = ImageDraw.Draw(img)
    rounded(d, [0, PHONE_H - 78, PHONE_W, PHONE_H], 0, WHITE)
    d.line([0, PHONE_H - 78, PHONE_W, PHONE_H - 78], fill=LIGHTGREY, width=1)
    tabs = [("🏠", "Accueil"), ("🤝", "Croisements"), ("👤", "Profil")]
    tw = PHONE_W // 3
    for i, (icon, label) in enumerate(tabs):
        cx = tw * i + tw / 2
        text_center(d, cx, PHONE_H - 66, icon, font(22), INK)
        col = INK if i == active else (190, 190, 190)
        text_center(d, cx, PHONE_H - 38, label, font(11, True if i == active else False), col)

# ---------------- compose ----------------
def frame(screen, title):
    canvas = Image.new("RGB", (PHONE_W + 24, PHONE_H + 70), BG)
    d = ImageDraw.Draw(canvas)
    text_center(d, canvas.width / 2, 18, title, font(18, True), INK)
    rounded(d, [12, 55, 12 + PHONE_W, 55 + PHONE_H], 36, INK)
    inner = screen.copy()
    mask = Image.new("L", inner.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, PHONE_W, PHONE_H], radius=30, fill=255)
    canvas.paste(inner, (12, 55), mask)
    return canvas

screens = [
    frame(screen_onboarding(), "1. Choix de la créature"),
    frame(screen_home(), "2. Écran principal"),
    frame(screen_crossings(), "3. Croisements"),
]

total_w = sum(s.width for s in screens) + GAP * (len(screens) + 1)
total_h = screens[0].height + GAP * 2
out = Image.new("RGB", (total_w, total_h), (238, 236, 250))
x = GAP
for s in screens:
    out.paste(s, (x, GAP))
    x += s.width + GAP

out.save("/home/user/spyke-web/game/scripts/croisio_preview.png")
print("saved")
