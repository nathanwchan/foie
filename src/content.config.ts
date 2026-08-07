import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { availabilityStatuses, resourceFormats, topics } from "./lib/taxonomy";

const contentIdSchema = z.string().regex(/^[a-z0-9-]+$/);
const profilePlatforms = [
  "website",
  "x",
  "mastodon",
  "bluesky",
  "github",
  "linkedin",
  "youtube",
  "threads",
  "medium",
  "instagram",
  "patreon"
] as const;

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
  }),
  z.object({
    type: z.literal("x"),
    postId: z.string().regex(/^\d{15,22}$/),
    videoUrl: z.url(),
    posterUrl: z.url(),
    title: z.string().min(1).max(180)
  })
]);

const resources = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/resources" }),
  schema: z.object({
    id: contentIdSchema,
    slug: contentIdSchema,
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
    relatedResourceIds: z.array(contentIdSchema).default([]),
    userIds: z.array(contentIdSchema).default([])
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

    const canonicalIsX = canonicalHost === "x.com" || canonicalHost === "twitter.com";
    const canonicalPostId = new URL(resource.canonicalUrl).pathname.match(/\/status\/(\d+)/)?.[1];
    if (resource.media.type === "x" && (!canonicalIsX || canonicalPostId !== resource.media.postId)) {
      context.addIssue({
        code: "custom",
        path: ["media", "postId"],
        message: "X video postId must match the canonical X post URL"
      });
    }
    if (resource.media.type === "video" && canonicalIsX) {
      context.addIssue({
        code: "custom",
        path: ["media", "type"],
        message: "X video posts must use the X video media type"
      });
    }
  })
});

const users = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/users" }),
  schema: z.object({
    id: contentIdSchema,
    name: z.string().min(1),
    addedAt: z.coerce.date(),
    lastVerifiedAt: z.coerce.date(),
    avatar: z.object({
      url: z.url(),
      sourceProfileUrl: z.url()
    }).strict(),
    profiles: z.array(z.object({
      platform: z.enum(profilePlatforms),
      handle: z.string().min(1),
      url: z.url()
    }).strict()).min(1)
  }).strict().superRefine((user, context) => {
    const platforms = new Set<string>();
    const urls = new Set<string>();
    user.profiles.forEach((profile, index) => {
      if (platforms.has(profile.platform)) {
        context.addIssue({
          code: "custom",
          path: ["profiles", index, "platform"],
          message: `Profile platform ${profile.platform} is duplicated`
        });
      }
      platforms.add(profile.platform);

      if (urls.has(profile.url)) {
        context.addIssue({
          code: "custom",
          path: ["profiles", index, "url"],
          message: "Profile URL is duplicated"
        });
      }
      urls.add(profile.url);
    });

    if (!urls.has(user.avatar.sourceProfileUrl)) {
      context.addIssue({
        code: "custom",
        path: ["avatar", "sourceProfileUrl"],
        message: "Avatar source must match one of the user's verified profiles"
      });
    }
  })
});

export const collections = { resources, users };
