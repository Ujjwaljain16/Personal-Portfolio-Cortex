import Link from "next/link";
import { RecordsBrowser } from "@/components/records/RecordsBrowser";
import { investigations } from "@/data/records";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "Investigations",
    description:
        "Benchmarks, root-cause analyses and controlled comparisons from my projects and open-source work, with the numbers, the method and where each one came from.",
    path: "/investigations",
});

export default function InvestigationsPage() {
    const measured = investigations.filter((i) => i.measured).length;
    return (
        <div className="space-y-6">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">INVESTIGATIONS</div>
                <h1 className="text-header mb-1">Investigations</h1>
                <p className="text-[14px] text-(--text-secondary) max-w-2xl">
                    Questions answered with evidence: {measured} with measurements and {investigations.length - measured} root-cause
                    analyses that were reproduced. Each lists the method, the result and the source of every number. Where a result
                    was inconclusive or a change was rejected, it says so. Decisions that came out of them are under{" "}
                    <Link href="/decisions" className="underline hover:text-(--accent-primary)">
                        decisions
                    </Link>
                    .
                </p>
            </header>
            <RecordsBrowser records={investigations} />
        </div>
    );
}
