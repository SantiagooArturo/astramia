/**
 * Prompt eval for the reading: runs teaser → reading → one chat turn over
 * varied synthetic profiles and has a Gemini judge score each with a rubric,
 * next to mechanical checks (length, cuts, voseo, clichés, cost, latency).
 *
 *   pnpm eval:prompts                       # current prompts, AI_TASKS and models
 *   pnpm eval:prompts --model=google/gemini-3.8-flash --reasoning=low
 *   pnpm eval:prompts --prompts=./other-prompts.ts --profiles=3 --rpm=5
 *   pnpm eval:prompts --only=cancer-sin-hora,libra-joven --repeat=3
 *
 * Needs AI_GATEWAY_API_KEY. Writes JSON + Markdown to `.eval/`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateText, Output } from "ai";
import { z } from "zod";
import { DEFAULT_AI_MODELS } from "@/core/ai/domain/models";
import { aiReasoningSchema } from "@/core/ai/domain/schemas";
import type { AiPurpose } from "@/core/ai/domain/types";
import { toAiUsage } from "@/core/ai/domain/usage";
import { natalChart, venusOutlook } from "@/core/reading/domain/chart";
import * as currentPrompts from "@/core/reading/domain/prompts";
import { describeAnswer, tratoOf } from "@/core/reading/domain/quiz";
import type { QuizAnswer, ReadingProfile } from "@/core/reading/domain/types";

type Profile = ReadingProfile & { name: string; chatQuestion: string };

const answers = (...ids: string[]): QuizAnswer[] =>
    ["trato", "situacion", "patron", "necesidad", "herida", "pregunta"].map(
        (questionId, i) => ({ questionId, optionId: ids[i] }),
    );

const PROFILES: Profile[] = [
    {
        name: "aries-ruptura",
        birthDate: "1994-03-21",
        birthTime: "08:30",
        birthTimeZone: null,
        birthPlace: "Lima",
        answers: answers(
            "femenino",
            "ruptura",
            "doy_demasiado",
            "seguridad",
            "abandono",
            "por_que",
        ),
        chatQuestion: "¿Por qué siempre termino con el mismo tipo de persona?",
    },
    {
        name: "cancer-sin-hora",
        birthDate: "1990-07-07",
        birthTime: null,
        birthTimeZone: null,
        birthPlace: "Arequipa",
        answers: answers(
            "masculino",
            "alguien",
            "me_alejo",
            "libertad",
            "control",
            "cuando",
        ),
        chatQuestion: "¿Cuándo voy a conocer a alguien que valga la pena?",
    },
    {
        name: "escorpio-relacion",
        birthDate: "1988-11-02",
        birthTime: "22:15",
        birthTimeZone: null,
        birthPlace: "Cusco",
        answers: answers(
            "neutro",
            "relacion",
            "celos",
            "admiracion",
            "engano",
            "quedarme",
        ),
        chatQuestion:
            "Llevamos tres años y siento que no avanzamos. ¿Me quedo o me voy?",
    },
    {
        name: "capricornio-soltera",
        birthDate: "1999-01-15",
        birthTime: "06:00",
        birthTimeZone: null,
        birthPlace: "Trujillo",
        answers: answers(
            "femenino",
            "soltera",
            "indisponibles",
            "pasion",
            "indiferencia",
            "quien",
        ),
        chatQuestion: "¿Qué tipo de persona me conviene de verdad?",
    },
    {
        name: "tauro-luna-incierta",
        birthDate: "1992-05-08",
        birthTime: null,
        birthTimeZone: null,
        birthPlace: null,
        answers: answers(
            "neutro",
            "complicado",
            "no_se",
            "complicidad",
            "perder_me",
            "volvera",
        ),
        chatQuestion: "Me escribió anoche después de dos meses. ¿Va a volver?",
    },
    {
        name: "libra-joven",
        birthDate: "2001-09-30",
        birthTime: "14:40",
        birthTimeZone: null,
        birthPlace: "Lima",
        answers: answers(
            "masculino",
            "ruptura",
            "celos",
            "seguridad",
            "engano",
            "volvera",
        ),
        chatQuestion: "¿Le escribo o espero a que me busque?",
    },
];

/** The prompts module's own shape; older versions may lack `AI_TASKS`. */
type PromptModule = Omit<typeof currentPrompts, "AI_TASKS"> &
    Partial<Pick<typeof currentPrompts, "AI_TASKS">>;

const TODAY = new Date("2026-10-14T15:00:00Z");

