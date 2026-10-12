import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type HeatState = { mass: number; initialTemp: number; power: number; timeScale: number };
type PhaseInfo = {
  temperature: number;
  phase: 'Es' | 'Mencair' | 'Air cair' | 'Mendidih / Menguap' | 'Uap';
  meltFraction: number;
  vaporFraction: number;
};

const state: HeatState = { mass: 1, initialTemp: -10, power: 1200, timeScale: 120 };
let running = true;
let realElapsed = 0;
let last = performance.now();

const cIce = 2100;
const cWater = 4180;
const cSteam = 2010;
const latentFusion = 334000;
const latentVapor = 2256000;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const fmt = (value: number, digits = 1) => value.toFixed(digits).replace('.', ',');
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

document.documentElement.dataset.theme = 'light';
document.body.innerHTML = `
<div class="shell">
  <header>
    <div class="brand"><span class="mark">♨</span><div><b>Kalor & Perubahan Wujud</b><small>Wadah air · Partikel termal · Pemanas</small></div></div>
    <button id="reset" class="ghost" type="button">Reset</button>
  </header>
  <main class="layout">
    <aside class="left">
      <section class="panel controls">
        <div class="eyebrow">PARAMETER PEMANASAN</div>
        <div class="actions"><button id="pause" class="secondary" type="button">Jeda</button><button id="apply" class="primary" type="button">Mulai ulang</button></div>
        <label>Massa H₂O <output id="outMass"></output><input id="mass" type="range" min="0.25" max="2.00" step="0.05"></label>
        <label>Suhu awal <output id="outTemp"></output><input id="initialTemp" type="range" min="-20" max="90" step="1"></label>
        <label>Daya pemanas <output id="outPower"></output><input id="power" type="range" min="250" max="2000" step="50"></label>
        <label>Percepatan waktu model <output id="outScale"></output><input id="timeScale" type="range" min="30" max="240" step="10"></label>
      </section>
      <section class="panel analysis">
        <div class="eyebrow">ANALISIS LANGSUNG</div>
        <div id="phaseBadge" class="phaseBadge"></div>
        <div id="stats" class="stats"></div>
        <div class="phaseBar"><div id="phaseProgress"></div></div>
        <div class="formula"><b>Q = mcΔT &nbsp; · &nbsp; Q = mL</b><span>Suhu tetap pada titik lebur/didih selama energi digunakan untuk perubahan wujud.</span></div>
      </section>
    </aside>
    <section class="panel stage">
      <div class="stagebar"><span class="tag">3D VIEWPORT · PERUBAHAN WUJUD</span><span id="status">BERJALAN</span></div>
      <div id="viewport" class="viewport"><div class="hud"><span id="hudPhase"></span><span id="hudRight"></span></div></div>
      <div class="legend">Wadah transparan · Es / air · Partikel termal · Gelembung / uap · Pemanas</div>
      <div class="question"><b>Eksperimen</b><p>Mulai dari suhu di bawah 0°C lalu amati perbedaan susunan dan gerak partikel ketika zat berupa es, sedang mencair, menjadi air, mendidih, dan akhirnya menjadi uap.</p></div>
    </section>
  </main>
  <footer><span>SUKA OLIMPIADE FISIKA</span><span>Model kalor sensibel + kalor laten</span></footer>
</div>`;

const viewport = $('#viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1216);
scene.fog = new THREE.Fog(0x0b1216, 10, 22);
const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
camera.position.set(5.9, 4.7, 7.7);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
viewport.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 1.1, 0);
orbit.minDistance = 4.6;
orbit.maxDistance = 12;

scene.add(new THREE.HemisphereLight(0xe2f8ff, 0x1e2930, 1.8));
const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(5, 8, 5);
key.castShadow = true;
scene.add(key);

const root = new THREE.Group();
scene.add(root);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshStandardMaterial({ color: 0x10191e, roughness: 0.98 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.05;
floor.receiveShadow = true;
root.add(floor);
const grid = new THREE.GridHelper(9, 18, 0x29444c, 0x1a2a30);
grid.position.y = -0.045;
root.add(grid);

// Pemanas
const heaterBase = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.7, 0.28, 48), new THREE.MeshStandardMaterial({ color: 0x353d43, metalness: 0.65, roughness: 0.35 }));
heaterBase.position.y = 0.12;
heaterBase.castShadow = true;
root.add(heaterBase);
const heaterCoilMat = new THREE.MeshStandardMaterial({ color: 0xf06434, emissive: 0x5a1208, emissiveIntensity: 1.2, roughness: 0.35, metalness: 0.4 });
for (const radius of [0.45, 0.75, 1.05, 1.30]) {
  const coil = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.045, 10, 64), heaterCoilMat);
  coil.rotation.x = Math.PI / 2;
  coil.position.y = 0.31;
  root.add(coil);
}

