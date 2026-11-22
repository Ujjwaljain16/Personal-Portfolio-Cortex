import { mergedPRs } from "@/data/openSource";
import { getProject } from "@/data/projects";

/**
 * The three numbers under the home page's hero. Each is copied from a record or computed from data, and links to the
 * place that shows its source, so the boldest claims on the site are also the easiest to check.
 */
export interface Highlight {
    value: string;
    label: string;
    /** The project the number comes from, shown above it. */
    project: string;
    /** Internal link: a record anchor on /decisions or /investigations, or a section of the home page. */
    href: string;
}

const KUBERNETES = "Kubernetes Gateway API";
const kubernetesMerged = mergedPRs.filter((pr) => pr.project === KUBERNETES).length;

export const highlights: Highlight[] = [
    {
        value: getProject("warrant")?.headline?.value ?? "",
        project: "Warrant",
        label: "Wrong \"done\" claims accepted (77 from real models): trusting the agent vs Warrant's hidden-test gate",
        href: "/projects/warrant#evidence",
    },
    {
        value: "1,172 → 0.2 ms",
        project: "CampusSync",
        label: "Credential lookup at a million certificates, from a JSON scan to an indexed query",
        href: "/investigations#campus-credential-lookup-json-scan-benchmark",
    },
    {
        value: `${kubernetesMerged} merged`,
        project: KUBERNETES,
        label: "Pull requests to the Kubernetes Gateway API, reviewed and merged by its maintainers",
        href: "/#open-source",
    },
];
