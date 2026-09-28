import { inReview } from "@/data/openSource";

/**
 * What is happening right now. Keep it short and true: every item names something
 * a visitor can check, and `updated` is the date this list was last reviewed.
 * Change the date whenever the list is edited.
 */

export interface NowItem {
    /** Where the work stands, e.g. "In review". */
    status: string;
    text: string;
    /** Internal path or absolute URL. */
    href: string;
    linkLabel: string;
}

export const nowUpdated = "2026-09-28";

export const nowItems: NowItem[] = [
    {
        status: "In review",
        text: `Vitest #${inReview.number}, a helper to compose test fixtures. ${inReview.note}`,
        href: inReview.url,
        linkLabel: "Pull request",
    },
    {
        status: "Just published",
        text: "FlashFlow, a Go lab that replays routing policies on identical traffic to show why one collapses under load.",
        href: "/projects/flashflow",
        linkLabel: "Project page",
    },
    {
        status: "Just fixed",
        text: "A security and honesty pass over CampusSync, VaultTabs, RecoveryOS and AgentBrake, including AgentBrake's fail-open bugs.",
        href: "/decisions#ab-fail-closed-framing-and-config",
        linkLabel: "The AgentBrake record",
    },
    {
        status: "Not yet released",
        text: "The AgentBrake fixes are on main, but the version on npm is still the old 1.0.0.",
        href: "/projects/agentbrake",
        linkLabel: "Project page",
    },
];
