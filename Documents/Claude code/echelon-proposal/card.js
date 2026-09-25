// card.js: the Founding Member card. Black metal, The Echelon's own gold mark on the face,
// member No. 0001 in Joe's name, and who built it on the back.
// ponytail: one extruded card, two engraved planes, no post-processing, no models.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const CW = 2.4, CH = CW / 1.586, DEPTH = 0.03; // ISO card proportions
const TW = 2048, TH = Math.round(TW / 1.586);
const GOLD = '#d4a456', SILVER = '#e9e6de';

const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

function roundRect(x, l, t, w, h, r) {
  x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
}

// fine engraved rosette, the way banknotes and metal cards mark themselves as the real thing
function rosette(x, cx, cy, R, rings, alpha) {
  x.save(); x.strokeStyle = `rgba(255,255,255,${alpha})`; x.lineWidth = 1.4;
  for (let k = 0; k < rings; k++) {
    x.beginPath();
    for (let i = 0; i <= 720; i++) {
      const th = (i / 720) * Math.PI * 2;
      const r = R * (0.55 + k / rings * 0.45) + Math.sin(th * 18 + k * 0.35) * R * 0.045;
      const px = cx + Math.cos(th) * r, py = cy + Math.sin(th) * r;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.stroke();
  }
  x.restore();
}

function canvas() { const c = document.createElement('canvas'); c.width = TW; c.height = TH; return [c, c.getContext('2d')]; }
const sp = (x, px) => { if ('letterSpacing' in x) x.letterSpacing = px + 'px'; };

async function faces() {
  await Promise.all([
    document.fonts.load('500 60px "Hanken Grotesk"'), document.fonts.load('400 30px "Hanken Grotesk"'),
    document.fonts.load('400 60px "Archivo Black"'),
  ]).catch(err => console.warn('[CARD] fonts not ready, engraving with fallbacks:', err));
  const [crest, word, tag] = await Promise.all(['img/card-crest.webp', 'img/card-word.webp', 'img/card-tag.webp'].map(img));

  // front: the crest, the rank, the member
  const [f, x] = canvas();
  rosette(x, TW * 0.5, TH * 0.34, 520, 34, 0.05);
  x.strokeStyle = 'rgba(212,164,86,0.55)'; x.lineWidth = 2.5; roundRect(x, 56, 56, TW - 112, TH - 112, 64); x.stroke();
  const ch = 440, cw = ch * crest.width / crest.height;
  x.drawImage(crest, TW / 2 - cw / 2, 118, cw, ch);
  x.textAlign = 'center'; x.fillStyle = GOLD;
  sp(x, 20); x.font = '500 44px "Hanken Grotesk", sans-serif';
  x.fillText('FOUNDING MEMBER', TW / 2 + 10, 668);
  x.fillRect(TW / 2 - 170, 714, 140, 2); x.fillRect(TW / 2 + 30, 714, 140, 2);
  x.save(); x.translate(TW / 2, 715); x.rotate(Math.PI / 4); x.fillRect(-7, -7, 14, 14); x.restore();
  x.textAlign = 'left'; x.fillStyle = SILVER;
  sp(x, 12); x.font = '500 62px "Hanken Grotesk", sans-serif';
  x.fillText('JOE BROCATO', 150, 1052);
  x.fillStyle = GOLD; sp(x, 7); x.font = '400 32px "Hanken Grotesk", sans-serif';
  x.fillText('NO. 0001  ·  MEMBER SINCE 2026', 152, 1118);
  const ww = 430, wh = ww * word.height / word.width;
  x.drawImage(word, TW - 150 - ww, 1128 - wh, ww, wh);

  // back: the promise, and who made the card
  const [b, y] = canvas();
  rosette(y, TW * 0.5, TH * 0.5, 700, 40, 0.04);
  y.strokeStyle = 'rgba(212,164,86,0.55)'; y.lineWidth = 2.5; roundRect(y, 56, 56, TW - 112, TH - 112, 64); y.stroke();
  const bw = 760, bh = bw * word.height / word.width;
  y.drawImage(word, TW / 2 - bw / 2, 250, bw, bh);
  const tw = 900, th = tw * tag.height / tag.width;
  y.drawImage(tag, TW / 2 - tw / 2, 250 + bh + 60, tw, th);
  y.textAlign = 'center'; y.fillStyle = SILVER;
  sp(y, 4); y.font = '400 34px "Hanken Grotesk", sans-serif';
  y.fillText('membership@TheEchelonSignature.com', TW / 2 + 2, 780);
  sp(y, 9); y.font = '500 26px "Hanken Grotesk", sans-serif'; y.fillStyle = 'rgba(233,230,222,0.8)';
  y.fillText('DESIGNED AND BUILT BY', TW / 2 + 4, 1010);
  sp(y, 16); y.font = '400 66px "Archivo Black", sans-serif'; y.fillStyle = '#0047ff';
  y.fillText('UPPERHAND', TW / 2 + 8, 1098);
  return [f, b];
}

export async function mountCard(host, { reduce = false } = {}) {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('no WebGL');
  const q = new URLSearchParams(location.search), snap = q.has('snap');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: snap });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0, 0, 6);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();

  // the card: a rounded rectangle extruded to metal-card thickness, black faces, a brushed gold edge
  const s = new THREE.Shape(), r = 0.1, w = CW / 2, h = CH / 2;
  s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
  const geo = new THREE.ExtrudeGeometry(s, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 12 });
  geo.translate(0, 0, -DEPTH / 2);
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0d0d10, metalness: 0.8, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.22, envMapIntensity: 0.9 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xc99a4e, metalness: 1, roughness: 0.3 });
  const card = new THREE.Group();
  card.add(new THREE.Mesh(geo, [black, edge]));

  // engraving: metal inlay on each face, so the gold catches the room as the card turns
  const [front, back] = await faces();
  const face = (cv, z, flip) => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH),
      new THREE.MeshStandardMaterial({ map: t, transparent: true, metalness: 0.9, roughness: 0.32, envMapIntensity: 1.5, depthWrite: false }));
    m.position.z = z; if (flip) m.rotation.y = Math.PI;
    card.add(m);
  };
  face(front, DEPTH / 2 + 0.006, false);
  face(back, -DEPTH / 2 - 0.006, true);
  scene.add(card);

  // a soft shadow behind, so the card floats instead of sitting on the backdrop
  const sh = document.createElement('canvas'); sh.width = sh.height = 256;
  const sx = sh.getContext('2d'), gr = sx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  sx.fillStyle = gr; sx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(CW * 1.5, CH * 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.position.set(0, -0.28, -1.2);
  scene.add(shadow);

  const key = new THREE.DirectionalLight(0xfff4e0, 1.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f8dff, 0.9); rim.position.set(-4, -2, -3); scene.add(rim);

  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const fit = () => {
    const cw = host.clientWidth, chh = host.clientHeight;
    if (!cw || !chh) return;
    renderer.setSize(cw, chh, false);
    camera.aspect = cw / chh;
    camera.updateProjectionMatrix();
    // keep the card at the same share of the stage's width, whatever its shape
    const vw = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    card.scale.setScalar(Math.min(1.15, (vw * 0.84) / CW));
  };
  fit();
  new ResizeObserver(fit).observe(host);

  // pointer tilts it, a drag turns it over, and it settles face-on (front or back)
  let tx = 0, ty = 0, rx = 0, ry = 0, spin = q.has('back') ? Math.PI : 0, target = spin, dragging = false, lastX = 0;
  host.addEventListener('pointermove', e => {
    const b = host.getBoundingClientRect();
    tx = ((e.clientY - b.top) / b.height - 0.5) * 0.3;
    ty = ((e.clientX - b.left) / b.width - 0.5) * 0.5;
    if (dragging) { target += (e.clientX - lastX) * 0.012; lastX = e.clientX; }
  });
  host.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; });
  addEventListener('pointerup', () => { if (dragging) { dragging = false; target = Math.round(target / Math.PI) * Math.PI; } });
  host.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

  let visible = true, raf = 0;
  const clock = new THREE.Clock();
  // one slow turn after it arrives, so the reader sees there is a back
  if (!reduce && !snap) setTimeout(() => { if (!dragging && target === 0) target = Math.PI * 2; }, 1800);
  const frame = () => {
    raf = 0;
    // easing counted in 60 Hz frames, so a 120 Hz screen turns it at the same speed
    const dt = Math.min(clock.getDelta(), 0.1) * 60, t = clock.elapsedTime;
    const ease = 1 - Math.pow(1 - 0.06, dt);
    spin += (target - spin) * (1 - Math.pow(1 - (dragging ? 0.35 : 0.035), dt));
    const sy = Math.min(scrollY / innerHeight, 1.2);
    rx += (tx + Math.sin(t * 0.5) * 0.05 - 0.1 - sy * 0.25 - rx) * ease;
    ry += (ty + Math.sin(t * 0.33) * 0.16 - 0.2 - ry) * ease;
    card.rotation.set(rx, ry + spin, -0.06 + Math.sin(t * 0.4) * 0.012);
    card.position.y = Math.sin(t * 0.8) * 0.035 + sy * 0.3;
    shadow.position.x = -ry * 0.3;
    renderer.render(scene, camera);
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });

  frame();
  host.classList.add('gl');
  if (reduce) { new ResizeObserver(() => requestAnimationFrame(frame)).observe(host); host.addEventListener('pointermove', () => requestAnimationFrame(frame)); }
  window.__card = { renderer, scene, camera, card, snap: (type = 'image/webp') => { renderer.render(scene, camera); return renderer.domElement.toDataURL(type, 0.9); } };
}
