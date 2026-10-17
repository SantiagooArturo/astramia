// What every video shares: the canvas, the sky, the words, the reading card,
// the button, the star hopping planet to planet below, and the clock that
// runs the scenes. A video imports it, says when its scenes cut and what each
// one draws, and calls start(). Everything is a function of t, so any frame
// renders alike however slow the drawing.
//
// render.mjs fits the voice-over and hands in window.VOICE: when each phrase
// (by its id) and each of its words is said. Words land as they're heard.

export const W = 1080,
    H = 1920,
    HALF = 960;
export const P = window.VOICE.phrases;
export const DURATION = window.VOICE.duration;
window.DURATION = DURATION; // render.mjs reads it

const canvas =
    document.getElementById("c") ??
    Object.assign(document.body.appendChild(document.createElement("canvas")), {
        id: "c",
        width: W,
        height: H,
    });
export const ctx = canvas.getContext("2d");

export const GOLD = "#e9c46a",
    GOLD_DEEP = "#c9973a",
    INK = "#f6f2ff",
    MUTED = "#b9b3d6";
const BG_TOP = "#070614",
    BG_BOTTOM = "#0b0820";

// ---------- helpers ----------
export function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export const clamp = (x, a = 0, b = 1) => Math.min(Math.max(x, a), b);
export const lerp = (a, b, u) => a + (b - a) * u;
export const ease = {
    out: (u) => 1 - (1 - u) ** 3,
    inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2),
    back: (u) => {
        const c = 1.9;
        return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2;
    },
};
/** 0→1 between a and b. */
export const prog = (t, a, b) => clamp((t - a) / (b - a));

const images = {};
function load(name) {
    return new Promise((ok) => {
        const img = new Image();
        img.onload = () => {
            images[name] = img;
            ok();
        };
        img.src = `/planets/sprites/${name}.webp`;
    });
}

// ---------- the scene clock ----------
/** A scene leaving: a hard cut, the words stay until the next ones land. */
export function out(t, end) {
    return 1 - prog(t, end - 0.04, end);
}
/** A scene coming in: never from nothing (the top is never empty), with a punch. */
export function enter(l) {
    return 0.4 + 0.6 * ease.out(prog(l, 0, 0.18));
}
export function punch(l) {
    return 1 + 0.07 * (1 - ease.out(prog(l, 0, 0.3)));
}
/** 0→1 as a word is said: on screen a hair before it's heard. */
export const shown = (t, at, len = 0.22) =>
    ease.out(prog(t, at - 0.08, at - 0.08 + len));
/** The same, overshooting a little: for the word that matters. */
export const pops = (t, at) => ease.back(prog(t, at - 0.1, at + 0.3));
/** Scenes start a beat before their first word is said. */
export const LEAD = 0.12;

// ---------- starfields ----------
const topStars = (() => {
    const r = rng(7);
    return Array.from({ length: 260 }, () => ({
        x: r() * W,
        y: r() * HALF,
        s: 0.6 + r() * 2.2,
        p: r() * 6.28,
        sp: 0.5 + r() * 2,
    }));
})();
const farStars = (() => {
    const r = rng(11);
    return Array.from({ length: 220 }, () => ({
        x: r() * 4000,
        y: HALF + r() * HALF,
        s: 0.5 + r() * 1.6,
        p: r() * 6.28,
    }));
})();
const dust = (() => {
    const r = rng(13);
    return Array.from({ length: 60 }, () => ({
        x: r() * 3000,
        y: HALF + 60 + r() * (HALF - 120),
        s: 1 + r() * 2.5,
    }));
})();

function drawStars(list, t, ox = 0, wrap = 0) {
    for (const s of list) {
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * (s.sp ?? 1.2) + s.p));
        let x = s.x - ox;
        if (wrap) x = ((x % wrap) + wrap) % wrap;
        ctx.globalAlpha = tw;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, s.y, s.s, 0, 6.283);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

