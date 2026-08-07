import { getCollection, type CollectionEntry } from "astro:content";

export type ResourceEntry = CollectionEntry<"resources">;
export type UpdateEntry = CollectionEntry<"updates">;

export async function getResources() {
  return (await getCollection("resources")).sort((a, b) => {
    const aDate = a.data.publishedAt?.getTime() ?? a.data.discoveredAt.getTime();
    const bDate = b.data.publishedAt?.getTime() ?? b.data.discoveredAt.getTime();
    return bDate - aDate;
  });
}

export async function getUpdates() {
  return (await getCollection("updates")).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function resourceMap(resources: ResourceEntry[]) {
  return new Map(resources.map((resource) => [resource.data.id, resource]));
}

export function displayDate(date: Date | null, options: Intl.DateTimeFormatOptions = {}) {
  if (!date) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...options
  }).format(date);
}

export function hostName(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}
