/**
 * How I approach engineering problems, as patterns drawn from my own documented work.
 *
 * Each principle is an interpretation, but it is tied to the decisions and investigations that show it, so /ask can
 * use it for "how would you approach X?" questions and cite real work instead of generic advice. It is not a
 * checklist I claim to follow every time: the linked records are the evidence, and only for what they show.
 * Add a principle only when a record backs it; tests check that every linked record exists.
 */

export interface Principle {
    /** The principle in a few words, in my voice. */
    title: string;
    /** What it means in practice, in one or two sentences; no facts that the linked records do not contain. */
    detail: string;
    /** Records (src/data/records.ts) where the pattern shows. */
    recordIds: string[];
}

export const playbook: Principle[] = [
    {
        title: "Measure first, and publish the number I got",
        detail: "A target is a hypothesis. I run the benchmark, report the measured result even when it misses, and withdraw a claim my own data does not support.",
        recordIds: ["minidb-volcano-vs-vectorized-benchmark", "flagship-worst-p99-claim-retracted", "campus-credential-lookup-json-scan-benchmark"],
    },
    {
        title: "Check where an improvement comes from before trusting it",
        detail: "A lift or a tuned threshold gets traced to its cause; if it came from the data or from fitting to known outcomes, I say so and keep the simpler option.",
        recordIds: ["lightgbm-lift-was-duplicate-rows", "classifier-thresholds-calibrated-to-six"],
    },
    {
        title: "Test against the real thing, not only the mock",
        detail: "Mocks and a passing suite can hide what breaks in the real image, database or rollout, so I run the real stack and watch what actually happens.",
        recordIds: ["verify-against-real-infrastructure", "campusslot-rolling-updates-dropped-requests"],
    },
    {
        title: "When in doubt, refuse rather than pass through",
        detail: "If a component cannot classify an input or its configuration is invalid, it should fail closed instead of letting the request through unchecked.",
        recordIds: ["ab-fail-closed-framing-and-config", "superset-catalog-self-reference-fail-closed"],
    },
    {
        title: "Wire the signal before writing the policy",
        detail: "A safeguard is only real if something drives it; I check that the failure signal actually reaches the policy, not just that the policy exists and passes its tests.",
        recordIds: ["ab-circuit-breaker-and-approval-not-driveable"],
    },
    {
        title: "Let AI recommend; let deterministic code decide",
        detail: "Where a model's output can cost money or claim success, the model advises and a deterministic, testable check holds the authority.",
        recordIds: ["bounded-ai-fusion-replaces-zero-authority", "warrant-gate-verdict-capability"],
    },
    {
        title: "Put invariants where they cannot be bypassed",
        detail: "A rule that matters is enforced at more than one layer, ending in the database itself, so a bug in one layer cannot break it.",
        recordIds: ["campusslot-booking-rule-in-three-layers"],
    },
    {
        title: "Find the root cause, then decide how each path should fail",
        detail: "When a dependency fails, I trace what the system actually does in that path, such as a client's default retries, and then decide per path how it should degrade instead of patching the symptom.",
        recordIds: ["typeaheadx-one-redis-node-down-took-the-api-down", "typeaheadx-writes-at-most-once-reads-guarded"],
    },
    {
        title: "Fix the method before seeing the results",
        detail: "When an evaluation has a pre-registered method, I keep it after seeing the data and report a weak result as inconclusive rather than re-running it until it looks good.",
        recordIds: ["warrant-decline-judge-amendment"],
    },
    {
        title: "Compare against a fair baseline",
        detail: "A comparison only means something if the baseline gets the same budget and the same rules as the system being tested.",
        recordIds: ["compliance-aware-same-budget-baseline"],
    },
    {
        title: "Keep what was measured apart from what is deduced",
        detail: "Evidence and conclusions are shown separately, and a check that could not run is reported as not evaluated, never as healthy.",
        recordIds: ["sse-evidence-apart-from-deduction"],
    },
];
