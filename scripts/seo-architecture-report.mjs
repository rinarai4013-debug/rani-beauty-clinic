import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

function countMatches(filePath, regex) {
  const content = read(filePath);
  return [...content.matchAll(regex)].length;
}

function countMatchesAcrossFiles(dir, filePattern, regex) {
  let total = 0;
  const entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !filePattern.test(entry.name)) continue;
    total += countMatches(path.join(dir, entry.name), regex);
  }

  return total;
}

function collectPageFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPageFiles(absolute));
      continue;
    }

    if (entry.isFile() && entry.name === "page.tsx") {
      files.push(absolute);
    }
  }

  return files;
}

const pageFiles = collectPageFiles(path.join(root, "src/app"));
const placeholderFiles = pageFiles
  .filter((filePath) => {
    const content = read(path.relative(root, filePath)).trim();
    return (
      content === "export default function Page() { return null; }" ||
      content.includes('export { default } from "@/lib/seo/placeholder-page";')
    );
  })
  .map((filePath) => path.relative(root, filePath))
  .sort();
const publicPlaceholderFiles = placeholderFiles.filter(
  (filePath) =>
    !filePath.includes("/(dashboard)/") &&
    !filePath.includes("/(portal)/") &&
    !filePath.includes("/(provider)/") &&
    !filePath.includes("/(saas)/")
);

const counts = {
  aestheticServices: countMatches("src/data/services/aesthetic-services.ts", /^\s+slug:\s/mg),
  wellnessServices: countMatches("src/data/services/wellness-services.ts", /^\s+slug:\s/mg),
  serviceVariations: countMatches("src/data/services/service-variations.ts", /^\s+v\(/mg),
  blogPosts:
    countMatches("src/data/blog/posts.ts", /^\s+slug:\s/mg) +
    countMatchesAcrossFiles("src/data/blog", /^posts-batch\d+\.ts$/, /^\s+slug:\s/mg),
  blogBatchFiles: countMatches("src/data/blog/posts.ts", /^import \{ postsBatch/mg),
  costPages: countMatches("src/data/cost-pages.ts", /^\s+slug:\s/mg),
  comparisonPages: countMatches("src/data/comparisons.ts", /^\s+slug:\s/mg),
  concerns: countMatches("src/data/skin-concerns.ts", /^\s+slug:\s/mg),
  guides: countMatches("src/data/guides/pillar-pages.ts", /^\s+slug:\s/mg),
  geoPages: countMatches("src/data/locations/geo-pages.ts", /^\s+slug:\s/mg) + countMatches("src/data/locations/geo-pages-eastside.ts", /^\s+slug:\s/mg),
  nearCities: countMatches("src/data/locations/pnw-cities.ts", /^\s+slug:\s/mg) + countMatches("src/data/locations/wa-cities-extended.ts", /^\s+slug:\s/mg),
  nearServiceTemplates: countMatches("src/data/locations/service-geo.ts", /^\s+generateContent:/mg),
  extendedNearServiceTemplates: countMatches("src/data/locations/service-geo-extended.ts", /^\s+generateContent:/mg),
};

const report = {
  generatedAt: new Date().toISOString(),
  pageFileCount: pageFiles.length,
  placeholderPageCount: placeholderFiles.length,
  publicPlaceholderPageCount: publicPlaceholderFiles.length,
  publicPlaceholderFiles,
  counts,
  estimatedNearServiceUrls: counts.nearCities * (counts.nearServiceTemplates + counts.extendedNearServiceTemplates),
  estimatedLocationServiceUrls: counts.geoPages * 20,
};

console.log(JSON.stringify(report, null, 2));
