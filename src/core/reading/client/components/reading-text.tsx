import { toReadingBlocks } from "@/core/reading/domain/markdown";

/**
 * Renders the model's Markdown subset (## headings, paragraphs, **bold**)
 * without injecting HTML.
 */
export function ReadingText({ text }: { text: string }) {
    return (
        <div className="flex flex-col gap-5 text-pretty text-base leading-relaxed sm:text-lg">
            {toReadingBlocks(text).map((block, i) => {
                const key = `${i}-${block.text.slice(0, 16)}`;
                return block.kind === "heading" ? (
                    <h2
                        key={key}
                        className="mt-4 font-display text-2xl text-astral-gold sm:text-3xl"
                    >
                        {block.text}
                    </h2>
                ) : (
                    <p key={key}>{renderInline(block.text)}</p>
                );
            })}
        </div>
    );
}

/** **bold** → <strong>; stray asterisks dropped. Shared with the chat. */
export function renderInline(text: string) {
    return text
        .split(/(\*\*[^*]+\*\*)/)
        .map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? (
                <strong key={i}>{part.slice(2, -2)}</strong>
            ) : (
                part.replace(/\*/g, "")
            ),
        );
}
