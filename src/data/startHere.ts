/**
 * The three things a visitor is asked to check first. Each claim is one sentence, states what
 * was not achieved or not explained where that is part of the story, and links to the record
 * that holds the evidence. src/data tests check every id below exists.
 */

export interface StartHereLink {
    label: string;
    /** A record id: the link goes to its card on /decisions or /investigations. */
    recordId: string;
}

export interface StartHereItem {
    projectId: string;
    claim: string;
    links: StartHereLink[];
}

export const startHere: StartHereItem[] = [
    {
        projectId: "fuze",
        claim: "Semantic search on the live deployment got 45% faster at its best run (p50 3,026 to 1,661 ms) by cutting about 10 database statements per search to 1. About 900 ms of the remaining time is still unexplained, and the record says so.",
        links: [{ label: "The latency series", recordId: "fuze-semantic-search-latency-series" }],
    },
    {
        projectId: "campussync",
        claim: "An audit found that every public credential verification failed, because the verifier was handed the private key. It is fixed with a test that reproduces the old failure. Credential lookup fell from 1,172 ms to 0.2 ms, and one earlier speed-up claim was withdrawn.",
        links: [
            { label: "The verification bug", recordId: "campus-public-verification-failed-on-every-credential" },
            { label: "The benchmark and the withdrawn claim", recordId: "campus-credential-lookup-json-scan-benchmark" },
        ],
    },
    {
        projectId: "campusslot",
        claim: "A rolling update configured as zero-downtime still dropped 0.28% of requests until a preStop delay was added. A deliberately broken release then rolled itself back with 0 of 4,800 requests failing, and a control run shows what the rollback adds.",
        links: [
            { label: "The dropped requests", recordId: "campusslot-rolling-updates-dropped-requests" },
            { label: "The rollback drill", recordId: "campusslot-bad-release-automatic-rollback" },
        ],
    },
];
