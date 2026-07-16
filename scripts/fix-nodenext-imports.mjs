import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const roots = ["api", "server", "src/platform"];
const writeChanges = process.argv.includes("--write");
const sourceExtensions = [".ts", ".tsx", ".mts", ".cts"];
const sourceExtensionSet = new Set(sourceExtensions);
const explicitRuntimeExtensions = new Set([
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

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (sourceExtensionSet.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function splitSpecifier(specifier) {
  const match = specifier.match(/^([^?#]*)([?#].*)?$/);
  return {
    pathname: match?.[1] ?? specifier,
    suffix: match?.[2] ?? "",
  };
}

async function resolveRuntimeSpecifier(importerPath, specifier) {
  if (!specifier.startsWith(".")) {
    return specifier;
  }

  const { pathname, suffix } = splitSpecifier(specifier);
  const runtimeExtension = path.posix.extname(pathname);

  if (
    explicitRuntimeExtensions.has(runtimeExtension) &&
    runtimeExtension !== ".js"
  ) {
    return specifier;
  }

  const withoutRuntimeExtension = pathname.endsWith(".js")
    ? pathname.slice(0, -3)
    : pathname;
  const importerDirectory = path.dirname(importerPath);
  const absoluteBase = path.resolve(importerDirectory, withoutRuntimeExtension);

  for (const extension of sourceExtensions) {
    if (await exists(`${absoluteBase}${extension}`)) {
      return `${withoutRuntimeExtension}.js${suffix}`;
    }
  }

  for (const extension of sourceExtensions) {
    if (await exists(path.join(absoluteBase, `index${extension}`))) {
      return `${withoutRuntimeExtension}/index.js${suffix}`;
    }
  }

  return specifier;
}

const importPatterns = [
  /(\bfrom\s*["'])(\.{1,2}\/[^"']+)(["'])/g,
  /(\bimport\s*\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g,
  /(\bexport\s+\*\s+from\s*["'])(\.{1,2}\/[^"']+)(["'])/g,
];

async function replaceAsync(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)];

  if (matches.length === 0) {
    return source;
  }

  let output = "";
  let cursor = 0;

  for (const match of matches) {
    const index = match.index ?? 0;
    output += source.slice(cursor, index);
    output += await replacer(match);
    cursor = index + match[0].length;
  }

  output += source.slice(cursor);
  return output;
}

async function normaliseRelativeImports(filePath, source) {
  let output = source;

  for (const pattern of importPatterns) {
    output = await replaceAsync(output, pattern, async (match) => {
      const [, prefix, specifier, suffix] = match;
      const resolvedSpecifier = await resolveRuntimeSpecifier(
        filePath,
        specifier,
      );
      return `${prefix}${resolvedSpecifier}${suffix}`;
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
const unresolvedImports = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const normalised = await normaliseRelativeImports(file, source);

  if (normalised !== source) {
    changedFiles.push(file.replaceAll(path.sep, "/"));

    if (writeChanges) {
      await writeFile(file, normalised, "utf8");
    }
  }

  const sourceToValidate = writeChanges ? normalised : source;

  for (const pattern of importPatterns) {
    for (const match of sourceToValidate.matchAll(pattern)) {
      const specifier = match[2];
      const resolvedSpecifier = await resolveRuntimeSpecifier(file, specifier);

      if (resolvedSpecifier !== specifier) {
        unresolvedImports.push({
          file: file.replaceAll(path.sep, "/"),
          specifier,
          expected: resolvedSpecifier,
        });
      }
    }
  }
}

if (writeChanges) {
  if (changedFiles.length === 0) {
    console.log("NodeNext imports were already normalised.");
  } else {
    console.log(`Updated ${changedFiles.length} file(s):`);
    for (const file of changedFiles) {
      console.log(`- ${file}`);
    }
  }
  process.exit(0);
}

if (unresolvedImports.length === 0) {
  console.log("NodeNext import validation passed.");
  process.exit(0);
}

console.error("Relative imports do not match their runtime targets:");
for (const issue of unresolvedImports) {
  console.error(
    `- ${issue.file}: ${issue.specifier} -> ${issue.expected}`,
  );
}
console.error(
  "Run npm run fix:nodenext, review the diff, then rerun npm run check.",
);
process.exit(1);
