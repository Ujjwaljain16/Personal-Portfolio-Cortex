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
scripts/          validate-data.mjs (CI), sync-github.mjs (daily), check-links.mjs (weekly), lib/github-sync.mjs (pure helpers)
```

## Content is data

Everything shown on the site comes from typed modules in `src/data`. `scripts/validate-data.mjs` imports them (Node type
stripping) and fails the build on structural problems: required fields, evidence hosts, minimum evidence per record,
resolvable related-record ids and date formats.

`records.ts` holds the decisions and investigations. It was generated once from verified research and is now edited by
hand; each record carries its evidence links, how it was checked, whether its reasoning was `recorded` or `reconstructed`,
and, for investigations, the numbers with their sources.

## Generated data

Two files are written by a bot, never by hand: `src/data/generated/github.json` (merged and open pull requests to projects I
do not own, and the date of the newest commit on each portfolio repository's default branch, so bot pushes such as Dependabot do not count). `scripts/sync-github.mjs` builds it from the GitHub GraphQL
API; `.github/workflows/sync.yml` runs it daily, runs the CI checks on any change, and commits to `main` when they pass.
`src/data/openSource.ts` composes the site's lists from it plus a small hand-written `CURATED` table, and `src/data/now.ts`
derives its "Just merged" and "In review" items and the page's sync date from the same file. Summaries are the pull request's own
first paragraph, never model-written. The coursework repository is excluded three ways: a star floor, a deny list, and a
refusal to use any description that contains an email address or roll number.

The file's `syncedAt` moves only when the data does, plus a weekly heartbeat, so most days produce no commit and a quiet
repository still shows activity. `validate-data` warns if the timestamp is over 21 days old.

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
   with the question reworded to ask for components, files and documented trade-offs. Its budget shrinks with whatever time
   the request has already spent (10 s at most); on any failure the notes are simply left out. Results are cached for an
   hour, and a repository the service has not indexed is skipped and remembered as unavailable for an hour.
3. **Checked portfolio and personal context.** `lib/corpus.ts` renders the site's verified content (`selectCorpus`) as an
   index of everything plus full detail for the projects and records a question is actually about, so a question does not
   need the whole site's text. `src/data/about.ts` is a short, separately-labelled, self-reported "how I think" section
   that is always included; unlike everything else in `src/data`, it is not checked against a repository.
4. **Deadline.** The route computes a deadline from its own start time (`SAFE_DEADLINE_MS`, well under `maxDuration`) and
   passes down whatever time is left to both the retrieval budget and generation's abort signal, so a slow step ends the
   request with a visible error rather than leaving the platform to kill it silently mid-stream.
5. **Answer.** `lib/askPrompt.ts` puts the rules and the portfolio first (the same for every question, so the provider can
   reuse it) and the notes last, marked as unchecked. `lib/answer.ts` streams from the first Gemini model that starts
   responding within its share of the peek budget.

On the page, `Markdown` shows a link only if it points at a real portfolio page or the author's GitHub, so an invented path
cannot become a clickable link. Secrets are read server side only.

## Known limits

- The rate limiter is in memory, so limits are per server instance.
- Repository notes cover an allowlist of public repositories that the lookup service has indexed. Others are skipped, so questions about them are answered from the checked portfolio alone.
- `src/data/about.ts` is public and unverified by design (see the comment in the file). It ships with placeholder text;
  `npm run validate:data` warns until it is replaced with real, curated facts.
- Records were verified when they were written. A later change in a source repository is not re-verified, but `check-links`
  runs weekly and fails when an evidence link stops resolving (a moved file, a deleted commit).
- Commit counts and similar numbers written into a project's prose are snapshots. The project page's "last commit" date
  is generated, so a stale snapshot is visible next to it.
