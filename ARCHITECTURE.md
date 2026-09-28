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

Validates the body (size, message count, question length), rate limits by IP and globally, keeps only user text, retrieves
context through the Devin MCP `ask_wiki_question` tool over an allowlist of public repositories, and streams a Gemini answer
that must cite its sources or say it has no data. Secrets are read server side only.

## Known limits

- The rate limiter is in memory, so limits are per server instance.
- `/ask` retrieval covers an allowlist of public repositories. One that the retrieval service has not indexed is skipped (and remembered as unavailable for 10 minutes), so answers keep working, but the first request after that pays for an extra round of calls.
- Records were verified when they were written; a later change in a source repository is not detected automatically.
