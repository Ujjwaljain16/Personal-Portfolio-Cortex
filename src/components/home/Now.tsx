import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { nowItems, nowUpdated, type NowItem } from "@/data/now";
import { formatDate } from "@/lib/utils";

const isExternal = (href: string) => /^https?:\/\//.test(href);

function ItemLink({ item }: { item: NowItem }) {
    if (!item.href || !item.linkLabel) return null;
    if (isExternal(item.href)) {
        return (
            <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-mono text-[12px] text-(--accent-primary) hover:underline"
            >
                {item.linkLabel}
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            </a>
        );
    }
    return (
        <Link href={item.href} className="font-mono text-[12px] text-(--accent-primary) hover:underline">
            {item.linkLabel} →
        </Link>
    );
}

export function Now() {
    return (
        <section aria-labelledby="now-heading" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id="now-heading" className="text-2xl font-semibold text-foreground">
                    Now
                </h2>
                <p className="text-[12px] font-mono text-(--text-muted)">
                    Updated <time dateTime={nowUpdated}>{formatDate(nowUpdated)}</time>
                </p>
            </div>
            <ul className="surface-1 divide-y divide-(--border-default)/60">
                {nowItems.map((item) => (
                    <li key={item.text} className="p-4 grid gap-1 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-4">
                        <span className="text-[12px] font-mono uppercase tracking-wider text-(--accent-primary) sm:pt-0.5">
                            {item.status}
                        </span>
                        <p className="text-[15px] leading-relaxed text-(--text-secondary)">
                            {item.text} <ItemLink item={item} />
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
