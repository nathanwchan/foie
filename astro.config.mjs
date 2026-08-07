import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const site = process.env.SITE_URL ?? "http://localhost:4321";

export default defineConfig({
  site,
  output: "static",
  integrations: [sitemap()],
  build: {
    format: "directory"
  }
});
