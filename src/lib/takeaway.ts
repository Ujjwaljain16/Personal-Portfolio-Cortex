import type { EngineeringRecord } from "@/data/records";

/** The first sentence of a record's outcome, trimmed to a readable length. */
export function takeaway(r: EngineeringRecord): string {
    const text = (r.kind === "decision" ? r.consequences : r.result) ?? "";
    const first = text.split(/(?<=[.!?])\s+(?=[A-Z])/)[0]?.trim() ?? "";
    if (first.length <= 220) return first;
    const cut = first.slice(0, 217);
    return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}
