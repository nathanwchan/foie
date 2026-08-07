# Future of iOS Engineering

A static intelligence dashboard tracking how LLMs and coding agents are changing iOS software development. The growing resource collection is ordered newest-first, backed by inspectable sources, and stored as schema-validated files in Git.

## Stack

- Astro and TypeScript
- Astro content collections for the resource contract
- Pagefind for static full-text search and filters
- Sitemap generation
- A repository-local Codex curation skill for scheduled research and publishing

## Local development

```sh
npm install
npm run dev
```

Set `SITE_URL` in the deployment environment so canonical links and the sitemap use the production origin. See `.env.example`.

## Publishing gates

```sh
npm run check
npm run build
```

The production build validates schemas, controlled vocabulary, canonical URL uniqueness, and discovery-ledger coverage before Astro and Pagefind run.

## Content model

- `src/content/resources/`: one JSON record per accepted source
- `src/content/users/`: one manually curated JSON record per person, with a verified-profile avatar and public profile links
- `data/discovery-ledger.json`: non-public audit trail for accepted, skipped, duplicate, and unavailable discoveries
- `.agents/skills/curate-ios-engineering/`: the durable curation and publication workflow

The scheduled Codex task invokes the repository-local skill instead of carrying a large duplicated prompt. Both Wednesday and Sunday runs use a rolling 7-day discovery window. Successful runs publish directly to `main`; no-change runs report without creating a commit.

Resources are presented as complete feed cells rather than internal detail pages. Each resource selects one best canonical source; titles and preview art point to that destination. Equivalent mirrors remain private discovery-ledger aliases used only for deduplication.

People are linked to posts through explicit `userIds` on resource records. Every stored user and verified profile is a priority seed for a dedicated scheduled-discovery pass, without replacing broad internet research or lowering the content threshold. The workflow never adds or modifies people automatically; user records change only through direct curator requests.

## Scope

The project covers engineering workflows: agentic development, Xcode tooling, architecture, code review, testing, evaluation, visual validation, SDLC automation, and human-in-the-loop team practices. App-facing AI features are out of scope unless the source directly addresses their effect on the engineering process.
