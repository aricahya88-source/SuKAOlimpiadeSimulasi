import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type WaveMode = 'traveling' | 'standing-fixed' | 'standing-free';
type WaveState = { mode: WaveMode; amplitudeCm: number; frequency: number; tension: number; density: number };

const state: WaveState = { mode: 'traveling', amplitudeCm: 35, frequency: 1.2, tension: 25, density: 0.25 };
let running = true;
let t = 0;
let last = performance.now();

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const fmt = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');

document.documentElement.dataset.theme = 'light';
document.body.innerHTML = `
<div class="shell">
  <header>
    <div class="brand"><span class="mark">∿</span><div><b>Gelombang Merambat</b><small>Gelombang berjalan & stasioner</small></div></div>
    <button id="reset" class="ghost" type="button">Reset</button>
  </header>
  <main class="layout">
    <aside class="left">
      <section class="panel controls">
        <div class="eyebrow">JENIS GELOMBANG</div>
        <label class="selectLabel">Mode
          <select id="mode">
            <option value="traveling">Gelombang Berjalan</option>
            <option value="standing-fixed">Gelombang Stasioner · Ujung Terikat</option>
            <option value="standing-free">Gelombang Stasioner · Ujung Bebas</option>
          </select>
        </label>
        <div class="actions"><button id="pause" class="secondary" type="button">Jeda</button><button id="apply" class="primary" type="button">Terapkan</button></div>
        <label>Amplitudo <output id="outAmplitude"></output><input id="amplitude" type="range" min="10" max="70" step="1"></label>
        <label>Frekuensi <output id="outFrequency"></output><input id="frequency" type="range" min="0.50" max="3.00" step="0.05"></label>
        <label>Tegangan tali <output id="outTension"></output><input id="tension" type="range" min="10" max="80" step="1"></label>
        <label>Massa jenis linear μ <output id="outDensity"></output><input id="density" type="range" min="0.10" max="0.60" step="0.01"></label>
      </section>
      <section class="panel analysis">
        <div class="eyebrow">ANALISIS LANGSUNG</div>
        <div id="stats" class="stats"></div>
        <div class="formula"><b>v = √(T/μ) &nbsp; · &nbsp; λ = v/f</b><span id="boundaryInfo"></span></div>
      </section>
    </aside>
    <section class="panel stage">
      <div class="stagebar"><span class="tag">3D VIEWPORT · TALI BERPARTIKEL</span><span id="status">BERJALAN</span></div>
      <div id="viewport" class="viewport"><div class="hud"><span id="hudMode"></span><span id="hudRight"></span></div></div>
      <div id="legend" class="legend"></div>
      <div class="question"><b>Eksperimen</b><p>Bandingkan bentuk gelombang ketika ujung tali tidak memantulkan, terikat, dan bebas. Perhatikan simpul/perut serta fase gelombang pantul pada batas.</p></div>
    </section>
  </main>
  <footer><span>SUKA OLIMPIADE FISIKA</span><span>Three.js · Gelombang berjalan & stasioner</span></footer>
</div>`;

const viewport = $('#viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1216);
scene.fog = new THREE.Fog(0x0b1216, 12, 24);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(7.4, 4.5, 8.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
viewport.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 0.2, 0);
orbit.minDistance = 5.5;
orbit.maxDistance = 14;

scene.add(new THREE.HemisphereLight(0xe2f8ff, 0x1c2830, 1.9));
const lamp = new THREE.DirectionalLight(0xffffff, 2.2);
lamp.position.set(4, 7, 5);
scene.add(lamp);

const root = new THREE.Group();
scene.add(root);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ color: 0x111a20, roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.25;
root.add(floor);
const grid = new THREE.GridHelper(12, 24, 0x29444c, 0x1a2a30);
grid.position.y = -1.24;
root.add(grid);

const N = 81;
const L = 7;
const xMin = -L / 2;
const particles: THREE.Mesh[] = [];
const particleMat = new THREE.MeshStandardMaterial({ color: 0x65d8e3, roughness: 0.32, metalness: 0.12 });
for (let i = 0; i < N; i++) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), particleMat);
  p.castShadow = true;
  particles.push(p);
  root.add(p);
}

const lineGeometry = new THREE.BufferGeometry();
const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xa7edf3 }));
root.add(line);

const sourcePost = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.5), new THREE.MeshStandardMaterial({ color: 0x56636b, roughness: 0.55, metalness: 0.4 }));
sourcePost.position.set(xMin - 0.15, 0, 0);
root.add(sourcePost);
const sourceMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.35, 22), new THREE.MeshStandardMaterial({ color: 0xf39b68, roughness: 0.35, metalness: 0.2 }));
sourceMotor.rotation.z = Math.PI / 2;
sourceMotor.position.set(xMin, 0, 0);
root.add(sourceMotor);

const boundaryRoot = new THREE.Group();
root.add(boundaryRoot);
const arrowRoot = new THREE.Group();
root.add(arrowRoot);

function clearGroup(group: THREE.Group): void {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) child.geometry?.dispose();
  }
}

