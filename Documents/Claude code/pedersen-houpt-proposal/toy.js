// toy.js: the Lucite deal toy. Law firms mark a closed deal with an acrylic block on the shelf;
// this one is engraved with the project as if it had already closed.
// ponytail: one mesh, one engraved plane, one backdrop. No post-processing, no models.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const W = 1024, H = 1354; // the block's face, 1.55 × 2.05

async function engraving() {
  await Promise.all([
    document.fonts.load('600 64px Newsreader'), document.fonts.load('italic 400 40px Newsreader'),
    document.fonts.load('400 56px "Archivo Black"'), document.fonts.load('600 20px "JetBrains Mono"'),
  ]).catch(err => console.warn('[TOY] fonts not ready, engraving with fallbacks:', err));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = x.strokeStyle = '#f5f7ff';
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const sp = (px) => { if ('letterSpacing' in x) x.letterSpacing = px + 'px'; };
  const line = (y, w, lw = 2) => { x.lineWidth = lw; x.beginPath(); x.moveTo(W / 2 - w / 2, y); x.lineTo(W / 2 + w / 2, y); x.stroke(); };
  // one frame, five lines: the firm, the site, the date, the studio. Nothing small enough to smear.
  x.lineWidth = 2.5; x.strokeRect(58, 58, W - 116, H - 116);
  sp(7); x.font = '600 22px "JetBrains Mono", monospace';
  x.fillText('A MATTER OF RECORD', W / 2, 190);
  sp(0); x.font = '600 70px Newsreader, Georgia, serif';
  x.fillText('Pedersen & Houpt, P.C.', W / 2, 380);
  x.font = 'italic 400 46px Newsreader, Georgia, serif';
  x.fillText('has relaunched', W / 2, 455);
  x.font = '600 104px Newsreader, Georgia, serif';
  x.fillText('pedersenhoupt.com', W / 2, 600);
  line(700, 140, 2);
  x.font = '600 190px Newsreader, Georgia, serif';
  x.fillText('Week 10', W / 2, 930);
  sp(10); x.font = '400 54px "Archivo Black", sans-serif';
  x.fillText('UPPERHAND', W / 2, 1160);
  return c;
}

export async function mountToy(host, { reduce = false } = {}) {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('no WebGL');

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: new URLSearchParams(location.search).has('snap') });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x1c1d20, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0, 6);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // the backdrop: La Salle Street, dipped in Upperhand blue. The block refracts it.
  const loader = new THREE.TextureLoader();
  const photo = await loader.loadAsync('img/hero-ink-soft.webp');
  photo.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: photo, toneMapped: false }));
  back.position.z = -2.6;
  scene.add(back);

  // the block
  const toy = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.6, ior: 1.49,
    attenuationColor: new THREE.Color(0xe8efff), attenuationDistance: 4.5,
    clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, envMapIntensity: 1.35, dispersion: 0.05,
  });
  const DEPTH = 0.3;
  const block = new THREE.Mesh(new RoundedBoxGeometry(1.55, 2.05, DEPTH, 8, 0.06), glass);
  toy.add(block);

  // the etching sits on the front face, drawn after the glass. Inside the block, the side faces
  // refracted it into mirrored copies of the lettering; on the face it reads cleanly from every angle.
  const etch = new THREE.CanvasTexture(await engraving());
  etch.colorSpace = THREE.SRGBColorSpace;
  etch.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.55 * 0.92, 2.05 * 0.92),
    new THREE.MeshBasicMaterial({ map: etch, transparent: true, opacity: 0.94, depthWrite: false, toneMapped: false }));
  plate.position.z = DEPTH / 2 + 0.002;
  toy.add(plate);
  scene.add(toy);

  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc0ff, 1.2); rim.position.set(-4, -1, -2); scene.add(rim);

  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const fit = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the block a steady share of the frame whatever the stage's shape
    camera.fov = w / h < 0.9 ? 30 : 34;
    camera.updateProjectionMatrix();
    const dist = camera.position.z - back.position.z;
    const vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.12, vw = vh * camera.aspect;
    const ar = 1200 / 1600;
    if (vw / vh > ar) back.scale.set(vw, vw / ar, 1); else back.scale.set(vh * ar, vh, 1);
    // narrow stages (phones) get a smaller block so its turning edges stay in frame
    toy.scale.setScalar(Math.max(0.72, Math.min(1, (w / h) / 0.8)) * (w / h > 1.2 ? 0.9 : 1));
  };
  fit();
  new ResizeObserver(fit).observe(host);

  // pointer tilts it; a drag spins it; left alone it breathes
  let tx = 0, ty = 0, rx = 0, ry = -0.35, spin = 0, vel = 0, dragging = false, lastX = 0;
  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    tx = ((e.clientY - r.top) / r.height - 0.5) * 0.22;
    ty = ((e.clientX - r.left) / r.width - 0.5) * 0.55;
    if (dragging) { vel = (e.clientX - lastX) * 0.012; spin += vel; lastX = e.clientX; }
  });
  host.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; });
  addEventListener('pointerup', () => { dragging = false; });
  host.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

  let visible = true, raf = 0;
  const clock = new THREE.Clock();
  const frame = () => {
    raf = 0;
    // easing measured in 60 Hz frames, so a 120 Hz display turns the block at the same speed
    const dt = Math.min(clock.getDelta(), 0.1) * 60, t = clock.elapsedTime;
    const ease = 1 - Math.pow(1 - 0.06, dt);
    if (!dragging) { spin += vel * dt; vel *= Math.pow(0.94, dt); spin *= Math.pow(0.985, dt); }
    const sy = Math.min(scrollY / innerHeight, 1.2);
    rx += (tx + Math.sin(t * 0.5) * 0.04 - sy * 0.12 - rx) * ease;
    ry += (ty + Math.sin(t * 0.35) * 0.1 - 0.14 + spin + sy * 0.45 - ry) * ease;
    toy.rotation.set(rx, ry, Math.sin(t * 0.4) * 0.015);
    toy.position.y = Math.sin(t * 0.8) * 0.04 + sy * 0.35;
    back.position.x = -ty * 0.25;
    back.position.y = tx * 0.25 + sy * 0.45;
    renderer.render(scene, camera);
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });

  frame();
  host.classList.add('gl');
  if (reduce) { // one still frame, re-rendered only when the stage changes size
    new ResizeObserver(() => requestAnimationFrame(frame)).observe(host);
  }
  window.__toy = { renderer, scene, camera, toy, snap: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/jpeg', 0.88); } };
}
