import { describe, expect, it } from "vitest";
import { toReadingBlocks } from "../markdown";

describe("toReadingBlocks", () => {
    it("splits a heading glued to its paragraph by a single newline", () => {
        expect(
            toReadingBlocks(
                "Apertura.\n\n## Fuego y agua\nTe enamoras rápido.\nY lo sabes.",
            ),
        ).toEqual([
            { kind: "paragraph", text: "Apertura." },
            { kind: "heading", text: "Fuego y agua" },
            { kind: "paragraph", text: "Te enamoras rápido. Y lo sabes." },
        ]);
    });

    it("drops list markers and blank runs", () => {
        expect(toReadingBlocks("* uno\n\n\n- dos")).toEqual([
            { kind: "paragraph", text: "uno" },
            { kind: "paragraph", text: "dos" },
        ]);
    });
});
