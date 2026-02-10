"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blogPosts";

export default function BlogsPage() {
    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-8 shrink-0">
                <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2 opacity-60">KNOWLEDGE BASE</div>
                <h1 className="text-header mb-1">Engineering Blog</h1>
                <p className="text-sm text-(--text-secondary)">
                    Technical deep dives, architectural decisions, and learnings
                </p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-4">
                <div className="grid grid-cols-1 gap-4 max-w-3xl">
                    {BLOG_POSTS.map((post, idx) => (
                        <motion.article
                            key={post.slug}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative surface-1 rounded-lg p-5 border border-transparent hover:border-(--border-default) transition-all duration-200"
                        >
                            <Link href={`/blogs/${post.slug}`} className="absolute inset-0 z-0" />

                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-medium text-foreground group-hover:text-(--accent-primary) transition-colors">
                                        {post.title}
                                    </h2>
                                    <div className="flex items-center gap-3 text-[11px] text-(--text-muted) font-mono">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {post.date}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" />
                                            {post.readTime}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-(--text-muted) opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                            </div>

                            <p className="text-sm text-(--text-secondary) leading-relaxed mb-4 line-clamp-2">
                                {post.excerpt}
                            </p>

                            <div className="flex flex-wrap gap-2 relative z-10">
                                {post.tags.map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-1 rounded bg-(--bg-surface-2) text-(--text-muted) border border-(--border-default)">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </div>
    );
}
