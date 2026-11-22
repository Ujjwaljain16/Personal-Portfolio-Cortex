import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, FileDown, Github, Linkedin, Mail } from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { SectionHeading } from "@/components/home/SectionHeading";
import { highlights } from "@/data/highlights";
import { ProjectConstellation, type ConstellationNode } from "@/components/home/ProjectConstellation";
import { ProjectFeature } from "@/components/home/ProjectFeature";
import { getWritingItems } from "@/lib/writing";
import { STATUS_LABEL, featuredProjects, getProject, projects } from "@/data/projects";
import { countByProject, mergedPRs, openPRs, type MergedPR } from "@/data/openSource";
import { formatDate } from "@/lib/utils";
import { ossLogo } from "@/data/ossLogos";
import { jsonLd, personJsonLd } from "@/lib/seo";
import { educationLine } from "@/data/profile";

const EXPLORE = [
    { href: "/projects", label: "Projects", desc: "Every project, with its evidence, source links and what isn't done." },
    { href: "/system", label: "System", desc: "Signals from my public GitHub account." },
    { href: "/decisions", label: "Decisions", desc: "Engineering decisions with the alternative I rejected and what happened." },
    { href: "/investigations", label: "Investigations", desc: "Benchmarks and root-cause analyses, with the numbers and their sources." },
    { href: "/deployments", label: "Deployments", desc: "Where each system actually runs." },
    { href: "/blogs", label: "Blogs", desc: "Posts on what I built and what I learned, here and on Medium." },
    { href: "/ask", label: "Ask", desc: "Ask questions about my projects." },
];

// The latest posts come from the same list as /blogs (native posts and the Medium feed), so this page
// refreshes on the same schedule.
export const revalidate = 3600;

/** Merged pull requests grouped by project, in the order each project's newest merge appears. */
function groupByProject(prs: MergedPR[]): { project: string; stars: string; prs: MergedPR[] }[] {
    const groups = new Map<string, { project: string; stars: string; prs: MergedPR[] }>();
    for (const pr of prs) {
        const g = groups.get(pr.project) ?? { project: pr.project, stars: pr.stars, prs: [] };
        g.prs.push(pr);
        groups.set(pr.project, g);
    }
    return [...groups.values()];
}

/** Merged pull requests shown per project before the rest fold away; the newest come first. */
const PRS_SHOWN = 2;