const args = Object.fromEntries(
    process.argv
        .slice(2)
        .map((arg) => arg.replace(/^--/, "").split("="))
        .map(([key, ...value]) => [key, value.join("=") || "true"]),
);

const MODELS = {
    teaser: args["teaser-model"] ?? args.model ?? DEFAULT_AI_MODELS.teaser,
    reading: args["reading-model"] ?? args.model ?? DEFAULT_AI_MODELS.reading,
    chat: args["chat-model"] ?? args.model ?? DEFAULT_AI_MODELS.chat,
};
const JUDGE = args.judge ?? "google/gemini-4-argon";

/** `--rpm=5` spaces call starts for rate-limited plans (Vercel's free tier: 5/min per model). */
const gapMs = args.rpm ? 60_000 / Number(args.rpm) : 0;
let nextSlot = 0;
async function slot(): Promise<void> {
    const now = Date.now();
    const wait = Math.max(0, nextSlot - now);
    nextSlot = Math.max(now, nextSlot) + gapMs;
    await new Promise((done) => setTimeout(done, wait));
}

interface Call {
    text: string;
    finishReason: string;
    outputTokens: number | undefined;
    reasoningTokens: number | undefined;
    costUsd: number;
    seconds: number;
}

async function call(
    task: AiPurpose,
    prompts: PromptModule,
    input: { system: string; prompt: string },
): Promise<Call> {
    const settings = prompts.AI_TASKS?.[task];
    const reasoning =
        aiReasoningSchema.optional().parse(args.reasoning) ??
        settings?.reasoning ??
        "none";
    const maxOutputTokens = Number(
        args[`${task}-max`] ??
            settings?.maxOutputTokens ??
            { teaser: 300, reading: 2500, chat: 800 }[task],
    );
    await slot();
    const started = Date.now();
    const result = await generateText({
        model: MODELS[task],
        maxRetries: 5,
        system: input.system,
        prompt: input.prompt,
        maxOutputTokens,
        reasoning,
    });
    return {
        text: result.text.trim(),
        finishReason: result.finishReason,
        outputTokens: result.usage.outputTokens,
        reasoningTokens: result.usage.outputTokenDetails?.reasoningTokens,
        costUsd: toAiUsage(MODELS[task], result).costUsd ?? 0,
        seconds: (Date.now() - started) / 1000,
    };
}

const score = z.number().int().min(1).max(5);
const verdictSchema = z.object({
    teaser: z.object({
        especificidad: score.describe(
            "5: solo podría ser de esta persona; 1: sirve para cualquiera",
        ),
        gancho: score.describe(
            "5: produce '¿cómo sabe esto?' y deja una pregunta abierta irresistible",
        ),
    }),
    lectura: z.object({
        especificidad: score,
        uso_de_datos: score.describe(
            "cruza carta y las cinco respuestas, reinterpretadas, no citadas",
        ),
        rigor: score.describe(
            "5: nada inventado (casas, ascendente, otros planetas, tránsitos o fechas fuera de los datos)",
        ),
        voz_y_gusto: score.describe(
            "imágenes concretas, ritmo, calidez sin empalagar, cero clichés",
        ),
        respuesta_a_su_pregunta: score.describe(
            "honesta, con matices, útil, sin predicción cerrada",
        ),
        gesto_final: score.describe(
            "acción concreta, pequeña, hecha para esta persona",
        ),
        magia: score.describe("¿se siente mágica, increíble, digna de pagar?"),
    }),
    chat: z.object({
        utilidad: score,
        anclaje: score.describe("se apoya en su carta o su lectura"),
        honestidad: score.describe("no promete lo que la carta no puede saber"),
    }),
    trato: score.describe(
        "5: respeta siempre el trato pedido (femenino, masculino o sin género); 1: lo rompe a menudo",
    ),
    tuteo_consistente: z.boolean().describe("siempre 'tú', sin voseo ni usted"),
    trato_roto: z
        .array(z.string())
        .describe(
            "palabras literales sobre la persona que rompen el trato pedido (p. ej. 'segura' cuando pidió masculino)",
        ),
    genero_ajeno: z
        .array(z.string())
        .describe(
            "frases literales que le dan género a la otra persona (él, ella, novio, novia, enamorado de él…); la persona nunca lo dijo",
        ),
    cliches: z
        .array(z.string())
        .describe("frases trilladas encontradas, literal"),
    inventos: z
        .array(z.string())
        .describe(
            "afirmaciones astrológicas que no salen de los datos, literal",
        ),
    mejor_frase: z.string(),
    peor_frase: z.string(),
    comentario: z.string().describe("2-3 frases: qué mejorar primero"),
});
type Verdict = z.infer<typeof verdictSchema>;

