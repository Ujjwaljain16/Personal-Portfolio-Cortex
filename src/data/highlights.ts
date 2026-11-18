/**
 * The three numbers under the home page's hero. Each is copied from a record or computed from data, and links to the
 * place that shows its source, so the boldest claims on the site are also the easiest to check.
 */
export interface Highlight {
    value: string;
    label: string;
    /** The project the number comes from, shown above it. */
    project: string;
    /** Internal link: a record anchor on /decisions or /investigations, or a section of the home page. */
    href: string;
}

export const highlights: Highlight[] = [
    {
        value: "1,172 → 0.2 ms",
        project: "CampusSync",
        label: "Credential lookup at a million certificates, from a JSON scan to an indexed query",
        href: "/investigations#campus-credential-lookup-json-scan-benchmark",
    },
    {
        value: "3,026 → 1,661 ms",
        project: "Fuze",
        label: "Median semantic-search latency on the live app, after collapsing ten queries into one",
        href: "/investigations#fuze-semantic-search-latency-series",
    },
    {
        value: "18 / 21",
        project: "AgentBrake",
        label: "Scripted attacks blocked by the MCP firewall, with 0 of 10 benign tasks refused",
        href: "/investigations#agentbrake-the-gauntlet-and-its-kept-misses",
    },
];
