import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // The chat endpoint is not a page and costs money to call.
            disallow: "/api/",
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
