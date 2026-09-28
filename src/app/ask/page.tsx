import { AskInterface } from "@/components/ask/AskInterface";
import { pageMetadata } from "@/lib/seo";
import { validLinkPaths } from "@/lib/corpus";

export const metadata = pageMetadata({
    title: "Ask",
    description: "Ask about my projects, decisions and measurements. Answers come from the checked portfolio and say so when they have no data.",
    path: "/ask",
});

export default function AskPage() {
    return (
        <div className="h-full min-h-0 flex flex-col">
            <header className="mb-4 shrink-0">
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">ASK</div>
                <h1 className="text-header mb-1">Ask how I think</h1>
                <p className="text-[14px] text-(--text-secondary) max-w-2xl">
                    An assistant grounded in my checked engineering record: projects, decisions, measurements and the things I got wrong.
                    It also reads repository docs for code detail; when those disagree with the checked record, the record wins.
                </p>
            </header>
            <div className="flex-1 min-h-0">
                <AskInterface allowedLinks={validLinkPaths()} />
            </div>
        </div>
    );
}
