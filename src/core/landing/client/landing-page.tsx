import { Comet, Nebula, Starfield } from "./effects";
import { AiConversation } from "./sections/ai-conversation";
import { Experiences } from "./sections/experiences";
import { Faq } from "./sections/faq";
import { FinalCta } from "./sections/final-cta";
import { FinePrint } from "./sections/fine-print";
import { Hero } from "./sections/hero";
import { HowItWorks } from "./sections/how-it-works";
import { Pricing } from "./sections/pricing";
import { SiteFooter } from "./sections/site-footer";
import { SiteHeader } from "./sections/site-header";
import { SkyStrip } from "./sections/sky-today";

export function LandingPage() {
    return (
        // `theme-astral` remaps shadcn tokens to the cosmic palette (globals.css)
        <div className="theme-astral relative min-h-svh overflow-x-clip bg-background text-foreground">
            <Nebula />
            <Starfield />
            <Comet />
            <div className="relative z-10">
                <SiteHeader />
                <main>
                    <Hero />
                    <SkyStrip />
                    <Experiences />
                    <HowItWorks />
                    <AiConversation />
                    <Pricing />
                    <FinePrint />
                    <Faq />
                    <FinalCta />
                </main>
                <SiteFooter />
            </div>
        </div>
    );
}
