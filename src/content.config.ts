import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { availabilityStatuses, evidenceTypes, resourceFormats, topics } from "./lib/taxonomy";

const authorSchema = z.object({
  name: z.string().min(1),
  url: z.url().optional()
});

const resources = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/resources" }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    canonicalUrl: z.url(),
    alternateUrls: z.array(z.url()).default([]),
    title: z.string().min(8),
    publisher: z.string().min(1),
    publisherUrl: z.url().optional(),
    authors: z.array(authorSchema).min(1),
    publishedAt: z.coerce.date().nullable(),
    discoveredAt: z.coerce.date(),
    lastVerifiedAt: z.coerce.date(),
    format: z.enum(resourceFormats),
    topics: z.array(z.enum(topics)).min(1),
    evidenceType: z.enum(evidenceTypes),
    summary: z.string().min(120).max(640),
    takeaway: z.string().min(45).max(280),
    availability: z.enum(availabilityStatuses).default("available"),
    relatedResourceIds: z.array(z.string()).default([])
  })
});

const updates = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/updates" }),
  schema: z.object({
    id: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    date: z.coerce.date(),
    headline: z.string().min(12),
    synthesis: z.string().min(180).max(1400),
    resourceIds: z.array(z.string()).min(1),
    highlightedResourceIds: z.array(z.string()).min(3).max(5),
    emergingTopics: z.array(z.enum(topics)).min(1)
  })
});

export const collections = { resources, updates };
