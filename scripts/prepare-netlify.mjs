import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const site = path.join(root, 'site');
const apps = ['parabola','bidang-miring','tumbukan','melingkar','hooke','venturi','bandul','gelombang','kalor'];

function requireFile(file, label) {
  if (!existsSync(file)) throw new Error(`${label} tidak ditemukan: ${file}`);
}

await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });

const home = path.join(root, 'index.html');
requireFile(home, 'index.html utama');
await cp(home, path.join(site, 'index.html'));

for (const app of apps) {
  const src = path.join(root, 'apps', app, 'dist');
  requireFile(path.join(src, 'index.html'), `Build ${app}`);
  const dst = path.join(site, app);
  await mkdir(dst, { recursive: true });
  await cp(src, dst, { recursive: true });
  requireFile(path.join(dst, 'index.html'), `Publish ${app}`);
  console.log(`OK /${app}/index.html`);
}
console.log('OK /index.html');
console.log('Folder site/ siap dipublish ke Netlify.');
