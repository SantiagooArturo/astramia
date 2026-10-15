"use client";

import {
    AnimatePresence,
    MotionConfig,
    motion,
    useScroll,
    useSpring,
} from "motion/react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Starfield } from "@/core/landing/client/effects";
import { AstramiaLogo } from "@/core/landing/client/sections/astramia-logo";
import { longDate, shortDate } from "@/core/reading/domain/chart";
import { buildStory, type StoryStep } from "@/core/reading/domain/story";
import type { Reading } from "@/core/reading/domain/types";
import { cn } from "@/frontend/lib/utils";
import { renderInline } from "../components/reading-text";
import { StoryStage } from "./story-stage";

export const CHAT_ANCHOR = "chat";

/** Text arrives softly as its step reaches the middle of the screen. */
const ENTER = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] },
} as const;

/** Over the scene on a phone; beside it on a wide screen. */
const CARD =
    "max-lg:rounded-2xl max-lg:border max-lg:border-astral-ink max-lg:bg-background/75 max-lg:p-5 max-lg:backdrop-blur-md";

function StepContent({ step }: { step: StoryStep }) {
    switch (step.kind) {
        case "prologue":
            return (
                <motion.div
                    {...ENTER}
                    className={cn("flex flex-col gap-3", CARD)}
                >
                    <p className="font-mono text-[11px] text-astral-gold uppercase tracking-[0.2em]">
                        Así empezó tu lectura
                    </p>
                    <p className="text-pretty font-display text-2xl leading-snug sm:text-3xl">
                        {step.text}
                    </p>
                </motion.div>
            );
        case "chapter":
            return (
                <motion.div {...ENTER} className="flex flex-col gap-4">
                    <p className="font-mono text-[11px] text-astral-gold uppercase tracking-[0.24em]">
                        Capítulo {step.numeral}
                        {step.label && ` · ${step.label}`}
                    </p>
                    <h2 className="text-balance font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
                        {step.title}
                    </h2>
                </motion.div>
            );
        case "title":
            return (
                <div className="flex flex-col gap-4">
                    <motion.p
                        {...ENTER}
                        className="font-mono text-[11px] text-astral-gold uppercase tracking-[0.24em]"
                    >
                        {step.eyebrow}
                    </motion.p>
                    <motion.h3
                        {...ENTER}
                        className="text-balance font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl"
                    >
                        {step.title}
                    </motion.h3>
                    {step.line && (
                        <motion.p
                            {...ENTER}
                            transition={{ ...ENTER.transition, delay: 0.6 }}
                            className="max-w-md text-pretty text-lg text-muted-foreground"
                        >
                            {step.line}
                        </motion.p>
                    )}
                </div>
            );
        case "note":
            return (
                <motion.div
                    {...ENTER}
                    className={cn(
                        "flex flex-col gap-2 border-astral-gold/60 lg:border-l lg:pl-6",
                        CARD,
                    )}
                >
                    <p className="font-mono text-[11px] text-astral-gold uppercase tracking-[0.2em]">
                        {step.label}
                    </p>
                    <p className="text-pretty text-lg leading-relaxed">
                        {step.text}
                    </p>
                </motion.div>
            );
        case "paragraph":
            return (
                <motion.p
                    {...ENTER}
                    className={cn(
                        "text-pretty text-lg leading-relaxed sm:text-xl sm:leading-relaxed",
                        CARD,
                    )}
                >
                    {renderInline(step.text)}
                </motion.p>
            );
        case "quote":
            return (
                <motion.blockquote
                    {...ENTER}
                    transition={{ ...ENTER.transition, duration: 1.6 }}
                    className="text-balance text-center font-display text-4xl text-astral-gold-soft leading-tight [text-shadow:0_2px_24px_rgb(0_0_0/70%)] sm:text-5xl lg:text-left lg:text-6xl"
                >
                    {step.text}
                </motion.blockquote>
            );
    }
}

/**
 * Nothing on screen is made up: every scene is their sky, computed for the
 * day (and hour, and place) they gave. The cover says so.
 */
