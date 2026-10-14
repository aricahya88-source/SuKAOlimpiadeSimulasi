import { cp, mkdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE = path.join(ROOT, "site");

const apps = [
  "parabola",
  "bidang-miring",
  "tumbukan",
  "melingkar",
  "hooke",
  "venturi",
  "bandul",
  "gelombang",
  "kalor",
];

async function mustExist(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} tidak ditemukan: ${filePath}`);
  }
}

async function main() {
  console.log("=== Menyiapkan folder publish Netlify ===");

  await rm(SITE, { recursive: true, force: true });
  await mkdir(SITE, { recursive: true });

  const rootIndex = path.join(ROOT, "index.html");
  await mustExist(rootIndex, "index.html utama");
  await cp(rootIndex, path.join(SITE, "index.html"));

  for (const app of apps) {
    const source = path.join(ROOT, "apps", app, "dist");
    const sourceIndex = path.join(source, "index.html");
    const destination = path.join(SITE, app);

    await mustExist(sourceIndex, `Build ${app}`);

    await mkdir(destination, { recursive: true });
    await cp(source, destination, { recursive: true });

    const deployedIndex = path.join(destination, "index.html");
    await mustExist(deployedIndex, `Hasil publish ${app}`);

    console.log(`OK  /${app}/index.html`);
  }

  console.log("OK  /index.html");
  console.log("Semua 9 simulasi siap dipublish dari folder site/.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
