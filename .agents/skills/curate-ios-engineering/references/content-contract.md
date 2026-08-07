# Content contract

## Resource files

Store resources in `src/content/resources/<id>.json`. The filename, `id`, and `slug` must match and use lowercase hyphen-case.

Required values are enforced in `src/content.config.ts`. Use these enums:

- Format: `article`, `video`, `podcast`, `paper`, `documentation`, `repository`, `tool`, `social`
- Topic: `agent-workflows`, `xcode-tooling`, `agent-readable-architecture`, `code-review`, `testing-evaluation`, `visual-validation`, `sdlc-automation`, `human-in-the-loop`
- Availability: `available`, `temporarily-unavailable`, `archived`

Use ISO `YYYY-MM-DD` dates. Set `publishedAt` to `null` only when the original source exposes no reliable date. Set `discoveredAt` and `lastVerifiedAt` to the current run date.

Every resource requires a `media` object:

- Use `{ "type": "youtube", "videoId": "…", "title": "…" }` when an inspectable YouTube recording is the canonical source or an equivalent alternate version.
- Use `{ "type": "video", "url": "…", "posterUrl": "…", "title": "…" }` for a stable first-party MP4.
- Otherwise use `{ "type": "image", "url": "…", "alt": "…" }` with a source-owned Open Graph image or directly relevant source figure.

Never generate placeholder art. Prefer entry-specific media over generic publisher branding, and add any equivalent public recording page to `alternateUrls`.

Summaries must be 120–640 characters. Takeaways must be 45–280 characters. Write original prose grounded only in the inspected source.

## Weekly updates

Store updates in `src/content/updates/YYYY-MM-DD.json`. `resourceIds` must be ordered newest-to-oldest by `publishedAt`, then `discoveredAt`. Select three to five IDs from that list for `highlightedResourceIds`.

## Discovery ledger

Maintain `data/discovery-ledger.json` as the non-public audit trail. Each entry contains a normalized canonical URL, aliases, first and last seen dates, status, and either an accepted `resourceId` or a concise skip reason. Do not delete previous skipped entries merely because the source appears in a later search.

Use `status: "skipped"` with a reason beginning `editorial-exclusion:` when the curator removes a source. This is a permanent denylist decision: scheduled curation must not reevaluate or republish the source unless the curator explicitly reverses it.

## Required validation

Run `npm run check` and `npm run build`. The build invokes deterministic checks for duplicate URLs, invalid relationships, missing weekly references, invalid enum values, summary bounds, and chronological ordering.
