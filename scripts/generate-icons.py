import os, math
from PIL import Image, ImageDraw

os.makedirs("src-tauri/icons", exist_ok=True)

def render_icon(size: int) -> Image.Image:
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = int(s * 0.06)
    rad = int(s * 0.24)
    draw.rounded_rectangle([pad, pad, s - pad, s - pad], radius=rad, fill=(10, 10, 10, 255), outline=(60, 52, 60, 255), width=max(2, s // 64))
    cx, cy = s / 2, s / 2
    r_outer = s * 0.34
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], outline=(203, 166, 197, 110), width=max(3, s // 48))
    orbit_r = s * 0.19
    node_r = s * 0.088
    angles = [-90, 30, 150]
    colors = [(253, 206, 241, 255), (245, 243, 245, 255), (203, 166, 197, 255)]
    pts = [(cx + orbit_r * math.cos(math.radians(deg)), cy + orbit_r * math.sin(math.radians(deg))) for deg in angles]
    draw.line([pts[0], pts[1], pts[2], pts[0]], fill=(203, 166, 197, 150), width=max(2, s // 56))
    for (px, py), col in zip(pts, colors):
        draw.ellipse([px - node_r, py - node_r, px + node_r, py + node_r], fill=col)
    cr = s * 0.042
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(10, 10, 10, 255), outline=(203, 166, 197, 200), width=max(2, s // 64))
    return img.resize((size, size), Image.Resampling.LANCZOS)

for fname, sz in [("32x32.png", 32), ("128x128.png", 128), ("128x128@2x.png", 256)]:
    render_icon(sz).save(f"src-tauri/icons/{fname}")

render_icon(256).save("src-tauri/icons/icon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("Generated SilentWatch desktop icons.")
