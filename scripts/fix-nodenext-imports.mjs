import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const roots = ["api", "server", "src/platform"];
const writeChanges = process.argv.includes("--write");
const sourceExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);
const explicitExtensions = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function needsJsExtension(specifier) {
  if (!specifier.startsWith(".")) {
    return false;
  }

  const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
  return !explicitExtensions.has(path.posix.extname(cleanSpecifier));
}

function normaliseRelativeImports(source) {
  const patterns = [
    /(\bfrom\s*["'])(\.{1,2}\/[^"']+)(["'])/g,
    /(\bimport\s*\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g,
    /(\bexport\s+\*\s+from\s*["'])(\.{1,2}\/[^"']+)(["'])/g,
  ];

  let output = source;

  for (const pattern of patterns) {
    output = output.replace(pattern, (match, prefix, specifier, suffix) => {
      if (!needsJsExtension(specifier)) {
        return match;
      }

      return `${prefix}${specifier}.js${suffix}`;
    });
  }

  return output;
}

const files = (
  await Promise.all(
    roots.map(async (root) => {
      try {
        return await collectSourceFiles(root);
      } catch (error) {
        if (error?.code === "ENOENT") {
          return [];
        }
        throw error;
      }
    }),
  )
).flat();

const changedFiles = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const normalised = normaliseRelativeImports(source);

  if (normalised === source) {
    continue;
  }

  changedFiles.push(file.replaceAll(path.sep, "/"));

  if (writeChanges) {
    await writeFile(file, normalised, "utf8");
  }
}

if (changedFiles.length === 0) {
  console.log("NodeNext import validation passed.");
  process.exit(0);
}

if (writeChanges) {
  console.log(`Updated ${changedFiles.length} file(s):`);
  for (const file of changedFiles) {
    console.log(`- ${file}`);
  }
  process.exit(0);
}

console.error("Relative imports without explicit runtime extensions were found:");
for (const file of changedFiles) {
  console.error(`- ${file}`);
}
console.error("Run npm run fix:nodenext, review the diff, then rerun npm run check.");
process.exit(1);
