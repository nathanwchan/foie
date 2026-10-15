# Future of iOS Engineering

A static intelligence dashboard tracking how LLMs and coding agents are changing iOS software development. The growing resource collection is backed by inspectable sources and stored as schema-validated files in Git. The feed prioritizes unseen posts, with newest-first ordering within the unseen and seen groups by publication date, falling back to discovery date when publication date is unavailable. Seen-post history is stored locally in the visitor's browser.

Live site: [www.futureofios.com](https://www.futureofios.com/).

## Stack

- Astro and TypeScript
- Astro content collections for the resource contract
- Pagefind for static full-text search and filters
- Sitemap generation
- A repository-local Codex curation skill for scheduled research and publishing

## Local development

Use Node.js 24, matching the GitHub Actions build.

```sh
npm ci
npm run dev
```

To preview the production build, including the generated Pagefind search index:

```sh
npm run build
npm run preview
```

Set `SITE_URL=https://www.futureofios.com` in the production deployment environment so canonical links and the sitemap use the production origin. See `.env.example` for the variable format.

## Publishing gates

```sh
npm run check
npm run build
```

The production build validates schemas, controlled vocabulary, canonical URL uniqueness, and discovery-ledger coverage before Astro and Pagefind run.

## Content model

- `src/content/resources/`: one JSON record per accepted source
- `src/content/users/`: one manually curated JSON record per person, with a verified-profile avatar and public profile links
- `data/discovery-ledger.json`: audit trail for accepted, skipped, duplicate, and unavailable discoveries; public in this repository but not rendered on the website
- `.agents/skills/curate-ios-engineering/`: the durable curation and publication workflow

The scheduled Codex task runs on Sundays and invokes the repository-local skill. Each run uses a rolling 7-day discovery window. Successful runs publish directly to `main`; no-change runs report without creating a commit.

Resources are presented as complete feed cells rather than internal detail pages. Each resource selects one best canonical source; titles and preview art point to that destination. Equivalent mirrors remain discovery-ledger aliases used only for deduplication.

People are linked to posts through explicit `userIds` on resource records. Every stored user and verified profile is a priority seed for a dedicated scheduled-discovery pass, without replacing broad internet research or lowering the content threshold. The workflow never adds or modifies people automatically; user records change only through direct curator requests.

## Scope

The project covers engineering workflows: agentic development, Xcode tooling, architecture, code review, testing, evaluation, visual validation, SDLC automation, and human-in-the-loop team practices. App-facing AI features are out of scope unless the source directly addresses their effect on the engineering process.

Scheduled discovery publishes editorial sources: substantive articles, social posts, talks, videos, podcasts, and papers. It excludes direct tool or product pages, repositories, releases, package or app listings, and documentation. An explicit curator request naming a specific artifact can override this restriction for a manual addition.
