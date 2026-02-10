"use client";

import { useEffect } from "react";
import { useSystemStore } from "@/lib/store";
import { AskInterface } from "@/components/ask/AskInterface";

export default function AskPage() {
    const setContextContent = useSystemStore((s) => s.setContextContent);

    // Clear context on mount — let MODULE_CONFIG show empty state
    useEffect(() => {
        setContextContent(null);
    }, [setContextContent]);

    return (
        <div className="h-full">
            <AskInterface />
        </div>
    );
}
