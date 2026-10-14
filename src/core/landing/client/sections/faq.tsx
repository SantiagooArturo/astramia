import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/frontend/components/ui/accordion";
import { FAQS } from "../../domain/content";
import { Reveal } from "../effects";
import { SectionIntro } from "./section-intro";

export function Faq() {
    return (
        <section
            id="preguntas"
            className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 md:py-28"
        >
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
                <Reveal className="lg:col-span-4">
                    <SectionIntro
                        compact
                        index="06"
                        label="Preguntas"
                        title={
                            <>
                                Lo que nos preguntan{" "}
                                <em className="text-astral-gold">
                                    antes de pagar.
                                </em>
                            </>
                        }
                    />
                </Reveal>
                <Reveal delay={0.1} className="lg:col-span-8">
                    <Accordion
                        type="single"
                        collapsible
                        className="border-astral-ink border-t"
                    >
                        {FAQS.map((faq, i) => (
                            <AccordionItem
                                key={faq.question}
                                value={faq.question}
                                className="border-astral-ink"
                            >
                                <AccordionTrigger className="gap-6 py-6 text-left font-display text-xl hover:no-underline sm:text-2xl [&>svg]:size-5 [&>svg]:text-astral-gold">
                                    <span className="flex items-baseline gap-4">
                                        <span className="font-mono text-astral-gold/70 text-xs">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        {faq.question}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="max-w-2xl pb-7 pl-9 text-pretty text-base text-muted-foreground leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Reveal>
            </div>
        </section>
    );
}