// Wadah transparan
const containerMat = new THREE.MeshPhysicalMaterial({ color: 0xa6e5ef, transparent: true, opacity: 0.18, roughness: 0.08, transmission: 0.25, thickness: 0.12, side: THREE.DoubleSide });
const container = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.32, 2.9, 56, 1, true), containerMat);
container.position.y = 1.85;
root.add(container);
const bottom = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.08, 56), new THREE.MeshStandardMaterial({ color: 0x4d7882, transparent: true, opacity: 0.45 }));
bottom.position.y = 0.42;
root.add(bottom);

const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x2587c8, transparent: true, opacity: 0.62, roughness: 0.18, transmission: 0.12 });
const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.26, 2.3, 48), liquidMat);
liquid.position.y = 1.58;
root.add(liquid);

const iceMaterial = new THREE.MeshPhysicalMaterial({ color: 0xbfefff, transparent: true, opacity: 0.78, roughness: 0.22, transmission: 0.28 });
const iceCubes: THREE.Mesh[] = [];
for (let i = 0; i < 8; i++) {
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.55), iceMaterial);
  cube.position.set(((i % 2) - 0.5) * 0.62, 0.82 + Math.floor(i / 4) * 0.48, ((Math.floor(i / 2) % 2) - 0.5) * 0.62);
  cube.rotation.set(i * 0.13, i * 0.21, i * 0.09);
  iceCubes.push(cube);
  root.add(cube);
}

const particleMat = new THREE.MeshStandardMaterial({ color: 0x8fe9ff, emissive: 0x102b38, roughness: 0.3 });
const particles: THREE.Mesh[] = [];
for (let i = 0; i < 52; i++) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), particleMat.clone());
  p.userData.i = i;
  p.userData.seed = (i * 12.9898) % 6.283;
  particles.push(p);
  root.add(p);
}

const vaporMat = new THREE.MeshStandardMaterial({ color: 0xe7f7fb, transparent: true, opacity: 0.55, roughness: 0.8 });
const vaporParticles: THREE.Mesh[] = [];
for (let i = 0; i < 26; i++) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (i % 3) * 0.02, 10, 8), vaporMat.clone());
  p.userData.i = i;
  p.userData.seed = i * 0.73;
  vaporParticles.push(p);
  root.add(p);
}

function initialEnthalpy(temp: number, mass: number): number {
  if (temp < 0) return mass * cIce * temp;
  if (temp <= 100) return mass * latentFusion + mass * cWater * temp;
  return mass * latentFusion + mass * cWater * 100 + mass * latentVapor + mass * cSteam * (temp - 100);
}

function phaseFromEnergy(energy: number): PhaseInfo {
  const m = state.mass;
  const meltEnd = m * latentFusion;
  const heatWaterEnd = meltEnd + m * cWater * 100;
  const vaporEnd = heatWaterEnd + m * latentVapor;
  if (energy < 0) return { temperature: energy / (m * cIce), phase: 'Es', meltFraction: 0, vaporFraction: 0 };
  if (energy < meltEnd) return { temperature: 0, phase: 'Mencair', meltFraction: clamp01(energy / meltEnd), vaporFraction: 0 };
  if (energy < heatWaterEnd) return { temperature: (energy - meltEnd) / (m * cWater), phase: 'Air cair', meltFraction: 1, vaporFraction: 0 };
  if (energy < vaporEnd) return { temperature: 100, phase: 'Mendidih / Menguap', meltFraction: 1, vaporFraction: clamp01((energy - heatWaterEnd) / (m * latentVapor)) };
  return { temperature: 100 + (energy - vaporEnd) / (m * cSteam), phase: 'Uap', meltFraction: 1, vaporFraction: 1 };
}

function currentPhase(): { info: PhaseInfo; energyAdded: number; simulatedSeconds: number } {
  const simulatedSeconds = realElapsed * state.timeScale;
  const energyAdded = state.power * simulatedSeconds;
  const total = initialEnthalpy(state.initialTemp, state.mass) + energyAdded;
  return { info: phaseFromEnergy(total), energyAdded, simulatedSeconds };
}

