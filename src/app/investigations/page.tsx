import Link from "next/link";
import { RecordsBrowser } from "@/components/records/RecordsBrowser";
import { RecordCard } from "@/components/records/RecordCard";
import { RecordsHeader } from "@/components/records/RecordsHeader";
import { toListItem } from "@/components/records/toListItem";
import { investigations } from "@/data/records";
import { orderRecords } from "@/lib/recordsOrder";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "Investigations",
    description:
        "Benchmarks, root-cause analyses and controlled comparisons from my projects and open-source work, with the numbers, the method and where each one came from.",
    path: "/investigations",
    ownImage: true,
});

export default function InvestigationsPage() {
    const measured = investigations.filter((i) => i.measured).length;
    const featured = investigations.filter((i) => i.featured).length;
    const projectCount = new Set(investigations.map((i) => i.project)).size;
    const negative = investigations.filter((i) => i.verdict === "rejected" || i.verdict === "inconclusive");
    const rejected = negative.filter((i) => i.verdict === "rejected").length;

    return (
        <div className="pb-16">
            <div className="max-w-[62rem] space-y-14">
                <RecordsHeader
                    kicker="Investigations"
                    title="Investigations"
                    facts={[
                        { label: "Investigations", value: investigations.length, note: `across ${projectCount} projects` },
                        { label: "Measured", value: measured, note: `${investigations.length - measured} reproduced analyses` },
                        { label: "Featured", value: featured, note: "the strongest, listed first" },
                        {
                            label: "Rejected or inconclusive",
                            value: negative.length,
                            note: `${rejected} rejected · ${negative.length - rejected} inconclusive`,
                        },
                    ]}
                >
                    <p>
                        Questions answered with evidence: benchmarks, root-cause analyses and controlled comparisons. Each lists the
                        method, the result and the source of every number, and says so when a result was inconclusive or a change was
                        rejected. Decisions that came out of them are under{" "}
                        <Link
                            href="/decisions"
                            className="text-foreground underline decoration-(--border-hover) underline-offset-4 hover:decoration-(--accent-primary)"
                        >
                            decisions
                        </Link>
                        .
                    </p>
                </RecordsHeader>
                <RecordsBrowser records={orderRecords(investigations).map((r) => toListItem(r, <RecordCard record={r} />))} />
            </div>
        </div>
    );
}
