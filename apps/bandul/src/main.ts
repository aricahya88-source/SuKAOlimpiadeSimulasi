import './style.css';
import { mountFrameControls } from './frame-controls';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type PendulumState = {
  length: number;
  angleDeg: number;
  mass: number;
  diameterCm: number;
};

const state: PendulumState = { length: 2, angleDeg: 25, mass: 1, diameterCm: 30 };
let running = true;
let t = 0;
let last = performance.now();
let trailEnabled = true;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const fmt = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');

document.documentElement.dataset.theme = 'light';
document.body.innerHTML = `
<div class="shell">
  <header>
    <div class="brand"><span class="mark">✦</span><div><b>Bandul Matematis</b><small>SuKa Olimpiade Fisika · Simulasi 3D</small></div></div>
    <button id="reset" class="ghost" type="button">Reset</button>
  </header>
  <main class="layout">
    <aside class="left">
      <section class="panel controls">
        <div class="eyebrow">PARAMETER PERCOBAAN</div>
        <div class="actions"><button id="pause" class="secondary" type="button">Jeda</button><button id="apply" class="primary" type="button">Terapkan</button></div>
        <label>Panjang tali <output id="outLength"></output><input id="length" type="range" min="0.50" max="3.00" step="0.05"></label>
        <label>Sudut awal <output id="outAngle"></output><input id="angle" type="range" min="5" max="60" step="1"></label>
        <label>Massa bandul <output id="outMass"></output><input id="mass" type="range" min="0.10" max="3.00" step="0.10"></label>
        <label>Ukuran bandul (diameter) <output id="outSize"></output><input id="size" type="range" min="12" max="60" step="1"></label>
        <div class="toggles"><label><span>Tampilkan jejak gerak</span><input id="trail" type="checkbox" checked></label></div>
      </section>
      <section class="panel analysis">
        <div class="eyebrow">ANALISIS LANGSUNG</div>
        <div id="stats" class="stats"></div>
        <div class="formula"><b>T = 2π√(L/g)</b><span>Model ideal: tali ringan, hambatan udara diabaikan.</span></div>
      </section>
    </aside>
    <section class="panel stage">
      <div class="stagebar"><span class="tag">3D VIEWPORT · ATAP + TITIK GANTUNG</span><span id="status">BERJALAN</span></div>
      <div id="viewport" class="viewport"><div class="hud"><span>Bandul matematis</span><span id="hudRight"></span></div></div>
      <div class="legend">Atap / penyangga · Titik gantung · Tali · Bola bandul · Garis setimbang</div>
      <div class="question"><b>Eksperimen</b><p>Ubah panjang tali, sudut awal, massa, dan diameter bandul. Amati parameter mana yang mengubah periode osilasi pada model bandul ideal.</p></div>
    </section>
  </main>
  <footer><span>SUKA OLIMPIADE FISIKA</span><span>Three.js · UI terang, viewport gelap</span></footer>
</div>`;

mountFrameControls();

const viewport = $('#viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1216);
scene.fog = new THREE.Fog(0x0b1216, 10, 22);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(5.8, 4.6, 7.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 1.35, 0);
orbit.minDistance = 4.5;
orbit.maxDistance = 12;

scene.add(new THREE.HemisphereLight(0xdff8ff, 0x253039, 1.7));
const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(4, 8, 5);
key.castShadow = true;
scene.add(key);

const root = new THREE.Group();
scene.add(root);

const mat = (color: number, roughness = 0.42, metalness = 0.12) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const roofMaterial = mat(0x6b747c, 0.62, 0.32);
const supportMaterial = mat(0x9ba8af, 0.4, 0.55);
const bobMaterial = mat(0x58d0dd, 0.28, 0.2);

// Lantai referensi
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshStandardMaterial({ color: 0x111b20, roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.05;
floor.receiveShadow = true;
root.add(floor);
const grid = new THREE.GridHelper(10, 20, 0x2d4a52, 0x1d2e34);
grid.position.y = -0.045;
root.add(grid);

// Atap / penyangga
const roof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.22, 2.0), roofMaterial);
roof.position.set(0, 3.55, 0);
roof.castShadow = true;
root.add(roof);
const roofTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.10, 2.35), mat(0x3d4850, 0.75, 0.25));
roofTop.position.set(0, 3.70, 0);
roofTop.castShadow = true;
root.add(roofTop);

const pivotY = 3.37;
const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.32, 20), supportMaterial);
hook.position.set(0, 3.36, 0);
hook.castShadow = true;
root.add(hook);
const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 18), mat(0xbdd44a, 0.3, 0.2));
pivot.position.set(0, pivotY, 0);
pivot.castShadow = true;
root.add(pivot);

const stringGeometry = new THREE.BufferGeometry();
const stringMaterial = new THREE.LineBasicMaterial({ color: 0xe6ecef });
const stringLine = new THREE.Line(stringGeometry, stringMaterial);
root.add(stringLine);

const equilibriumGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, pivotY, 0), new THREE.Vector3(0, 0.25, 0)]);
const equilibrium = new THREE.Line(equilibriumGeometry, new THREE.LineDashedMaterial({ color: 0x526c77, dashSize: 0.12, gapSize: 0.10 }));
equilibrium.computeLineDistances();
root.add(equilibrium);

let bob = new THREE.Mesh(new THREE.SphereGeometry(0.15, 36, 24), bobMaterial);
bob.castShadow = true;
root.add(bob);

const trailGeometry = new THREE.BufferGeometry();
const trailLine = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color: 0x79e3ed, transparent: true, opacity: 0.55 }));
root.add(trailLine);
const trailPoints: THREE.Vector3[] = [];

function rebuildBob(): void {
  root.remove(bob);
  bob.geometry.dispose();
  const radius = state.diameterCm / 200;
  bob = new THREE.Mesh(new THREE.SphereGeometry(radius, 36, 24), bobMaterial);
  bob.castShadow = true;
  bob.receiveShadow = true;
  root.add(bob);
  trailPoints.length = 0;
}

function updateOutputs(): void {
  $('#outLength').textContent = `${fmt(state.length)} m`;
  $('#outAngle').textContent = `${fmt(state.angleDeg, 0)}°`;
  $('#outMass').textContent = `${fmt(state.mass)} kg`;
  $('#outSize').textContent = `${fmt(state.diameterCm, 0)} cm`;
}

function updateStats(): void {
  const g = 9.81;
  const theta0 = THREE.MathUtils.degToRad(state.angleDeg);
  const period = 2 * Math.PI * Math.sqrt(state.length / g);
  const frequency = 1 / period;
  const vmax = Math.sqrt(Math.max(0, 2 * g * state.length * (1 - Math.cos(theta0))));
  const tensionBottom = state.mass * g + state.mass * vmax * vmax / state.length;
  $('#stats').innerHTML = [
    ['Periode', `${fmt(period)} s`],
    ['Frekuensi', `${fmt(frequency)} Hz`],
    ['v maks.', `${fmt(vmax)} m/s`],
    ['Tegangan bawah', `${fmt(tensionBottom)} N`],
  ].map(([label, value]) => `<div><span>${label}</span><b>${value.split(' ')[0]}</b><small>${value.split(' ').slice(1).join(' ')}</small></div>`).join('');
  $('#hudRight').textContent = `t = ${fmt(t)} s · θ₀ = ${fmt(state.angleDeg, 0)}°`;
  $('#status').textContent = running ? 'BERJALAN' : 'DIJEDA';
}

function updatePendulum(): void {
  const omega = Math.sqrt(9.81 / state.length);
  const theta = THREE.MathUtils.degToRad(state.angleDeg) * Math.cos(omega * t);
  const bobPos = new THREE.Vector3(
    state.length * Math.sin(theta),
    pivotY - state.length * Math.cos(theta),
    0,
  );
  bob.position.copy(bobPos);

  stringGeometry.setFromPoints([new THREE.Vector3(0, pivotY, 0), bobPos]);

  if (running && trailEnabled) {
    const lastPoint = trailPoints.at(-1);
    if (!lastPoint || lastPoint.distanceToSquared(bobPos) > 0.0008) {
      trailPoints.push(bobPos.clone());
      if (trailPoints.length > 180) trailPoints.shift();
      trailGeometry.setFromPoints(trailPoints);
    }
  }
  trailLine.visible = trailEnabled;
}

function bindRange(id: keyof Pick<PendulumState, 'length' | 'angleDeg' | 'mass' | 'diameterCm'>, selector: string): void {
  const input = $<HTMLInputElement>(selector);
  input.value = String(state[id]);
  input.addEventListener('input', () => {
    state[id] = Number(input.value);
    if (id === 'diameterCm') rebuildBob();
    trailPoints.length = 0;
    trailGeometry.setFromPoints([]);
    t = 0;
    updateOutputs();
    updateStats();
    updatePendulum();
  });
}

bindRange('length', '#length');
bindRange('angleDeg', '#angle');
bindRange('mass', '#mass');
bindRange('diameterCm', '#size');

$<HTMLInputElement>('#trail').addEventListener('change', (event) => {
  trailEnabled = (event.currentTarget as HTMLInputElement).checked;
  if (!trailEnabled) {
    trailPoints.length = 0;
    trailGeometry.setFromPoints([]);
  }
});

$('#pause').addEventListener('click', (event) => {
  running = !running;
  (event.currentTarget as HTMLButtonElement).textContent = running ? 'Jeda' : 'Lanjutkan';
  updateStats();
});

$('#apply').addEventListener('click', () => {
  t = 0;
  running = true;
  $('#pause').textContent = 'Jeda';
  trailPoints.length = 0;
  trailGeometry.setFromPoints([]);
});

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
  if (running) t += dt;
  updatePendulum();
  updateStats();
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

updateOutputs();
rebuildBob();
updatePendulum();
animate();