function computedFrom(reading: Reading): string {
    const when = reading.birthTime
        ? `${longDate(reading.birthDate)}, a las ${reading.birthTime}`
        : longDate(reading.birthDate);
    const where = reading.birthPlace ? `, en ${reading.birthPlace}` : "";
    return `Calculado con la posición real del Sol, la Luna, Venus y Marte el ${when}${where}.`;
}

/** Steps that introduce something get the whole screen; text, a bit less. */
function stepHeight(step: StoryStep): string {
    return step.kind === "paragraph" || step.kind === "note"
        ? "min-h-[85svh]"
        : "min-h-[100svh]";
}

/**
 * The paid reading, told on scroll. A stage holds one scene at a time (their
 * sky, the Moon settling on their phase, Venus over its sign…) while the
 * text slides over it on a phone or beside it on a wide screen. It ends at
 * dawn, where the chat (the Sun) takes over.
 */
export function ReadingStory({
    reading,
    content,
    notice,
    account,
    chat,
}: {
    reading: Reading;
    content: string;
    /** On the cover, e.g. "save it": it only lives in this browser. */
    notice?: ReactNode;
    /** Between the story and the chat. */
    account?: ReactNode;
    chat: ReactNode;
}) {
    const story = useMemo(
        () =>
            buildStory({
                teaser: reading.teaser,
                content,
                chart: reading.chart,
                question: reading.question,
                skyAhead: reading.skyAhead,
            }),
        [reading, content],
    );
    const [active, setActive] = useState(0);
    const stepRefs = useRef<(HTMLElement | null)[]>([]);
    const storyRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: storyRef,
        offset: ["start start", "end end"],
    });
    const progress = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
    });

    // Once the chat is on screen, "Ir al chat" has nothing left to do.
    const [inChat, setInChat] = useState(false);
    useEffect(() => {
        const chat = document.getElementById(CHAT_ANCHOR);
        if (!chat) return;
        const observer = new IntersectionObserver(
            ([entry]) => setInChat(entry.isIntersecting),
            { threshold: 0.15 },
        );
        observer.observe(chat);
        return () => observer.disconnect();
    }, []);

    // The step crossing the middle of the screen owns the stage.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const index = Number(
                        (entry.target as HTMLElement).dataset.step,
                    );
                    if (!Number.isNaN(index)) setActive(index);
                }
            },
            { rootMargin: "-50% 0px -50% 0px" },
        );
        for (const el of stepRefs.current) if (el) observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const step = story.steps[active] ?? story.steps[0];
    const chapter = step.chapter === null ? null : story.chapters[step.chapter];
    const dawn = step.visual.kind === "dawn";

    return (
        <MotionConfig reducedMotion="user">
            <div className="theme-astral relative bg-background text-foreground">
                <Starfield />

                <header className="fixed inset-x-0 top-0 z-30">
                    <motion.div
                        aria-hidden
                        className="h-0.5 origin-left bg-astral-gold"
                        style={{ scaleX: progress }}
                    />
                    <nav className="flex items-center justify-between gap-3 bg-gradient-to-b from-background/90 to-transparent px-4 pt-3 pb-6 sm:px-6">
                        <Link href="/" aria-label="Astramia AI, inicio">
                            <AstramiaLogo className="scale-90 max-sm:[&>span]:hidden" />
                        </Link>
                        <AnimatePresence mode="wait">
                            {chapter && !inChat && (
                                <motion.p
                                    key={chapter.numeral}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="truncate font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]"
                                >
                                    {chapter.numeral} · {chapter.label}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        <AnimatePresence initial={false}>
                            {!inChat && (
                                <motion.a
                                    href={`#${CHAT_ANCHOR}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="shrink-0 rounded-full border border-astral-gold/40 px-3 py-1.5 font-mono text-[11px] text-astral-gold uppercase tracking-[0.16em] hover:bg-astral-gold/10"
                                >
                                    Ir al chat
                                </motion.a>
                            )}
                        </AnimatePresence>
                    </nav>
                </header>

                <section
                    ref={storyRef}
                    aria-label="Tu lectura"
                    className="relative z-10 lg:grid lg:grid-cols-2"
                >
                    <div className="sticky top-0 h-svh overflow-hidden lg:self-start">
                        <div
                            className={cn(
                                "absolute inset-x-0 top-0 lg:inset-0 lg:h-auto lg:pt-0",
                                // The sunrise needs the whole screen; the rest
                                // keep the bottom for the text.
                                dawn ? "h-svh" : "h-[60svh] pt-12",
                            )}
                        >
                            <StoryStage
                                visual={step.visual}
                                chart={reading.chart}
                                born={shortDate(reading.birthDate)}
                            />
                        </div>
                        {/* Keeps text legible where it slides over the scene. */}
                        <div
                            aria-hidden
                            className={cn(
                                "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/70 to-transparent transition-opacity duration-700 lg:hidden",
                                dawn && "opacity-0",
                            )}
                        />
                    </div>

                    <div className="relative -mt-[100svh] px-5 sm:px-8 lg:mt-0 lg:px-14 xl:px-20">
                        <article
                            ref={(el) => {
                                stepRefs.current[story.steps.length] = el;
                            }}
                            data-step={0}
                            className="flex min-h-[100svh] flex-col justify-end gap-6 pb-[10svh] lg:justify-center lg:pb-0"
                        >
                            <motion.div
                                {...ENTER}
                                className="flex flex-col gap-4"
                            >
                                <p className="font-mono text-[11px] text-astral-gold uppercase tracking-[0.24em]">
                                    Tu lectura de amor · {reading.sunSign}
                                </p>
                                <h1 className="text-balance font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
                                    El cielo del {longDate(reading.birthDate)}
                                </h1>
                                <p className="max-w-md text-pretty text-lg text-muted-foreground">
                                    Así estaba el cielo cuando naciste. Esta es
                                    la historia que cuenta sobre cómo amas.
                                </p>
                                <p className="max-w-md text-pretty font-mono text-[11px] text-muted-foreground uppercase leading-relaxed tracking-[0.14em]">
                                    {computedFrom(reading)}
                                </p>
                            </motion.div>
                            <ScrollCue />
                            {notice}
                        </article>

                        {story.steps.map((s, i) => (
                            <article
                                // Steps are fixed for a given text: order is their identity.
                                key={i}
                                ref={(el) => {
                                    stepRefs.current[i] = el;
                                }}
                                data-step={i}
                                className={cn(
                                    "flex flex-col justify-end pb-[10svh] lg:justify-center lg:pb-0",
                                    stepHeight(s),
                                    s.kind === "quote" &&
                                        "max-lg:justify-start max-lg:pt-[18svh]",
                                    // Alone on a quiet night: the middle of the screen.
                                    s.kind === "chapter" &&
                                        s.visual.kind === "night" &&
                                        "max-lg:justify-center max-lg:pb-0",
                                )}
                            >
                                <StepContent step={s} />
                            </article>
                        ))}
                    </div>
                </section>

                {account && (
                    <div className="relative z-10 mx-auto max-w-2xl px-5 py-10 sm:px-8">
                        {account}
                    </div>
                )}

                <section
                    id={CHAT_ANCHOR}
                    aria-label="Chat sobre tu lectura"
                    className="relative z-10 scroll-mt-4"
                >
                    {chat}
                </section>
            </div>
        </MotionConfig>
    );
}

function ScrollCue() {
    return (
        <div
            aria-hidden
            className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]"
        >
            <span className="relative h-10 w-px overflow-hidden bg-astral-ink">
                <motion.span
                    className="absolute inset-x-0 top-0 h-1/2 bg-astral-gold"
                    animate={{ y: ["-100%", "200%"] }}
                    transition={{
                        duration: 1.8,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />
            </span>
            Desliza para empezar
        </div>
    );
}
