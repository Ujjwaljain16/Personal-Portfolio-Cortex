# CORTEX

The source of my engineering portfolio: <https://ujjwaljain.vercel.app>

It is built as a small "control plane" interface, but the content is the point. Every project claim, decision and
measurement on the site was checked against the repository it came from, and where something is unfinished, unmeasured or
was later found to be wrong, the site says so.

## What is on the site

| Route | What it shows |
| --- | --- |
| `/` | Summary, lessons from projects that went wrong, open-source work |
| `/projects`, `/projects/[id]` | Projects with the problem, approach, evidence (linked to files) and limitations |
| `/decisions` | Decision records: context, alternatives, what happened, how each was checked |
| `/investigations` | Benchmarks and root-cause analyses with method, result and the source of every number |
| `/deployments` | What is published and where, linked to the related records |
| `/blogs`, `/blogs/[slug]` | Technical write-ups (Markdown) with published and updated dates |
| `/system` | Live GitHub activity (public data only; revalidated every 10 minutes) |
| `/ask` | Chat over the engineering record, backed by Gemini and a public-repository knowledge source |
| `/experiments` | Redirects to `/investigations` |

## Stack

Next.js 16 (App Router, React Server Components, React Compiler), React 19, TypeScript in strict mode, Tailwind CSS 4,
framer-motion, `react-markdown`, the Vercel AI SDK with Gemini for `/api/ask`. There is no database: all content is typed
data in `src/data`, validated at build time.

## Run it

```bash
npm ci
cp .env.example .env.local   # every variable is optional except for /ask
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run validate:data` | Checks projects, records, posts and links (needs Node 22.18+) |
| `npm run build` | Production build |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, data validation, the build and a scan for credentials in the build
output.

## Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `/api/ask` | Server only |
| `DEVIN_API_KEY` | `/api/ask` | Server only; retrieval over four public repositories |
| `GITHUB_TOKEN` | `/system` | Optional; a token with no permissions, only to raise the rate limit |

Nothing is prefixed with `NEXT_PUBLIC_`, so no secret can reach the client bundle.

## How the content is kept honest

- `src/data/projects.ts`, `records.ts`, `openSource.ts` and `blogPosts.ts` are the only sources of content.
- `scripts/validate-data.mjs` fails CI on missing fields, evidence links to hosts that are not allowed, records
  without at least two pieces of evidence, or dates that do not parse.
- Decision and investigation records say whether the reasoning was written down at the time or reconstructed from history,
  and whether the numbers were measured or reproduced.
- Where a project used an AI coding assistant, the project page says so.

## `/api/ask`

A POST endpoint that streams a Gemini answer. Requests are limited to 32 KB, 24 messages and 500 characters per question,
and rate limited per IP and globally (in memory, so per server instance). Only the text of user messages is used. Retrieval
runs over an allowlist of public repositories, and the answer is required to cite its sources or say it has no data.

## Layout

See [ARCHITECTURE.md](ARCHITECTURE.md).
