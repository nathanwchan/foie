import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { availabilityStatuses, resourceFormats, topics } from "./lib/taxonomy";

const authorSchema = z.object({
  name: z.string().min(1),
  url: z.url().optional()
});

const mediaSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("image"),
    url: z.url(),
    alt: z.string().min(1).max(180)
  }),
  z.object({
    type: z.literal("youtube"),
    videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    title: z.string().min(1).max(180)
  }),
  z.object({
    type: z.literal("video"),
    url: z.url(),
    posterUrl: z.url(),
    title: z.string().min(1).max(180)
  })
]);

const resources = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/resources" }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    canonicalUrl: z.url(),
    media: mediaSchema,
    title: z.string().min(8),
    publisher: z.string().min(1),
    publisherUrl: z.url().optional(),
    authors: z.array(authorSchema).min(1),
    publishedAt: z.coerce.date().nullable(),
    discoveredAt: z.coerce.date(),
    lastVerifiedAt: z.coerce.date(),
    format: z.enum(resourceFormats),
    topics: z.array(z.enum(topics)).min(1),
    summary: z.string().min(120).max(640),
    takeaway: z.string().min(45).max(280),
    availability: z.enum(availabilityStatuses).default("available"),
    relatedResourceIds: z.array(z.string()).default([])
  }).strict().superRefine((resource, context) => {
    const primaryAuthor = resource.authors[0]?.name;
    if (primaryAuthor && !resource.summary.startsWith(primaryAuthor)) {
      context.addIssue({
        code: "custom",
        path: ["summary"],
        message: "Summary must begin with the primary author's exact name"
      });
    }

    const canonicalHost = new URL(resource.canonicalUrl).hostname.toLowerCase().replace(/^www\./, "");
    const canonicalIsYouTube = canonicalHost === "youtube.com" || canonicalHost === "youtu.be";
    if (canonicalIsYouTube && resource.format !== "video") {
      context.addIssue({
        code: "custom",
        path: ["format"],
        message: "A YouTube canonical URL must use video format"
      });
    }
    if (resource.format === "video" && resource.media.type === "youtube" && !canonicalIsYouTube) {
      context.addIssue({
        code: "custom",
        path: ["canonicalUrl"],
        message: "A YouTube video resource must use its YouTube URL as canonicalUrl"
      });
    }
  })
});

export const collections = { resources };
