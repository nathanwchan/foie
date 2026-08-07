import rss from "@astrojs/rss";
import { getResources } from "../lib/content";

export async function GET(context) {
  const resources = await getResources();
  return rss({
    title: "Future of iOS Engineering",
    description: "Curated resources about coding agents and native iOS engineering.",
    site: context.site ?? "http://localhost:4321",
    items: resources.map((resource) => ({
      title: resource.data.title,
      description: `${resource.data.summary} Practical takeaway: ${resource.data.takeaway}`,
      pubDate: resource.data.publishedAt ?? resource.data.discoveredAt,
      link: `/#resource-${resource.data.slug}`
    })),
    customData: "<language>en-us</language>"
  });
}
