import Link from "next/link";
import { ArrowRight, FileDown, Github, Linkedin, Mail } from "lucide-react";
import { BootOverlay } from "@/components/landing/BootSequence";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ProjectCard } from "@/components/system/ProjectCard";
import { BLOG_POSTS } from "@/data/blogPosts";
import { featuredProjects, projects } from "@/data/projects";
import { countByProject, inReview, mergedPRs } from "@/data/openSource";
import { formatDate } from "@/lib/utils";

// Two failures I documented in the projects themselves. Each links to the source.
const LESSONS = [
    {
        title: "A circuit breaker that could never trip",
        body: "In AgentBrake I wrote a circuit-breaker policy with open, half-open and reset logic, and unit-tested it. Then I found that nothing in the proxy ever reports a failure to it, because the child's output is piped straight through. It's documented as scaffolding. The lesson: wire the signal before writing the policy.",
        href: "https://github.com/Ujjwaljain16/AgentBrake/blob/HEAD/src/policy/policies/CircuitBreakerPolicy.ts",
        cta: "CircuitBreakerPolicy.ts",
    },
    {
        title: "A 10× target that reached 1.2–2.2×",
        body: "In MiniDB I expected the vectorized executor to beat the Volcano-style one by about ten times. It reached roughly 1.2 to 2.2×, and the benchmark doc explains the overhead instead of hiding the miss. The lesson: measure first, and publish the number you got.",
        href: "https://github.com/Ujjwaljain16/MiniDB/blob/HEAD/MiniDB_Projects/Team_ARIES_Recovery/docs/BENCHMARKS.md",
        cta: "BENCHMARKS.md",
    },
];

const WRITING_SLUGS = ["integration-complexity", "unicode-corruption-base64"];

const EXPLORE = [
    { href: "/decisions", label: "Decisions", desc: "Engineering decisions with the alternative I rejected and what happened." },
    { href: "/experiments", label: "Experiments", desc: "Hypotheses tested by building the alternative." },
    { href: "/deployments", label: "Deployments", desc: "Where each system actually runs." },
    { href: "/system", label: "System", desc: "Signals from my public GitHub account." },
    { href: "/ask", label: "Ask", desc: "Ask questions about four of my projects." },
];

