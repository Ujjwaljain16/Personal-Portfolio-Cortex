# Architecture

## Shape of the app

A static-first Next.js App Router site. Almost every page is a server component rendered at build time; the only dynamic
route is `/api/ask`, and `/system` is incremental (revalidated every 10 minutes). There is no database and no client state
library.

```
src/
  app/            routes, metadata, sitemap, robots, Open Graph images
    api/ask/      streaming chat endpoint (Digital Ujjwal)
  components/
    brand/        the CORTEX mark
    layout/       shell, sidebar, mobile nav, command palette
    records/      decision and investigation cards, header and filters
    projects/     pipeline, status pill, area tags and filter, summary card, on-this-page
    home/         header, project constellation, featured project card, section heading
    deployments/ system/ ask/ landing/
  data/           typed content: projects, records, posts, deployments, open source, playbook, logos
  lib/            seo and share-card helpers, GitHub client (server only), rate limiter, search index, ask pipeline
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
do not own, and the date of the newest commit on each portfolio repository's default branch, so bot pushes such as Dependabot do not count; a project whose released version is on the default branch while its work is on another branch can be listed in `DEV_BRANCH` in the sync script and is then read from that branch, and the page says so). `scripts/sync-github.mjs` builds it from the GitHub GraphQL
API; `.github/workflows/sync.yml` runs it daily, runs the CI checks on any change, and commits to `main` when they pass.
`src/data/openSource.ts` composes the site's lists from it plus a small hand-written `CURATED` table, and `src/data/now.ts`
takes the page's sync date from the same file (the "Now" items themselves are hand-written). Summaries are the pull request's own
first paragraph, never model-written. The coursework repository is excluded three ways: a star floor, a deny list, and a
refusal to use any description that contains an email address or roll number.

The file's `syncedAt` moves only when the data does, plus a weekly heartbeat, so most days produce no commit and a quiet
repository still shows activity. `validate-data` warns if the timestamp is over 21 days old.

## Look and feel

- One palette of CSS custom properties in `globals.css` (midnight dark theme by default, a light theme, and accent palettes
  picked from the palette button). Components use the tokens, never raw colours, so every palette and theme works without
  per-component overrides. Tailwind 4 reads the same tokens.
- Inner pages scroll inside `.main-panel`, the home page inside `.boot-fullscreen`. `.main-panel > *` caps width at 72rem;
  page frames set their own narrower width one level in.
- Projects carry `areas` (AI, backend, infra and DevOps, internals, security, full stack, tools, mobile). The projects page
  filters on them client side through `data-areas`, so the full list still renders without JavaScript.
- Project and open-source logos live in `public/projects/*` and `public/oss/*`, looked up through `src/data/projectLogos.ts`
  and `src/data/ossLogos.ts`; a project without one simply shows no logo.
- The CORTEX mark (`components/brand/CortexMark.tsx`) is drawn in `currentColor` on an accent tile, so it follows the
  palette. `app/icon.svg` and the share cards (`lib/ogCard.tsx`) draw the same shape with fixed colours.

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

The Ask page is "Digital Ujjwal": an AI version of me that answers in the first person from the verified record. It says
it is an AI and not me, never turns project work into employment, never invents experience or a weakness, and labels any
reasoning about something I have not built as a hypothetical. The page offers four modes (my work, how I'd build it, hiring,
interview me), which only change the starter questions.

Validates the body (size, message count, question length), rate limits by IP and globally, and keeps only user text. Then:

1. **Route.** `lib/askRouting.ts` finds which project the question (or, for a follow-up, the earlier question) is about and
   keeps at most two repositories from the allowlist. The allowlist (`WIKI_REPOS` in the route) is every project's
   repository plus LEXIS, minus private ones (`PRIVATE_REPOS`, because this endpoint is public); the smaller "Also built"
   repositories are left out on purpose. A question that names no project skips the lookup.
2. **Repository notes (optional).** `lib/wiki.ts` asks the Devin MCP `ask_wiki_question` tool about only those repositories,
   with the question reworded to ask for components, files and documented trade-offs. Its budget shrinks with whatever time
   the request has already spent (18 s at most; one lookup usually takes about 12 s); on any failure the notes are simply left out. Results are cached for an
   hour, and a repository the service has not indexed is skipped and remembered as unavailable for an hour.
3. **Checked portfolio and personal context.** `lib/corpus.ts` renders the site's verified content (`selectCorpus`) as an
   index of everything plus full detail for the projects and records a question is actually about, so a question does not
   need the whole site's text. Always included as well: who I am (`profile.ts`, `about.ts`), the playbook
   (`src/data/playbook.ts`, principles each tied to the records that show them), and a skills index mapping each
   technology to the projects that use it, so "do you know React?" is answered from the work. Hiring and weakness questions
   also get the records whose outcome was a miss. `about.ts` is self-reported and, unlike the rest of `src/data`, not checked
   against a repository.
4. **Deadline.** The route computes a deadline from its own start time (`SAFE_DEADLINE_MS`, well under `maxDuration`) and
   passes down whatever time is left to both the retrieval budget and generation's abort signal, so a slow step ends the
   request with a visible error rather than leaving the platform to kill it silently mid-stream.
5. **Answer.** `lib/askPrompt.ts` puts the rules and the portfolio first (the same for every question, so the provider can
   reuse it) and the notes last, marked as unchecked. A follow-up sends the earlier question as context only, so a refusal
   is never carried into the next answer. `lib/answer.ts` streams from the first Gemini model that starts responding within
   its share of the peek budget, with a capped thinking budget so reasoning cannot eat the output tokens.

`scripts/ask-eval.mjs` runs live questions against a running server and checks the answers (`ASK_EVAL_ONLY` runs a subset).
Each run spends real model quota.

On the page, `Markdown` shows a link only if it points at a real portfolio page or the author's GitHub, so an invented path
cannot become a clickable link; a bare bracketed path to a real page (`[/projects/minidb]`) is turned into a link. Secrets are read server side only.

## Known limits

- The rate limiter is in memory, so limits are per server instance.
- Repository notes cover an allowlist of public repositories that the lookup service has indexed. Others are skipped, so questions about them are answered from the checked portfolio alone.
- `src/data/about.ts` is public and unverified by design (see the comment in the file).
- Ask runs on Gemini's free tier. When the daily quota is spent it falls back to the next model, and if every model is out
  the page shows an error until the quota resets.
- Records were verified when they were written. A later change in a source repository is not re-verified, but `check-links`
  runs weekly and fails when an evidence link stops resolving (a moved file, a deleted commit).
- Commit counts and similar numbers written into a project's prose are snapshots. The project page's "last commit" date
  is generated, so a stale snapshot is visible next to it.
