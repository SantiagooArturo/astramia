import { STEPS } from "../../domain/content";
import { Reveal, ScrollPath } from "../effects";
import { SectionIntro } from "./section-intro";

// A gently weaving orbit that runs the full height of the list.
const ORBIT_PATH = "M24 0 C44 110 4 220 24 330 S44 550 24 660 S4 880 24 1000";

export function HowItWorks() {
    return (
        <section
            id="como-funciona"
            className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 md:py-28"
        >
            <Reveal>
                <SectionIntro
                    index="02"
                    label="Cómo funciona"
                    title={
                        <>
                            De la pregunta a la lectura,{" "}
                            <em className="text-astral-gold">sin cita</em>.
                        </>
                    }
                    description="Todo desde el celular. La línea de abajo se dibuja mientras bajas; el proceso real tarda menos que leerla."
                />
            </Reveal>

            <div className="relative mt-16 md:mt-20">
                {/* Orbit line, drawn by scroll, lives in the second column */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-0 bottom-0 left-0 w-12 md:left-24"
                >
                    <ScrollPath d={ORBIT_PATH} viewBox="0 0 48 1000" />
                </div>

                <ol className="relative flex flex-col gap-14 md:gap-20">
                    {STEPS.map((step, i) => (
                        <li
                            key={step.numeral}
                            className="grid grid-cols-[3rem_1fr] gap-x-4 md:grid-cols-[6rem_3rem_1fr_7rem] md:gap-x-6"
                        >
                            <Reveal delay={i * 0.05} className="contents">
                                <span className="hidden font-display text-6xl text-astral-gold/80 leading-none md:block">
                                    {step.numeral}
                                </span>
                                {/* Node on the orbit */}
                                <span className="relative flex h-6 w-12 items-start justify-center md:w-12">
                                    <span className="mt-1.5 size-3 rounded-full border border-astral-gold bg-background shadow-[0_0_18px_-2px_var(--astral-gold)]" />
                                </span>
                                <div className="flex max-w-xl flex-col gap-2">
                                    <p className="font-mono text-[11px] text-astral-gold/80 uppercase tracking-[0.2em] md:hidden">
                                        {step.numeral} · {step.note}
                                    </p>
                                    <h3 className="font-display text-3xl leading-tight sm:text-4xl">
                                        {step.title}
                                    </h3>
                                    <p className="text-pretty text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                                <span className="hidden pt-2 text-right font-mono text-muted-foreground/70 text-xs uppercase tracking-[0.18em] md:block">
                                    {step.note}
                                </span>
                            </Reveal>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
