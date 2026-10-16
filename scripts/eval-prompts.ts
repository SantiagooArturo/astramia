/**
 * Prompt eval for the reading: runs teaser → reading → one chat turn over
 * varied synthetic profiles and has a Gemini judge score each with a rubric,
 * next to mechanical checks (length, cuts, voseo, clichés, cost, latency).
 *
 *   pnpm eval:prompts                       # current prompts, the cheap models
 *   pnpm eval:prompts --produccion --max-usd=2   # production's models
 *   pnpm eval:prompts --model=google/gemini-3.8-flash --reasoning=low
 *   pnpm eval:prompts --prompts=./other-prompts.ts --profiles=3 --rpm=5
 *   pnpm eval:prompts --only=cancer-sin-hora,libra-joven --repeat=3
 *
 * It spends real money. Drafts are written on Gemini 3.8 Flash, production's
 * family, reasoning little (at "medium" it thinks 9k tokens a reading and
 * costs more than Argon), and judged by Claude Haiku 5.5 (a twentieth of
 * Argon's price, and not judging its own family's writing), unless told
 * otherwise; the run stops at `--max-usd` (0.30 by default). An afternoon
 * of runs on Argon once burned the account's credit.
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
import { cluesFor } from "@/core/reading/domain/clues";
import { LOVE_PLAN, sceneText } from "@/core/reading/domain/plan";
import * as currentPrompts from "@/core/reading/domain/prompts";
import {
    describeAnswer,
    LOVE_QUIZ,
    questionsFor,
} from "@/core/reading/domain/quiz";
import {
    freeAsText,
    hookShown,
    keepCutMark,
    keptFree,
    parseTexts,
    readingAsText,
} from "@/core/reading/domain/reading-content";
import type { QuizAnswer, ReadingProfile } from "@/core/reading/domain/types";

type Profile = ReadingProfile & { name: string; chatQuestion: string };

/**
 * One answer per question asked, in order (the follow-up comes third): an
 * option, or a list for a ranking.
 */
