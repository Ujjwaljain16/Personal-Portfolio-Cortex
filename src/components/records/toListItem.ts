import type { EngineeringRecord } from "@/data/records";
import type { RecordListItem } from "@/components/records/RecordsBrowser";

/** The filter fields for a record, paired with its server-rendered card. */
export function toListItem(r: EngineeringRecord, card: React.ReactNode): RecordListItem {
    return {
        id: r.id,
        project: r.project,
        outcome: (r.kind === "decision" ? r.status : r.verdict) ?? "adopted",
        provenance: r.provenance,
        card,
    };
}
