import Link from "next/link";
import { RecordsHeader } from "@/components/records/RecordsHeader";
import { MiniDBPlayground } from "@/components/minidb/MiniDBPlayground";
import { MINIDB_ENGINE } from "@/data/minidbDemo";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "MiniDB, live",
    description:
        "Run SQL against MiniDB, a database I wrote from scratch, in your browser: see the query plan, the B+ tree pages it reads and every buffer-pool hit and miss.",
    path: "/minidb",
});

const link = "text-foreground underline decoration-(--border-hover) underline-offset-4 hover:decoration-(--accent-primary)";

export default function MiniDBPage() {
    const commitUrl = `https://github.com/Ujjwaljain16/MiniDB/commit/${MINIDB_ENGINE.commit}`;
    return (
        <div className="pb-16">
            <div className="max-w-[62rem] space-y-12">
                <RecordsHeader
                    kicker="Live demo"
                    title="MiniDB in your browser"
                    facts={[
                        {
                            label: "Engine",
                            value: MINIDB_ENGINE.commit.slice(0, 7),
                            note: (
                                <a href={commitUrl} className={link}>
                                    the commit this build came from
                                </a>
                            ),
                        },
                        { label: "Download", value: `${MINIDB_ENGINE.gzipKb} KB`, note: `gzipped, ${MINIDB_ENGINE.sizeKb} KB raw, loaded only on this page` },
                        { label: "Data", value: "5,000 rows", note: "users and orders, generated and indexed when the page opens" },
                        { label: "Page size", value: "4 KB", note: "the same pages the engine writes to disk" },
                    ]}
                >
                    <p>
                        This is the real{" "}
                        <Link href="/projects/minidb" className={link}>
                            MiniDB
                        </Link>{" "}
                        engine, compiled for the browser and running in a worker in this tab: the same parser, planner, B+ tree and LRU-K buffer pool
                        as the Node build. The one difference is the disk, which here is an array of 4 KB pages in memory. So you can watch plans,
                        index lookups and cache behaviour, but not durability; write-ahead logging and crash recovery are covered by the crash-matrix
                        tests instead.
                    </p>
                </RecordsHeader>

                <MiniDBPlayground />

                <section className="space-y-3 text-[14px] leading-relaxed text-(--text-secondary)">
                    <h2 className="text-[17px] font-semibold text-foreground">What it supports</h2>
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>
                            <code className="font-mono text-foreground">CREATE TABLE</code>, <code className="font-mono text-foreground">CREATE INDEX</code>,{" "}
                            <code className="font-mono text-foreground">INSERT</code>, <code className="font-mono text-foreground">DELETE</code>,{" "}
                            <code className="font-mono text-foreground">ANALYZE</code>, <code className="font-mono text-foreground">EXPLAIN [ANALYZE]</code>{" "}
                            and <code className="font-mono text-foreground">SHOW BUFFER_POOL</code> / <code className="font-mono text-foreground">WAL</code>.
                        </li>
                        <li>
                            <code className="font-mono text-foreground">SELECT</code> with column lists, <code className="font-mono text-foreground">WHERE</code>{" "}
                            (comparisons with AND / OR), inner <code className="font-mono text-foreground">JOIN … ON</code> and{" "}
                            <code className="font-mono text-foreground">LIMIT</code>. Column types: INT, BIGINT, FLOAT, BOOL, VARCHAR.
                        </li>
                        <li>
                            Not supported, and rejected with an error rather than ignored: ORDER BY, GROUP BY, aggregates, DISTINCT, OFFSET, UPDATE, outer
                            joins and expressions in the select list.
                        </li>
                        <li>
                            Joins are nested loops. Filters on one table are pushed below the join, but a join without a selective filter reads the inner
                            table once per outer row, so the page stops any query after 8 seconds and resets.
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
