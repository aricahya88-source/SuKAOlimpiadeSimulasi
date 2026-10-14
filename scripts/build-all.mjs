import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const apps = [
  'parabola',
  'bidang-miring',
  'tumbukan',
  'melingkar',
  'hooke',
  'venturi',
  'bandul',
  'gelombang',
  'kalor',
];

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(args) {
  const result = spawnSync(npx, ['--no-install', ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

for (const app of apps) {
  const appDir = `apps/${app}`;
  console.log(`\n=== Build ${app} ===`);

  run(['tsc', '-p', `${appDir}/tsconfig.json`, '--noEmit']);
  run(['vite', 'build', appDir]);

  const output = resolve(appDir, 'dist', 'index.html');
  if (!existsSync(output)) {
    console.error(`Build ${app} tidak menghasilkan ${output}`);
    process.exit(1);
  }
}

console.log('\nSemua 9 simulasi berhasil dibuild.');
