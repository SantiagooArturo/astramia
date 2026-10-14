import { FINE_PRINT } from "../../domain/content";
import { Reveal } from "../effects";
import { SectionIntro } from "./section-intro";

/** Trust, written as clear clauses instead of an icon grid. */
export function FinePrint() {
    return (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
                <Reveal className="lg:col-span-4">
                    <SectionIntro
                        compact
                        index="05"
                        label="Letra clara"
                        title={
                            <>
                                Lo que te diríamos{" "}
                                <em className="text-astral-gold">
                                    en la primera cita.
                                </em>
                            </>
                        }
                        description="Cuatro cosas que preferimos decir antes de que las busques en la letra pequeña."
                    />
                </Reveal>

                <Reveal delay={0.1} className="lg:col-span-8">
                    <ol className="grid border-astral-ink border-t sm:grid-cols-2 sm:gap-x-10">
                        {FINE_PRINT.map((point) => (
                            <li
                                key={point.numeral}
                                className="flex flex-col gap-3 border-astral-ink border-b py-7"
                            >
                                <span className="font-mono text-astral-gold/80 text-xs tracking-[0.2em]">
                                    {point.numeral}
                                </span>
                                <h3 className="font-display text-2xl leading-tight sm:text-3xl">
                                    {point.title}
                                </h3>
                                <p className="text-pretty text-muted-foreground text-sm leading-relaxed">
                                    {point.description}
                                </p>
                            </li>
                        ))}
                    </ol>
                </Reveal>
            </div>
        </section>
    );
}
