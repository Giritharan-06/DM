import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';
const excluded = new Set([
  'node_modules',
  '.next',
  '.turbo',
  '.git',
  'migrations',
  'playwright-report',
  'test-results',
]);
async function walk(root) {
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (
      /\.(tsx?|mjs|json|css|md)$/.test(file) &&
      entry.name !== 'pnpm-lock.yaml'
    ) {
      const source = await fs.readFile(file, 'utf8');
      const formatted = await prettier.format(source, {
        filepath: file,
        singleQuote: true,
        trailingComma: 'all',
      });
      if (formatted !== source) await fs.writeFile(file, formatted);
    }
  }
}
await walk('.');
