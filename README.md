# Future of iOS Engineering

A static intelligence dashboard tracking how LLMs and coding agents are changing iOS software development. Resources and weekly updates are ordered newest-first, backed by inspectable sources, and stored as schema-validated files in Git.

## Stack

- Astro and TypeScript
- Astro content collections for resource and update contracts
- Pagefind for static full-text search and filters
- RSS and sitemap generation
- A repository-local Codex curation skill for weekly research and publishing

## Local development

```sh
npm install
npm run dev
```

Set `SITE_URL` in the deployment environment so canonical links, RSS, and the sitemap use the production origin. See `.env.example`.

## Publishing gates

```sh
npm run check
npm run build
```

The production build validates schemas, controlled vocabulary, URL uniqueness, alternate-version relationships, weekly-update references, discovery-ledger coverage, and strict newest-first chronology before Astro and Pagefind run.

## Content model

- `src/content/resources/`: one JSON record per accepted source
- `src/content/updates/`: dated weekly syntheses and resource references
- `data/discovery-ledger.json`: non-public audit trail for accepted, skipped, duplicate, and unavailable discoveries
- `.agents/skills/curate-ios-engineering/`: the durable weekly curation and publication workflow

The scheduled Codex task invokes the repository-local skill instead of carrying a large duplicated prompt. Successful runs publish directly to `main`; no-change runs report without creating a commit.

Resources are presented as complete feed cells rather than internal detail pages. Titles, preview art, and source buttons link directly to the canonical source or its alternate versions.

## Scope

The project covers engineering workflows: agentic development, Xcode tooling, architecture, code review, testing, evaluation, visual validation, SDLC automation, and human-in-the-loop team practices. App-facing AI features are out of scope unless the source directly addresses their effect on the engineering process.
