import { AskInterface } from "@/components/ask/AskInterface";

export default function AskPage() {
    return (
        <div className="h-full min-h-0 flex flex-col">
            <header className="mb-4 shrink-0">
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">ASK</div>
                <h1 className="text-header mb-1">Ask how I think</h1>
                <p className="text-[14px] text-(--text-secondary)">
                    An assistant grounded in my written engineering record: projects, decisions and trade-offs.
                </p>
            </header>
            <div className="flex-1 min-h-0">
                <AskInterface />
            </div>
        </div>
    );
}