function buildBoundary(): void {
  clearGroup(boundaryRoot);
  clearGroup(arrowRoot);
  const rightX = xMin + L;
  if (state.mode === 'standing-fixed') {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.4, 0.9), new THREE.MeshStandardMaterial({ color: 0x6c777e, roughness: 0.65, metalness: 0.3 }));
    wall.position.set(rightX + 0.12, 0, 0);
    boundaryRoot.add(wall);
    const clamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), new THREE.MeshStandardMaterial({ color: 0xbdd44a }));
    clamp.position.set(rightX, 0, 0);
    boundaryRoot.add(clamp);
  } else if (state.mode === 'standing-free') {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.8, 16), new THREE.MeshStandardMaterial({ color: 0x7e8a90, metalness: 0.5, roughness: 0.35 }));
    rail.position.set(rightX + 0.18, 0, 0);
    boundaryRoot.add(rail);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 10, 28), new THREE.MeshStandardMaterial({ color: 0xbdd44a, metalness: 0.25 }));
    ring.rotation.y = Math.PI / 2;
    ring.userData.freeRing = true;
    ring.position.set(rightX, 0, 0);
    boundaryRoot.add(ring);
  } else {
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(1.7, 0.85, 0), 2.0, 0x65d8e3, 0.25, 0.12);
    arrowRoot.add(arrow);
  }
}

function physics(): { v: number; lambda: number; omega: number; k: number; amplitude: number } {
  const v = Math.sqrt(state.tension / state.density);
  const lambda = v / state.frequency;
  return { v, lambda, omega: 2 * Math.PI * state.frequency, k: 2 * Math.PI / lambda, amplitude: state.amplitudeCm / 100 };
}

function yAt(xLocal: number, time: number): number {
  const { k, omega, amplitude } = physics();
  if (state.mode === 'traveling') return amplitude * Math.sin(k * xLocal - omega * time);
  const reflectedCoordinate = 2 * k * L - k * xLocal - omega * time;
  const incident = Math.sin(k * xLocal - omega * time);
  if (state.mode === 'standing-fixed') return amplitude * (incident - Math.sin(reflectedCoordinate));
  return amplitude * (incident + Math.sin(reflectedCoordinate));
}

function updateWave(): void {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const xLocal = (i / (N - 1)) * L;
    const x = xMin + xLocal;
    const y = yAt(xLocal, t);
    particles[i].position.set(x, y, 0);
    points.push(new THREE.Vector3(x, y, 0));
  }
  lineGeometry.setFromPoints(points);
  const freeRing = boundaryRoot.children.find((item: any) => item.userData.freeRing);
  if (freeRing) freeRing.position.y = yAt(L, t);
}

function updateUI(): void {
  const { v, lambda } = physics();
  $('#outAmplitude').textContent = `${fmt(state.amplitudeCm, 0)} cm`;
  $('#outFrequency').textContent = `${fmt(state.frequency)} Hz`;
  $('#outTension').textContent = `${fmt(state.tension, 0)} N`;
  $('#outDensity').textContent = `${fmt(state.density)} kg/m`;
  const boundary = state.mode === 'traveling' ? 'Tanpa refleksi' : state.mode === 'standing-fixed' ? 'Ujung terikat · pantul berbalik fase' : 'Ujung bebas · pantul sefase';
  $('#stats').innerHTML = [
    ['Cepat rambat', `${fmt(v)} m/s`],
    ['Panjang λ', `${fmt(lambda)} m`],
    ['Periode', `${fmt(1 / state.frequency)} s`],
    ['Batas', state.mode === 'traveling' ? 'berjalan' : state.mode === 'standing-fixed' ? 'terikat' : 'bebas'],
  ].map(([label, value]) => `<div><span>${label}</span><b>${value.split(' ')[0]}</b><small>${value.split(' ').slice(1).join(' ')}</small></div>`).join('');
  $('#boundaryInfo').textContent = boundary;
  $('#hudMode').textContent = state.mode === 'traveling' ? 'GELOMBANG BERJALAN' : state.mode === 'standing-fixed' ? 'STASIONER · UJUNG TERIKAT' : 'STASIONER · UJUNG BEBAS';
  $('#hudRight').textContent = `v = ${fmt(v)} m/s · λ = ${fmt(lambda)} m`;
  $('#legend').textContent = state.mode === 'traveling' ? 'Sumber getar · Tali · Arah rambat →' : state.mode === 'standing-fixed' ? 'Sumber getar · Gelombang datang + pantul · Ujung terikat (simpul)' : 'Sumber getar · Gelombang datang + pantul · Ujung bebas (perut)';
  $('#status').textContent = running ? 'BERJALAN' : 'DIJEDA';
}

function bindNumber<K extends keyof Omit<WaveState, 'mode'>>(key: K, selector: string): void {
  const input = $<HTMLInputElement>(selector);
  input.value = String(state[key]);
  input.addEventListener('input', () => {
    state[key] = Number(input.value) as WaveState[K];
    t = 0;
    updateUI();
    updateWave();
  });
}

bindNumber('amplitudeCm', '#amplitude');
bindNumber('frequency', '#frequency');
bindNumber('tension', '#tension');
bindNumber('density', '#density');

const modeSelect = $<HTMLSelectElement>('#mode');
modeSelect.value = state.mode;
modeSelect.addEventListener('change', () => {
  state.mode = modeSelect.value as WaveMode;
  t = 0;
  buildBoundary();
  updateUI();
  updateWave();
});

$('#pause').addEventListener('click', (event) => {
  running = !running;
  (event.currentTarget as HTMLButtonElement).textContent = running ? 'Jeda' : 'Lanjutkan';
  updateUI();
});
$('#apply').addEventListener('click', () => { t = 0; running = true; $('#pause').textContent = 'Jeda'; });
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
  updateWave();
  updateUI();
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

buildBoundary();
updateUI();
updateWave();
animate();
