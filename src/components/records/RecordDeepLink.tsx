"use client";

import { useEffect } from "react";

/**
 * Deep links: /decisions#some-id opens and scrolls to that record. The card
 * itself is server-rendered; this renders nothing and only reacts to the hash.
 */
export function RecordDeepLink({ id }: { id: string }) {
    useEffect(() => {
        function openIfLinked() {
            if (window.location.hash !== `#${id}`) return;
            const article = document.getElementById(id);
            const details = article?.querySelector("details");
            if (!article || !details) return;
            details.open = true;
            article.scrollIntoView({ block: "start" });
        }
        openIfLinked();
        window.addEventListener("hashchange", openIfLinked);
        return () => window.removeEventListener("hashchange", openIfLinked);
    }, [id]);

    return null;
}
