export function mountFrameControls(): void {
  const viewport = document.querySelector<HTMLElement>('#viewport') ?? document.querySelector<HTMLElement>('.viewport');
  const panel = document.querySelector<HTMLElement>('.controls');
  if (!viewport || !panel || panel.dataset.frameControls === 'true') return;

  panel.dataset.frameControls = 'true';
  panel.classList.add('frame-controls-panel');
  panel.parentElement?.classList.add('frame-controls-source');
  document.documentElement.classList.add('controls-inside-frame');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'frame-controls-toggle';
  toggle.setAttribute('aria-controls', 'suka-frame-controls');
  panel.id = panel.id || 'suka-frame-controls';

  viewport.appendChild(panel);
  viewport.appendChild(toggle);

  const params = new URLSearchParams(window.location.search);
  const embedded = window.parent !== window || params.get('embed') === '1';
  if (embedded) document.documentElement.classList.add('simulation-embedded');

  let open = viewport.clientWidth >= 760;
  if (params.get('controls') === 'open') open = true;
  if (params.get('controls') === 'closed') open = false;

  const renderState = () => {
    panel.classList.toggle('frame-controls-hidden', !open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Tutup parameter' : '⚙ Parameter';
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    open = !open;
    renderState();
  });

  panel.addEventListener('pointerdown', (event) => event.stopPropagation());
  panel.addEventListener('click', (event) => event.stopPropagation());
  panel.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
  panel.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });

  renderState();

  if (window.parent !== window) {
    window.parent.postMessage({ type: 'suka-simulation-ready', controlsInsideFrame: true }, '*');
  }
}
