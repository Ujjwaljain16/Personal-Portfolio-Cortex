import { describe, expect, it } from "vitest";
import { cardText } from "@/lib/ogCard";

describe("cardText", () => {
    it("drops emoji so the image renderer never needs to fetch glyphs during a build", () => {
        expect(cardText("Fixed it \u{1F44D}")).toBe("Fixed it");
        expect(cardText("a \u{1F44D} b \u{1F44D}")).toBe("a b");
    });

    it("keeps ordinary text and the en dash used in project periods", () => {
        expect(cardText("Aug–Sep 2026")).toBe("Aug–Sep 2026");
        expect(cardText("How AgentBrake Intercepts MCP Tool Calls")).toBe("How AgentBrake Intercepts MCP Tool Calls");
    });

    it("collapses the gaps a removed character leaves", () => {
        expect(cardText("one  \u{1F600}  two")).toBe("one two");
    });
});
