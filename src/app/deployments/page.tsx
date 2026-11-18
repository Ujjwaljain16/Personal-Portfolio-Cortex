import Link from "next/link";
import { DeploymentTable } from "@/components/deployments/DeploymentTable";
import { RecordsHeader } from "@/components/records/RecordsHeader";
import { deployments } from "@/data/deployments";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "Deployments",
    description: "Where each system runs: web apps, an Android app and published packages, and what is and isn't live.",
    path: "/deployments",
});

export default function DeploymentsPage() {
    const count = (s: string) => deployments.filter((d) => d.status === s).length;

    return (
        <div className="pb-16">
            <div className="max-w-[62rem] space-y-14">
                <RecordsHeader
                    kicker="Deployments"
                    title="Where it runs"
                    facts={[
                        { label: "Systems", value: deployments.length, note: "web apps, an Android app and packages" },
                        { label: "Live on the web", value: count("active"), note: "deployed web apps" },
                        { label: "Published", value: count("published"), note: "packages on npm" },
                        { label: "On a device", value: count("device"), note: "an Android app" },
                    ]}
                >
                    <p>
                        Web apps, a mobile app and published packages, with what is and isn&apos;t live. Only facts that could be checked
                        are listed: no uptime or latency claims. Open a row for how it runs; the work itself is under{" "}
                        <Link
                            href="/projects"
                            className="text-foreground underline decoration-(--border-hover) underline-offset-4 hover:decoration-(--accent-primary)"
                        >
                            projects
                        </Link>
                        .
                    </p>
                </RecordsHeader>
                <DeploymentTable />
            </div>
        </div>
    );
}