const answers = (...given: (string | string[])[]): QuizAnswer[] => {
    const path: QuizAnswer[] = [];
    for (const q of LOVE_QUIZ)
        if (questionsFor(path).includes(q)) {
            const id = given[path.length];
            path.push(
                typeof id === "string"
                    ? { questionId: q.id, optionId: id }
                    : { questionId: q.id, ranking: id },
            );
        }
    return path;
};

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
            "meses",
            "doy_demasiado",
            "que_hice",
            "abandono",
            ["amor", "amigos", "familia", "dinero"],
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
            "no_se_que_siente",
            "me_alejo",
            "como_si_nada",
            "control",
            ["dinero", "amor", "familia", "amigos"],
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
            "dudas",
            "celos",
            "reviso",
            "engano",
            ["familia", "amor", "dinero", "amigos"],
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
            "anos",
            "indisponibles",
            "sigo",
            "indiferencia",
            ["dinero", "familia", "amigos", "amor"],
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
            "idas_y_vueltas",
            "no_se",
            "escribo",
            "perder_me",
            ["amor", "familia", "dinero", "amigos"],
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
            "reciente_hablan",
            "celos",
            "reviso",
            "engano",
            ["amigos", "amor", "familia", "dinero"],
            "volvera",
        ),
        chatQuestion: "¿Le escribo o espero a que me busque?",
    },
    {
        // A real tester: they chose "perderme a mí" over clashing life plans
        // (moving abroad, children), and were told it was about friends.
        name: "geminis-caminos",
        birthDate: "2003-06-12",
        birthTime: null,
        birthTimeZone: null,
        birthPlace: "Lima",
        answers: answers(
            "masculino",
            "relacion",
            "caminos",
            "no_se",
            "sigo",
            "perder_me",
            ["familia", "dinero", "amor", "amigos"],
            "quedarme",
        ),
        chatQuestion:
            "Yo quiero emigrar y tener hijos, y mi pareja no. ¿Vale la pena renunciar a eso?",
    },
    {
        // "Hay otra persona": theirs, the other's, or a third in between?
        name: "virgo-otra-persona",
        birthDate: "1997-09-05",
        birthTime: "19:20",
        birthTimeZone: null,
        birthPlace: "Lima",
        answers: answers(
            "femenino",
            "complicado",
            "otra_persona",
            "celos",
            "reviso",
            "engano",
            ["amor", "dinero", "amigos", "familia"],
            "quedarme",
        ),
        chatQuestion: "¿Cómo sé si de verdad me va a elegir?",
    },
    {
        // Never really in love: no past to lean on.
        name: "leo-nunca",
        birthDate: "2000-08-10",
        birthTime: null,
        birthTimeZone: null,
        birthPlace: "Piura",
        answers: answers(
            "masculino",
            "soltera",
            "nunca",
            "indisponibles",
            "sigo",
            "perder_me",
            ["dinero", "amigos", "familia", "amor"],
            "cuando",
        ),
        chatQuestion: "¿Por qué nunca me he enamorado de verdad?",
    },
    {
        // Family or friends against: which, and why?
        name: "acuario-entorno",
        birthDate: "1995-02-01",
        birthTime: "11:05",
        birthTimeZone: null,
        birthPlace: "Chiclayo",
        answers: answers(
            "neutro",
            "complicado",
            "entorno",
            "doy_demasiado",
            "que_hice",
            "control",
            ["amor", "dinero", "amigos", "familia"],
            "volvera",
        ),
        chatQuestion: "¿Debo hacer caso a lo que me dicen o a lo que siento?",
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

/** Drafts of a prompt are written on the cheapest of production's family. */
const CHEAP = "google/gemini-3.8-flash";
/** `--produccion`: the models buyers get, at their price. */
const BASE = "produccion" in args ? DEFAULT_AI_MODELS : null;
const MODELS = {
    teaser: args["teaser-model"] ?? args.model ?? BASE?.teaser ?? CHEAP,
    reading: args["reading-model"] ?? args.model ?? BASE?.reading ?? CHEAP,
    chat: args["chat-model"] ?? args.model ?? BASE?.chat ?? CHEAP,
    review: args["review-model"] ?? BASE?.review ?? CHEAP,
};
/** `--sin-revision`: as written, without the editor's pass. */
const REVIEW = !("sin-revision" in args);
const JUDGE = args.judge ?? "anthropic/claude-haiku-5.5";

/** What the run may spend, judge included; past it, no call starts. */
const BUDGET = Number(args["max-usd"] ?? 0.3);
let spent = 0;
class OverBudget extends Error {}
function afford(): void {
    if (spent >= BUDGET) throw new OverBudget();
}
function spend(costUsd: number): number {
    spent += costUsd;
    return costUsd;
}

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
    input: { system: string; prompt: string; schema?: z.ZodType },
): Promise<Call> {
    const settings = prompts.AI_TASKS?.[task];
    const reasoning =
        aiReasoningSchema
            .optional()
            .parse(args.reasoning ?? (BASE ? undefined : "low")) ??
        settings?.reasoning ??
        "none";
    const maxOutputTokens = Number(
        args[`${task}-max`] ??
            settings?.maxOutputTokens ??
            { teaser: 300, reading: 2500, chat: 800, review: 8000 }[task],
    );
    await slot();
    afford();
    const started = Date.now();
    const result = await generateText({
        model: MODELS[task],
        maxRetries: 5,
        system: input.system,
        prompt: input.prompt,
        maxOutputTokens,
        reasoning,
        // A reading written per scene comes back as an object (stored as JSON).
        ...(input.schema
            ? { output: Output.object({ schema: input.schema }) }
            : {}),
    });
    return {
        text: input.schema ? JSON.stringify(result.output) : result.text.trim(),
        finishReason: result.finishReason,
        outputTokens: result.usage.outputTokens,
        reasoningTokens: result.usage.outputTokenDetails?.reasoningTokens,
        costUsd: spend(toAiUsage(MODELS[task], result).costUsd ?? 0),
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
        corte: score.describe(
            "5: [CORTE] cae a mitad de una frase, justo antes de lo que más quiere saber, y es imposible no querer leer cómo sigue; 1: cae al final de una frase o donde no queda nada por saber",
        ),
        claridad: score.describe(
            "5: alguien de 20 años que llegó desde TikTok y nunca leyó de astrología lo entiende todo a la primera; 1: hay que saber astrología para entenderlo",
        ),
    }),
    lectura: z.object({
        especificidad: score,
        claridad: score.describe(
            "5: alguien sin ningún conocimiento de astrología entiende cada frase; 1: lleno de jerga sin explicar",
        ),
        uso_de_datos: score.describe(
            "cruza carta y sus respuestas, reinterpretadas, no citadas",
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
        inferencia: score.describe(
            "5: dice cosas que la persona no contó pero que se siguen de sus respuestas y de su carta, y se siente vista; 1: repite lo que respondió con otras palabras o lo presenta como si la carta lo hubiera descubierto",
        ),
        escenas: score.describe(
            "si viene por escenas (## Venus, ## Marte…): 5 si cada una habla solo de su astro y ninguna repite a otra; si es un texto corrido, 3",
        ),
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
    jerga_sin_explicar: z
        .array(z.string())
        .describe(
            "términos astrológicos usados sin decir en palabras simples qué significan para la persona (p. ej. 'tu Marte en Cáncer' a secas), literal",
        ),
    inventos: z
        .array(z.string())
        .describe(
            "afirmaciones astrológicas que no salen de los datos, literal",
        ),
    supuestos_graves: z
        .array(z.string())
        .describe(
            'afirmaciones que eligen por la persona algo que sus respuestas no dicen y que, si es falso, rompe la lectura: qué significa una respuesta ("perderme a mí" = dejar a sus amigos), un hecho de su vida (trabajo, familia, con quién vive, qué pasó), quién tiene la razón, qué siente o hará la otra persona; literal. No cuentes lo que se sigue directo de una respuesta (si dijo que se fueron sin explicación, que alguien se fue no es un supuesto) ni lo que viene como opciones o en condicional',
        ),
    supuestos_leves: z
        .array(z.string())
        .describe(
            'detalles de escena que no contó y podrían no ser suyos (un café, el bus, una comida), dichos como hecho; literal. No cuentes lo que viene como opciones ("un lugar, una canción o una foto") ni en condicional',
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
            const d = describeAnswer(a, profile.answers);
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
    afford();
    const result = await generateText({
        model: JUDGE,
        maxRetries: 5,
        reasoning: "medium",
        maxOutputTokens: 6000,
        output: Output.object({ schema: verdictSchema }),
        system: `Eres editora de un producto de astrología de pago en español latinoamericano, exigente con la calidad literaria y con la precisión. Evalúas sin piedad: un 5 es excepcional y raro; un texto correcto pero genérico es un 2. El público es masivo (llega desde TikTok e Instagram) y no sabe astrología: un texto que solo entiende quien sabe astrología falla, por bien escrito que esté. Juzgas solo contra los datos dados: cualquier dato astrológico que no esté en ellos es un invento.
Así se lee: una historia en el celular, una escena por pantalla junto a su imagen. La pantalla ya pone cada título ("Venus estaba en Aries", la fase de la Luna con su nombre y qué es, su pregunta), así que el texto no tiene por qué repetirlo. El gancho gratuito son las primeras escenas: su última se corta donde dice [CORTE] (lo de después aparece borroso), y quien paga la termina de leer y sigue con la lectura pagada, que continúa desde ahí sin repetirlas.`,
        prompt: `<datos>\n${groundTruth(profile)}\n</datos>\n\n<gancho_gratuito>\n${teaser}\n</gancho_gratuito>\n\n<lectura_pagada>\n${reading}\n</lectura_pagada>\n\n<chat>\nPregunta: ${profile.chatQuestion}\nRespuesta: ${chat}\n</chat>`,
    });
    return {
        verdict: result.output as Verdict,
        costUsd: spend(toAiUsage(JUDGE, result).costUsd ?? 0),
    };
}

const BANNED =
    /energía vibrante|danza|aguas turbulentas|el universo|conectar contigo|es importante recordar|en conclusión|entiendo perfecto|excelente pregunta|qué buena pregunta|no te preocupes|viaje de autodescubrimiento|luz propia/gi;
const VOSEO = /\b(tenés|sentís|querés|podés|sos|vos|sabés|hacés|necesitás)\b/gi;
/** The other person's gender is never given; any of these assumes it. */
/** Technical terms a mass audience doesn't know; each one needs a plain gloss or nothing. */
const JARGON =
    /(?<!\p{L})(cuadratura|trígono|sextil|conjunción|oposición|orbe|elemento dominante|fase lunar)(?!\p{L})/giu;
// "desde chico/chica" is the reader, in their own trato.
const OTHER_GENDER =
    /(?<!\p{L})(?<!desde )(él|ella|novio|novia|chico|chica)(?!\p{L})/giu;
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Sentences: what a reader takes in one go (a line break ends one too). */
const sentences = (text: string) =>
    text
        .replace(/\*\*/g, "")
        .split(/(?<=[.?!…])\s+|\n+/)
        .map((s) => s.trim())
        .filter((s) => words(s) > 0);
/** Easy to read on a phone: few words per sentence, almost no long ones. */
function readability(text: string) {
    const lengths = sentences(text).map(words);
    const total = lengths.reduce((a, b) => a + b, 0);
    return {
        wordsPerSentence: Math.round((total / lengths.length) * 10) / 10,
        longSentences: lengths.filter((n) => n > 20).length,
    };
}

/** Bodies each single-body scene is shown next to. */
const ON_SCREEN: Record<string, string[]> = {
    venus: ["Venus"],
    mars: ["Marte"],
    moon: ["Luna"],
    sun: ["Sol"],
};
/**
 * Scenes that talk about a body that isn't on screen ("venus: … tu Marte …"):
 * the story shows one body at a time, its text should follow.
 */
function crossTalk(teaser: string, content: string): string[] {
    const texts = { ...parseTexts(content), ...parseTexts(teaser) };
    return Object.entries(ON_SCREEN).flatMap(([key, shown]) =>
        ["Venus", "Marte", "Luna", "Sol"]
            .filter((body) => !shown.includes(body))
            .filter((body) =>
                new RegExp(`(?<!\\p{L})${body}(?!\\p{L})`, "u").test(
                    sceneText(texts, key) ?? "",
                ),
            )
            .map((body) => `${key}→${body}`),
    );
}

const normal = (text: string) =>
    text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zñ0-9 ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

/** Their answers, said back word for word: an echo they'll notice. */
function echoes(profile: Profile, text: string): string[] {
    const said = normal(text);
    return profile.answers
        .filter((a) => a.questionId !== "trato" && "optionId" in a)
        .map((a) => describeAnswer(a, profile.answers)?.answer)
        .filter((answer): answer is string => Boolean(answer))
        .filter((answer) => said.includes(normal(answer)));
}

/** Runs of six words, to compare texts without caring about punctuation. */
function shingles(text: string, size = 6): string[] {
    const words = normal(text).split(" ");
    return Array.from(
        new Set(
            words
                .slice(0, Math.max(words.length - size + 1, 0))
                .map((_, i) => words.slice(i, i + size).join(" ")),
        ),
    );
}

/** Clues pasted instead of rewritten: five words in a row from one (they're short). */
function copiedClues(profile: Profile, text: string): string[] {
    const said = new Set(shingles(text, 5));
    return cluesFor(profile.answers).filter((clue) =>
        shingles(clue, 5).some((run) => said.has(run)),
    );
}

/**
 * Six-word runs that show up for more than one profile: the lines readers
 * would find in each other's screenshots.
 */
function sharedAcrossProfiles(
    results: readonly { profile: string; checks: { shingles: string[] } }[],
): number {
    const seen = new Map<string, Set<string>>();
    for (const r of results)
        for (const run of r.checks.shingles)
            seen.set(run, (seen.get(run) ?? new Set()).add(r.profile));
    return [...seen.values()].filter((profiles) => profiles.size > 1).length;
}

/**
 * The editor's pass, as the app runs it (`reviewTexts`), when the prompts
 * module has one: the call, and what it changed.
 */
async function reviewed(
    prompts: PromptModule,
    profile: Profile,
    written: Call,
    schema: z.ZodType | undefined,
): Promise<{ text: string; changes: string[]; call?: Call }> {
    if (!REVIEW || !schema || !("reviewPrompt" in prompts))
        return { text: written.text, changes: [] };
    const review = prompts.reviewPrompt(schema);
    const result = await call("review", prompts, {
        system: review.system,
        prompt: review.prompt(profile, JSON.parse(written.text)),
        schema: review.schema,
    });
    const { cambios, texto } = JSON.parse(result.text);
    return { text: JSON.stringify(texto), changes: cambios, call: result };
}

async function runProfile(prompts: PromptModule, profile: Profile) {
    const teaserSchema =
        "schema" in prompts.TEASER_PROMPT
            ? prompts.TEASER_PROMPT.schema
            : undefined;
    const teaserWritten = await call("teaser", prompts, {
        system: prompts.TEASER_PROMPT.system,
        prompt: prompts.TEASER_PROMPT.prompt(profile, TODAY),
        schema: teaserSchema,
    });
    const teaserReview = await reviewed(
        prompts,
        profile,
        teaserWritten,
        teaserSchema,
    );
    const teaser = {
        ...teaserWritten,
        // As the server keeps it: the editor's text, the first cut mark.
        text: teaserReview.call
            ? JSON.stringify(
                  keepCutMark(
                      JSON.parse(teaserWritten.text),
                      JSON.parse(teaserReview.text),
                      LOVE_PLAN,
                  ),
              )
            : teaserWritten.text,
    };
    // The free scenes as the server keeps them (older prompts: a paragraph).
    const written = parseTexts(teaser.text);
    const keptTexts = written && keptFree(written, LOVE_PLAN);
    const kept = keptTexts ? JSON.stringify(keptTexts) : teaser.text;
    const cutByModel = keptTexts ? "cut" in keptTexts : false;
    const teaserText = freeAsText(kept, LOVE_PLAN);
    // For the judge: where the hook is cut, as it's read before paying.
    const shown = keptTexts && hookShown(keptTexts, LOVE_PLAN);
    const hook = keptTexts && sceneText(keptTexts, LOVE_PLAN.hook.key);
    const teaserCut =
        shown && hook
            ? teaserText.replace(
                  hook,
                  `${shown} [CORTE] ${hook.slice(shown.length).trim()}`,
              )
            : teaserText;
    const readingSchema =
        "schema" in prompts.READING_PROMPT
            ? prompts.READING_PROMPT.schema
            : undefined;
    const readingWritten = await call("reading", prompts, {
        system: prompts.READING_PROMPT.system,
        prompt: prompts.READING_PROMPT.prompt(profile, kept, TODAY),
        schema: readingSchema,
    });
    const readingReview = await reviewed(
        prompts,
        profile,
        readingWritten,
        readingSchema,
    );
    const reading = { ...readingWritten, text: readingReview.text };
    const review = {
        changes: [...teaserReview.changes, ...readingReview.changes],
        costUsd:
            (teaserReview.call?.costUsd ?? 0) +
            (readingReview.call?.costUsd ?? 0),
        seconds: [teaserReview.call?.seconds, readingReview.call?.seconds],
    };
    // Free and paid scenes together: everything the person reads.
    const readingText = readingAsText(reading.text, kept, LOVE_PLAN);
    // What paying adds: the judge reads it apart from the free scenes.
    const paidText = readingAsText(reading.text, "", LOVE_PLAN);
    const chat = await call("chat", prompts, {
        system: prompts.chatSystemPrompt(profile, reading.text, kept, TODAY),
        prompt: profile.chatQuestion,
    });
    const { verdict, costUsd } = await judge(
        profile,
        teaserCut,
        paidText,
        chat.text,
    );
    const all = [readingText, chat.text].join("\n");
    return {
        profile: profile.name,
        teaser,
        reading,
        chat,
        review,
        verdict,
        judgeCostUsd: costUsd,
        checks: {
            teaserWords: words(teaserText),
            readingWords: words(readingText),
            ...readability(readingText),
            teaserWordsPerSentence: readability(teaserText).wordsPerSentence,
            crossTalk: crossTalk(kept, reading.text),
            cutByModel,
            hookShown: shown ?? "",
            chatWords: words(chat.text),
            cut: [teaser, reading, chat].some(
                (c) => c.finishReason === "length",
            ),
            banned: all.match(BANNED) ?? [],
            echoes: echoes(profile, `${teaserText}\n${readingText}`),
            copiedClues: copiedClues(profile, `${teaserText}\n${readingText}`),
            shingles: shingles(`${teaserText}\n${readingText}`),
            voseo: all.match(VOSEO) ?? [],
            otherGender: all.match(OTHER_GENDER) ?? [],
            jargon: all.match(JARGON) ?? [],
            teaserPlanets: (
                teaserText.match(
                    /(?<!\p{L})(Luna|Venus|Marte|Sol)(?!\p{L})/gu,
                ) ?? []
            ).length,
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
    `eval "${label}" · ${profiles.length} profiles · models ${JSON.stringify(MODELS)} · judge ${JUDGE} · max $${BUDGET}`,
);
/**
 * A few profiles at a time (`--parallel`), so reaching the budget leaves
 * only those calls running; the profiles it cut short are left out.
 */
const queue = [...profiles];
const done: Awaited<ReturnType<typeof runProfile>>[] = [];
await Promise.all(
    Array.from({ length: Number(args.parallel ?? 4) }, async () => {
        for (let p = queue.shift(); p; p = queue.shift()) {
            try {
                done.push(await runProfile(prompts, p));
            } catch (error) {
                if (!(error instanceof OverBudget)) throw error;
                queue.length = 0;
            }
        }
    }),
);
const order = (r: (typeof done)[number]) =>
    PROFILES.findIndex((p) => p.name === r.profile);
const results = done.sort((a, b) => order(a) - order(b));
console.log(
    `$${spent.toFixed(2)} spent` +
        (results.length < profiles.length
            ? ` · budget reached: ${results.length} of ${profiles.length} profiles`
            : ""),
);
if (results.length === 0) process.exit(1);

const mean = (values: number[]) =>
    Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
const rubric = (pick: (v: Verdict) => number) =>
    mean(results.map((r) => pick(r.verdict)));
const summary = {
    label,
    models: MODELS,
    "teaser.especificidad": rubric((v) => v.teaser.especificidad),
    "teaser.gancho": rubric((v) => v.teaser.gancho),
    "teaser.claridad": rubric((v) => v.teaser.claridad),
    "teaser.corte": rubric((v) => v.teaser.corte),
    corteDeLaIA: mean(results.map((r) => (r.checks.cutByModel ? 1 : 0))),
    "lectura.claridad": rubric((v) => v.lectura.claridad),
    jergaSinExplicar: results.reduce(
        (n, r) => n + r.verdict.jerga_sin_explicar.length,
        0,
    ),
    terminosTecnicos: results.reduce((n, r) => n + r.checks.jargon.length, 0),
    planetasEnGancho: mean(results.map((r) => r.checks.teaserPlanets)),
    "lectura.especificidad": rubric((v) => v.lectura.especificidad),
    "lectura.uso_de_datos": rubric((v) => v.lectura.uso_de_datos),
    "lectura.rigor": rubric((v) => v.lectura.rigor),
    "lectura.voz_y_gusto": rubric((v) => v.lectura.voz_y_gusto),
    "lectura.respuesta": rubric((v) => v.lectura.respuesta_a_su_pregunta),
    "lectura.gesto": rubric((v) => v.lectura.gesto_final),
    "lectura.magia": rubric((v) => v.lectura.magia),
    "lectura.escenas": rubric((v) => v.lectura.escenas),
    "lectura.inferencia": rubric((v) => v.lectura.inferencia),
    ecos: results.reduce((n, r) => n + r.checks.echoes.length, 0),
    pistasCopiadas: results.reduce(
        (n, r) => n + r.checks.copiedClues.length,
        0,
    ),
    repetidasEntrePerfiles: sharedAcrossProfiles(results),
    astroAjeno: results.reduce((n, r) => n + r.checks.crossTalk.length, 0),
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
    supuestosGraves: results.reduce(
        (n, r) => n + r.verdict.supuestos_graves.length,
        0,
    ),
    cambiosRevision: results.reduce((n, r) => n + r.review.changes.length, 0),
    segundosRevisionGancho: mean(results.map((r) => r.review.seconds[0] ?? 0)),
    supuestosLeves: results.reduce(
        (n, r) => n + r.verdict.supuestos_leves.length,
        0,
    ),
    cliches: results.reduce((n, r) => n + r.verdict.cliches.length, 0),
    cortes: results.filter((r) => r.checks.cut).length,
    voseo: results.reduce((n, r) => n + r.checks.voseo.length, 0),
    palabrasLectura: mean(results.map((r) => r.checks.readingWords)),
    palabrasPorFrase: mean(results.map((r) => r.checks.wordsPerSentence)),
    frasesLargas: mean(results.map((r) => r.checks.longSentences)),
    palabrasPorFraseGancho: mean(
        results.map((r) => r.checks.teaserWordsPerSentence),
    ),
    segundosLectura: mean(results.map((r) => r.reading.seconds)),
    segundosChat: mean(results.map((r) => r.chat.seconds)),
    usdPorCompra:
        mean(
            results.map(
                (r) =>
                    (r.teaser.costUsd +
                        r.reading.costUsd +
                        r.chat.costUsd +
                        r.review.costUsd) *
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