function PrList({ prs }: { prs: MergedPR[] }) {
    return (
        <ul className="divide-y divide-(--border-default)/60">
            {prs.map((pr) => (
                <li key={pr.url} className="px-5 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <a
                            href={pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[15px] font-medium text-foreground hover:text-(--accent-primary)"
                        >
                            #{pr.number}: {pr.title}
                        </a>
                        <span className="font-mono text-[12px] text-(--text-muted)">merged {formatDate(pr.merged)}</span>
                    </div>
                    {pr.summary && <p className="mt-1 text-[14px] leading-relaxed text-(--text-secondary)">{pr.summary}</p>}
                </li>
            ))}
        </ul>
    );
}

export default async function HomePage() {
    const posts = (await getWritingItems()).slice(0, 2);
    const prCounts = countByProject();
    const constellation: ConstellationNode[] = [
        ...featuredProjects.map((p) => ({ p, major: true })),
        ...["agentbrake", "recoveryos", "vaulttabs"].map((id) => ({ p: getProject(id), major: false })),
    ].flatMap(({ p, major }) =>
        p
            ? [{ id: p.id, name: p.name, tagline: p.tagline, status: STATUS_LABEL[p.status], value: p.headline?.value, label: p.headline?.label, major }]
            : [],
    );

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd()) }} />

            <div className="max-w-6xl mx-auto px-5 md:px-10 pb-24">
                <HomeHeader />

                <main id="main" className="space-y-20 pt-12 md:pt-20">
                    {/* Hero */}
                    <section aria-labelledby="hero-heading" className="hero relative isolate">
                        <div className="hero-backdrop" aria-hidden="true" />
                        <div className="grid items-center gap-12 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="space-y-8">
                                <p className="hero-kicker">
                                    <span className="hero-pulse" aria-hidden="true" />
                                    Computer Science &middot; Backend &middot; Systems &middot; Applied AI
                                </p>
                                <div className="space-y-5">
                                    <h1 id="hero-heading" className="hero-name text-[2.75rem] leading-[1.02] sm:text-6xl font-semibold tracking-[-0.035em]">
                                        Ujjwal Jain
                                    </h1>
                                    <p className="max-w-[34rem] text-[19px] md:text-[22px] leading-[1.45] tracking-[-0.01em] text-foreground">
                                        I like understanding how things work beneath the surface, and building them myself.
                                    </p>
                                    <p className="max-w-[34rem] text-[15px] md:text-[16px] leading-relaxed text-(--text-secondary)">
                                        From database internals and distributed systems to backend infrastructure and applied AI, I
                                        explore ideas by turning them into working software, testing their limits, and learning from
                                        what breaks.
                                    </p>
                                    <p className="max-w-[34rem] text-[15px] md:text-[16px] leading-relaxed text-(--text-secondary)">
                                        This is a collection of things I&apos;ve built, problems I&apos;ve explored, and lessons
                                        I&apos;ve picked up along the way.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <a
                                        href="#projects"
                                        className="hero-cta inline-flex items-center gap-2 min-h-11 px-5 rounded-full text-[14px] font-medium"
                                    >
                                        Selected work
                                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                    </a>
                                    <a
                                        href="/resume.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 min-h-11 px-5 rounded-full border border-(--border-hover) text-[14px] text-foreground hover:border-(--text-muted) transition-colors"
                                    >
                                        <FileDown className="w-4 h-4" aria-hidden="true" />
                                        Resume
                                    </a>
                                </div>
                                <p className="text-[12.5px] font-mono text-(--text-muted)">{educationLine}</p>
                            </div>

                            <ProjectConstellation nodes={constellation} />
                        </div>

                        {/* Three numbers, each linking to the record that holds its source. */}
                        <ul className="metrics-strip mt-16 md:mt-20 grid md:grid-cols-3">
                            {highlights.map((h) => (
                                <li key={h.label}>
                                    <Link href={h.href} className="metric-cell group">
                                        <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">{h.project}</span>
                                        <span className="metric-value mt-3 block whitespace-nowrap text-[26px] md:text-[30px] leading-none">{h.value}</span>
                                        <span className="mt-3 block max-w-[19rem] text-[13.5px] leading-relaxed text-(--text-secondary)">{h.label}</span>
                                        <span className="mt-4 inline-flex items-center gap-1 font-mono text-[12px] text-(--text-muted) group-hover:text-(--accent-primary) transition-colors">
                                            Source
                                            <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Featured projects */}
                    <section id="projects" aria-labelledby="projects-heading" className="reveal scroll-mt-6 space-y-6">
                        <SectionHeading id="projects-heading" kicker="01 / Selected work" title="Six systems, measured">
                            Case studies, each with the problem, what I built and the number it reached. Every page links to the source and
                            says what isn&apos;t done.
                        </SectionHeading>
                        <div className="grid gap-6">
                            {featuredProjects.map((p, i) => (
                                <ProjectFeature key={p.id} project={p} index={i} />
                            ))}
                        </div>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 min-h-11 text-[14px] font-mono text-(--accent-primary) hover:underline"
                        >
                            All {projects.length} projects
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    </section>

                    {/* Open source */}
                    <section id="open-source" aria-labelledby="oss-heading" className="reveal scroll-mt-6 space-y-6">
                        <SectionHeading id="oss-heading" kicker="02 / Open source" title="Merged upstream">
                            {mergedPRs.length} merged pull requests to projects I don&apos;t own:{" "}
                            {prCounts.map((c, i) => (
                                <span key={c.project}>
                                    {i > 0 && (i === prCounts.length - 1 ? " and " : ", ")}
                                    {c.count} in {c.project}
                                </span>
                            ))}
                            . Mostly bug fixes with tests, and each was reviewed and merged by a maintainer.
                        </SectionHeading>
                        <div className="grid gap-4">
                            {groupByProject(mergedPRs).map((g) => {
                                const logo = ossLogo(g.prs[0].url);
                                return (
                                    <article key={g.project} className="surface-1 overflow-hidden">
                                        <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-(--border-default) bg-(--bg-surface-2)">
                                            <h3 className="flex items-center gap-3 text-[16px] font-semibold text-foreground">
                                                {logo && <Image src={logo} alt="" width={28} height={28} className="oss-logo" />}
                                                {g.project}
                                            </h3>
                                            <p className="font-mono text-[12px] text-(--text-muted)">
                                                <span className="metric-value text-[14px]">{g.prs.length}</span> merged · {g.stars}★
                                            </p>
                                        </header>
                                        <PrList prs={g.prs.slice(0, PRS_SHOWN)} />
                                        {g.prs.length > PRS_SHOWN && (
                                            <details className="oss-more">
                                                <summary>
                                                    <span className="oss-more-closed">Show {g.prs.length - PRS_SHOWN} more</span>
                                                    <span className="oss-more-open">Show fewer</span>
                                                    <ChevronDown className="oss-more-icon w-3.5 h-3.5" aria-hidden="true" />
                                                </summary>
                                                <PrList prs={g.prs.slice(PRS_SHOWN)} />
                                            </details>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                        {openPRs.length > 0 && (
                            <div className="space-y-2 text-[14px] text-(--text-secondary)">
                                <p className="font-mono text-(--text-muted)">Open now</p>
                                <ul className="space-y-2">
                                    {openPRs.map((pr) => {
                                        const logo = ossLogo(pr.url);
                                        return (
                                            <li key={pr.url} className="flex items-start gap-2.5">
                                                {logo && <Image src={logo} alt="" width={18} height={18} className="oss-logo mt-0.5" />}
                                                <span>
                                                    <a
                                                        href={pr.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-(--accent-primary) hover:underline"
                                                    >
                                                        {pr.project} #{pr.number}, {pr.title}
                                                    </a>
                                                    . {pr.note}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* Writing */}
                    <section id="writing" aria-labelledby="writing-heading" className="reveal scroll-mt-6 space-y-6">
                        <SectionHeading id="writing-heading" kicker="03 / Writing" title="Writing" />
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {posts.map((post) => (
                                <li key={post.href}>
                                    <article className="group relative surface-1 p-5 h-full hover:border-(--border-hover) transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-[16px] font-semibold text-foreground group-hover:text-(--accent-primary)">
                                                {post.external ? (
                                                    <a
                                                        href={post.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="after:absolute after:inset-0 after:content-['']"
                                                    >
                                                        {post.title}
                                                    </a>
                                                ) : (
                                                    <Link href={post.href} className="after:absolute after:inset-0 after:content-['']">
                                                        {post.title}
                                                    </Link>
                                                )}
                                            </h3>
                                            {post.external && (
                                                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-(--text-muted)">
                                                    Medium
                                                    <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-[12px] font-mono text-(--text-muted)">
                                            {post.date} · {post.readTime}
                                        </p>
                                        <p className="mt-3 text-[14px] leading-relaxed text-(--text-secondary)">{post.excerpt}</p>
                                    </article>
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/blogs"
                            className="inline-flex items-center gap-2 min-h-11 text-[14px] font-mono text-(--accent-primary) hover:underline"
                        >
                            All posts
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    </section>

                    {/* Explore */}
                    <section aria-labelledby="explore-heading" className="reveal space-y-6">
                        <div className="space-y-2">
                            <p className="section-kicker">04 / Explore</p>
                            <h2 id="explore-heading" className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                                Explore CORTEX
                            </h2>
                            <p className="text-[15px] leading-relaxed text-(--text-secondary) max-w-2xl">
                                The rest of the site is a small control-plane for my engineering notes. Press{" "}
                                <kbd className="font-mono text-[12px] px-1.5 py-0.5 rounded bg-(--bg-surface-2) border border-(--border-default)">
                                    Ctrl/⌘ K
                                </kbd>{" "}
                                to search it.
                            </p>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {EXPLORE.map((e, i) => (
                                // Seven cards: the last one fills its row instead of sitting alone in a corner.
                                <li key={e.href} className={i === EXPLORE.length - 1 ? "sm:col-span-2 lg:col-span-3" : undefined}>
                                    <Link
                                        href={e.href}
                                        className="block h-full surface-1 p-4 hover:border-(--border-hover) transition-colors"
                                    >
                                        <span className="font-mono text-[14px] text-(--accent-primary)">{e.href}</span>
                                        <span className="mt-1 block text-[14px] text-(--text-secondary)">{e.desc}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>

                <footer className="mt-24 pt-8 border-t border-(--border-default) flex flex-wrap items-center justify-between gap-4">
                    <ul className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[13px]">
                        <li>
                            <a
                                href="https://github.com/Ujjwaljain16"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 min-h-11 px-2 text-(--text-secondary) hover:text-(--accent-primary)"
                            >
                                <Github className="w-4 h-4" aria-hidden="true" />
                                GitHub
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.linkedin.com/in/ujjwal-jain-306b60323"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 min-h-11 px-2 text-(--text-secondary) hover:text-(--accent-primary)"
                            >
                                <Linkedin className="w-4 h-4" aria-hidden="true" />
                                LinkedIn
                            </a>
                        </li>
                        <li>
                            <a
                                href="mailto:jainujjwal1609@gmail.com"
                                className="inline-flex items-center gap-2 min-h-11 px-2 text-(--text-secondary) hover:text-(--accent-primary)"
                            >
                                <Mail className="w-4 h-4" aria-hidden="true" />
                                Email
                            </a>
                        </li>
                        <li>
                            <a
                                href="/resume.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 min-h-11 px-2 text-(--text-secondary) hover:text-(--accent-primary)"
                            >
                                <FileDown className="w-4 h-4" aria-hidden="true" />
                                Resume
                            </a>
                        </li>
                    </ul>
                    <p className="font-mono text-[12px] text-(--text-muted)">CORTEX · Ujjwal Jain</p>
                </footer>
            </div>
        </>
    );
}
