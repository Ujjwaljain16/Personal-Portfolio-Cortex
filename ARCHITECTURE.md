# Architecture

## Shape of the app

A static-first Next.js App Router site. Almost every page is a server component rendered at build time; the only dynamic
route is `/api/ask`, and `/system` is incremental (revalidated every 10 minutes). There is no database and no client state
library.

```
src/
  app/            routes, metadata, sitemap, robots, Open Graph image
    api/ask/      streaming chat endpoint
  components/
    layout/       shell, sidebar, mobile nav, command palette
    records/      decision and investigation cards and filters
    projects/ deployments/ home/ system/ ask/ landing/
  data/           typed content: projects, records, posts, deployments, open source
  lib/            seo helpers, GitHub client (server only), rate limiter, search index
scripts/          validate-data.mjs (runs in CI)
```

## Content is data

Everything shown on the site comes from typed modules in `src/data`. `scripts/validate-data.mjs` imports them (Node type
stripping) and fails the build on structural problems: required fields, evidence hosts, minimum evidence per record,
resolvable related-record ids and date formats.

`records.ts` holds the decisions and investigations. It was generated once from verified research and is now edited by
hand; each record carries its evidence links, how it was checked, whether its reasoning was `recorded` or `reconstructed`,
and, for investigations, the numbers with their sources.

## Rendering and bundle rules

- Record cards are server components. Only the filter bar (`RecordsBrowser`) and a tiny deep-link helper
  (`RecordDeepLink`) are client components, and they receive the rendered cards as children, so record text never enters
  the client bundle.
- The command palette is mounted on every page. It receives a slim index (`lib/searchIndex.ts`, built in `layout.tsx`)
  instead of importing the full data, which keeps the shared bundle small.
- `react-markdown` and the AI SDK are only needed by `/ask`, so they load only there.
- Fonts are self-hosted through `next/font` (Geist for text, JetBrains Mono for code and labels).
- Heavy pages (`/decisions`, `/investigations`) render every record collapsed inside `<details>`, so they work without
  JavaScript. The cost is page size, about 140 KB and 95 KB gzipped.

## Accessibility

Skip link and focus target for `<main>`; native `<details>` for disclosures; the command palette is a modal dialog with a
combobox and listbox, focus is trapped while open and restored on close; framer-motion honours `prefers-reduced-motion`
through `MotionConfig`; colour tokens were checked with axe in both themes.

## SEO

`lib/seo.ts` builds page metadata (canonical URL, Open Graph, Twitter) and JSON-LD (Person, Article). `sitemap.ts` lists
static routes, projects and posts; `robots.ts` disallows `/api/`.

## `/api/ask`

Validates the body (size, message count, question length), rate limits by IP and globally, and keeps only user text. Then:

1. **Route.** `lib/askRouting.ts` finds which project the question (or, for a follow-up, the earlier question) is about and
   keeps at most two repositories from the allowlist. A question that names no project skips the lookup.
2. **Repository notes (optional).** `lib/wiki.ts` asks the Devin MCP `ask_wiki_question` tool about only those repositories,
   with the question reworded to ask for components, files and documented trade-offs. It has a 20 s budget; on any failure the
   notes are simply left out. Results are cached for an hour, and a repository the service has not indexed is skipped and
   remembered as unavailable for an hour.
3. **Checked portfolio.** `lib/corpus.ts` renders all the site's verified content as one block of text with a page path on
   every item. The whole site is small enough to send with every question, so nothing is retrieved or ranked.
4. **Answer.** `lib/askPrompt.ts` puts the rules and the portfolio first (the same for every question, so the provider can
   reuse it) and the notes last, marked as unchecked. `lib/answer.ts` streams from the first Gemini model that starts
   responding.

On the page, `Markdown` shows a link only if it points at a real portfolio page or the author's GitHub, so an invented path
cannot become a clickable link. Secrets are read server side only.

## Known limits

- The rate limiter is in memory, so limits are per server instance.
- Repository notes cover an allowlist of public repositories that the lookup service has indexed. Others are skipped, so questions about them are answered from the checked portfolio alone.
- Every question sends the whole checked portfolio (about 60k tokens). That is fine at this size; if the content grows past a few hundred thousand tokens, retrieval will be needed.
- Records were verified when they were written; a later change in a source repository is not detected automatically.
