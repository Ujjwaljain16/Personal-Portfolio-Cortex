/**
 * Merged pull requests to projects I don't own. Verified against the GitHub
 * API (author, state, merge date). Star counts are rounded and approximate.
 */

export interface MergedPR {
    project: string;
    /** Approximate stars, rounded (e.g. "75k"). */
    stars: string;
    number: number;
    title: string;
    summary: string;
    merged: string; // YYYY-MM-DD
    url: string;
}

export const mergedPRs: MergedPR[] = [
    {
        project: "Apache Superset",
        stars: "75k",
        number: 37982,
        title: "Resolve SECRET_KEY lazily to fix silent re-encrypt-secrets failures",
        summary:
            "Made EncryptedType resolve SECRET_KEY lazily, fixing silent failures of the re-encrypt-secrets command during key rotation. Added an integration test.",
        merged: "2026-02-20",
        url: "https://github.com/apache/superset/pull/37982",
    },
    {
        project: "Apache Superset",
        stars: "75k",
        number: 44142,
        title: "Delete deprecated permissions left over after upgrades",
        summary:
            "Added migrations and security-manager logic that remove deprecated permissions left behind by upgrades, with tests and upgrade notes.",
        merged: "2026-09-23",
        url: "https://github.com/apache/superset/pull/44142",
    },
    {
        project: "Apache Superset",
        stars: "75k",
        number: 43974,
        title: "Handle self-referential catalog qualifiers",
        summary:
            "Fixed permission lookups for names like db.dbo.table on engines without catalog support, across the DB engine specs and the security manager.",
        merged: "2026-09-16",
        url: "https://github.com/apache/superset/pull/43974",
    },
    {
        project: "Apache Superset",
        stars: "75k",
        number: 38910,
        title: "Use FILTER_STATE_CACHE_CONFIG timeout for dynamic filter option queries",
        summary: "Dynamic native-filter option queries now use the filter-state cache timeout, fixing stale dropdown values.",
        merged: "2026-07-24",
        url: "https://github.com/apache/superset/pull/38910",
    },
    {
        project: "Apache Superset",
        stars: "75k",
        number: 44237,
        title: "Add configurable display format for time filters",
        summary: "Added a filter-level display format for native time filters, reusing the D3 time-format setup.",
        merged: "2026-09-22",
        url: "https://github.com/apache/superset/pull/44237",
    },
    {
        project: "Apache Superset",
        stars: "75k",
        number: 38229,
        title: "Safely render database URIs in startup warnings",
        summary: "Masked database passwords when metadata database URIs are printed in startup warnings and by test-db.",
        merged: "2026-06-22",
        url: "https://github.com/apache/superset/pull/38229",
    },
    {
        project: "Apache Superset",
        stars: "75k",
        number: 37978,
        title: "Restore arrow key navigation in modal inputs opened from a dropdown",
        summary: "Stopped keyboard events bubbling to the menu handler so arrow, Home and End keys work in those inputs.",
        merged: "2026-07-11",
        url: "https://github.com/apache/superset/pull/37978",
    },
    {
        project: "Appwrite",
        stars: "57k",
        number: 10925,
        title: "Resolve MFA recovery code validation in 1.8.0",
        summary:
            "MFA recovery codes were rejected as invalid because a type constant was lower-cased. Fixed it and added an end-to-end test. First released in v1.9.0-rc.1 (not in 1.8.1).",
        merged: "2025-12-11",
        url: "https://github.com/appwrite/appwrite/pull/10925",
    },
    {
        project: "Vitest",
        stars: "17k",
        number: 9213,
        title: "Respect nested test.only within describe.only",
        summary:
            "A test.only nested inside describe.only now runs only the .only tests, matching Mocha. Added a regression test. First released in v4.0.17.",
        merged: "2025-12-17",
        url: "https://github.com/vitest-dev/vitest/pull/9213",
    },
    {
        project: "Vitest",
        stars: "17k",
        number: 9214,
        title: "Improve error message when tsc outputs help text",
        summary: "Detects when tsc prints its help text (no tsconfig found) and raises a clear error instead of dumping over a hundred lines. With tests.",
        merged: "2025-12-23",
        url: "https://github.com/vitest-dev/vitest/pull/9214",
    },
];

export const inReview = {
    project: "Vitest",
    number: 9662,
    title: "Add mergeTests utility to compose TestAPI fixtures",
    note: "Open. The maintainer has requested changes to the tests.",
    url: "https://github.com/vitest-dev/vitest/pull/9662",
};

export function countByProject(): { project: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const pr of mergedPRs) counts.set(pr.project, (counts.get(pr.project) ?? 0) + 1);
    return [...counts.entries()].map(([project, count]) => ({ project, count }));
}
