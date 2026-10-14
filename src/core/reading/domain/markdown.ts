export type ReadingBlock =
    | { kind: "heading"; text: string }
    | { kind: "paragraph"; text: string };

/**
 * The model's Markdown subset → blocks. Line-based, so a "## Título" glued to
 * its paragraph by a single newline still becomes a heading.
 */
export function toReadingBlocks(markdown: string): ReadingBlock[] {
    const blocks: ReadingBlock[] = [];
    let lines: string[] = [];
    const flush = () => {
        if (lines.length)
            blocks.push({ kind: "paragraph", text: lines.join(" ") });
        lines = [];
    };
    for (const raw of markdown.split("\n")) {
        const line = raw.trim();
        const heading = line.match(/^#{1,6}\s+(.+)$/);
        if (heading) {
            flush();
            blocks.push({ kind: "heading", text: heading[1].trim() });
        } else if (line) lines.push(line.replace(/^[-*]\s+/, ""));
        else flush();
    }
    flush();
    return blocks;
}
