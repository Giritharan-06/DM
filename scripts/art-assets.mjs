import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(
  new URL('../apps/website/package.json', import.meta.url),
);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const [source, name] = process.argv.slice(2);
if (!source || !/^[a-z-]+$/.test(name))
  throw new Error('Provide source image and safe asset name.');
await fs.mkdir('apps/website/public/art', { recursive: true });
await fs.copyFile(source, `apps/website/public/art/${name}.png`);
await sharp(source)
  .resize({ width: 1400, withoutEnlargement: true })
  .webp({ quality: 88 })
  .toFile(`apps/website/public/art/${name}.webp`);
console.log(`Saved art/${name}.webp`);
