// Renders a video page frame by frame and encodes it with ffmpeg.
//
//   pnpm video escorpio                 # → marketing/tiktok/out/escorpio.mp4
//   pnpm video escorpio --stills=0,3.2  # a few frames as PNG, to check a design
//
// A video with a voice-over (videos/<name>.voice.json) gets it fitted first
// (voice.mjs): the page learns when each word is said, the MP4 gets the voice.
//
// Each page in videos/ defines window.renderFrame(t) and window.ready; every
// frame is drawn at its exact time, so the video is smooth however slow the
// drawing is. Needs ffmpeg, and a Chromium: the one Playwright installs, or
// CHROMIUM_PATH.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { fitVoice } from "./voice.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const name = process.argv[2] ?? "escorpio";
const args = Object.fromEntries(
    process.argv.slice(3).map((arg) => arg.replace(/^--/, "").split("=")),
);
const fps = Number(args.fps ?? 30);
const stills = args.stills?.split(",").map(Number);

/** Where a page's URL is served from: its own assets, or the app's public/. */
function file(path) {
    const candidates = [
        resolve(here, "videos", path),
        resolve(here, path),
        resolve(root, "public", path),
    ];
    return candidates.find((p) => existsSync(p));
}

const TYPES = {
    html: "text/html",
    js: "text/javascript",
    woff2: "font/woff2",
    ttf: "font/ttf",
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
};
const browser = await chromium.launch({
    executablePath:
        process.env.CHROMIUM_PATH ??
        (existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
            ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
            : undefined),
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.route("http://video.local/**", (route) => {
    const path = decodeURIComponent(
        new URL(route.request().url()).pathname.slice(1),
    );
    const found = file(path);
    if (!found) return route.fulfill({ status: 404 });
    route.fulfill({
        body: readFileSync(found),
        contentType: TYPES[path.split(".").pop()] ?? "application/octet-stream",
    });
});
const voice = await fitVoice(name, { audio: !stills });
if (voice?.estimated)
    console.log(`${name}: no take yet, timing estimated from the text`);
if (voice)
    await page.addInitScript((timing) => {
        window.VOICE = timing;
    }, voice.timing);
await page.goto(`http://video.local/${name}.html`);
await page.evaluate(() => window.ready);
// How long the video runs: the page says (window.DURATION), or --duration.
const duration = Number(
    args.duration ?? (await page.evaluate(() => window.DURATION)) ?? 15,
);

const out = resolve(here, "out");
mkdirSync(out, { recursive: true });
const frame = async (t) => {
    const data = await page.evaluate((t) => {
        window.renderFrame(t);
        return document.getElementById("c").toDataURL("image/png");
    }, t);
    return Buffer.from(data.split(",")[1], "base64");
};

if (stills) {
    for (const t of stills)
        writeFileSync(resolve(out, `${name}-${t}s.png`), await frame(t));
    console.log("stills:", stills.join(", "));
} else {
    const target = resolve(out, `${name}.mp4`);
    // H.264 high, yuv420p, the voice or a silent track (some apps want one),
    // fast start.
    const sound = voice?.file
        ? ["-i", voice.file, "-af", "apad"]
        : [
              ...["-f", "lavfi", "-i"],
              "anullsrc=channel_layout=stereo:sample_rate=44100",
          ];
    const ff = spawn(
        "ffmpeg",
        [
            ...["-y", "-loglevel", "error"],
            ...["-f", "image2pipe", "-framerate", String(fps), "-i", "-"],
            ...sound,
            ...["-shortest", "-c:v", "libx264", "-profile:v", "high"],
            ...["-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p"],
            ...["-r", String(fps), "-c:a", "aac", "-b:a", "160k", "-ac", "2"],
            ...["-movflags", "+faststart", target],
        ],
        { stdio: ["pipe", "inherit", "inherit"] },
    );
    const frames = Math.round(duration * fps);
    const started = Date.now();
    for (let i = 0; i < frames; i++) {
        const png = await frame(i / fps);
        if (!ff.stdin.write(png))
            await new Promise((ok) => ff.stdin.once("drain", ok));
        if (i % 60 === 0) console.log(`frame ${i}/${frames}`);
    }
    ff.stdin.end();
    await new Promise((ok) => ff.on("close", ok));
    console.log(
        `→ ${target} (${((Date.now() - started) / 1000).toFixed(0)} s)`,
    );
}
await browser.close();
