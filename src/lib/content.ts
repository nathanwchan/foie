import { getCollection, type CollectionEntry } from "astro:content";

export type ResourceEntry = CollectionEntry<"resources">;
export type UserEntry = CollectionEntry<"users">;

export async function getResources() {
  return (await getCollection("resources")).sort((a, b) => {
    const aDate = a.data.publishedAt?.getTime() ?? a.data.discoveredAt.getTime();
    const bDate = b.data.publishedAt?.getTime() ?? b.data.discoveredAt.getTime();
    return bDate - aDate;
  });
}

export async function getUsers() {
  return (await getCollection("users")).sort((a, b) => a.data.name.localeCompare(b.data.name));
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
