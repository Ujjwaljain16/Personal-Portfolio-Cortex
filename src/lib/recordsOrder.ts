import type { EngineeringRecord } from "@/data/records";

/** Featured records first, then newest first; records with the same date keep their order in the data. */
export function orderRecords(list: EngineeringRecord[]): EngineeringRecord[] {
    return list
        .map((r, i) => ({ r, i }))
        .sort((a, b) => Number(b.r.featured) - Number(a.r.featured) || b.r.date.localeCompare(a.r.date) || a.i - b.i)
        .map(({ r }) => r);
}