function updateVisuals(): void {
  const { info } = currentPhase();
  const liquidFraction = info.phase === 'Es' ? 0 : info.phase === 'Mencair' ? info.meltFraction : info.phase === 'Air cair' ? 1 : info.phase === 'Mendidih / Menguap' ? 1 - 0.92 * info.vaporFraction : 0;
  liquid.visible = liquidFraction > 0.02;
  if (liquid.visible) {
    const height = 0.20 + 2.15 * liquidFraction;
    liquid.scale.y = height / 2.3;
    liquid.position.y = 0.46 + height / 2;
    const hotness = clamp01(info.temperature / 100);
    (liquid.material as THREE.MeshPhysicalMaterial).color.setHSL(0.57 - 0.035 * hotness, 0.68, 0.46 + 0.08 * hotness);
  }

  const iceVisibility = info.phase === 'Es' ? 1 : info.phase === 'Mencair' ? 1 - info.meltFraction : 0;
  iceCubes.forEach((cube, i) => {
    cube.visible = iceVisibility > 0.03;
    cube.scale.setScalar(0.55 + 0.45 * iceVisibility);
    cube.position.y = 0.74 + Math.floor(i / 4) * 0.44 + Math.sin(realElapsed * 0.4 + i) * 0.012;
  });

  particles.forEach((p, i) => {
    const phase = info.phase;
    const angle = i * 2.39996;
    const radial = 0.18 + ((i * 37) % 100) / 100 * 0.95;
    if (phase === 'Es') {
      const gx = (i % 4 - 1.5) * 0.48;
      const gy = 0.72 + (Math.floor(i / 16) % 3) * 0.43;
      const gz = (Math.floor(i / 4) % 4 - 1.5) * 0.42;
      p.position.set(gx + Math.sin(realElapsed * 5 + i) * 0.008, gy + Math.cos(realElapsed * 5.4 + i) * 0.008, gz);
      p.scale.setScalar(0.75);
    } else if (phase === 'Mencair' || phase === 'Air cair') {
      const stillSolid = phase === 'Mencair' && (i + 0.5) / particles.length > info.meltFraction;
      if (stillSolid) {
        const gx = (i % 4 - 1.5) * 0.48;
        const gy = 0.72 + (Math.floor(i / 16) % 3) * 0.43;
        const gz = (Math.floor(i / 4) % 4 - 1.5) * 0.42;
        p.position.set(gx + Math.sin(realElapsed * 4.5 + i) * 0.012, gy + Math.cos(realElapsed * 4.2 + i) * 0.012, gz);
        p.scale.setScalar(0.74);
      } else {
        const speed = 0.65 + Math.max(0, info.temperature) / 100 * 1.8;
        p.position.set(
          Math.cos(angle + realElapsed * speed * (0.18 + (i % 5) * 0.02)) * radial,
          0.58 + ((i * 29) % 100) / 100 * 1.75 + Math.sin(realElapsed * speed + i) * 0.08,
          Math.sin(angle + realElapsed * speed * 0.16) * radial,
        );
        p.scale.setScalar(0.72 + 0.12 * Math.sin(realElapsed * speed + i));
      }
    } else if (phase === 'Mendidih / Menguap') {
      const bubble = i % 3 === 0;
      const rise = (realElapsed * (0.35 + (i % 7) * 0.03) + i * 0.13) % 1.85;
      p.position.set(Math.cos(angle) * radial * 0.8, bubble ? 0.56 + rise : 0.68 + ((i * 31) % 100) / 100 * 1.65, Math.sin(angle) * radial * 0.8);
      p.scale.setScalar(bubble ? 1.25 : 0.7);
    } else {
      const rise = (realElapsed * (0.5 + (i % 5) * 0.05) + i * 0.18) % 3.2;
      p.position.set(Math.cos(angle + realElapsed * 0.3) * (0.5 + radial), 1.25 + rise, Math.sin(angle + realElapsed * 0.2) * (0.5 + radial));
      p.scale.setScalar(0.65);
    }
    p.visible = true;
    const mat = p.material as THREE.MeshStandardMaterial;
    mat.color.set(info.temperature < 0 ? 0x91d9f3 : info.temperature < 60 ? 0x6ad8ec : 0xffa36b);
  });

  const vaporStrength = info.phase === 'Mendidih / Menguap' ? Math.max(0.15, info.vaporFraction) : info.phase === 'Uap' ? 1 : 0;
  vaporParticles.forEach((p, i) => {
    p.visible = vaporStrength > 0.02;
    if (!p.visible) return;
    const cycle = (realElapsed * (0.32 + (i % 4) * 0.04) + i * 0.21) % 2.6;
    p.position.set(Math.sin(i * 1.9 + realElapsed * 0.35) * (0.25 + cycle * 0.16), 3.12 + cycle, Math.cos(i * 1.4 + realElapsed * 0.28) * (0.25 + cycle * 0.13));
    p.scale.setScalar(0.65 + vaporStrength * (0.45 + cycle * 0.12));
    (p.material as THREE.MeshStandardMaterial).opacity = 0.18 + 0.45 * vaporStrength * (1 - cycle / 3.0);
  });

  heaterCoilMat.emissiveIntensity = 0.55 + (state.power / 2000) * 2.8;
  heaterCoilMat.color.setHSL(0.07 - (state.power / 2000) * 0.045, 0.92, 0.54);
}

