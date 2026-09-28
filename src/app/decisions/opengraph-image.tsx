import { renderCard, OG_SIZE } from "@/lib/ogCard";
import { decisions } from "@/data/records";

export const alt = "Engineering decisions by Ujjwal Jain";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
    return renderCard({
        eyebrow: "DECISIONS",
        title: "Engineering decisions, traced to the commits",
        subtitle: "The problem, the alternatives, what happened, and how each record was checked. Reversals and failures included.",
        chips: [`${decisions.length} records`],
    });
}
