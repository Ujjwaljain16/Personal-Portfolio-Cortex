import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = SITE_URL;

    return [
        { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
        { url: `${baseUrl}/system`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
        { url: `${baseUrl}/decisions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${baseUrl}/experiments`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${baseUrl}/deployments`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${baseUrl}/blogs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
        // ...removed simulate-founder from sitemap
        { url: `${baseUrl}/ask`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ];
}
