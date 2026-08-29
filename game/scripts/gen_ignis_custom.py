"""
Import custom ignis sprites and generate animation frames from them.
Usage:
  1. Place the 3 source images in game/assets/sprites/:
       ignis_custom_s1.png  (stage 1: baby with helmet)
       ignis_custom_s2.png  (stage 2: armored)
       ignis_custom_s3.png  (stage 3: full samurai + fire)
  2. Run: python scripts/gen_ignis_custom.py
"""
from PIL import Image
import os

OUT = "/home/user/spyke-web/game/assets/sprites"
TARGET_SIZE = 128  # px — big enough for crisp display on Retina/mobile

STAGES = [
    ("ignis_custom_s1.png", "ignis"),
    ("ignis_custom_s2.png", "ignis_e2"),
    ("ignis_custom_s3.png", "ignis_e3"),
]

# Vertical offsets for the 3 animation frames (floating bounce)
FRAME_OFFSETS = [0, -4, -7]

def make_frames(src_path: str, prefix: str):
    img = Image.open(src_path).convert("RGBA")

    # Resize keeping pixel art crispness
    img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.NEAREST)

    for fi, dy in enumerate(FRAME_OFFSETS):
        canvas = Image.new("RGBA", (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
        canvas.paste(img, (0, dy))
        out_path = os.path.join(OUT, f"{prefix}_f{fi}.png")
        canvas.save(out_path)
        print(f"  saved {out_path}")

def main():
    missing = []
    for src_name, prefix in STAGES:
        src = os.path.join(OUT, src_name)
        if not os.path.exists(src):
            missing.append(src_name)

    if missing:
        print("ERREUR — fichiers manquants dans game/assets/sprites/ :")
        for m in missing:
            print(f"  {m}")
        return

    print(f"Génération des frames ignis custom ({TARGET_SIZE}px)...")
    for src_name, prefix in STAGES:
        src = os.path.join(OUT, src_name)
        print(f"\n[{prefix}] <- {src_name}")
        make_frames(src, prefix)

    print("\nDone! Recharge l'app Expo.")

if __name__ == "__main__":
    main()
