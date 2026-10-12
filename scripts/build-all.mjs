import { spawnSync } from 'node:child_process';

const apps = ['parabola','bidang-miring','tumbukan','melingkar','hooke','venturi','bandul','gelombang','kalor'];
for (const app of apps) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run','build','--prefix',`apps/${app}`],
    { stdio:'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