function groundTruth(profile: Profile): string {
    const chart = natalChart(
        profile.birthDate,
        profile.birthTime,
        profile.birthTimeZone,
    );
    const venus = venusOutlook(TODAY, {
        sun: chart.placements[0].sign,
        moon: chart.placements[1].sign,
        venus: chart.placements[2].sign,
    });
    return [
        `Nacimiento: ${profile.birthDate} ${profile.birthTime ?? "(hora desconocida)"} ${profile.birthPlace ?? ""}`,
        ...chart.placements.map((p) => `${p.body} en ${p.sign} ${p.degree}`),
        chart.moonRange
            ? `Luna incierta: ${chart.moonRange.early} o ${chart.moonRange.late}`
            : "",
        `Aspectos: ${chart.aspects.map((a) => `${a.a} ${a.name} ${a.b}`).join(", ") || "ninguno"}`,
        `Elemento dominante: ${chart.dominantElement ?? "ninguno (repartidos)"}`,
        `Fase lunar natal: ${chart.moonPhase}`,
        `Hoy 14 de octubre de 2026. Venus en ${venus.sign}${venus.retrograde ? " retrógrada" : ""}. ${venus.events.map((e) => `${e.when}: ${e.text}`).join("; ")}`,
        "Respuestas:",
        ...profile.answers.map((a) => {
            const d = describeAnswer(
                a.questionId,
                a.optionId,
                tratoOf(profile.answers),
            );
            return `- ${d?.question} → ${d?.answer}`;
        }),
    ]
        .filter(Boolean)
        .join("\n");
}

async function judge(
    profile: Profile,
    teaser: string,
    reading: string,
    chat: string,
): Promise<{ verdict: Verdict; costUsd: number }> {
    await slot();
    const result = await generateText({
        model: JUDGE,
        maxRetries: 5,
        reasoning: "medium",
        maxOutputTokens: 6000,
        output: Output.object({ schema: verdictSchema }),
        system: `Eres editora de un producto de astrología de pago en español latinoamericano, exigente con la calidad literaria y con la precisión. Evalúas sin piedad: un 5 es excepcional y raro; un texto correcto pero genérico es un 2. Juzgas solo contra los datos dados: cualquier dato astrológico que no esté en ellos es un invento.`,
        prompt: `<datos>\n${groundTruth(profile)}\n</datos>\n\n<gancho_gratuito>\n${teaser}\n</gancho_gratuito>\n\n<lectura_pagada>\n${reading}\n</lectura_pagada>\n\n<chat>\nPregunta: ${profile.chatQuestion}\nRespuesta: ${chat}\n</chat>`,
    });
    return {
        verdict: result.output as Verdict,
        costUsd: toAiUsage(JUDGE, result).costUsd ?? 0,
    };
}

const BANNED =
    /energía vibrante|danza|aguas turbulentas|el universo|conectar contigo|es importante recordar|en conclusión|entiendo perfecto|excelente pregunta|qué buena pregunta|no te preocupes|viaje de autodescubrimiento|luz propia/gi;
const VOSEO = /\b(tenés|sentís|querés|podés|sos|vos|sabés|hacés|necesitás)\b/gi;
/** The other person's gender is never given; any of these assumes it. */
// "desde chico/chica" is the reader, in their own trato.
const OTHER_GENDER =
    /(?<!\p{L})(?<!desde )(él|ella|novio|novia|chico|chica)(?!\p{L})/giu;
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

async function runProfile(prompts: PromptModule, profile: Profile) {
    const teaser = await call("teaser", prompts, {
        system: prompts.TEASER_PROMPT.system,
        prompt: prompts.TEASER_PROMPT.prompt(profile),
    });
    const reading = await call("reading", prompts, {
        system: prompts.READING_PROMPT.system,
        prompt: prompts.READING_PROMPT.prompt(profile, teaser.text, TODAY),
    });
    const chat = await call("chat", prompts, {
        system: prompts.chatSystemPrompt(profile, reading.text, TODAY),
        prompt: profile.chatQuestion,
    });
    const { verdict, costUsd } = await judge(
        profile,
        teaser.text,
        reading.text,
        chat.text,
    );
    const all = [teaser.text, reading.text, chat.text].join("\n");
    return {
        profile: profile.name,
        teaser,
        reading,
        chat,
        verdict,
        judgeCostUsd: costUsd,
        checks: {
            teaserWords: words(teaser.text),
            readingWords: words(reading.text),
            chatWords: words(chat.text),
            cut: [teaser, reading, chat].some(
                (c) => c.finishReason === "length",
            ),
            banned: all.match(BANNED) ?? [],
            voseo: all.match(VOSEO) ?? [],
            otherGender: all.match(OTHER_GENDER) ?? [],
            exclamations: (all.match(/!/g) ?? []).length,
        },
    };
}

