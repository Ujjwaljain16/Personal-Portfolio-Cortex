import { describe, expect, it } from "vitest";
import { jsonLd, pageMetadata } from "@/lib/seo";

describe("pageMetadata", () => {
    const meta = pageMetadata({ title: "Decisions", description: "About decisions.", path: "/decisions" });

    it("sets a canonical path and complete Open Graph and Twitter blocks", () => {
        expect(meta.alternates?.canonical).toBe("/decisions");
        expect(meta.openGraph).toMatchObject({ url: "/decisions", title: "Decisions | Ujjwal Jain", description: "About decisions." });
        expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Decisions | Ujjwal Jain" });
    });

    it("points social previews at the generated image", () => {
        const images = meta.openGraph?.images as { url: string }[];
        expect(images[0].url).toBe("/opengraph-image");
    });

    it("adds article fields only for articles", () => {
        expect(meta.openGraph).not.toHaveProperty("publishedTime");
        const article = pageMetadata({
            title: "Post",
            description: "d",
            path: "/blogs/x",
            type: "article",
            publishedTime: "2026-02-10",
            modifiedTime: "2026-09-28",
            tags: ["a"],
        });
        expect(article.openGraph).toMatchObject({ type: "article", publishedTime: "2026-02-10", modifiedTime: "2026-09-28" });
    });
});

describe("jsonLd", () => {
    it("escapes < so content cannot close the script tag", () => {
        const out = jsonLd({ name: "</script><script>alert(1)</script>" });
        expect(out).not.toContain("</script>");
        expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
    });
});
