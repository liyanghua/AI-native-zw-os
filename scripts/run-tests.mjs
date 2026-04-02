import { mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const rootDir = process.cwd();
const testsDir = resolve(rootDir, "tests");
const outDir = resolve(rootDir, ".tmp-tests");

async function collectTests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectTests(target);
      }

      if (entry.isFile() && entry.name.endsWith(".test.ts")) {
        return [target];
      }

      return [];
    }),
  );

  return files.flat();
}

async function bundleTest(testFile) {
  const relativePath = relative(testsDir, testFile).replace(/\.ts$/, ".mjs");
  const outfile = resolve(outDir, relativePath);

  await mkdir(dirname(outfile), { recursive: true });
  await esbuild.build({
    absWorkingDir: rootDir,
    bundle: true,
    entryPoints: [testFile],
    format: "esm",
    outfile,
    platform: "node",
    sourcemap: "inline",
  });

  return outfile;
}

async function main() {
  await rm(outDir, { recursive: true, force: true });
  const tests = await collectTests(testsDir);

  if (tests.length === 0) {
    throw new Error("No test files found in tests/");
  }

  const bundled = await Promise.all(tests.map(bundleTest));

  for (const file of bundled) {
    const module = await import(pathToFileURL(file).href);
    const runner = module.default ?? module.run;
    if (typeof runner !== "function") {
      throw new Error(`Test module ${file} must export a default or named run() function.`);
    }
    await runner();
    console.log(`PASS ${relative(rootDir, file)}`);
  }

  await rm(outDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