const promptsPath = args.prompts;
const prompts = (
    promptsPath
        ? await import(pathToFileURL(resolve(promptsPath)).href)
        : currentPrompts
) as PromptModule;
const only = args.only?.split(",");
const profiles = PROFILES.slice(0, Number(args.profiles ?? PROFILES.length))
    .filter((p) => !only || only.includes(p.name))
    .flatMap((p) => Array.from({ length: Number(args.repeat ?? 1) }, () => p));
const label = args.label ?? (promptsPath ? "custom" : "current");

console.log(
    `eval "${label}" · ${profiles.length} profiles · models ${JSON.stringify(MODELS)} · judge ${JUDGE}`,
);
const results = await Promise.all(profiles.map((p) => runProfile(prompts, p)));

const mean = (values: number[]) =>
    Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
const rubric = (pick: (v: Verdict) => number) =>
    mean(results.map((r) => pick(r.verdict)));
const summary = {
    label,
    models: MODELS,
    "teaser.especificidad": rubric((v) => v.teaser.especificidad),
    "teaser.gancho": rubric((v) => v.teaser.gancho),
    "lectura.especificidad": rubric((v) => v.lectura.especificidad),
    "lectura.uso_de_datos": rubric((v) => v.lectura.uso_de_datos),
    "lectura.rigor": rubric((v) => v.lectura.rigor),
    "lectura.voz_y_gusto": rubric((v) => v.lectura.voz_y_gusto),
    "lectura.respuesta": rubric((v) => v.lectura.respuesta_a_su_pregunta),
    "lectura.gesto": rubric((v) => v.lectura.gesto_final),
    "lectura.magia": rubric((v) => v.lectura.magia),
    "chat.utilidad": rubric((v) => v.chat.utilidad),
    "chat.anclaje": rubric((v) => v.chat.anclaje),
    "chat.honestidad": rubric((v) => v.chat.honestidad),
    trato: rubric((v) => v.trato),
    tuteo: results.filter((r) => r.verdict.tuteo_consistente).length,
    tratoRoto: results.reduce((n, r) => n + r.verdict.trato_roto.length, 0),
    generoAjeno: results.reduce((n, r) => n + r.verdict.genero_ajeno.length, 0),
    "él/ella/novio…": results.reduce(
        (n, r) => n + r.checks.otherGender.length,
        0,
    ),
    inventos: results.reduce((n, r) => n + r.verdict.inventos.length, 0),
    cliches: results.reduce((n, r) => n + r.verdict.cliches.length, 0),
    cortes: results.filter((r) => r.checks.cut).length,
    voseo: results.reduce((n, r) => n + r.checks.voseo.length, 0),
    palabrasLectura: mean(results.map((r) => r.checks.readingWords)),
    segundosLectura: mean(results.map((r) => r.reading.seconds)),
    segundosChat: mean(results.map((r) => r.chat.seconds)),
    usdPorCompra:
        mean(
            results.map(
                (r) =>
                    (r.teaser.costUsd + r.reading.costUsd + r.chat.costUsd) *
                    1000,
            ),
        ) / 1000,
    usdJuez: results.reduce((n, r) => n + r.judgeCostUsd, 0),
};
console.table(summary);

const dir = resolve(".eval");
mkdirSync(dir, { recursive: true });
const stamp = `${label}-${Date.now()}`;
writeFileSync(
    resolve(dir, `${stamp}.json`),
    JSON.stringify({ summary, results }, null, 2),
);
writeFileSync(
    resolve(dir, `${stamp}.md`),
    results
        .map(
            (r) =>
                `# ${r.profile}\n\n## Gancho\n\n${r.teaser.text}\n\n## Lectura\n\n${r.reading.text}\n\n## Chat\n\n**${PROFILES.find((p) => p.name === r.profile)?.chatQuestion}**\n\n${r.chat.text}\n\n## Juez\n\n${JSON.stringify(r.verdict, null, 2)}\n`,
        )
        .join("\n---\n\n"),
);
console.log(`→ .eval/${stamp}.{json,md}`);
