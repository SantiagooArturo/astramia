# TikTok videos

Short vertical videos (1080×1920) drawn with code: each page in `videos/`
draws one frame for a given time, and `render.mjs` steps through the frames
and encodes them with ffmpeg. No AI voice and no stock footage: the sky,
the planets (the app's own sprites) and the words are ours.

```sh
pnpm video escorpio                      # → marketing/tiktok/out/escorpio.mp4
pnpm video escorpio --stills=0,3.2,10.9  # a few PNG frames, to check a design
```

Needs ffmpeg and a Chromium (Playwright's, or `CHROMIUM_PATH`).

Format: split screen. Top, the hook and the words over the sky, readable
with the sound off; bottom, a star hopping planet to planet that keeps the
eye moving. The first frame already says the whole hook (it's the cover),
and the last one runs back into the first, so the video loops.

Videos are silent: whoever posts adds a sound from TikTok's Commercial
Music Library (business accounts and ads can't use the rest).
