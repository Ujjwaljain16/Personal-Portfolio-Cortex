import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blogPosts";

// Improved renderer for code blocks
interface ContentSection {
    type: "text" | "code";
    content: string;
    language?: string;
}

function ContentRenderer({ content }: { content: string }) {
    const sections: ContentSection[] = [];
    let currentText = "";
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeContent = "";

    const lines = content.split("\n");

    lines.forEach((line) => {
        if (line.startsWith("```")) {
            if (inCodeBlock) {
                // End of code block
                sections.push({ type: "code", language: codeLanguage, content: codeContent });
                inCodeBlock = false;
                codeContent = "";
                codeLanguage = "";
            } else {
                // Start of code block
                if (currentText) {
                    sections.push({ type: "text", content: currentText });
                    currentText = "";
                }
                inCodeBlock = true;
                codeLanguage = line.replace("```", "").trim();
            }
        } else if (inCodeBlock) {
            codeContent += line + "\n";
        } else {
            currentText += line + "\n";
        }
    });

    if (currentText) sections.push({ type: "text", content: currentText });

    return (
        <div className="space-y-6">
            {sections.map((section, idx) => {
                if (section.type === "code") {
                    return (
                        <div key={idx} className="my-6 rounded-lg overflow-hidden border border-(--border-default) bg-(--bg-surface-2)">
                            <div className="px-4 py-2 border-b border-(--border-default) bg-(--bg-surface-1) text-[10px] uppercase font-mono text-(--text-muted)">
                                {section.language || "TEXT"}
                            </div>
                            <pre className="p-4 overflow-x-auto custom-scrollbar text-sm font-mono leading-relaxed text-(--text-secondary)">
                                <code>{section.content}</code>
                            </pre>
                        </div>
                    );
                }

                // Text rendering
                const lines = section.content.split("\n");
                return (
                    <div key={idx} className="space-y-4">
                        {lines.map((line, i) => {
                            if (!line.trim()) return null;
                            if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold text-foreground mt-8 mb-2">{line.slice(3)}</h2>;
                            if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-medium text-foreground mt-6 mb-2">{line.slice(4)}</h3>;
                            if (line.startsWith("- ")) {
                                const content = line.slice(2);
                                return (
                                    <div key={i} className="flex gap-2 ml-1">
                                        <span className="text-(--accent-primary) mt-1.5 w-1 h-1 rounded-full shrink-0" />
                                        <span className="text-base text-(--text-secondary)">
                                            {content.split(/\*\*(.*?)\*\*/g).map((part, pi) =>
                                                pi % 2 === 1 ? <strong key={pi} className="text-foreground font-medium">{part}</strong> : part
                                            )}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <p key={i} className="text-base leading-7 text-(--text-secondary)">
                                    {line.split(/\*\*(.*?)\*\*/g).map((part, pi) =>
                                        pi % 2 === 1 ? <strong key={pi} className="text-foreground font-medium">{part}</strong> : part
                                    )}
                                </p>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export function generateStaticParams() {
    return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    if (!post) notFound();

    return (
        <div className="max-w-3xl pb-10">
            <header className="mb-8">
                <Link
                    href="/blogs"
                    className="inline-flex items-center gap-2 min-h-11 text-[13px] font-mono text-(--text-secondary) hover:text-(--accent-primary) transition-colors group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                    All posts
                </Link>

                <ul className="flex flex-wrap gap-2 mt-4 mb-4" aria-label="Tags">
                    {post.tags.map((tag) => (
                        <li
                            key={tag}
                            className="text-[11px] px-2 py-1 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono"
                        >
                            {tag}
                        </li>
                    ))}
                </ul>

                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-4 leading-tight">
                    {post.title}
                </h1>

                <div className="flex items-center gap-6 text-[13px] text-(--text-muted) font-mono pb-6 border-b border-(--border-default)">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {post.readTime}
                    </span>
                </div>
            </header>

            <article>
                <ContentRenderer content={post.content} />
            </article>
        </div>
    );
}
