import { describe, expect, it } from "vitest";
import { collapseActivity, type ActivityItem } from "@/lib/github";

const item = (id: string, date: string, repo: string, text: string): ActivityItem => ({ id, date, repo, text, url: `https://example.test/${id}` });

describe("system page activity", () => {
    it("puts the newest first and folds identical events on the same day into one counted row", () => {
        const rows = collapseActivity([
            item("1", "2026-11-15T10:00:00Z", "SSE-Observatory", "pushed to main"),
            item("2", "2026-11-16T09:00:00Z", "SSE-Observatory", "pushed to network-faults"),
            item("3", "2026-11-15T12:00:00Z", "SSE-Observatory", "pushed to main"),
            item("4", "2026-11-15T11:00:00Z", "VaultTabs", "pushed to main"),
            item("5", "2026-11-14T08:00:00Z", "SSE-Observatory", "pushed to main"),
        ]);
        expect(rows.map((r) => [r.repo, r.text, r.date.slice(0, 10), r.count])).toEqual([
            ["SSE-Observatory", "pushed to network-faults", "2026-11-16", 1],
            ["SSE-Observatory", "pushed to main", "2026-11-15", 2],
            ["VaultTabs", "pushed to main", "2026-11-15", 1],
            ["SSE-Observatory", "pushed to main", "2026-11-14", 1],
        ]);
        // The folded row keeps the newest of its events.
        expect(rows[1].id).toBe("3");
    });

    it("does not change the list it was given", () => {
        const input = [item("a", "2026-11-01T00:00:00Z", "r", "x"), item("b", "2026-11-02T00:00:00Z", "r", "y")];
        collapseActivity(input);
        expect(input.map((i) => i.id)).toEqual(["a", "b"]);
    });
});
