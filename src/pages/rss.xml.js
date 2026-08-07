import rss from "@astrojs/rss";
import { getUpdates } from "../lib/content";

export async function GET(context) {
  const updates = await getUpdates();
  return rss({
    title: "Future of iOS Engineering",
    description: "Weekly signals about coding agents and native iOS engineering.",
    site: context.site ?? "http://localhost:4321",
    items: updates.map((update) => ({
      title: update.data.headline,
      description: update.data.synthesis,
      pubDate: update.data.date,
      link: `/updates/${update.data.id}/`
    })),
    customData: "<language>en-us</language>"
  });
}