export default function HomePage() {
    const posts = WRITING_SLUGS.map((s) => BLOG_POSTS.find((p) => p.slug === s)).filter((p) => p !== undefined);
    const prCounts = countByProject();

    return (
        <>
            <BootOverlay />

            <div className="max-w-5xl mx-auto px-5 md:px-10 pb-24">
                <HomeHeader />

                <main id="main" className="space-y-20 pt-12 md:pt-20">
                    {/* Hero */}
                    <section aria-labelledby="hero-heading" className="space-y-6">
                        <p className="text-[12px] font-mono uppercase tracking-[0.2em] text-(--accent-primary)">
                            Backend &amp; systems engineering
                        </p>
                        <h1 id="hero-heading" className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
                            Ujjwal Jain
                        </h1>
                        <p className="max-w-2xl text-[17px] md:text-[19px] leading-relaxed text-(--text-secondary)">
                            I build databases, protocols and data pipelines from scratch, then write the tests and
                            benchmarks that show where they break. Each project below links to its code and lists what
                            it doesn&apos;t do yet.
                        </p>
                        <p className="text-[13px] font-mono text-(--text-muted)">
                            Bachelor&apos;s in Computer Science · BITS Pilani · 9.3 CGPA · 2024–2028
                        </p>
                        <ul className="flex flex-wrap gap-3 pt-2">
                            <li>
                                <a
                                    href="#projects"
                                    className="inline-flex items-center gap-2 min-h-11 px-5 rounded-lg bg-(--accent-primary) text-white text-[14px] font-medium hover:opacity-90"
                                >
                                    See projects
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/resume.pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 min-h-11 px-4 rounded-lg border border-(--border-hover) bg-(--bg-surface-2) text-[14px] text-foreground hover:border-(--accent-primary)"
                                >
                                    <FileDown className="w-4 h-4" aria-hidden="true" />
                                    Resume
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/Ujjwaljain16"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 min-h-11 px-4 rounded-lg border border-(--border-hover) bg-(--bg-surface-2) text-[14px] text-foreground hover:border-(--accent-primary)"
                                >
                                    <Github className="w-4 h-4" aria-hidden="true" />
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:jainujjwal1609@gmail.com"
                                    className="inline-flex items-center gap-2 min-h-11 px-4 rounded-lg border border-(--border-hover) bg-(--bg-surface-2) text-[14px] text-foreground hover:border-(--accent-primary)"
                                >
                                    <Mail className="w-4 h-4" aria-hidden="true" />
                                    Email
                                </a>
                            </li>
                        </ul>
                    </section>

                    {/* Featured projects */}
                    <section id="projects" aria-labelledby="projects-heading" className="scroll-mt-6 space-y-6">
                        <div>
                            <h2 id="projects-heading" className="text-2xl font-semibold text-foreground">
                                Featured projects
                            </h2>
                            <p className="mt-2 text-[15px] text-(--text-secondary) max-w-2xl">
                                The four with the most verifiable engineering. Each page shows the evidence, links to the
                                source files, and says what isn&apos;t done.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {featuredProjects.map((p) => (
                                <ProjectCard key={p.id} project={p} variant="feature" />
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
                    <section id="open-source" aria-labelledby="oss-heading" className="scroll-mt-6 space-y-6">
                        <div>
                            <h2 id="oss-heading" className="text-2xl font-semibold text-foreground">
                                Open source
                            </h2>
                            <p className="mt-2 text-[15px] text-(--text-secondary) max-w-2xl">
                                {mergedPRs.length} merged pull requests to projects I don&apos;t own:{" "}
                                {prCounts.map((c, i) => (
                                    <span key={c.project}>
                                        {i > 0 && (i === prCounts.length - 1 ? " and " : ", ")}
                                        {c.count} in {c.project}
                                    </span>
                                ))}
                                . Mostly bug fixes with tests, and each was reviewed and merged by a maintainer.
                            </p>
                        </div>
                        <ul className="surface-1 divide-y divide-(--border-default)/60">
                            {mergedPRs.map((pr) => (
                                <li key={pr.url} className="p-4">
                                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                        <span className="font-mono text-[12px] text-(--text-muted)">
                                            {pr.project} · {pr.stars}★
                                        </span>
                                        <a
                                            href={pr.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[15px] font-medium text-foreground hover:text-(--accent-primary)"
                                        >
                                            #{pr.number}: {pr.title} ↗
                                        </a>
                                        <span className="font-mono text-[12px] text-(--text-muted)">
                                            merged {formatDate(pr.merged)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[14px] leading-relaxed text-(--text-secondary)">{pr.summary}</p>
                                </li>
                            ))}
                        </ul>
                        <p className="text-[14px] text-(--text-secondary)">
                            <span className="font-mono text-(--text-muted)">In review: </span>
                            <a
                                href={inReview.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-(--accent-primary) hover:underline"
                            >
                                {inReview.project} #{inReview.number}, {inReview.title} ↗
                            </a>
                            . {inReview.note}
                        </p>
                    </section>

                    {/* Lessons */}
                    <section aria-labelledby="lessons-heading" className="space-y-6">
                        <div>
                            <h2 id="lessons-heading" className="text-2xl font-semibold text-foreground">
                                What didn&apos;t go to plan
                            </h2>
                            <p className="mt-2 text-[15px] text-(--text-secondary) max-w-2xl">
                                I keep the misses in the repositories rather than tidying them away. Two examples.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {LESSONS.map((l) => (
                                <article key={l.title} className="surface-1 p-5 flex flex-col gap-3">
                                    <h3 className="text-[16px] font-semibold text-foreground">{l.title}</h3>
                                    <p className="text-[14px] leading-relaxed text-(--text-secondary)">{l.body}</p>
                                    <a
                                        href={l.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-auto inline-flex min-h-11 items-center font-mono text-[12px] text-(--accent-primary) hover:underline"
                                    >
                                        {l.cta} ↗
                                    </a>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* Writing */}
                    <section id="writing" aria-labelledby="writing-heading" className="scroll-mt-6 space-y-6">
                        <h2 id="writing-heading" className="text-2xl font-semibold text-foreground">
                            Writing
                        </h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {posts.map((post) => (
                                <li key={post.slug}>
                                    <article className="group relative surface-1 p-5 h-full hover:border-(--border-hover) transition-colors">
                                        <h3 className="text-[16px] font-semibold text-foreground group-hover:text-(--accent-primary)">
                                            <Link
                                                href={`/blogs/${post.slug}`}
                                                className="after:absolute after:inset-0 after:content-['']"
                                            >
                                                {post.title}
                                            </Link>
                                        </h3>
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
                    <section aria-labelledby="explore-heading" className="space-y-6">
                        <div>
                            <h2 id="explore-heading" className="text-2xl font-semibold text-foreground">
                                Explore CORTEX
                            </h2>
                            <p className="mt-2 text-[15px] text-(--text-secondary) max-w-2xl">
                                The rest of the site is a small control-plane for my engineering notes. Press{" "}
                                <kbd className="font-mono text-[12px] px-1.5 py-0.5 rounded bg-(--bg-surface-2) border border-(--border-default)">
                                    Ctrl/⌘ K
                                </kbd>{" "}
                                to search it.
                            </p>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {EXPLORE.map((e) => (
                                <li key={e.href}>
                                    <Link
                                        href={e.href}
                                        className="block h-full surface-1 p-4 hover:border-(--border-hover) transition-colors"
                                    >
                                        <span className="font-mono text-[14px] text-(--accent-primary)">/{e.label.toLowerCase()}</span>
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
