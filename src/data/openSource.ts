import github from "./generated/github.json" with { type: "json" };

/**
 * Pull requests to projects I don't own.
 *
 * The list itself is generated: `scripts/sync-github.mjs` reads my pull requests from the GitHub API every day and
 * writes `generated/github.json` (merged, open, and the newest commit date of each repository). Never edit that file.
 *
 * What is written by hand is only `CURATED` below: a better summary (or title) for a pull request, keyed by its URL.
 * Without an entry, a pull request shows its own title and the first paragraph of its own description, so a new
 * contribution appears on the site with no work and is never described in words that are not mine or the PR's.
 */

export interface MergedPR {
    project: string;
    /** Approximate stars, rounded down (e.g. "75k"). */
    stars: string;
    number: number;
    title: string;
    /** Hand-written if curated, else the PR description's first paragraph, else empty. */
    summary: string;
    merged: string; // YYYY-MM-DD
    url: string;
}

/**
 * Pull requests that are open right now and fresh (not drafts, active within 60 days). They leave this list on
 * their own when they merge, close or go quiet.
 */
export interface OpenPR {
    project: string;
    number: number;
    title: string;
    note: string;
    url: string;
}

/** Hand-written summaries and titles for pull requests worth explaining better than their own description does. */
const CURATED: Record<string, { title?: string; summary: string }> = {
    // Metacog Hypergraph #92
    "https://github.com/metacoglabs/hypergraph/pull/92": {
        summary:
            "After a crash, a transaction that never committed could come back after a second crash and even delete committed data, because the first checkpoint put the old lsn back. The checkpointer now starts from the lsn recovery computed, and recovery raises the next transaction id above any id in the log. Three regression tests fail on main and pass; the bug was reported as #91.",
    },
    // Apache Superset #44248
    "https://github.com/apache/superset/pull/44248": {
        summary:
            "Publishing an image for a release cut before the superset Dockerfile stage existed failed with \"target stage could not be found\". The release workflow now checks the target supersetbot would use against the checked-out Dockerfile and builds from lean when only that stage is missing; any other mismatch still fails.",
    },
    // Apache Superset #43985
    "https://github.com/apache/superset/pull/43985": {
        summary:
            "A SQL Lab query used as a chart datasource added no row-level-security material to its cache key, so two viewers with different RLS on the underlying tables could share a cached result. The key now includes the applicable predicates, with a regression test; a test for the already-fixed query path is added too.",
    },
    // Apache Superset #44142
    "https://github.com/apache/superset/pull/44142": {
        summary:
            "Added migrations and security-manager logic that remove deprecated permissions left behind by upgrades, with tests and upgrade notes.",
    },
    // Apache Superset #44237
    "https://github.com/apache/superset/pull/44237": {
        summary:
            "Added a filter-level display format for native time filters, reusing the D3 time-format setup.",
    },
    // Apache Superset #43974
    "https://github.com/apache/superset/pull/43974": {
        summary:
            "Fixed permission lookups for names like db.dbo.table on engines without catalog support, across the DB engine specs and the security manager.",
    },
    // Apache Superset #38910
    "https://github.com/apache/superset/pull/38910": {
        summary:
            "Dynamic native-filter option queries now use the filter-state cache timeout, fixing stale dropdown values.",
    },
    // Apache Superset #37978
    "https://github.com/apache/superset/pull/37978": {
        title: "Restore arrow key navigation in modal inputs opened from a dropdown",
        summary:
            "Stopped keyboard events bubbling to the menu handler so arrow, Home and End keys work in those inputs.",
    },
    // Apache Superset #38229
    "https://github.com/apache/superset/pull/38229": {
        summary:
            "Masked database passwords when metadata database URIs are printed in startup warnings and by test-db.",
    },
    // Apache Superset #37982
    "https://github.com/apache/superset/pull/37982": {
        summary:
            "Made EncryptedType resolve SECRET_KEY lazily, fixing silent failures of the re-encrypt-secrets command during key rotation. Added an integration test.",
    },
    // Vitest #9214
    "https://github.com/vitest-dev/vitest/pull/9214": {
        summary:
            "Detects when tsc prints its help text (no tsconfig found) and raises a clear error instead of dumping over a hundred lines. With tests.",
    },
    // Vitest #9213
    "https://github.com/vitest-dev/vitest/pull/9213": {
        title: "Respect nested test.only within describe.only",
        summary:
            "A test.only nested inside describe.only now runs only the .only tests, matching Mocha. Added a regression test. First released in v4.0.17.",
    },
    // Appwrite #10925
    "https://github.com/appwrite/appwrite/pull/10925": {
        summary:
            "MFA recovery codes were rejected as invalid because a type constant was lower-cased. Fixed it and added an end-to-end test. First released in v1.9.0-rc.1 (not in 1.8.1).",
    },
};

/** ISO timestamp of the last time the generated data changed. */
export const githubSyncedAt: string = github.syncedAt;

export const mergedPRs: MergedPR[] = github.merged.map((pr) => {
    const curated = CURATED[pr.url];
    return {
        project: pr.project,
        stars: pr.stars,
        number: pr.number,
        title: curated?.title ?? pr.title,
        summary: curated?.summary ?? pr.summary,
        merged: pr.merged,
        url: pr.url,
    };
});

export const openPRs: OpenPR[] = github.open.map((pr) => ({
    project: pr.project,
    number: pr.number,
    title: pr.title,
    note: pr.note,
    url: pr.url,
}));

/** Hand-written entries whose pull request is no longer in the generated list (reverted, or the repository changed). */
export const orphanedCurated: string[] = Object.keys(CURATED).filter((url) => !github.merged.some((pr) => pr.url === url));

/** Date (YYYY-MM-DD) of the newest commit on a portfolio repository's default branch, or undefined for a private or unknown one. */
export function lastCommitDate(repo: string): string | undefined {
    return (github.repos as Record<string, { committed: string }>)[repo]?.committed;
}

/** The branch that date was read from, when it is not the default branch (a project whose released version sits on `main`). */
export function lastCommitBranch(repo: string): string | undefined {
    return (github.repos as Record<string, { branch?: string }>)[repo]?.branch;
}

export function countByProject(): { project: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const pr of mergedPRs) counts.set(pr.project, (counts.get(pr.project) ?? 0) + 1);
    return [...counts.entries()].map(([project, count]) => ({ project, count }));
}
