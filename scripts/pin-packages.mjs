import fs from 'node:fs';
import path from 'node:path';
const manifests = [
  'package.json',
  ...['apps', 'packages'].flatMap((root) =>
    fs
      .readdirSync(root)
      .filter((dir) => fs.existsSync(path.join(root, dir, 'package.json')))
      .map((dir) => path.join(root, dir, 'package.json')),
  ),
];
for (const file of manifests) {
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const group of ['dependencies', 'devDependencies'])
    for (const [name, value] of Object.entries(manifest[group] || {})) {
      if (String(value).startsWith('workspace:')) continue;
      const local = path.join(
        path.dirname(file),
        'node_modules',
        name,
        'package.json',
      );
      const fallback = path.join('node_modules', name, 'package.json');
      const installed = JSON.parse(
        fs.readFileSync(fs.existsSync(local) ? local : fallback, 'utf8'),
      );
      manifest[group][name] = installed.version;
    }
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
}
