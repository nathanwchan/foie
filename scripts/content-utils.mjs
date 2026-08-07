import fs from "node:fs/promises";
import path from "node:path";

export const allowedFormats = ["article", "video", "podcast", "paper", "documentation", "repository", "tool", "social"];
export const allowedTopics = ["agent-workflows", "xcode-tooling", "agent-readable-architecture", "code-review", "testing-evaluation", "visual-validation", "sdlc-automation", "human-in-the-loop"];
export const allowedMediaTypes = ["image", "youtube", "video", "x"];
export const allowedProfilePlatforms = ["website", "x", "mastodon", "bluesky", "github", "linkedin", "youtube", "threads", "medium", "instagram", "patreon"];
const trackingKeys = new Set(["fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source"]);

function isYouTubeUrl(value) {
  const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  return host === "youtube.com" || host === "youtu.be";
}

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
  const users = await readJsonDirectory(path.join(rootDirectory, "src/content/users"));
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
    if (data.media?.type === "x") {
      if (!/^\d{15,22}$/.test(data.media.postId ?? "") || !data.media.videoUrl || !data.media.posterUrl || !data.media.title) errors.push(`${label}: X media requires a valid postId, videoUrl, posterUrl, and title`);
      try {
        const canonicalUrl = new URL(data.canonicalUrl);
        const canonicalHost = canonicalUrl.hostname.toLowerCase().replace(/^www\./, "");
        const canonicalPostId = canonicalUrl.pathname.match(/\/status\/(\d+)/)?.[1];
        if ((canonicalHost !== "x.com" && canonicalHost !== "twitter.com") || canonicalPostId !== data.media.postId) errors.push(`${label}: X media postId must match canonicalUrl`);
      } catch {
        // The canonical URL is reported by the URL validation below.
      }
    }
    if (data.media?.type === "video") {
      try {
        const canonicalHost = new URL(data.canonicalUrl).hostname.toLowerCase().replace(/^www\./, "");
        if (canonicalHost === "x.com" || canonicalHost === "twitter.com") errors.push(`${label}: X video posts must use X video media`);
      } catch {
        // The canonical URL is reported by the URL validation below.
      }
    }
    try {
      const canonicalIsYouTube = isYouTubeUrl(data.canonicalUrl);
      if (canonicalIsYouTube && data.format !== "video") errors.push(`${label}: a YouTube canonical URL must use video format`);
      if (data.format === "video" && data.media?.type === "youtube" && !canonicalIsYouTube) errors.push(`${label}: a YouTube video resource must use its YouTube URL as canonicalUrl`);
    } catch {
      // The canonical URL is reported by the URL validation below.
    }
    for (const value of [data.media?.url, data.media?.videoUrl, data.media?.posterUrl].filter(Boolean)) {
      try { new URL(value); } catch { errors.push(`${label}: invalid media URL ${value}`); }
    }
    if (!Array.isArray(data.topics) || data.topics.length === 0) errors.push(`${label}: at least one topic is required`);
    for (const topic of data.topics ?? []) if (!allowedTopics.includes(topic)) errors.push(`${label}: invalid topic ${topic}`);
    if ((data.summary?.length ?? 0) < 120 || data.summary.length > 640) errors.push(`${label}: summary must be 120–640 characters`);
    if ((data.takeaway?.length ?? 0) < 45 || data.takeaway.length > 280) errors.push(`${label}: takeaway must be 45–280 characters`);
    if (!isDate(data.discoveredAt) || !isDate(data.lastVerifiedAt) || (data.publishedAt !== null && !isDate(data.publishedAt))) errors.push(`${label}: invalid date`);
    if (!Array.isArray(data.authors) || data.authors.length === 0 || data.authors.some((author) => !author.name)) errors.push(`${label}: at least one named author is required`);
    const primaryAuthor = data.authors?.[0]?.name;
    if (primaryAuthor && !data.summary.startsWith(primaryAuthor)) errors.push(`${label}: summary must begin with primary author ${primaryAuthor}`);
    if ("alternateUrls" in data) errors.push(`${label}: alternateUrls is deprecated; publish exactly one canonicalUrl`);
    for (const value of [data.canonicalUrl]) {
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

  const userById = new Map();
  for (const { file, data } of users) {
    const label = `user ${file}`;
    if (data.id !== file.replace(/\.json$/, "")) errors.push(`${label}: filename must match id`);
    if (userById.has(data.id)) errors.push(`${label}: duplicate id also used by ${userById.get(data.id)}`);
    userById.set(data.id, file);
    if (!data.name) errors.push(`${label}: missing name`);
    if (!isDate(data.addedAt) || !isDate(data.lastVerifiedAt)) errors.push(`${label}: invalid date`);
    if (!data.avatar?.url || !data.avatar?.sourceProfileUrl) errors.push(`${label}: avatar requires url and sourceProfileUrl`);
    for (const [key, value] of [["avatar URL", data.avatar?.url], ["avatar source profile URL", data.avatar?.sourceProfileUrl]]) {
      if (!value) continue;
      try { new URL(value); } catch { errors.push(`${label}: invalid ${key} ${value}`); }
    }
    if (!Array.isArray(data.profiles) || data.profiles.length === 0) errors.push(`${label}: at least one profile is required`);

    const profilePlatforms = new Set();
    const profileUrls = new Set();
    for (const profile of data.profiles ?? []) {
      if (!allowedProfilePlatforms.includes(profile.platform)) errors.push(`${label}: invalid profile platform ${profile.platform}`);
      if (profilePlatforms.has(profile.platform)) errors.push(`${label}: duplicate profile platform ${profile.platform}`);
      profilePlatforms.add(profile.platform);
      if (!profile.handle) errors.push(`${label}: profile ${profile.platform} is missing a handle`);
      try {
        const normalized = canonicalizeUrl(profile.url);
        if (profileUrls.has(normalized)) errors.push(`${label}: duplicate profile URL ${profile.url}`);
        profileUrls.add(normalized);
      } catch {
        errors.push(`${label}: invalid profile URL ${profile.url}`);
      }
    }
    if (data.avatar?.sourceProfileUrl) {
      try {
        const avatarSource = canonicalizeUrl(data.avatar.sourceProfileUrl);
        if (!profileUrls.has(avatarSource)) errors.push(`${label}: avatar source must match a verified profile URL`);
      } catch {
        // The invalid avatar source URL is reported above.
      }
    }
  }

  for (const { file, data } of resources) {
    const seenUserIds = new Set();
    for (const userId of data.userIds ?? []) {
      if (seenUserIds.has(userId)) errors.push(`resource ${file}: duplicate user ${userId}`);
      seenUserIds.add(userId);
      if (!userById.has(userId)) errors.push(`resource ${file}: unknown user ${userId}`);
    }
  }

  const ledgerUrls = new Map();
  const ledgerResourceIds = new Set();
  for (const [index, entry] of (ledger.entries ?? []).entries()) {
    const label = `ledger entry ${index + 1}`;
    try {
      const normalized = canonicalizeUrl(entry.canonicalUrl);
      if (ledgerUrls.has(normalized)) errors.push(`${label}: canonical URL duplicates ${ledgerUrls.get(normalized)}`);
      ledgerUrls.set(normalized, label);
    } catch {
      errors.push(`${label}: invalid canonical URL`);
    }
    if (entry.status === "accepted") {
      const resource = resourceById.get(entry.resourceId);
      if (!resource) {
        errors.push(`${label}: accepted resource ${entry.resourceId} does not exist`);
      } else {
        ledgerResourceIds.add(entry.resourceId);
        try {
          if (canonicalizeUrl(entry.canonicalUrl) !== canonicalizeUrl(resource.canonicalUrl)) {
            errors.push(`${label}: canonical URL must match resource ${entry.resourceId}`);
          }
        } catch {
          // Invalid URLs are reported by their respective validation paths.
        }
      }
    }
    if (entry.status === "skipped" && !entry.reason) errors.push(`${label}: skipped entries require a reason`);
  }

  for (const resourceId of resourceById.keys()) {
    if (!ledgerResourceIds.has(resourceId)) errors.push(`resource ${resourceId}: missing accepted discovery-ledger entry`);
  }

  return { errors, counts: { resources: resources.length, users: users.length, ledgerEntries: ledger.entries?.length ?? 0 } };
}
