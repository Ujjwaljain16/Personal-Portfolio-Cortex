import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * The single markdown renderer for blog posts and chat answers.
 *
 * react-markdown never renders raw HTML (no rehype-raw), sanitises URLs
 * (javascript: etc. are dropped) and builds React elements rather than
 * strings, so untrusted model output is safe to pass through. Images are
 * disallowed. Headings are shifted down so the page keeps its single <h1>.
 */

type Variant = "article" | "chat";

function makeComponents(variant: Variant): Components {
    const article = variant === "article";
    const text = article ? "text-base leading-7" : "text-[14px] leading-relaxed";

    return {
        h1: ({ children }) => <h2 className={cn("font-semibold text-foreground", article ? "text-xl mt-10 mb-3" : "text-[15px] mt-3")}>{children}</h2>,
        h2: ({ children }) => <h2 className={cn("font-semibold text-foreground", article ? "text-xl mt-10 mb-3" : "text-[15px] mt-3")}>{children}</h2>,
        h3: ({ children }) => <h3 className={cn("font-medium text-foreground", article ? "text-lg mt-8 mb-2" : "text-[13px] uppercase tracking-wider mt-3")}>{children}</h3>,
        h4: ({ children }) => <h4 className="font-medium text-foreground mt-4 mb-1">{children}</h4>,
        p: ({ children }) => <p className={cn("text-(--text-secondary)", text, article ? "my-4" : "my-1.5")}>{children}</p>,
        ul: ({ children }) => <ul className={cn("list-disc pl-6 text-(--text-secondary) space-y-1.5", text, article ? "my-4" : "my-1.5")}>{children}</ul>,
        ol: ({ children }) => <ol className={cn("list-decimal pl-6 text-(--text-secondary) space-y-1.5", text, article ? "my-4" : "my-1.5")}>{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        hr: () => <hr className="my-6 border-(--border-default)" />,
        blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-2 border-(--accent-primary) text-(--text-secondary)">{children}</blockquote>
        ),
        a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
                <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-(--accent-primary) underline underline-offset-2 hover:opacity-80"
                >
                    {children}
                </a>
            );
        },
        pre: ({ children }) => (
            <pre className="my-5 overflow-x-auto rounded-lg border border-(--border-default) bg-(--bg-surface-2) p-4 text-[13px] leading-relaxed font-mono text-(--text-secondary)">
                {children}
            </pre>
        ),
        code: ({ className, children }) => {
            const isBlock = /language-/.test(className ?? "") || String(children).includes("\n");
            if (isBlock) return <code className={className}>{children}</code>;
            return (
                <code className="px-1.5 py-0.5 rounded bg-(--bg-surface-3) text-(--accent-secondary) text-[0.9em] font-mono">
                    {children}
                </code>
            );
        },
    };
}

const COMPONENTS: Record<Variant, Components> = {
    article: makeComponents("article"),
    chat: makeComponents("chat"),
};

export function Markdown({ children, variant = "article" }: { children: string; variant?: Variant }) {
    return (
        <ReactMarkdown components={COMPONENTS[variant]} disallowedElements={["img"]} unwrapDisallowed>
            {children}
        </ReactMarkdown>
    );
}
