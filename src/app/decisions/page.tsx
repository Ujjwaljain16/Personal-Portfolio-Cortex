import Link from "next/link";
import { RecordsBrowser } from "@/components/records/RecordsBrowser";
import { RecordCard } from "@/components/records/RecordCard";
import { RecordsHeader } from "@/components/records/RecordsHeader";
import { toListItem } from "@/components/records/toListItem";
import { decisions } from "@/data/records";
import { orderRecords } from "@/lib/recordsOrder";
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
    const projectCount = new Set(decisions.map((d) => d.project)).size;
    const recorded = decisions.filter((d) => d.provenance === "recorded").length;
    const notAdopted = decisions.filter((d) => (d.status ?? "adopted") !== "adopted");
    const byStatus = new Map<string, number>();
    for (const d of notAdopted) byStatus.set(d.status!, (byStatus.get(d.status!) ?? 0) + 1);

    return (
        <div className="pb-16">
            <div className="max-w-[62rem] space-y-14">
                <RecordsHeader
                    kicker="Decisions"
                    title="Decisions"
                    facts={[
                        { label: "Decisions", value: decisions.length, note: `across ${projectCount} projects` },
                        { label: "Featured", value: featured, note: "the strongest, listed first" },
                        {
                            label: "Not simply adopted",
                            value: notAdopted.length,
                            note: [...byStatus.entries()].map(([s, n]) => `${n} ${s}`).join(" · "),
                        },
                        { label: "Recorded at the time", value: recorded, note: `${decisions.length - recorded} reconstructed from history` },
                    ]}
                >
                    <p>
                        The calls that shaped my projects and my open-source work, chosen for their trade-offs rather than their number.
                        Each points at the commits and files it came from and says how it was checked; the reversals and failures are
                        kept in. For measured results, see{" "}
                        <Link
                            href="/investigations"
                            className="text-foreground underline decoration-(--border-hover) underline-offset-4 hover:decoration-(--accent-primary)"
                        >
                            investigations
                        </Link>
                        .
                    </p>
                </RecordsHeader>
                <RecordsBrowser records={orderRecords(decisions).map((r) => toListItem(r, <RecordCard record={r} />))} />
            </div>
        </div>
    );
}
