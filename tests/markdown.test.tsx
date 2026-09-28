import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "@/components/Markdown";

const html = (md: string, variant: "article" | "chat" = "article") =>
    renderToStaticMarkup(<Markdown variant={variant}>{md}</Markdown>);

describe("Markdown", () => {
    it("does not render raw HTML, scripts or images from untrusted text", () => {
        const out = html('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n![alt](https://example.com/a.png)');
        expect(out).not.toContain("<script");
        expect(out).not.toContain("<img");
        // Raw HTML is shown as escaped text, never as elements.
        expect(out).toContain("&lt;script&gt;");
        expect(out).not.toMatch(/<[a-z]+[^>]*\sonerror=/i);
    });

    it("drops javascript: links", () => {
        const out = html("[click](javascript:alert(1))");
        expect(out).not.toContain("javascript:");
    });

    it("opens external links safely and leaves internal links alone", () => {
        const external = html("[site](https://example.com)");
        expect(external).toContain('target="_blank"');
        expect(external).toContain('rel="noopener noreferrer"');

        const internal = html("[post](/blogs/agent-brake-architecture)");
        expect(internal).not.toContain("target=");
    });

    it("never renders an h1, so the page keeps a single h1", () => {
        expect(html("# Title\n\n## Section")).not.toContain("<h1");
    });

    it("promotes ### headings to h2 when a post has no ## headings", () => {
        const out = html("### First\n\ntext\n\n#### Second");
        expect(out).toContain("<h2");
        expect(out).toContain("<h3");
        expect(out).not.toContain("<h4");
    });

    it("keeps heading levels as written when the post uses ##", () => {
        const out = html("## Section\n\n### Sub");
        expect(out).toContain("<h2");
        expect(out).toContain("<h3");
    });

    it("renders fenced code as a pre block and inline code as code", () => {
        const out = html("Use `npm ci`.\n\n```ts\nconst x = 1;\n```");
        expect(out).toContain("<pre");
        expect(out).toContain("npm ci");
        expect(out).toContain("const x = 1;");
    });
});
