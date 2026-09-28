import {
    Activity,
    BookOpen,
    FlaskConical,
    GitBranch,
    Home,
    MessageSquare,
    Rocket,
    type LucideIcon,
} from "lucide-react";

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
    { href: "/", label: "home", icon: Home },
    { href: "/system", label: "system", icon: Activity },
    { href: "/decisions", label: "decisions", icon: GitBranch },
    { href: "/experiments", label: "experiments", icon: FlaskConical },
    { href: "/deployments", label: "deployments", icon: Rocket },
    { href: "/blogs", label: "blogs", icon: BookOpen },
    { href: "/ask", label: "ask", icon: MessageSquare },
];

export const CONTACT_LINKS = [
    { label: "GitHub", href: "https://github.com/Ujjwaljain16", external: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ujjwal-jain-306b60323", external: true },
    { label: "Email", href: "mailto:jainujjwal1609@gmail.com", external: false },
    { label: "Resume", href: "/resume.pdf", external: true },
] as const;

/** `/blogs/some-slug` should still highlight `/blogs`. */
export function isActivePath(pathname: string, href: string): boolean {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
