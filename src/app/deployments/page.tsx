import { DeploymentTable } from "@/components/deployments/DeploymentTable";

export default function DeploymentsPage() {
    return (
        <div className="space-y-6">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">DEPLOYMENTS</div>
                <h1 className="text-header mb-1">Deployments</h1>
                <p className="text-[14px] text-(--text-secondary) max-w-2xl">
                    Where each system actually runs: web apps, a mobile app, and published packages. Open a row for the
                    details and links.
                </p>
            </header>
            <DeploymentTable />
        </div>
    );
}
