/**
 * Renders the model's Markdown subset (## headings, paragraphs, **bold**)
 * without injecting HTML.
 */
export function ReadingText({ text }: { text: string }) {
    const blocks = text.split(/\n{2,}/).map((block) => block.trim());
    return (
        <div className="flex flex-col gap-5 text-pretty text-base leading-relaxed sm:text-lg">
            {blocks.filter(Boolean).map((block, i) => {
                const key = `${i}-${block.slice(0, 16)}`;
                const heading = block.match(/^#{1,3}\s+(.*)$/);
                if (heading)
                    return (
                        <h2
                            key={key}
                            className="mt-4 font-display text-2xl text-astral-gold sm:text-3xl"
                        >
                            {heading[1]}
                        </h2>
                    );
                return <p key={key}>{renderInline(block)}</p>;
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
