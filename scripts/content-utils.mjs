import fs from "node:fs/promises";
import path from "node:path";

export const allowedFormats = ["article", "video", "podcast", "paper", "documentation", "repository", "tool", "social"];
export const allowedTopics = ["agent-workflows", "xcode-tooling", "agent-readable-architecture", "code-review", "testing-evaluation", "visual-validation", "sdlc-automation", "human-in-the-loop"];
export const allowedMediaTypes = ["image", "youtube", "video"];
const trackingKeys = new Set(["fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source"]);

export function canonicalizeUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || trackingKeys.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/$/, "");
}

async function readJsonDirectory(directory) {
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map(async (file) => ({ file, data: JSON.parse(await fs.readFile(path.join(directory, file), "utf8")) })));
}

function isDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export async function validateContent(rootDirectory) {
  const errors = [];
  const resources = await readJsonDirectory(path.join(rootDirectory, "src/content/resources"));
  const ledger = JSON.parse(await fs.readFile(path.join(rootDirectory, "data/discovery-ledger.json"), "utf8"));
  const ids = new Map();
  const urls = new Map();

  for (const { file, data } of resources) {
    const label = `resource ${file}`;
    for (const key of ["id", "slug", "canonicalUrl", "media", "title", "publisher", "format", "summary", "takeaway", "availability"]) if (!data[key]) errors.push(`${label}: missing ${key}`);
    if (data.id !== file.replace(/\.json$/, "")) errors.push(`${label}: filename must match id`);
    if (data.id !== data.slug) errors.push(`${label}: id and slug must match`);
    if (ids.has(data.id)) errors.push(`${label}: duplicate id also used by ${ids.get(data.id)}`);
    ids.set(data.id, file);
    if (!allowedFormats.includes(data.format)) errors.push(`${label}: invalid format ${data.format}`);
    if (!allowedMediaTypes.includes(data.media?.type)) errors.push(`${label}: invalid media type ${data.media?.type}`);
    if (data.media?.type === "image") {
      if (!data.media.url || !data.media.alt) errors.push(`${label}: image media requires url and alt`);
    }
    if (data.media?.type === "youtube") {
      if (!/^[A-Za-z0-9_-]{11}$/.test(data.media.videoId ?? "") || !data.media.title) errors.push(`${label}: YouTube media requires a valid videoId and title`);
    }
    if (data.media?.type === "video") {
      if (!data.media.url || !data.media.posterUrl || !data.media.title) errors.push(`${label}: video media requires url, posterUrl, and title`);
    }
    for (const value of [data.media?.url, data.media?.posterUrl].filter(Boolean)) {
      try { new URL(value); } catch { errors.push(`${label}: invalid media URL ${value}`); }
    }
    if (!Array.isArray(data.topics) || data.topics.length === 0) errors.push(`${label}: at least one topic is required`);
    for (const topic of data.topics ?? []) if (!allowedTopics.includes(topic)) errors.push(`${label}: invalid topic ${topic}`);
    if ((data.summary?.length ?? 0) < 120 || data.summary.length > 640) errors.push(`${label}: summary must be 120–640 characters`);
    if ((data.takeaway?.length ?? 0) < 45 || data.takeaway.length > 280) errors.push(`${label}: takeaway must be 45–280 characters`);
    if (!isDate(data.discoveredAt) || !isDate(data.lastVerifiedAt) || (data.publishedAt !== null && !isDate(data.publishedAt))) errors.push(`${label}: invalid date`);
    if (!Array.isArray(data.authors) || data.authors.length === 0 || data.authors.some((author) => !author.name)) errors.push(`${label}: at least one named author is required`);
    for (const value of [data.canonicalUrl, ...(data.alternateUrls ?? [])]) {
      try {
        const normalized = canonicalizeUrl(value);
        if (urls.has(normalized)) errors.push(`${label}: URL duplicates ${urls.get(normalized)}`);
        urls.set(normalized, label);
      } catch {
        errors.push(`${label}: invalid URL ${value}`);
      }
    }
  }

  const resourceById = new Map(resources.map(({ data }) => [data.id, data]));
  for (const { file, data } of resources) {
    for (const relatedId of data.relatedResourceIds ?? []) {
      if (relatedId === data.id) errors.push(`resource ${file}: cannot relate to itself`);
      if (!resourceById.has(relatedId)) errors.push(`resource ${file}: unknown related resource ${relatedId}`);
    }
  }

  const ledgerUrls = new Map();
  for (const [index, entry] of (ledger.entries ?? []).entries()) {
    const label = `ledger entry ${index + 1}`;
    try {
      const normalized = canonicalizeUrl(entry.canonicalUrl);
      if (ledgerUrls.has(normalized)) errors.push(`${label}: canonical URL duplicates ${ledgerUrls.get(normalized)}`);
      ledgerUrls.set(normalized, label);
    } catch {
      errors.push(`${label}: invalid canonical URL`);
    }
    if (entry.status === "accepted" && !resourceById.has(entry.resourceId)) errors.push(`${label}: accepted resource ${entry.resourceId} does not exist`);
    if (entry.status === "skipped" && !entry.reason) errors.push(`${label}: skipped entries require a reason`);
  }

  return { errors, counts: { resources: resources.length, ledgerEntries: ledger.entries?.length ?? 0 } };
}
