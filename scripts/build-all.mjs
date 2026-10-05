import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const apps = ['parabola','bidang-miring','tumbukan','melingkar','hooke','venturi','bandul','gelombang','kalor','induksi'];
for (const app of apps) {
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','build','--prefix',`apps/${app}`], { stdio:'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
