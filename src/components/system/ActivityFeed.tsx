import type { ActivityItem } from "@/lib/github";
import { formatDate } from "@/lib/utils";

/** GitHub's public events for the account, as hairline rows: date, repository, what happened. */
export function ActivityFeed({ items }: { items: ActivityItem[] | null }) {
    return (
        <div>
            {items === null || items.length === 0 ? (
                <p className="text-[15px] text-(--text-secondary)">GitHub activity is unavailable right now.</p>
            ) : (
                <ul className="activity-list">
                    {items.map((item) => (
                        <li key={item.id}>
                            <time dateTime={item.date} className="font-mono text-[12px] text-(--text-muted)">
                                {formatDate(item.date)}
                            </time>
                            <span className="min-w-0 truncate font-mono text-[12.5px] text-(--text-secondary)">{item.repo}</span>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-w-0 text-[14.5px] text-foreground hover:text-(--accent-primary) transition-colors md:truncate"
                            >
                                {item.text}
                                {item.count && item.count > 1 && (
                                    <span className="ml-2 font-mono text-[12px] text-(--text-muted)" aria-label={`${item.count} times`}>
                                        ×{item.count}
                                    </span>
                                )}
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            <p className="mt-6 text-[13px] text-(--text-muted)">
                From GitHub&apos;s public events for{" "}
                <a
                    href="https://github.com/Ujjwaljain16"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--text-secondary) underline decoration-(--border-hover) underline-offset-4 hover:decoration-(--accent-primary)"
                >
                    @Ujjwaljain16
                </a>
                , refreshed at most every 10 minutes.
            </p>
        </div>
    );
}