function updateUI(): void {
  const { info, energyAdded, simulatedSeconds } = currentPhase();
  $('#outMass').textContent = `${fmt(state.mass, 2)} kg`;
  $('#outTemp').textContent = `${fmt(state.initialTemp, 0)} °C`;
  $('#outPower').textContent = `${fmt(state.power, 0)} W`;
  $('#outScale').textContent = `${fmt(state.timeScale, 0)}×`;
  $('#phaseBadge').textContent = info.phase;
  $('#phaseBadge').className = `phaseBadge phase-${info.phase.replaceAll(' ', '-').replaceAll('/', '').toLowerCase()}`;
  let progress = 0;
  if (info.phase === 'Es') progress = clamp01((info.temperature + 20) / 20) * 0.18;
  if (info.phase === 'Mencair') progress = 0.18 + info.meltFraction * 0.22;
  if (info.phase === 'Air cair') progress = 0.40 + clamp01(info.temperature / 100) * 0.28;
  if (info.phase === 'Mendidih / Menguap') progress = 0.68 + info.vaporFraction * 0.27;
  if (info.phase === 'Uap') progress = 1;
  $('#phaseProgress').style.width = `${Math.round(progress * 100)}%`;
  $('#stats').innerHTML = [
    ['Suhu', `${fmt(info.temperature)} °C`],
    ['Energi masuk', `${fmt(energyAdded / 1000)} kJ`],
    ['Waktu model', `${fmt(simulatedSeconds, 0)} s`],
    ['Fraksi lebur', `${fmt(info.meltFraction * 100, 0)} %`],
    ['Fraksi uap', `${fmt(info.vaporFraction * 100, 0)} %`],
    ['Daya', `${fmt(state.power, 0)} W`],
  ].map(([label, value]) => `<div><span>${label}</span><b>${value.split(' ')[0]}</b><small>${value.split(' ').slice(1).join(' ')}</small></div>`).join('');
  $('#hudPhase').textContent = info.phase.toUpperCase();
  $('#hudRight').textContent = `T = ${fmt(info.temperature)} °C · t model = ${fmt(simulatedSeconds, 0)} s`;
  $('#status').textContent = running ? 'BERJALAN' : 'DIJEDA';
}

function bindNumber<K extends keyof HeatState>(key: K, selector: string): void {
  const input = $<HTMLInputElement>(selector);
  input.value = String(state[key]);
  input.addEventListener('input', () => {
    state[key] = Number(input.value) as HeatState[K];
    realElapsed = 0;
    updateUI();
    updateVisuals();
  });
}

bindNumber('mass', '#mass');
bindNumber('initialTemp', '#initialTemp');
bindNumber('power', '#power');
bindNumber('timeScale', '#timeScale');

$('#pause').addEventListener('click', (event) => {
  running = !running;
  (event.currentTarget as HTMLButtonElement).textContent = running ? 'Jeda' : 'Lanjutkan';
  updateUI();
});
$('#apply').addEventListener('click', () => { realElapsed = 0; running = true; $('#pause').textContent = 'Jeda'; });
$('#reset').addEventListener('click', () => location.reload());

new ResizeObserver(() => {
  const rect = viewport.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / Math.max(rect.height, 1);
  camera.updateProjectionMatrix();
}).observe(viewport);

function animate(): void {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (running) realElapsed += dt;
  updateVisuals();
  updateUI();
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

updateUI();
updateVisuals();
animate();