export function glow(x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace("ALPHA", alpha));
    g.addColorStop(1, color.replace("ALPHA", 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ---------- text ----------
export function font(family, size, { italic = false, weight = 400 } = {}) {
    return `${italic ? "italic " : ""}${weight} ${size}px ${family}`;
}
/** A line, centered, shrunk to fit `max` width; returns its width. */
export function line(
    text,
    y,
    {
        family = "Instrument",
        size = 100,
        italic = false,
        weight = 400,
        color = INK,
        alpha = 1,
        scale = 1,
        dy = 0,
        blur = 0,
        glowColor = null,
        spacing = 0,
        max = 900,
        gradient = false,
        x = 540,
    } = {},
) {
    if (alpha <= 0) return 0;
    ctx.save();
    ctx.font = font(family, size, { italic, weight });
    ctx.letterSpacing = `${spacing}px`;
    const w = ctx.measureText(text).width;
    const fit = w > max ? max / w : 1;
    ctx.translate(x, y + dy);
    ctx.scale(scale * fit, scale * fit);
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (blur) ctx.filter = `blur(${blur}px)`;
    if (glowColor) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 40;
    }
    if (gradient) {
        const g = ctx.createLinearGradient(-w / 2, -size / 2, w / 2, size / 2);
        g.addColorStop(0, "#fff4d6");
        g.addColorStop(0.5, GOLD);
        g.addColorStop(1, GOLD_DEEP);
        ctx.fillStyle = g;
    } else ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
    return w * fit;
}
/** The big gold words: italic, gradient, glowing, popping in with `pop`. */
export function goldLine(
    text,
    y,
    pop,
    alpha,
    { size = 150, italic = true, max = 900, from = 0.75 } = {},
) {
    return line(text, y, {
        size,
        italic,
        gradient: true,
        glowColor: "rgba(233,196,106,0.5)",
        alpha: alpha * clamp(pop * 1.3),
        scale: lerp(from, 1, clamp(pop)),
        max,
    });
}
/** Words centered as a line, each landing at its time in `times`. */
export function words(list, y, times, style, t) {
    ctx.save();
    ctx.font = font(style.family ?? "Instrument", style.size, style);
    const space = ctx.measureText(" ").width;
    const widths = list.map((w) => ctx.measureText(w.text ?? w).width);
    ctx.restore();
    const total = widths.reduce((a, b) => a + b, 0) + space * (list.length - 1);
    let x = 540 - total / 2;
    list.forEach((w, i) => {
        const word = w.text ?? w;
        const u = prog(t, times[i] - 0.08, times[i] + 0.2);
        const a = ease.out(u);
        ctx.save();
        ctx.font = font(style.family ?? "Instrument", style.size, style);
        ctx.textBaseline = "middle";
        ctx.globalAlpha = a * (style.alpha ?? 1);
        const blur = w.blurUntil
            ? lerp(18, 0, ease.out(prog(t, w.blurUntil, w.blurUntil + 0.35)))
            : 0;
        if (blur > 0.1) ctx.filter = `blur(${blur}px)`;
        if (w.gold) {
            ctx.fillStyle = GOLD;
            ctx.shadowColor = "rgba(233,196,106,0.8)";
            ctx.shadowBlur = 30;
        } else ctx.fillStyle = style.color ?? INK;
        ctx.fillText(word, x, y + (1 - a) * 40);
        ctx.restore();
        x += widths[i] + space;
    });
}

// ---------- signs ----------
export const SIGNS = {
    aries: "♈",
    tauro: "♉",
    geminis: "♊",
    cancer: "♋",
    leo: "♌",
    virgo: "♍",
    libra: "♎",
    escorpio: "♏",
    sagitario: "♐",
    capricornio: "♑",
    acuario: "♒",
    piscis: "♓",
    venus: "♀",
    marte: "♂",
    sol: "☉",
};
/** Constellations, roughly as seen, in a 0–1 box; `bright` is the star that stands out. */
export const CONSTELLATIONS = {
    // Head (claws) top right, tail curling down left; Antares is the heart.
    escorpio: {
        points: [
            [0.8, 0.08],
            [0.83, 0.18],
            [0.78, 0.28],
            [0.7, 0.36],
            [0.63, 0.45],
            [0.58, 0.56],
            [0.55, 0.68],
            [0.48, 0.78],
            [0.38, 0.84],
            [0.28, 0.82],
            [0.22, 0.74],
            [0.26, 0.66],
        ],
        bright: 5,
        color: ["rgba(255,120,80,ALPHA)", "#ffb08a"],
    },
    // The scales: σ, Zubenelgenubi, Zubeneschamali (the brightest), γ, υ, τ.
    libra: {
        points: [
            [0.24, 0.8],
            [0.26, 0.46],
            [0.54, 0.16],
            [0.76, 0.42],
            [0.8, 0.68],
            [0.7, 0.84],
        ],
        bright: 2,
        color: ["rgba(170,230,210,ALPHA)", "#d8fff0"],
    },
};

function constellation(t, alpha, { points, bright, color }) {
    const ox = 120,
        oy = 120,
        w = 840,
        h = 760;
    const drawn = ease.inOut(prog(t, 0, 1.4));
    const n = points.length;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(233,196,106,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const upto = drawn * (n - 1);
    for (let i = 0; i <= Math.floor(upto) && i < n; i++) {
        const [x, y] = points[i];
        i === 0
            ? ctx.moveTo(ox + x * w, oy + y * h)
            : ctx.lineTo(ox + x * w, oy + y * h);
    }
    const k = Math.floor(upto);
    if (k < n - 1) {
        const f = upto - k,
            [x1, y1] = points[k],
            [x2, y2] = points[k + 1];
        ctx.lineTo(ox + lerp(x1, x2, f) * w, oy + lerp(y1, y2, f) * h);
    }
    ctx.stroke();
    points.forEach(([x, y], i) => {
        if (i > upto + 0.5) return;
        const big = i === bright;
        const r = big ? 7 : 3.5;
        glow(
            ox + x * w,
            oy + y * h,
            big ? 50 : 22,
            big ? color[0] : "rgba(255,240,210,ALPHA)",
            0.7 * alpha,
        );
        ctx.fillStyle = big ? color[1] : "#fff6e0";
        ctx.beginPath();
        ctx.arc(ox + x * w, oy + y * h, r, 0, 6.283);
        ctx.fill();
    });
    ctx.restore();
}

let video = null;

/** A sign's glyph, gold and breathing; the video's own sign unless told. */
export function glyph(
    t,
    alpha,
    { symbol = video.symbol, x = 540, y = 520, size = 520 } = {},
) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${size}px Glyphs`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = GOLD;
    ctx.shadowColor = "rgba(233,196,106,0.9)";
    ctx.shadowBlur = 60;
    const s = 1 + 0.03 * Math.sin(t * 3);
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillText(`${symbol}︎`, 0, 0);
    ctx.restore();
}

export function planet(name, x, y, r, { shade = true, alpha = 1 } = {}) {
    const img = images[name];
    ctx.save();
    ctx.globalAlpha = alpha;
    const half = r / 0.86;
    ctx.drawImage(img, x - half, y - half, half * 2, half * 2);
    if (shade) {
        const g = ctx.createRadialGradient(
            x - r * 0.4,
            y - r * 0.45,
            r * 0.1,
            x,
            y,
            r * 1.05,
        );
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.65, "rgba(3,3,12,0.15)");
        g.addColorStop(1, "rgba(3,3,12,0.75)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.283);
        ctx.fill();
    }
    ctx.restore();
}

/** A planet walking backwards over the sky, a little loop in its path. */
export function retrograde(t, a, from, to, { name = "venus", y = 830 } = {}) {
    const path = (u) => [
        lerp(820, 300, u) + Math.sin(u * Math.PI * 2) * 60,
        y - Math.sin(u * Math.PI) * 30 - Math.sin(u * Math.PI * 2) * 24,
    ];
    const u = ease.inOut(prog(t, from, to));
    for (let k = 1; k <= 14; k++) {
        const [tx, ty] = path(clamp(u - k * 0.02));
        ctx.globalAlpha = a * (1 - k / 15) * 0.5;
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(tx, ty, 7 - k * 0.35, 0, 6.283);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    const [vx, vy] = path(u);
    glow(vx, vy, 120, "rgba(255,230,170,ALPHA)", 0.5 * a);
    planet(name, vx, vy, 48, { alpha: a });
}

/** "Si eres <sign> / no pases este video": the hook, the cover, the loop. */
export function ifYouAre(sign) {
    return (t, leave) => {
        const flash = 1 - ease.out(prog(t % DURATION, 0, 0.5));
        glyph(t, 0.16 * leave);
        line("SI ERES", 330, {
            family: "Geist",
            size: 54,
            weight: 600,
            spacing: 16,
            color: GOLD,
            alpha: leave,
            dy: (1 - leave) * -30,
        });
        line(sign.toUpperCase(), 455, {
            size: 200,
            gradient: true,
            glowColor: "rgba(233,196,106,0.55)",
            alpha: leave,
            scale: 1 + 0.06 * flash,
            dy: (1 - leave) * -30,
            max: 940,
        });
        // Already there on frame 0 (it's the cover); a punch-in gives it motion.
        const punch =
            1 +
            0.08 *
                Math.max(
                    0,
                    Math.sin(Math.min((t % DURATION) / 0.5, 1) * Math.PI),
                );
        line("no pases este video", 590, {
            size: 96,
            italic: true,
            alpha: leave,
            scale: punch,
            dy: (1 - leave) * -30,
        });
    };
}

/** Venus going backwards in the sign: the scene that says why now. */
export function retrogradeIn(
    t,
    l,
    a,
    { from, to, lead, word, sign, until, signAt, untilAt },
) {
    glyph(t, 0.12 * a);
    line(lead, 300, {
        family: "Geist",
        size: 60,
        weight: 600,
        alpha: a,
        scale: punch(l),
    });
    goldLine("retrógrada", 440, pops(t, word), a, { size: 190, from: 0.7 });
    line(sign, 570, { size: 84, alpha: a * shown(t, signAt) });
    chip(until, 680, a * shown(t, untilAt));
    retrograde(t, a, from, to);
}

// ---------- tags, buttons, the reading card ----------
/** A small outlined label, like a tag; with `dot`, a status pill. */
export function chip(text, y, alpha, { size = 40, dot = null } = {}) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = font("Geist", size, { weight: 600 });
    const tw = ctx.measureText(text).width;
    const pad = dot ? 70 : 36,
        h = size * 1.75,
        w = tw + pad + 36;
    ctx.translate(540 - w / 2, y);
    ctx.fillStyle = dot ? "rgba(255,255,255,0.08)" : "rgba(233,196,106,0.12)";
    ctx.strokeStyle = dot ? "rgba(255,255,255,0.18)" : "rgba(233,196,106,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, -h / 2, w, h, h / 2);
    ctx.fill();
    ctx.stroke();
    if (dot) {
        ctx.fillStyle = dot;
        ctx.shadowColor = dot;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(42, 0, 10, 0, 6.283);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.fillStyle = dot ? MUTED : GOLD;
    ctx.textBaseline = "middle";
    ctx.fillText(text, pad, 2);
    ctx.restore();
}

/** The gold button, with a sheen passing over it. */
export function button(text, y, alpha, pop, l) {
    if (pop <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha * clamp(pop * 1.3);
    ctx.translate(540, y);
    const s = lerp(0.6, 1, clamp(pop)) * (1 + 0.025 * Math.sin(l * 6));
    ctx.scale(s, s);
    const bw = 560,
        bh = 112;
    ctx.shadowColor = "rgba(233,196,106,0.8)";
    ctx.shadowBlur = 50;
    const bg = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    bg.addColorStop(0, "#f7dc95");
    bg.addColorStop(1, GOLD_DEEP);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.clip();
    const sx = lerp(-bw, bw, (l * 0.7) % 1);
    const sh = ctx.createLinearGradient(sx - 80, 0, sx + 80, 0);
    sh.addColorStop(0, "rgba(255,255,255,0)");
    sh.addColorStop(0.5, "rgba(255,255,255,0.55)");
    sh.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.restore();
    ctx.font = font("Geist", 46, { weight: 650 });
    ctx.fillStyle = "#1a1030";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 3);
    ctx.restore();
}

/** The call to action under the question: the button, then the address. */
export function cta(t, l, a, { label = "Empieza gratis", at, url }) {
    button(label, 600, a, pops(t, at), l);
    line("astramia.app", 730, {
        family: "Geist",
        size: 44,
        weight: 500,
        spacing: 4,
        color: MUTED,
        alpha: a * shown(t, url, 0.3),
    });
}

// A reading as the app shows it before paying: written word by word, the
// rest of the sentence blurred.
const CARD = { x: 100, y: 360, w: 880, h: 420, pad: 56, size: 62, lead: 80 };
const layouts = new Map();
function layoutReading(text, hidden) {
    ctx.save();
    ctx.font = font("Instrument", CARD.size);
    const space = ctx.measureText(" ").width;
    const lines = [[]];
    let x = 0,
        i = 0;
    for (const part of [{ text }, { text: hidden, blur: true }])
        for (const word of part.text.split(" ")) {
            const w = ctx.measureText(word).width;
            if (x > 0 && x + w > CARD.w - CARD.pad * 2) {
                lines.push([]);
                x = 0;
            }
            lines[lines.length - 1].push({
                text: word,
                x,
                w,
                blur: !!part.blur,
                i: part.blur ? -1 : i++,
            });
            x += w + space;
        }
    ctx.restore();
    return { lines, count: i };
}

/**
 * The card writes itself while the voice says `phrase` (a sentence that
 * stops halfway sounds wrong read out loud, not seen); the rest blurs as the
 * voice ends.
 */
export function readingCard(
    t,
    a,
    {
        phrase,
        text,
        hidden,
        header = "TU VENUS · CÓMO AMAS",
        planetName = "venus",
    },
) {
    const key = `${text}|${hidden}`;
    if (!layouts.has(key)) layouts.set(key, layoutReading(text, hidden));
    const { lines, count } = layouts.get(key);
    const from = phrase.start + 0.45,
        to = phrase.end - 0.15;
    const pop = ease.back(prog(t, phrase.start + 0.1, phrase.start + 0.45));
    if (pop <= 0) return;
    ctx.save();
    ctx.globalAlpha = a * clamp(pop * 1.4);
    const s = lerp(0.88, 1, clamp(pop));
    ctx.translate(540, CARD.y + CARD.h / 2);
    ctx.scale(s, s);
    ctx.translate(-540, -(CARD.y + CARD.h / 2));
    ctx.shadowColor = "rgba(122,72,200,0.6)";
    ctx.shadowBlur = 60;
    ctx.fillStyle = "rgba(22,15,48,0.92)";
    ctx.beginPath();
    ctx.roundRect(CARD.x, CARD.y, CARD.w, CARD.h, 40);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(233,196,106,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Header: whose planet, and the planet.
    const left = CARD.x + CARD.pad;
    ctx.font = font("Geist", 30, { weight: 600 });
    ctx.letterSpacing = "6px";
    ctx.fillStyle = GOLD;
    ctx.textBaseline = "middle";
    ctx.fillText(header, left, CARD.y + 64);
    ctx.letterSpacing = "0px";
    planet(planetName, CARD.x + CARD.w - CARD.pad - 22, CARD.y + 64, 26);
    ctx.fillStyle = "rgba(233,196,106,0.25)";
    ctx.fillRect(left, CARD.y + 110, CARD.w - CARD.pad * 2, 2);
    // Body, word by word; the hidden part comes in already blurred.
    const blurred = ease.out(prog(t, phrase.end, phrase.end + 0.3));
    ctx.font = font("Instrument", CARD.size);
    let caret = null;
    lines.forEach((row, n) => {
        const y = CARD.y + 180 + n * CARD.lead;
        for (const w of row) {
            const on = w.blur
                ? blurred
                : clamp((t - lerp(from, to, w.i / count)) / 0.12);
            if (on <= 0) continue;
            ctx.save();
            ctx.globalAlpha *= on;
            if (w.blur) ctx.filter = "blur(11px)";
            ctx.fillStyle = INK;
            ctx.fillText(w.text, left + w.x, y + (1 - on) * 10);
            ctx.restore();
            if (!w.blur) caret = { x: left + w.x + w.w + 8, y };
        }
    });
    if (caret && t < phrase.end && Math.sin(t * 18) > -0.3) {
        ctx.fillStyle = GOLD;
        ctx.fillRect(caret.x, caret.y - 32, 4, 62);
    }
    ctx.restore();
}

/** "Astramia lee el cielo / del día que naciste" over the card. */
export function astramiaReads(t, l, a, card) {
    line("Astramia lee el cielo", 180, {
        family: "Geist",
        size: 54,
        weight: 600,
        alpha: a,
        scale: punch(l),
    });
    line("del día que naciste", 275, {
        size: 96,
        italic: true,
        gradient: true,
        glowColor: "rgba(233,196,106,0.45)",
        alpha: a * shown(t, card.phrase.words[4].start),
    });
    readingCard(t, a, card);
}

// ---------- the top half ----------
function drawTop(t) {
    const { cuts, hook, scenes } = video;
    // Sky.
    const g = ctx.createLinearGradient(0, 0, 0, HALF);
    g.addColorStop(0, BG_TOP);
    g.addColorStop(1, "#140a2c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HALF);
    glow(820, 260, 520, "rgba(122,72,200,ALPHA)", 0.35);
    glow(220, 720, 460, "rgba(201,151,58,ALPHA)", 0.16);
    drawStars(topStars, t);
    if (video.constellation)
        constellation(t, 0.9, CONSTELLATIONS[video.constellation]);
    video.backdrop?.(t);

    // A burst of gold behind the title on the first frames: it stops the
    // thumb without washing out the words.
    const flash = 1 - ease.out(prog(t, 0, 0.6));
    if (flash > 0) glow(540, 455, 620, "rgba(255,214,120,ALPHA)", 0.35 * flash);

    // The hook is on screen from the very first frame: the feed shows frame 0.
    if (t < cuts[1]) return hook(t, out(t, cuts[1]));
    for (let i = 1; i < cuts.length - 2; i++) {
        if (t >= cuts[i + 1]) continue;
        const l = t - cuts[i];
        return scenes[i - 1](t, l, enter(l) * out(t, cuts[i + 1]));
    }
    // Back to the hook, so the loop runs on without a seam.
    const end = cuts.length - 1;
    const l = prog(t, cuts[end - 1], cuts[end]);
    glow(
        540,
        460,
        900,
        "rgba(255,226,150,ALPHA)",
        0.35 * Math.sin(l * Math.PI),
    );
    ctx.globalAlpha = ease.out(prog(t, cuts[end - 1] + 0.1, cuts[end]));
    hook(t, 1);
    ctx.globalAlpha = 1;
}

// ---------- the bottom half: a star hopping planet to planet ----------
const NAMES = ["luna", "marte", "tierra", "venus"];
let LANDINGS = [],
    PLATFORMS = [],
    GOAL = 0;

/** Landing times: each scene split into even hops, landing on every cut. */
function plan(cuts, goalCut) {
    LANDINGS = [];
    for (let i = 0; i < cuts.length - 1; i++) {
        const a = cuts[i],
            b = cuts[i + 1];
        const n = Math.max(1, Math.round((b - a) / 0.5));
        for (let k = 0; k < n; k++) LANDINGS.push(a + ((b - a) * k) / n);
    }
    LANDINGS.push(cuts[cuts.length - 1]);
    GOAL = LANDINGS.indexOf(cuts[goalCut]); // lands on the gold sign with the call to action
    const r = rng(21);
    let x = 380;
    PLATFORMS = [];
    LANDINGS.forEach((_, i) => {
        // After landing on the sign, one hop in place: the moment of the button.
        if (i === GOAL + 1) {
            PLATFORMS.push(PLATFORMS[GOAL]);
            return;
        }
        const big = i === GOAL;
        const p = {
            x,
            y: big ? 1380 : 1320 + r() * 150,
            r: big ? 150 : 70 + r() * 50,
            name: NAMES[i % NAMES.length],
            goal: big,
            ph: r() * 6.28,
        };
        if (i === GOAL) p.x = x + 60;
        x = p.x + 330 + r() * 120 + (big || i + 1 === GOAL ? 120 : 0);
        PLATFORMS.push(p);
    });
}

function platformY(p, t) {
    return p.y + Math.sin(t * 2.2 + p.ph) * 7;
}
/** Where the star is at t: on a parabola from one landing to the next. */
function star(t) {
    let i = 0;
    while (i < LANDINGS.length - 2 && t >= LANDINGS[i + 1]) i++;
    const a = PLATFORMS[i],
        b = PLATFORMS[i + 1];
    const u = clamp((t - LANDINGS[i]) / (LANDINGS[i + 1] - LANDINGS[i]));
    const ya = platformY(a, t) - a.r - 34,
        yb = platformY(b, t) - b.r - 34;
    // Never above the bottom half's top edge.
    const wanted =
        a === b ? 150 : 170 + Math.abs(b.x - a.x) * 0.22 + (b.goal ? 110 : 0);
    const height = Math.min(wanted, Math.min(ya, yb) - (HALF + 90));
    return {
        x: lerp(a.x, b.x, u),
        y: lerp(ya, yb, u) - height * 4 * u * (1 - u),
        u,
        i,
    };
}

function drawStarShape(x, y, r, rot, sx = 1, sy = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, sy);
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
        const rr = k % 2 ? r * 0.45 : r;
        const ang = -Math.PI / 2 + (k * Math.PI) / 5;
        ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.45, "#fff0c2");
    g.addColorStop(1, GOLD);
    ctx.fillStyle = g;
    ctx.shadowColor = "rgba(255,220,140,1)";
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();
}

/** A gas giant rising from the bottom edge, its bands drifting slowly. */
function horizon(cam) {
    const cx = 540,
        cy = 2620,
        R = 1020;
    ctx.save();
    glow(cx, cy - R + 40, 520, "rgba(150,110,255,ALPHA)", 0.28);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 6.283);
    ctx.clip();
    const g = ctx.createLinearGradient(0, cy - R, 0, cy - R + 420);
    g.addColorStop(0, "#5b3f9e");
    g.addColorStop(0.4, "#2a1b55");
    g.addColorStop(1, "#0b0820");
    ctx.fillStyle = g;
    ctx.fillRect(0, cy - R, W, 600);
    ctx.filter = "blur(6px)";
    for (let k = 0; k < 9; k++) {
        const y = cy - R + 30 + k * 46;
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = k % 2 ? "#e9c46a" : "#b79cff";
        const off = ((cam * 0.08 + k * 140) % 400) - 200;
        ctx.beginPath();
        ctx.ellipse(cx + off, y, R * 1.1, 10 + (k % 3) * 6, 0, 0, 6.283);
        ctx.fill();
    }
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    // Night side toward the bottom edge.
    const night = ctx.createLinearGradient(0, cy - R + 120, 0, cy - R + 520);
    night.addColorStop(0, "rgba(5,4,13,0)");
    night.addColorStop(1, "rgba(5,4,13,0.85)");
    ctx.fillStyle = night;
    ctx.fillRect(0, cy - R, W, 600);
    ctx.restore();
    // The rim, lit from above, and a ring crossing in front.
    ctx.save();
    ctx.strokeStyle = "rgba(220,200,255,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.strokeStyle = "rgba(233,196,106,0.35)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(
        cx,
        cy - R + 90,
        760,
        70,
        -0.08,
        Math.PI * 1.02,
        Math.PI * 1.98,
    );
    ctx.stroke();
    ctx.restore();
}

function drawBottom(t) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HALF, W, HALF);
    ctx.clip();
    const g = ctx.createLinearGradient(0, HALF, 0, H);
    g.addColorStop(0, BG_BOTTOM);
    g.addColorStop(1, "#05040d");
    ctx.fillStyle = g;
    ctx.fillRect(0, HALF, W, HALF);

    const s = star(t);
    const cam = s.x - 400;
    glow(700, 1180, 600, "rgba(90,60,170,ALPHA)", 0.25);
    drawStars(farStars, t, cam * 0.25, 4000);
    horizon(cam);

    // Planets.
    PLATFORMS.forEach((p, i) => {
        const x = p.x - cam;
        if (x < -300 || x > W + 300) return;
        const y = platformY(p, t);
        // Squash a little when the star lands on it.
        const since = t - LANDINGS[i];
        const squash =
            since >= 0 && since < 0.25
                ? Math.sin((since / 0.25) * Math.PI) * 0.06
                : 0;
        if (p.goal) {
            glow(
                x,
                y,
                p.r * 2.6,
                "rgba(233,196,106,ALPHA)",
                0.45 + 0.25 * Math.sin(t * 4),
            );
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(1 + squash, 1 - squash);
            const pg = ctx.createRadialGradient(
                -p.r * 0.35,
                -p.r * 0.4,
                p.r * 0.1,
                0,
                0,
                p.r,
            );
            pg.addColorStop(0, "#fff1c8");
            pg.addColorStop(0.55, GOLD);
            pg.addColorStop(1, "#7a5418");
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(0, 0, p.r, 0, 6.283);
            ctx.fill();
            ctx.font = `${p.r * 1.25}px Glyphs`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#2a1a40";
            ctx.fillText(`${video.goalSymbol ?? video.symbol}︎`, 0, 6);
            ctx.strokeStyle = "rgba(255,236,190,0.6)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.38, -0.25, 0, 6.283);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(1 + squash, 1 - squash);
            planet(p.name, 0, 0, p.r);
            ctx.restore();
        }
    });

    // Landing bursts: a ring and gold dust, every time it touches down.
    LANDINGS.forEach((lt, i) => {
        const since = t - lt;
        if (since < 0 || since > 0.7) return;
        const p = PLATFORMS[i];
        const x = p.x - cam,
            y = platformY(p, lt) - p.r - 4;
        const big = p.goal ? 2 : 1;
        const u = since / 0.7;
        ctx.save();
        ctx.globalAlpha = (1 - u) * 0.9;
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 4 * big;
        ctx.beginPath();
        ctx.ellipse(
            x,
            y + 8,
            30 + u * 140 * big,
            (30 + u * 140 * big) * 0.28,
            0,
            0,
            6.283,
        );
        ctx.stroke();
        const r = rng(1000 + i);
        for (let k = 0; k < 16 * big; k++) {
            const ang = -Math.PI * (0.1 + 0.8 * r());
            const v = (220 + r() * 380) * big;
            const px = x + Math.cos(ang) * v * since;
            const py = y + Math.sin(ang) * v * since + 900 * since * since;
            ctx.fillStyle = k % 3 ? GOLD : "#fff";
            ctx.beginPath();
            ctx.arc(px, py, (3 + r() * 4) * (1 - u), 0, 6.283);
            ctx.fill();
        }
        ctx.restore();
    });

    // Trail, then the star itself: spinning in the air, squashed on landing.
    for (let k = 14; k >= 1; k--) {
        const p = star(Math.max(0, t - k * 0.018));
        ctx.globalAlpha = (1 - k / 15) * 0.55;
        ctx.fillStyle = k % 2 ? GOLD : "#fff3cf";
        ctx.beginPath();
        ctx.arc(p.x - cam, p.y, 18 - k * 0.9, 0, 6.283);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    const landed = LANDINGS[s.i];
    const since = t - landed;
    const sq =
        since >= 0 && since < 0.14 ? Math.sin((since / 0.14) * Math.PI) : 0;
    glow(s.x - cam, s.y, 110, "rgba(255,226,150,ALPHA)", 0.55);
    drawStarShape(
        s.x - cam,
        s.y,
        48,
        ease.inOut(s.u) * Math.PI * 2,
        1 + sq * 0.35,
        1 - sq * 0.3,
    );

    // Near dust, faster than the rest: depth.
    for (const d of dust) {
        const x = ((((d.x - cam * 1.6) % 3000) + 3000) % 3000) - 500;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#cfc6ff";
        ctx.beginPath();
        ctx.arc(x, d.y, d.s, 0, 6.283);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

function divider() {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(233,196,106,0)");
    g.addColorStop(0.5, "rgba(233,196,106,0.9)");
    g.addColorStop(1, "rgba(233,196,106,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, HALF - 1.5, W, 3);
    glow(540, HALF, 260, "rgba(233,196,106,ALPHA)", 0.18);
}

const FONTS = [
    ["Instrument", "instrument-serif.woff2", {}],
    ["Instrument", "instrument-serif-italic.woff2", { style: "italic" }],
    ["Geist", "geist.woff2", { weight: "100 900" }],
    ["Glyphs", "DejaVuSans.ttf", {}],
];

/**
 * Runs a video. `cuts`: when each scene starts, from 0 to the loop back to
 * the hook and the end. `hook(t, alpha)` draws the opening (it's also the
 * cover and the loop); `scenes[i](t, l, a)` the ones between, with `l` the
 * time since their cut and `a` their opacity. `goal` is the cut where the
 * star lands on the gold sign: the call to action.
 */
export function start(config) {
    video = config;
    plan(config.cuts, config.goal);
    window.renderFrame = (t) => {
        ctx.clearRect(0, 0, W, H);
        drawTop(t);
        drawBottom(t);
        divider();
    };
    window.ready = (async () => {
        for (const [family, file, descriptors] of FONTS)
            document.fonts.add(
                await new FontFace(
                    family,
                    `url(/assets/${file})`,
                    descriptors,
                ).load(),
            );
        await Promise.all([...NAMES, "sol"].map(load));
        window.renderFrame(0);
        return true;
    })();
}
