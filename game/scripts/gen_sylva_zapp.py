#!/usr/bin/env python3
"""Generate sylva (red panda) and zapp (electric deer) sprites from source images."""
from PIL import Image
from collections import deque
import os

SPRITES_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sprites')

SOURCES = {
    'sylva': {
        '':    '9B470F66-3CF9-41D8-9965-E7EBB3F50C68.png',
        '_e2': '75B67F2A-4218-4FCF-8BAD-E1E29C8311BF.png',
        '_e3': '635BDB29-8295-443E-BCF3-14B993F20557.png',
    },
    'zapp': {
        '':    '883F1EC7-AEFA-412B-8E0C-72131D9D4F14.png',
        '_e2': 'BA330AFE-CBF5-4C7F-9652-6C80298D5C4A.png',
        '_e3': '38BB9D19-CD12-40E0-A50B-856CFF7FD333.png',
    },
}

STAGE_HEIGHTS = {'': 90, '_e2': 115, '_e3': 142}
CANVAS = 160
FRAME_OFFSETS = [0, -5, -9]


def bfs_remove_bg(img: Image.Image, threshold: int = 200) -> Image.Image:
    """BFS flood-fill from all borders to remove white/light background."""
    img = img.convert('RGBA')
    w, h = img.size
    pixels = img.load()
    visited = [[False] * h for _ in range(w)]
    q = deque()

    def is_bg(x, y):
        r, g, b, a = pixels[x, y]
        return r >= threshold and g >= threshold and b >= threshold

    for x in range(w):
        for y in [0, h - 1]:
            if not visited[x][y] and is_bg(x, y):
                visited[x][y] = True
                q.append((x, y))
    for y in range(h):
        for x in [0, w - 1]:
            if not visited[x][y] and is_bg(x, y):
                visited[x][y] = True
                q.append((x, y))

    while q:
        cx, cy = q.popleft()
        pixels[cx, cy] = (0, 0, 0, 0)
        for nx, ny in [(cx-1, cy), (cx+1, cy), (cx, cy-1), (cx, cy+1)]:
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny] and is_bg(nx, ny):
                visited[nx][ny] = True
                q.append((nx, ny))

    return img


def has_white_bg(img: Image.Image) -> bool:
    """Check if image has a white (non-transparent) background."""
    if img.mode != 'RGBA':
        return True
    w, h = img.size
    corners = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
    for x, y in corners:
        r, g, b, a = img.convert('RGBA').getpixel((x, y))
        if a > 200 and r > 200 and g > 200 and b > 200:
            return True
    return False


def autocrop(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img


def make_frames(src_path: str, stage: str, creature: str):
    img = Image.open(src_path).convert('RGBA')

    # Remove white background if present
    if has_white_bg(img):
        img = bfs_remove_bg(img, threshold=200)
        img = bfs_remove_bg(img, threshold=160)  # second pass for stubborn near-white

    img = autocrop(img)

    # Scale to target height
    target_h = STAGE_HEIGHTS[stage]
    w, h = img.size
    scale = target_h / h
    new_w = max(1, int(w * scale))
    img = img.resize((new_w, target_h), Image.LANCZOS)

    for frame_idx, y_offset in enumerate(FRAME_OFFSETS):
        canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
        paste_x = (CANVAS - new_w) // 2
        paste_y = (CANVAS - target_h) // 2 + y_offset
        canvas.paste(img, (paste_x, paste_y), img)

        fname = f'{creature}{stage}_f{frame_idx}.png'
        out_path = os.path.join(SPRITES_DIR, fname)
        canvas.save(out_path)
        print(f'  Saved {fname}')


def main():
    for creature, stages in SOURCES.items():
        print(f'\n=== {creature} ===')
        for stage, uuid_fname in stages.items():
            src = os.path.join(SPRITES_DIR, uuid_fname)
            if not os.path.exists(src):
                print(f'  MISSING: {uuid_fname}')
                continue
            print(f'  Processing stage "{stage or "base"}" ...')
            make_frames(src, stage, creature)

    print('\nDone!')


if __name__ == '__main__':
    main()
