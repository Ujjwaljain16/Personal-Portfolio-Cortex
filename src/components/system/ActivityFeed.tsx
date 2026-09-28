import type { ActivityItem } from "@/lib/github";
import { formatDate } from "@/lib/utils";

export function ActivityFeed({ items }: { items: ActivityItem[] | null }) {
    return (
        <div className="surface-1 p-4">
            <h2 className="text-label mb-3">RECENT PUBLIC ACTIVITY</h2>

            {items === null || items.length === 0 ? (
                <p className="text-[13px] text-(--text-secondary) py-2">
                    GitHub activity is unavailable right now.
                </p>
            ) : (
                <ul className="divide-y divide-(--border-default)/60">
                    {items.map((item) => (
                        <li key={item.id} className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-x-4 gap-y-0.5 text-[13px]">
                            <time dateTime={item.date} className="font-mono text-(--text-muted) shrink-0 sm:w-28">
                                {formatDate(item.date)}
                            </time>
                            <span className="font-mono text-(--accent-primary) shrink-0 sm:w-40 truncate">
                                {item.repo}
                            </span>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-(--text-secondary) hover:text-foreground min-w-0 sm:truncate"
                            >
                                {item.text}
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            <p className="mt-3 pt-3 border-t border-(--border-default) text-[12px] text-(--text-muted)">
                From GitHub&apos;s public events for{" "}
                <a
                    href="https://github.com/Ujjwaljain16"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-(--accent-primary)"
                >
                    @Ujjwaljain16
                </a>
                , refreshed at most every 10 minutes.
            </p>
        </div>
    );
}
