// Fits a voice-over (an ElevenLabs take, say) to a video: shortens the
// pauses, speeds up only the phrases said too slowly (the pitch stays), and
// works out when each word is said, so the page shows it right then.
//
//   node marketing/tiktok/voice.mjs escorpio   # prints the fitted phrases
//
// videos/<name>.voice.json lists the phrases in the take, in order, one per
// stretch of speech between pauses: { id, text, pause?, maxTempo?, until?,
// drop? }. `until` cuts a phrase short (seconds in the take), `drop` leaves it
// out. render.mjs calls fitVoice() and hands the timing to the page. Before
// there's a take (no `source`, or no such file), the timing is estimated from
// the text at the target pace, for a silent preview.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function ffmpeg(args) {
    return new Promise((ok, fail) => {
        const ff = spawn("ffmpeg", ["-hide_banner", ...args]);
        let log = "";
        ff.stderr.on("data", (d) => {
            log += d;
        });
        ff.on("close", (code) =>
            code === 0
                ? ok(log)
                : fail(new Error(`ffmpeg: ${log.slice(-800)}`)),
        );
    });
}

/** Spanish syllables, near enough: one per strong or accented vowel. */
function syllables(text) {
    const groups = text.toLowerCase().match(/[aeiouáéíóúü]+/g) ?? [];
    return Math.max(
        1,
        groups.reduce(
            (n, g) => n + Math.max(1, (g.match(/[aeoáéíóú]/g) ?? []).length),
            0,
        ),
    );
}

/** The stretches of speech in a take: what lies between its pauses. */
async function speech(file, noise, minPause) {
    const log = await ffmpeg([
        ...["-i", file, "-af", `silencedetect=noise=${noise}dB:d=${minPause}`],
        ...["-f", "null", "-"],
    ]);
    const total = Number(
        /Duration: (\d+):(\d+):([\d.]+)/
            .exec(log)
            .slice(1)
            .reduce((s, x) => s * 60 + Number(x), 0),
    );
    const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) =>
        Number(m[1]),
    );
    const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) =>
        Number(m[1]),
    );
    const stretches = [];
    let from = 0;
    starts.forEach((start, i) => {
        if (start > from) stretches.push({ start: from, end: start });
        from = ends[i] ?? total;
    });
    if (from < total - 0.05) stretches.push({ start: from, end: total });
    return stretches;
}

/**
 * The voice fitted to `name`'s phrases: when each phrase and word is said,
 * and, with `audio`, the fitted take written to out/. Null if the video has
 * no voice.
 */
export async function fitVoice(name, { audio = false } = {}) {
    const configFile = resolve(here, "videos", `${name}.voice.json`);
    if (!existsSync(configFile)) return null;
    const config = JSON.parse(readFileSync(configFile, "utf8"));
    const source = config.source && resolve(here, "videos", config.source);
    const take = Boolean(source && existsSync(source));
    const stretches = take
        ? await speech(source, config.noise ?? -38, config.minPause ?? 0.18)
        : null;
    if (take && stretches.length !== config.phrases.length) {
        const found = stretches
            .map((s) => `  ${s.start.toFixed(2)}–${s.end.toFixed(2)}`)
            .join("\n");
        throw new Error(
            `${name}: the take has ${stretches.length} stretches of speech, the config ${config.phrases.length} phrases.\n${found}`,
        );
    }

    // A little air around each stretch, so no sound is clipped.
    const EDGE = 0.03;
    const phrases = {};
    const parts = [];
    const pace = config.rate ?? 6.8;
    let at = 0;
    config.phrases.forEach((phrase, i) => {
        if (phrase.drop) return;
        const from = take ? Math.max(0, stretches[i].start - EDGE) : 0;
        const to = take
            ? (phrase.until ?? stretches[i].end + EDGE)
            : syllables(phrase.text) / pace;
        const rate = syllables(phrase.text) / (to - from);
        const tempo = Math.min(
            Math.max(pace / rate, 1),
            phrase.maxTempo ?? config.maxTempo ?? 1.35,
        );
        const length = (to - from) / tempo;
        const pause =
            phrase.pause ??
            (/[.?!]$/.test(phrase.text)
                ? 0.16
                : /,$/.test(phrase.text)
                  ? 0.1
                  : 0.06);
        // Words spread by their syllables over the phrase, the edges aside.
        const words = phrase.text.split(/\s+/);
        const weights = words.map(syllables);
        const sum = weights.reduce((a, b) => a + b, 0);
        const span = length - EDGE * 2;
        let w = at + EDGE;
        phrases[phrase.id] = {
            text: phrase.text,
            start: at + EDGE,
            end: at + length - EDGE,
            words: words.map((text, k) => {
                const word = {
                    text,
                    start: w,
                    end: w + (span * weights[k]) / sum,
                };
                w = word.end;
                return word;
            }),
        };
        parts.push({ from, to, tempo, length, pause, id: phrase.id });
        at += length + pause;
    });
    const duration = at + (config.tail ?? 0.6);

    let file = null;
    if (audio && take) {
        file = resolve(here, "out", `${name}.voice.wav`);
        const chains = parts.map(
            (p, i) =>
                `[0:a]atrim=start=${p.from}:end=${p.to},asetpts=PTS-STARTPTS,` +
                `rubberband=tempo=${p.tempo.toFixed(4)}:pitchq=quality,` +
                `atrim=end=${p.length.toFixed(4)},` +
                `afade=t=in:d=0.01,afade=t=out:st=${(p.length - 0.02).toFixed(4)}:d=0.02,` +
                `apad=whole_dur=${(p.length + p.pause).toFixed(4)}[p${i}]`,
        );
        const joined = `${parts.map((_, i) => `[p${i}]`).join("")}concat=n=${parts.length}:v=0:a=1,loudnorm=I=-14:TP=-1.5:LRA=11[voice]`;
        await ffmpeg([
            ...["-y", "-i", source, "-filter_complex"],
            [...chains, joined].join(";"),
            ...["-map", "[voice]", "-ar", "44100", "-ac", "1", file],
        ]);
    }
    return { timing: { duration, phrases }, parts, file, estimated: !take };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const name = process.argv[2] ?? "escorpio";
    const voice = await fitVoice(name, {
        audio: process.argv.includes("--audio"),
    });
    if (!voice) throw new Error(`${name}: no videos/${name}.voice.json`);
    for (const p of voice.parts) {
        const phrase = voice.timing.phrases[p.id];
        console.log(
            `${phrase.start.toFixed(2).padStart(6)}  ×${p.tempo.toFixed(2)}  ${(p.to - p.from).toFixed(2)}→${p.length.toFixed(2)} s  ${phrase.text}`,
        );
    }
    console.log(
        `duration ${voice.timing.duration.toFixed(2)} s${voice.estimated ? " (estimated: no take yet)" : ""}`,
    );
    if (voice.file) console.log(`→ ${voice.file}`);
}
