import { readdir, readFile } from "node:fs/promises";
import { createIndex } from "pagefind";

const resourceDirectory = new URL("../src/content/resources/", import.meta.url);
const files = (await readdir(resourceDirectory)).filter((file) => file.endsWith(".json"));
const resources = await Promise.all(files.map(async (file) => JSON.parse(await readFile(new URL(file, resourceDirectory), "utf8"))));
const { index, errors } = await createIndex({ forceLanguage: "en" });

if (!index || errors.length > 0) {
  throw new Error(`Unable to create Pagefind index: ${errors.join("; ")}`);
}

for (const resource of resources) {
  const content = [
    resource.title,
    resource.publisher,
    ...resource.authors.map((author) => author.name),
    resource.summary,
    resource.takeaway,
    ...resource.topics
  ].join(" ");

  const result = await index.addCustomRecord({
    url: `/#resource-${resource.slug}`,
    content,
    language: "en",
    meta: { title: resource.title, slug: resource.slug },
    filters: {
      topic: resource.topics,
      format: [resource.format]
    }
  });

  if (result.errors.length > 0) {
    throw new Error(`Unable to index ${resource.slug}: ${result.errors.join("; ")}`);
  }
}

const output = await index.writeFiles({ outputPath: "dist/pagefind" });
if (output.errors.length > 0) {
  throw new Error(`Unable to write Pagefind index: ${output.errors.join("; ")}`);
}

console.log(`Pagefind indexed ${resources.length} resource records.`);
