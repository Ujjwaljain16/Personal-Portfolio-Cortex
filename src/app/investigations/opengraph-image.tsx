import { renderCard, OG_SIZE } from "@/lib/ogCard";
import { investigations } from "@/data/records";

export const alt = "Investigations by Ujjwal Jain";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
    return renderCard({
        eyebrow: "INVESTIGATIONS",
        title: "Questions answered with evidence",
        subtitle: "Benchmarks and root-cause analyses with the method, the result and the source of every number.",
        chips: [`${investigations.length} records`],
    });
}
