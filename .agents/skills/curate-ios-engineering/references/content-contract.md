# Content contract

## Resource files

Store resources in `src/content/resources/<id>.json`. The filename, `id`, and `slug` must match and use lowercase hyphen-case.

Required values are enforced in `src/content.config.ts`. Use these enums:

- Format: `article`, `video`, `podcast`, `paper`, `documentation`, `repository`, `tool`, `social`
- Topic: `agent-workflows`, `xcode-tooling`, `agent-readable-architecture`, `code-review`, `testing-evaluation`, `visual-validation`, `sdlc-automation`, `human-in-the-loop`
- Availability: `available`, `temporarily-unavailable`, `archived`

Use ISO `YYYY-MM-DD` dates. Set `publishedAt` to `null` only when the original source exposes no reliable date. Set `discoveredAt` and `lastVerifiedAt` to the current run date.

Every resource requires a `media` object:

- Use `{ "type": "youtube", "videoId": "…", "title": "…" }` when an inspectable YouTube recording is the chosen canonical source, or when the canonical source is the first-party page for the same video-recorded podcast.
- Use `{ "type": "video", "url": "…", "posterUrl": "…", "title": "…" }` for a stable first-party MP4.
- Otherwise use `{ "type": "image", "url": "…", "alt": "…" }` with a source-owned Open Graph image or directly relevant source figure.

Every public resource has exactly one destination in `canonicalUrl`; `alternateUrls` is not supported. If equivalent versions exist, select the best canonical destination by completeness, originality, stability, inspectability, and match to the resource's primary format. Store the remaining URLs only as aliases on the resource's private discovery-ledger entry so later runs can detect duplicates. The `format` value and visible source badge must describe the chosen canonical URL.

Never generate placeholder art. Prefer entry-specific media from the chosen source over generic publisher branding. Do not use a companion or mirror solely to supply a more visually prominent preview.

Summaries must be 120–640 characters and begin with the exact name in `authors[0].name`. The card links that opening name to the author's profile URL, falling back to the canonical source when no profile is available. Takeaways must be 45–280 characters. Write original prose grounded only in the inspected source.

## Discovery ledger

Maintain `data/discovery-ledger.json` as the non-public audit trail. Each entry contains a normalized canonical URL, aliases, first and last seen dates, status, and either an accepted `resourceId` or a concise skip reason. Do not delete previous skipped entries merely because the source appears in a later search.

Use `status: "skipped"` with a reason beginning `editorial-exclusion:` when the curator removes a source. This is a permanent denylist decision: scheduled curation must not reevaluate or republish the source unless the curator explicitly reverses it.

## Required validation

Run `npm run check` and `npm run build`. The build invokes deterministic checks for duplicate URLs, invalid relationships, invalid enum values, summary bounds, and discovery-ledger coverage.
