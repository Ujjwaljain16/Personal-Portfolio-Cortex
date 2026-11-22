import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    // DOM order matters: on small screens the top bar must be the first
    // grid child so it occupies the first row.
    return (
        <div className="app-grid">
            <MobileNav />
            <Sidebar />
            <main id="main" tabIndex={-1} className="main-panel">
                {children}
            </main>
        </div>
    );
}
