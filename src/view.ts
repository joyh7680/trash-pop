import * as THREE from 'three';
import { Game, ROLE_INFO, side, type GameEvent, type Role } from './game.ts';

const BLUE = 0x70caff, RED = 0xff829f, LIME = 0xb6f879;
const materials = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: THREE.ColorRepresentation, metalness = 0, roughness = .65) {
  const key = `${new THREE.Color(color).getHexString()}-${metalness}-${roughness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: true }));
  return materials.get(key)!;
}
function mesh(geometry: THREE.BufferGeometry, color: THREE.ColorRepresentation, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, mat(color));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const ball = (r: number) => new THREE.SphereGeometry(r, 12, 8);
function ring(parent: THREE.Object3D, radius: number, color: number, width = .06) {
  const m = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.y = .04; parent.add(m); return m;
}
function roundedPlatform(w: number, h: number, depth: number, color: number, parent: THREE.Object3D) {
  const s = new THREE.Shape(), r = .85, x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const m = mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .12, bevelThickness: .12 }), color, parent);
  m.rotation.x = -Math.PI / 2; return m;
}

export function createCharacter(role: Role, team: 'blue' | 'red', player = false) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const color = new THREE.Color(ROLE_INFO[role].color), teamColor = team === 'blue' ? BLUE : RED;
  const bootL = mesh(box(.4, .4, .65), 0x242c49, body, -.28, .27, .06);
  const bootR = mesh(box(.4, .4, .65), 0x242c49, body, .28, .27, .06);
  const torso = mesh(new THREE.CylinderGeometry(.48, .55, .77, 8), color, body, 0, .95);
  torso.rotation.y = Math.PI / 8;
  mesh(box(.58, .28, .12), 0xf4f7ff, body, 0, 1.03, .48);
  mesh(box(.24, .12, .04), teamColor, body, 0, 1.05, .56);
  mesh(new THREE.CylinderGeometry(.41, .38, .75, 8), 0x39425c, body, 0, 1, -.5).rotation.x = .12;
  mesh(new THREE.CylinderGeometry(.16, .16, .7, 8), teamColor, body, -.36, 1, -.51);
  mesh(new THREE.CylinderGeometry(.16, .16, .7, 8), color, body, .36, 1, -.51);
  mesh(ball(.7), color, body, 0, 1.85);
  const visor = mesh(new THREE.SphereGeometry(.57, 16, 10, 0, Math.PI), 0x152c47, body, 0, 1.88, .16);
  visor.scale.set(1, .66, 1);
  mesh(box(.14, .18, .06), 0xb6efff, body, -.21, 1.9, .7);
  mesh(box(.14, .18, .06), 0xb6efff, body, .21, 1.9, .7);
  mesh(box(.29, .07, .03), 0x7fd7f1, body, -.21, 2.1, .62).rotation.z = .2;
  mesh(new THREE.TorusGeometry(.61, .065, 6, 16), 0xf1f2f8, body, 0, 1.85, .18).scale.y = .75;
  mesh(ball(.17), 0xf3f5ff, body, -.68, 1.83);
  mesh(ball(.17), 0xf3f5ff, body, .68, 1.83);
  const armL = mesh(new THREE.CapsuleGeometry(.16, .45, 3, 6), color, body, -.65, 1.04, .06);
  const armR = mesh(new THREE.CapsuleGeometry(.16, .45, 3, 6), color, body, .65, 1.04, .16);
  armL.rotation.z = -.2; armR.rotation.z = -.5;
  const tool = new THREE.Group(); tool.position.set(.8, .9, .48); body.add(tool);
  mesh(new THREE.CylinderGeometry(.15, .18, .65, 8), 0xe3e8f3, tool).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.26, .14, .25, 8), color, tool, 0, 0, .4).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.2, .2, .05, 8), 0x2c4052, tool, 0, 0, .55).rotation.x = Math.PI / 2;
  if (role === 'guardian') {
    const shield = mesh(new THREE.CylinderGeometry(.52, .52, .13, 6), BLUE, body, -.81, 1, .24);
    shield.rotation.x = Math.PI / 2;
    mesh(box(.13, .45, .07), 0xf4fbff, body, -.81, 1, .34);
    mesh(box(.36, .13, .07), 0xf4fbff, body, -.81, 1, .35);
  } else if (role === 'blaster') {
    mesh(new THREE.CylinderGeometry(.28, .3, .8, 8), 0x41435c, body, .7, 1.1, .45).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(.32, .32, .17, 8), 0xffae5c, body, .7, 1.1, .9).rotation.x = Math.PI / 2;
    mesh(box(.2, .25, .2), 0xffc670, body, 0, 2.52);
  } else {
    mesh(new THREE.ConeGeometry(.23, .4, 6), LIME, body, 0, 2.55).rotation.z = -.3;
    mesh(box(.5, .08, .07), 0x315447, body, 0, 1.03, .57);
  }
  const baseRing = ring(root, player ? 1 : .75, teamColor, player ? .1 : .045);
  if (player) {
    const marker = mesh(new THREE.ConeGeometry(.17, .32, 3), LIME, root, 0, 3.45);
    marker.rotation.z = Math.PI; marker.castShadow = false;
  }
  root.userData = { body, bootL, bootR, armL, armR, tool, baseRing };
  return root;
}

function createTrash(kind: number, natural: boolean) {
  const group = new THREE.Group();
  const accent = natural ? [0xffc96a, 0x9be2d6, 0xb2acd7, 0xd7dbe6][kind] : 0xff8fa3;
  if (kind === 0) {
    mesh(box(.55, .16, .38), accent, group, 0, .21).rotation.z = .25;
    mesh(box(.18, .48, .2), 0x848eab, group, .12, .3).rotation.z = -.35;
  } else if (kind === 1) {
    mesh(new THREE.CylinderGeometry(.23, .23, .55, 8), 0x445571, group, 0, .3).rotation.z = .55;
    mesh(new THREE.CylinderGeometry(.24, .24, .18, 8), accent, group, -.1, .47).rotation.z = .55;
  } else if (kind === 2) {
    const part = mesh(new THREE.TorusGeometry(.27, .1, 5, 8, Math.PI * 1.5), accent, group, 0, .26); part.rotation.x = Math.PI / 2.4;
    mesh(box(.35, .15, .33), 0x777797, group, .23, .22);
  } else {
    mesh(box(.28, .35, .3), accent, group, 0, .25);
    mesh(box(.85, .08, .34), 0x65749c, group, 0, .35).rotation.z = .2;
    for (const x of [-.3, .3]) mesh(box(.05, .025, .32), 0xa8c4f1, group, x, .42);
  }
  return group;
}

interface Particle { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }
interface Pulse { mesh: THREE.Mesh; life: number; maxLife: number; size: number }
export class GameView {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-28, 28, 20, -20, .1, 200);
  private actorMeshes = new Map<number, THREE.Group>();
  private trashMeshes = new Map<number, THREE.Group>();
  private shotMeshes = new Map<number, THREE.Group>();
  private shieldMeshes = new Map<number, THREE.Group>();
  private labels = new Map<number, HTMLDivElement>();
  private particles: Particle[] = [];
  private pulses: Pulse[] = [];
  private aim = new THREE.Group();
  private selection = new THREE.Group();
  private beam: THREE.Mesh;
  private stars: THREE.Points;
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private home = true;
  private width = 1;
  private height = 1;
  private labelRoot: HTMLElement;

  constructor(container: HTMLElement, labelRoot: HTMLElement) {
    this.labelRoot = labelRoot;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.25;
    container.append(this.renderer.domElement);
    this.camera.position.set(9, 30, 36); this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.HemisphereLight(0xd9eaff, 0x77718f, 2.4));
    const key = new THREE.DirectionalLight(0xfff0da, 3.3); key.position.set(-10, 25, 8); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -23; key.shadow.camera.right = 23;
    key.shadow.camera.top = 23; key.shadow.camera.bottom = -23; key.shadow.normalBias = .06;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x89b4ff, 1.3); rim.position.set(8, 7, -15); this.scene.add(rim);
    this.buildArena();
    const starPositions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      starPositions[i * 3] = (Math.random() - .5) * 170;
      starPositions[i * 3 + 1] = (Math.random() - .5) * 80 - 10;
      starPositions[i * 3 + 2] = (Math.random() - .5) * 120 - 30;
    }
    this.stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(starPositions, 3)), new THREE.PointsMaterial({ color: 0xb9caff, size: .075, transparent: true, opacity: .75 }));
    this.scene.add(this.stars);
    const planet = mesh(new THREE.IcosahedronGeometry(5, 2), 0x6a618f, this.scene, 29, -7, -27); planet.rotation.z = .3;
    const belt = new THREE.Mesh(new THREE.TorusGeometry(7.4, .65, 3, 64), mat(0xa6a0c7));
    belt.position.copy(planet.position); belt.rotation.set(1.2, .3, -.4); this.scene.add(belt);
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.4;
      const rock = mesh(new THREE.IcosahedronGeometry(.35 + Math.random() * .6, 0), 0x45445e, this.scene, Math.cos(angle) * (22 + i), -3 - i % 4, Math.sin(angle) * (17 + i));
      rock.rotation.set(i, i * 2, i);
    }
    ring(this.aim, 1.1, 0xffc770, .08);
    ring(this.aim, .28, 0xffc770, .05);
    for (let i = 0; i < 4; i++) {
      const mark = mesh(box(.32, .03, .07), 0xffdb9b, this.aim, Math.cos(i * Math.PI / 2) * 1.25, .07, Math.sin(i * Math.PI / 2) * 1.25);
      mark.rotation.y = -i * Math.PI / 2;
    }
    this.scene.add(this.aim); this.aim.visible = false;
    ring(this.selection, .7, LIME, .09); this.scene.add(this.selection); this.selection.visible = false;
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(.06, .25, 1, 8), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: .55 }));
    this.scene.add(this.beam); this.beam.visible = false;
    window.addEventListener('resize', () => this.resize()); this.resize();
  }

  private buildArena() {
    const base = new THREE.Group(); this.scene.add(base);
    roundedPlatform(32, 20, .9, 0x393d5d, base).position.y = -1.35;
    roundedPlatform(31.8, 19.8, .12, 0x8c9ab0, base).position.y = -.3;
    for (const team of ['blue', 'red'] as const) {
      const floor = mesh(box(15.25, .14, 18.75), team === 'blue' ? 0x9abdc5 : 0xc3aab8, base, side(team) * 7.9, -.1);
      floor.receiveShadow = true;
      const color = team === 'blue' ? BLUE : RED;
      for (let x = 1.7; x < 15; x += 2.7) mesh(box(.025, .015, 18.3), team === 'blue' ? 0x87adb9 : 0xb598ab, base, side(team) * x, .003);
      for (let z = -8; z <= 8; z += 2.7) mesh(box(15, .015, .025), team === 'blue' ? 0x87adb9 : 0xb598ab, base, side(team) * 7.9, .003, z);
      for (const z of [-9.5, 9.5]) {
        mesh(box(15, .3, .25), 0x444b69, base, side(team) * 8, .1, z);
        mesh(box(14.5, .06, .12), color, base, side(team) * 8, .28, z);
      }
      mesh(box(.28, .3, 19), 0x444b69, base, side(team) * 15.6, .1);
      mesh(box(.08, .05, 18), color, base, side(team) * 15.6, .28);
      for (const z of [-9, 9]) {
        const tower = new THREE.Group(); tower.position.set(side(team) * 15, 0, z); base.add(tower);
        mesh(new THREE.CylinderGeometry(.42, .6, 1.3, 8), 0x535d7c, tower, 0, .5);
        mesh(new THREE.CylinderGeometry(.33, .33, .25, 8), color, tower, 0, 1.2);
        mesh(ball(.17), 0xf0fbff, tower, 0, 1.45);
      }
      const pad = new THREE.Group(); pad.position.set(side(team) * 12.5, .02, 0); base.add(pad);
      ring(pad, 1.9, color, .08); ring(pad, 1.6, color, .025);
      const emblem = mesh(new THREE.CircleGeometry(.65, 3), color, pad, 0, .01); emblem.rotation.x = -Math.PI / 2; emblem.rotation.z = team === 'blue' ? -Math.PI / 2 : Math.PI / 2;
      for (let i = 0; i < 5; i++) mesh(box(.65, .09, .12), color, base, side(team) * 10, -.7, -6 + i * 3);
    }
    mesh(box(.5, .08, 18.8), 0x555974, base, 0, .01);
    for (let z = -8.5; z < 9; z += 1.25) mesh(box(.1, .04, .65), 0xf7e2aa, base, 0, .07, z);
    for (const z of [-9.4, 9.4]) {
      mesh(new THREE.CylinderGeometry(.28, .4, .6, 8), 0x373f5b, base, 0, .3, z);
      mesh(ball(.25), 0xffdc8d, base, 0, .7, z);
    }
    for (const x of [-12, -6, 6, 12]) {
      const engine = mesh(new THREE.CylinderGeometry(.7, .45, .8, 8), 0x28344e, base, x, -1.6, 4);
      const glow = mesh(new THREE.ConeGeometry(.37, 1.2, 8), 0x88d9f4, base, x, -2.5, 4); glow.rotation.z = Math.PI;
      engine.castShadow = false; glow.castShadow = false;
    }
  }

  setMode(home: boolean) { this.home = home; this.resize(); }
  resize() {
    this.width = window.innerWidth; this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    const aspect = this.width / this.height;
    const halfH = this.home ? Math.max(17, 28 / aspect) : Math.max(15.2, 24.5 / aspect);
    const offset = this.home ? -aspect * halfH * .22 : 0;
    this.camera.left = -halfH * aspect + offset; this.camera.right = halfH * aspect + offset;
    this.camera.top = halfH + 1.4; this.camera.bottom = -halfH + 1.4; this.camera.updateProjectionMatrix();
  }
  reset() {
    for (const map of [this.actorMeshes, this.trashMeshes, this.shotMeshes, this.shieldMeshes]) {
      map.forEach(m => this.dispose(m)); map.clear();
    }
    this.labels.forEach(l => l.remove()); this.labels.clear();
    this.particles.forEach(p => this.dispose(p.mesh)); this.particles = [];
    this.pulses.forEach(p => this.dispose(p.mesh)); this.pulses = [];
  }
  private dispose(root: THREE.Object3D) {
    root.removeFromParent();
    root.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); if (!Array.from(materials.values()).includes(obj.material)) obj.material.dispose(); } });
  }
  project(point: { x: number; z: number }, y = 0) {
    const v = new THREE.Vector3(point.x, y, point.z).project(this.camera);
    return { x: (v.x + 1) * this.width / 2, y: (-v.y + 1) * this.height / 2 };
  }
  pointer(clientX: number, clientY: number) {
    this.ray.setFromCamera(new THREE.Vector2(clientX / this.width * 2 - 1, -clientY / this.height * 2 + 1), this.camera);
    const hit = new THREE.Vector3();
    return this.ray.ray.intersectPlane(this.plane, hit) ? { x: hit.x, z: hit.z } : null;
  }
  event(e: GameEvent) {
    if (e.type === 'wave' || e.type === 'finish') return;
    const color = e.type === 'bomb' ? 0xffa25a : e.type === 'suction' || e.type === 'clean' ? LIME : e.type === 'reflect' || e.type === 'shield' ? BLUE : 0xffc96a;
    const count = e.type === 'bomb' ? 24 : e.type === 'suction' ? 20 : 8;
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.05 + Math.random() * .09, 0), new THREE.MeshBasicMaterial({ color, transparent: true }));
      m.position.set(e.x, .45, e.z); this.scene.add(m);
      const maxLife = .5 + Math.random() * .5;
      this.particles.push({ mesh: m, velocity: new THREE.Vector3((Math.random() - .5) * 5, 2 + Math.random() * 4, (Math.random() - .5) * 5), life: maxLife, maxLife });
    }
    const p = ring(this.scene, 1, color, .08); p.position.set(e.x, .07, e.z);
    const life = e.type === 'suction' ? .8 : .5;
    this.pulses.push({ mesh: p, life, maxLife: life, size: e.type === 'suction' ? 3.8 : e.type === 'bomb' ? 2.7 : 1.1 });
  }
  render(game: Game, dt: number, clock: number, aim: { x: number; z: number }, playing: boolean) {
    for (const a of game.actors) {
      let group = this.actorMeshes.get(a.id);
      if (!group) {
        group = createCharacter(a.role, a.team, a.player); this.scene.add(group); this.actorMeshes.set(a.id, group);
        const label = document.createElement('div'); label.className = `nameplate ${a.team}${a.player ? ' player' : ''}`;
        label.innerHTML = `<span>${a.player ? '◆' : '●'}</span> ${a.name}<i></i>`;
        this.labelRoot.append(label); this.labels.set(a.id, label);
      }
      group.position.set(a.x, .03, a.z);
      const { body, bootL, bootR, armL, armR, tool, baseRing } = group.userData;
      body.rotation.y = THREE.MathUtils.lerp(body.rotation.y, a.facing, .18);
      body.position.y = a.moving ? Math.abs(Math.sin(clock * 13 + a.id)) * .1 : Math.sin(clock * 2.5 + a.id) * .035;
      bootL.rotation.x = a.moving ? Math.sin(clock * 13) * .55 : 0;
      bootR.rotation.x = -bootL.rotation.x;
      armL.rotation.x = a.moving ? -bootL.rotation.x * .6 : 0;
      armR.rotation.x = a.target !== null ? -.5 + Math.sin(clock * 24) * .12 : -.12;
      tool.rotation.x = a.target !== null ? Math.sin(clock * 24) * .13 : 0;
      baseRing.material.opacity = a.player ? .8 + Math.sin(clock * 4) * .2 : .45;
      const pos = this.project(a, 3.1), label = this.labels.get(a.id)!;
      label.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -100%)`;
      label.style.opacity = this.home ? '0' : '1';
      label.classList.toggle('cleaning', a.target !== null);
      label.style.setProperty('--progress', `${Math.min(100, a.cleaning * 100)}%`);
    }
    const trashIds = new Set(game.trash.map(t => t.id));
    for (const [id, m] of this.trashMeshes) if (!trashIds.has(id)) { this.dispose(m); this.trashMeshes.delete(id); }
    for (const t of game.trash) {
      let m = this.trashMeshes.get(t.id);
      if (!m) { m = createTrash(t.kind, t.natural); m.rotation.y = t.id * 2.4; this.scene.add(m); this.trashMeshes.set(t.id, m); }
      m.position.set(t.x, .06 + Math.sin(clock * 2 + t.id) * .025, t.z);
      m.rotation.z = t.claimed !== null ? Math.sin(clock * 30) * .08 : 0;
    }
    const shotIds = new Set(game.shots.map(s => s.id));
    for (const [id, m] of this.shotMeshes) if (!shotIds.has(id)) { this.dispose(m); this.shotMeshes.delete(id); }
    for (const s of game.shots) {
      let m = this.shotMeshes.get(s.id);
      if (!m) {
        m = new THREE.Group();
        mesh(new THREE.IcosahedronGeometry(s.bomb ? .45 : .25, 1), s.bomb ? 0xffa252 : 0xe4c084, m);
        const halo = mesh(new THREE.TorusGeometry(s.bomb ? .6 : .35, .045, 4, 12), s.reflected ? BLUE : 0xffe1ac, m); halo.rotation.x = .5;
        this.scene.add(m); this.shotMeshes.set(s.id, m);
      }
      const t = Math.min(1, (game.time - s.start) / s.duration);
      m.position.set(THREE.MathUtils.lerp(s.from.x, s.to.x, t), 1.2 * (1 - t) + Math.sin(t * Math.PI) * 6, THREE.MathUtils.lerp(s.from.z, s.to.z, t));
      m.rotation.set(clock * 5, clock * 4, 0);
    }
    const shieldIds = new Set(game.shields.map(s => s.id));
    for (const [id, m] of this.shieldMeshes) if (!shieldIds.has(id)) { this.dispose(m); this.shieldMeshes.delete(id); }
    for (const s of game.shields) {
      let m = this.shieldMeshes.get(s.id);
      if (!m) {
        m = new THREE.Group();
        const panel = new THREE.Mesh(box(.1, 3.1, 9), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false }));
        panel.position.y = 1.6; m.add(panel);
        for (let z = -4.5; z <= 4.5; z += .75) mesh(box(.12, 3.2, .035), BLUE, m, 0, 1.6, z);
        mesh(box(.12, .07, 9), 0xb1efff, m, 0, 3.2);
        mesh(box(.12, .07, 9), 0xb1efff, m, 0, .04);
        this.scene.add(m); this.shieldMeshes.set(s.id, m);
      }
      m.position.set(side(s.team) * .32, 0, s.z);
      m.scale.y = Math.min(1, (s.until - game.time) * 3);
    }
    this.aim.visible = playing;
    const boundAim = game.bound('red', { x: Math.abs(aim.x), z: aim.z });
    this.aim.position.set(boundAim.x, .01, boundAim.z);
    this.aim.rotation.y = Math.sin(clock) * .1;
    const nearest = game.nearest(game.player, 1.7);
    this.selection.visible = playing && !!nearest;
    if (nearest) this.selection.position.set(nearest.x, .03, nearest.z);
    this.beam.visible = playing && game.player.target !== null;
    if (this.beam.visible) {
      const t = game.trash.find(t => t.id === game.player.target);
      if (t) {
        const from = new THREE.Vector3(game.player.x, 1.05, game.player.z), to = new THREE.Vector3(t.x, .3, t.z);
        const dir = to.clone().sub(from); this.beam.position.copy(from.add(to).multiplyScalar(.5));
        this.beam.scale.y = dir.length(); this.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      }
    }
    for (const p of [...this.particles]) {
      p.life -= dt; p.mesh.position.addScaledVector(p.velocity, dt); p.velocity.y -= dt * 6;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) { this.dispose(p.mesh); this.particles.splice(this.particles.indexOf(p), 1); }
    }
    for (const p of [...this.pulses]) {
      p.life -= dt; const t = 1 - p.life / p.maxLife;
      p.mesh.scale.setScalar(p.size * t + .1); (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t);
      if (p.life <= 0) { this.dispose(p.mesh); this.pulses.splice(this.pulses.indexOf(p), 1); }
    }
    this.stars.rotation.y = clock * .003;
    this.renderer.render(this.scene, this.camera);
  }
  renderPortraits(container: HTMLElement) {
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x56516c, 3));
    const light = new THREE.DirectionalLight(0xffeacb, 4); light.position.set(-2, 5, 5); scene.add(light);
    const camera = new THREE.OrthographicCamera(-1.8, 1.8, 1.9, -1.9, .1, 50); camera.position.set(3, 3, 7); camera.lookAt(0, 1.4, 0);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); renderer.setSize(280, 260); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.toneMapping = THREE.ACESFilmicToneMapping;
    for (const role of ['guardian', 'blaster', 'cleaner'] as Role[]) {
      const group = createCharacter(role, 'blue'); scene.add(group); group.rotation.y = -.25;
      renderer.render(scene, camera);
      const img = document.createElement('img'); img.src = renderer.domElement.toDataURL(); img.alt = `${ROLE_INFO[role].name} 3D 캐릭터`;
      container.querySelector(`[data-role="${role}"] .portrait`)!.append(img);
      scene.remove(group); this.dispose(group);
    }
    renderer.dispose();
  }
  movement(x: number, z: number) {
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    return { x: right.x * x - right.z * z, z: right.z * x + right.x * z };
  }
}
