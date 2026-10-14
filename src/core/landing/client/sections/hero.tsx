import { HERO, OFFER } from "../../domain/content";
import { Reveal, ScrambleText } from "../effects";
import { SignExplorer } from "./sign-explorer";

export function Hero() {
    return (
        <section className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 md:pt-16 lg:pb-24">
            {/* Marginalia, desktop only */}
            <p
                aria-hidden
                className="-left-2 absolute top-16 hidden rotate-180 font-mono text-[10px] text-muted-foreground/50 tracking-[0.32em] [writing-mode:vertical-rl] xl:block"
            >
                ASTRAMIA · LECTURA Nº I · AMOR Y RELACIONES
            </p>

            <div className="grid gap-10 [grid-template-areas:'copy'_'picker'_'wheel'] lg:grid-cols-[7fr_5fr] lg:gap-x-10 lg:[grid-template-areas:'copy_wheel'_'picker_wheel']">
                <div className="flex flex-col gap-6 [grid-area:copy]">
                    <Reveal>
                        <p className="flex items-center gap-3 font-mono text-[11px] text-astral-gold/80 uppercase tracking-[0.24em]">
                            <span
                                aria-hidden
                                className="h-px w-8 bg-astral-gold/50"
                            />
                            {HERO.kicker}
                        </p>
                    </Reveal>

                    <Reveal delay={0.08}>
                        <h1 className="font-display text-[2.9rem] leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.4rem]">
                            {HERO.headline[0]}
                            <br />
                            <em className="text-astral-gold">
                                <ScrambleText
                                    text={HERO.headline[1]}
                                    delay={0.4}
                                    duration={1.6}
                                />
                            </em>
                            <br />
                            {HERO.headline[2]}
                        </h1>
                    </Reveal>

                    <Reveal delay={0.16}>
                        <p className="max-w-xl text-pretty text-lg text-muted-foreground sm:text-xl">
                            {HERO.lede}
                        </p>
                    </Reveal>

                    <Reveal delay={0.22}>
                        <dl className="grid max-w-xl grid-cols-3 gap-4 border-astral-ink border-t pt-4 font-mono text-[11px] uppercase tracking-[0.16em]">
                            <div>
                                <dt className="text-muted-foreground/70">
                                    Lista en
                                </dt>
                                <dd className="mt-1 text-foreground">
                                    minutos
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground/70">
                                    Chat
                                </dt>
                                <dd className="mt-1 text-foreground">
                                    {OFFER.chatHours} horas
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground/70">
                                    Pago
                                </dt>
                                <dd className="mt-1 text-foreground">
                                    único · {OFFER.price}
                                </dd>
                            </div>
                        </dl>
                    </Reveal>
                </div>

                <SignExplorer />
            </div>
        </section>
    );
}
