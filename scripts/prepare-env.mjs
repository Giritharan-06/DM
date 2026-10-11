import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
try {
  const template = await fs.readFile('.env.example', 'utf8');
  await fs.writeFile(
    '.env',
    template.replace(
      'BETTER_AUTH_SECRET=',
      'BETTER_AUTH_SECRET=' + randomBytes(32).toString('hex'),
    ),
    { flag: 'wx' },
  );
  console.log(
    'Created local .env with a generated session secret. Provider credentials are blank.',
  );
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Existing .env preserved.');
}
