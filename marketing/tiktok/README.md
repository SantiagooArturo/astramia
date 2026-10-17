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

Voice-over: drop the take (ElevenLabs, say) in `videos/<name>.voice.mp3`
and list its phrases, in order, in `videos/<name>.voice.json`: one per
stretch of speech between pauses, with the `id` the page uses. The render
shortens the pauses, speeds up only the phrases said too slowly (to about
6.8 syllables a second, never more than ×1.35, the pitch untouched), and
lands each word on screen as it's said. `until` cuts a phrase short
(seconds into the take), `drop` leaves one out: Escorpio's take reads the
reading card aloud, which sounds odd cut off, so the card stays on screen
and out of the voice.
`node marketing/tiktok/voice.mjs <name>` prints the fit.

Without a voice the video is silent. Music, if any, comes from TikTok's
Commercial Music Library (business accounts and ads can't use the rest),
under the voice.
