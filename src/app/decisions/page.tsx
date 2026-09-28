import Link from "next/link";
import { RecordsBrowser } from "@/components/records/RecordsBrowser";
import { RecordCard } from "@/components/records/RecordCard";
import { toListItem } from "@/components/records/toListItem";
import { decisions } from "@/data/records";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "Decisions",
    description:
        "Engineering decisions traced to commits and code: the problem, the alternatives considered, what happened, and how each record was checked.",
    path: "/decisions",
    ownImage: true,
});

export default function DecisionsPage() {
    const featured = decisions.filter((d) => d.featured).length;
    return (
        <div className="space-y-6">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">DECISIONS</div>
                <h1 className="text-header mb-1">Decisions</h1>
                <p className="text-[14px] text-(--text-secondary) max-w-2xl">
                    {decisions.length} decisions that shaped my projects and my open-source work, chosen for their trade-offs rather
                    than their number. Each one points at the commits and files it came from and says how it was checked; the
                    reversals and failures are kept in. {featured} are marked as the strongest. For measured results, see{" "}
                    <Link href="/investigations" className="underline hover:text-(--accent-primary)">
                        investigations
                    </Link>
                    .
                </p>
            </header>
            <RecordsBrowser records={decisions.map((r) => toListItem(r, <RecordCard record={r} />))} />
        </div>
    );
}
