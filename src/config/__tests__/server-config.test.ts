import { describe, expect, it } from "vitest";
import { requestOrigin, ServerConfig } from "../server-config";

describe("requestOrigin", () => {
    it("trusts the configured origin and its www twin", () => {
        expect(ServerConfig.appOrigins).toEqual([
            "http://localhost:3000",
            "http://www.localhost:3000",
        ]);
        expect(
            requestOrigin(new Request("http://www.localhost:3000/api/v1/x")),
        ).toBe("http://www.localhost:3000");
    });

    it("falls back to the configured origin for a foreign host", () => {
        expect(
            requestOrigin(new Request("https://evil.example/api/v1/x")),
        ).toBe("http://localhost:3000");
    });
});
