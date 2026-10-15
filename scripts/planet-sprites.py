"""
Renders the small, lit spheres the story's solar system draws from afar
(public/planets/sprites/*.webp), so a planet seen from a distance still
looks like itself instead of a flat dot.

Each sprite is lit from its right (+x): the scene rotates it so that side
faces the Sun. The sphere fills SPHERE of the image; the rest is room for
an atmosphere or the Sun's rim.

    python3 scripts/planet-sprites.py path/to/earth.jpg

Maps (public domain): Mars and the Moon from public/planets (NASA). The
Earth is NASA's Blue Marble, land_ocean_ice_cloud_2048.jpg from
https://visibleearth.nasa.gov/images/57735 (not kept in the repo). Venus's
clouds and the Sun's surface are drawn here, as the 3D globes draw them.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

SIZE = 256
SPHERE = 0.86
SUPERSAMPLE = 2
OUT = Path("public/planets/sprites")
RNG = np.random.default_rng(7)


def fbm(width, height, octaves, base, stretch=1.0):
    """Value noise in 0..1, summed over octaves; `stretch` makes bands."""
    total = np.zeros((height, width))
    amplitude, norm = 1.0, 0.0
    for octave in range(octaves):
        cells_x = max(2, int(base * 2**octave))
        cells_y = max(2, int(base * 2**octave / stretch))
        grid = RNG.random((cells_y, cells_x))
        layer = Image.fromarray((grid * 255).astype(np.uint8)).resize(
            (width, height), Image.BICUBIC
        )
        total += amplitude * np.asarray(layer, dtype=float) / 255
        norm += amplitude
        amplitude *= 0.5
    return total / norm


def sphere_grid(n):
    """Pixel centers in sphere units (y up), with the visible normal."""
    axis = ((np.arange(n) + 0.5) / n * 2 - 1) / SPHERE
    x, y = np.meshgrid(axis, -axis)
    d = x * x + y * y
    z = np.sqrt(np.clip(1 - d, 0, 1))
    return x, y, z, np.sqrt(d)


def sample(texture, x, y, z, tilt, lon0):
    """Equirectangular map onto the sphere, its axis tilted toward us."""
    c, s = np.cos(tilt), np.sin(tilt)
    ny, nz = y * c - z * s, y * s + z * c
    lon = np.arctan2(x, nz) + lon0
    lat = np.arcsin(np.clip(ny, -1, 1))
    h, w, _ = texture.shape
    u = ((lon / (2 * np.pi) + 0.5) % 1) * (w - 1)
    v = (0.5 - lat / np.pi) * (h - 1)
    return texture[v.astype(int), u.astype(int)]


def smoothstep(a, b, t):
    t = np.clip((t - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def planet(texture, *, tilt=0.0, lon0=0.0, tint=(1, 1, 1), ambient=0.04,
           limb=0.25, rim=None):
    n = SIZE * SUPERSAMPLE
    x, y, z, r = sphere_grid(n)
    albedo = sample(texture, x, y, z, tilt, lon0) / 255 * np.array(tint)
    light = np.array([1.0, 0.18, 0.42])
    light /= np.linalg.norm(light)
    facing = x * light[0] + y * light[1] + z * light[2]
    # A soft terminator, the way a real limb of day fades into night.
    shade = ambient + (1 - ambient) * smoothstep(-0.12, 0.55, facing)
    darken = (1 - limb) + limb * np.sqrt(z)
    rgb = np.clip(albedo * (shade * darken)[..., None], 0, 1)
    alpha = smoothstep(1.0, 1.0 - 2.5 / (n * SPHERE / 2), r)

    if rim is not None:
        # Atmosphere: a thin glow past the edge, on the lit side.
        outside = np.clip(r - 1, 0, None)
        day = smoothstep(-0.4, 0.6, x / np.maximum(r, 1e-6))
        glow = np.exp(-outside * 38) * (r >= 1) * day * 0.85
        inner = smoothstep(0.82, 1.0, r) * (r < 1) * day * 0.35
        rgb = rgb + np.array(rim) * (inner)[..., None]
        rgb = np.where((r >= 1)[..., None], np.array(rim), rgb)
        alpha = np.maximum(alpha, glow)
    return finish(np.clip(rgb, 0, 1), alpha)


def sun():
    n = SIZE * SUPERSAMPLE
    x, y, z, r = sphere_grid(n)
    cells = fbm(1024, 512, 6, 56)
    texture = (np.stack([cells] * 3, axis=-1) * 255).astype(np.uint8)
    heat = sample(texture, x, y, z, 0.1, 0.0)[..., 0] / 255
    heat = 0.55 + 0.45 * smoothstep(0.25, 0.8, heat)
    # Hotter toward the middle: the limb is cooler and redder.
    heat *= 0.62 + 0.38 * z**0.5
    ramp = np.stack([
        np.clip(0.75 + heat * 0.6, 0, 1),
        np.clip(0.18 + heat * 0.85, 0, 1),
        np.clip(-0.35 + heat * 0.75, 0, 1),
    ], axis=-1)
    alpha = smoothstep(1.0, 1.0 - 2.5 / (n * SPHERE / 2), r)
    # Its rim: ragged flames just past the edge.
    angle = np.arctan2(y, x)
    flames = fbm(512, 8, 4, 12)[4]
    ragged = flames[((angle / (2 * np.pi) + 0.5) * 511).astype(int)]
    outside = np.clip(r - 1, 0, None)
    corona = np.exp(-outside * (26 - 14 * ragged)) * (r >= 1) * 0.9
    rgb = np.where((r >= 1)[..., None], np.array([1.0, 0.55, 0.15]), ramp)
    return finish(rgb, np.maximum(alpha, corona))


def venus_clouds():
    """Sulfuric-acid clouds: cream bands, faint darker streaks."""
    bands = fbm(1024, 512, 5, 3, stretch=4)
    detail = fbm(1024, 512, 5, 10, stretch=2.5)
    t = 0.6 * bands + 0.4 * detail
    light = np.array([0.98, 0.93, 0.8])
    dark = np.array([0.72, 0.56, 0.34])
    rgb = dark + (light - dark) * smoothstep(0.38, 0.68, t)[..., None]
    return (rgb * 255).astype(np.uint8)


def finish(rgb, alpha):
    rgba = np.dstack([rgb, alpha])
    image = Image.fromarray((rgba * 255).astype(np.uint8), "RGBA")
    return image.resize((SIZE, SIZE), Image.LANCZOS)


def load(path):
    return np.asarray(Image.open(path).convert("RGB"))


def main(earth_map):
    OUT.mkdir(parents=True, exist_ok=True)
    sprites = {
        "sol": sun(),
        "venus": planet(venus_clouds(), tilt=0.05, limb=0.45,
                        rim=(1.0, 0.9, 0.7)),
        "tierra": planet(load(earth_map), tilt=-0.25, lon0=-1.95,
                         tint=(1.1, 1.1, 1.15), limb=0.3,
                         rim=(0.45, 0.7, 1.0)),
        "marte": planet(load("public/planets/mars.jpg"), tilt=0.42,
                        tint=(1.18, 0.9, 0.74), limb=0.2,
                        rim=(1.0, 0.6, 0.45)),
        "luna": planet(load("public/planets/moon.jpg"), tint=(1.6, 1.58, 1.52),
                       ambient=0.03, limb=0.1),
    }
    for name, image in sprites.items():
        target = OUT / f"{name}.webp"
        image.save(target, "WEBP", quality=82, method=6)
        print(f"{target} {target.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1])
