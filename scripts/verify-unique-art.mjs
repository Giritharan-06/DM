import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(
  new URL('../apps/website/package.json', import.meta.url),
);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const catalog = JSON.parse(
  await fs.readFile('docs/unique-art-catalog.json', 'utf8'),
);
const hashes = new Set();
await fs.mkdir('artifacts', { recursive: true });
let totalBytes = 0;
for (const item of catalog) {
  const png = await fs.readFile(`apps/website/public/art/${item.name}.png`);
  const webp = await fs.readFile(`apps/website/public/art/${item.name}.webp`);
  const hash = createHash('sha256').update(png).digest('hex');
  if (hashes.has(hash)) throw new Error(`Repeated image: ${item.name}`);
  hashes.add(hash);
  const info = await sharp(png).metadata();
  if (!info.hasAlpha) throw new Error(`Missing transparency: ${item.name}`);
  totalBytes += webp.length;
}
for (let start = 0; start < catalog.length; start += 12) {
  const batch = catalog.slice(start, start + 12);
  const layers = [];
  for (const [i, item] of batch.entries()) {
    const left = (i % 4) * 280,
      top = Math.floor(i / 4) * 300;
    layers.push({
      input: await sharp(`apps/website/public/art/${item.name}.png`)
        .resize(240, 240, { fit: 'inside' })
        .toBuffer(),
      left: left + 20,
      top: top + 8,
    });
    const label = item.label.replace(/&/g, '&amp;');
    layers.push({
      input: Buffer.from(
        `<svg width="280" height="50"><text x="140" y="27" text-anchor="middle" font-family="Arial" font-size="12" fill="#17323b">${label}</text></svg>`,
      ),
      left,
      top: top + 248,
    });
  }
  await sharp({
    create: { width: 1120, height: 900, channels: 4, background: '#f8f6ef' },
  })
    .composite(layers)
    .png()
    .toFile(path.join('artifacts', `unique-art-sheet-${start / 12 + 1}.png`));
}
console.log(
  `${hashes.size} unique transparent PNGs; optimized WebP total ${(totalBytes / 1024 / 1024).toFixed(2)} MB. Contact sheets saved in artifacts.`,
);
