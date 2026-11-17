export type Team = 'blue' | 'red';
export type Role = 'guardian' | 'blaster' | 'cleaner';
export type Point = { x: number; z: number };
export const ROLES: Role[] = ['guardian', 'blaster', 'cleaner'];
export const ROLE_INFO = {
  guardian: { name: '가디언', role: '방어형', skill: '쓰레기 반사막', cooldown: 15, color: '#70caff', description: '5초 동안 날아오는 쓰레기를 반사해요.', hint: '경계선 근처에서 사용 · 5초 지속' },
  blaster: { name: '블래스터', role: '공격형', skill: '오염 폭탄', cooldown: 15, color: '#ffb15c', description: '오염 폭탄으로 상대 구역에 쓰레기 5개!', hint: '투척 자원 2개 소비 · 마우스로 조준' },
  cleaner: { name: '클리너', role: '정화형', skill: '강력 흡입', cooldown: 8, color: '#b6f879', description: '주변 쓰레기 3개를 한 번에 정화해요.', hint: '주변 최대 3개 제거 · 자원 획득 가능' },
};
export interface Actor extends Point {
  id: number; team: Team; role: Role; player: boolean; name: string;
  resources: number; recycled: number; cleaned: number; throws: number;
  skillReady: number; throwReady: number; target: number | null; cleaning: number;
  moving: boolean; facing: number; aiAttack: boolean;
}
export interface Trash extends Point { id: number; team: Team; natural: boolean; kind: number; claimed: number | null }
export interface Shot { id: number; actor: number; team: Team; targetTeam: Team; from: Point; to: Point; start: number; duration: number; bomb: boolean; crossed: boolean; reflected: boolean }
export interface Shield { id: number; team: Team; z: number; until: number }
export interface GameEvent extends Point { type: 'clean' | 'throw' | 'bomb' | 'shield' | 'suction' | 'reflect' | 'wave' | 'finish'; team: Team; amount?: number }
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export const other = (team: Team): Team => team === 'blue' ? 'red' : 'blue';
export const side = (team: Team) => team === 'blue' ? -1 : 1;

export class Game {
  actors: Actor[] = [];
  trash: Trash[] = [];
  shots: Shot[] = [];
  shields: Shield[] = [];
  events: GameEvent[] = [];
  time = 0;
  duration = 180;
  finished = false;
  nextWave = 16;
  private id = 0;
  private random: () => number;

  constructor(role: Role = 'cleaner', random = Math.random) {
    this.random = random;
    const blueRoles = [role, ...ROLES.filter(r => r !== role)];
    for (const team of ['blue', 'red'] as Team[]) {
      (team === 'blue' ? blueRoles : ROLES).forEach((r, i) => {
        this.actors.push({ id: this.id++, team, role: r, player: team === 'blue' && i === 0,
          name: team === 'blue' && i === 0 ? '나' : `${team === 'blue' ? '블루' : '레드'} ${ROLE_INFO[r].name}`,
          x: side(team) * (i === 0 ? 8 : 11), z: (i - 1) * 4,
          resources: 1, recycled: 0, cleaned: 0, throws: 0, skillReady: 0, throwReady: 0,
          target: null, cleaning: 0, moving: false, facing: 0, aiAttack: false });
      });
    }
    // Mirrored placement keeps both teams' starting travel distances identical.
    for (let i = 0; i < 30; i++) {
      const p = { x: 2 + (i % 6) * 2.1 + random() * .9, z: -7.5 + Math.floor(i / 6) * 3.3 + random() * .8 };
      this.addTrash('blue', { x: -p.x, z: p.z }, true, i % 4);
      this.addTrash('red', p, true, i % 4);
    }
  }

  get player() { return this.actors[0]; }
  purity(team: Team) { return clamp(100 * (1 - this.trash.filter(t => t.team === team).length / 30), 0, 100); }
  get winner(): Team | 'draw' {
    const diff = this.purity('blue') - this.purity('red');
    return Math.abs(diff) < .001 ? 'draw' : diff > 0 ? 'blue' : 'red';
  }
  bound(team: Team, p: Point): Point {
    return { x: team === 'blue' ? clamp(p.x, -14.2, -.75) : clamp(p.x, .75, 14.2), z: clamp(p.z, -8.2, 8.2) };
  }
  addTrash(team: Team, p: Point, natural: boolean, kind = Math.floor(this.random() * 4)) {
    const t: Trash = { id: this.id++, team, ...this.bound(team, p), natural, kind, claimed: null };
    this.trash.push(t);
    return t;
  }
  move(a: Actor, x: number, z: number, dt: number) {
    if (this.finished) return;
    const length = Math.hypot(x, z);
    a.moving = length > .01;
    if (!a.moving) return;
    this.cancelClean(a);
    const speed = a.player ? 7.2 : 3.8;
    const next = this.bound(a.team, { x: a.x + x / length * speed * dt, z: a.z + z / length * speed * dt });
    a.x = next.x; a.z = next.z; a.facing = Math.atan2(x, z);
  }
  cancelClean(a: Actor) {
    const t = this.trash.find(t => t.id === a.target);
    if (t?.claimed === a.id) t.claimed = null;
    a.target = null; a.cleaning = 0;
  }
  nearest(a: Actor, radius = Infinity) {
    return this.trash.filter(t => t.team === a.team && (t.claimed === null || t.claimed === a.id) && distance(t, a) <= radius)
      .sort((a1, b) => distance(a1, a) - distance(b, a))[0];
  }
  clean(a: Actor): string | null {
    if (this.finished || a.target !== null) return null;
    const t = this.nearest(a, 1.7);
    if (!t) return '쓰레기에 조금 더 가까이 가세요.';
    t.claimed = a.id; a.target = t.id; a.cleaning = 0; a.moving = false;
    return null;
  }
  private removeTrash(a: Actor, t: Trash) {
    this.trash = this.trash.filter(item => item.id !== t.id);
    a.cleaned++;
    if (t.natural) {
      a.recycled++;
      if (a.recycled >= 3) { a.resources = Math.min(5, a.resources + 1); a.recycled = 0; }
    }
    this.events.push({ type: 'clean', x: t.x, z: t.z, team: a.team });
  }
  throw(a: Actor, aim: Point): string | null {
    if (this.finished) return null;
    if (this.time < a.throwReady) return '투척을 준비하고 있어요.';
    if (a.resources < 1) return '기본 쓰레기 3개를 청소해 자원을 모으세요.';
    if (Math.abs(a.x) > 4.2) return '가운데 경계선 근처에서 던질 수 있어요.';
    a.resources--; a.throwReady = this.time + 3;
    this.launch(a, aim, false);
    return null;
  }
  private launch(a: Actor, aim: Point, bomb: boolean) {
    this.cancelClean(a);
    const targetTeam = other(a.team);
    const to = this.bound(targetTeam, { x: side(targetTeam) * Math.abs(aim.x), z: aim.z });
    this.shots.push({ id: this.id++, actor: a.id, team: a.team, targetTeam, from: { x: a.x, z: a.z }, to,
      start: this.time, duration: bomb ? 1.2 : .95, bomb, crossed: false, reflected: false });
    a.throws++; a.facing = Math.atan2(to.x - a.x, to.z - a.z);
    this.events.push({ type: 'throw', team: a.team, x: a.x, z: a.z });
  }
  skill(a: Actor, aim: Point): string | null {
    if (this.finished) return null;
    if (this.time < a.skillReady) return '스킬을 충전하고 있어요.';
    if (a.role === 'guardian') {
      if (Math.abs(a.x) > 4.2) return '경계선 근처에서 반사막을 설치하세요.';
      this.shields.push({ id: this.id++, team: a.team, z: clamp(a.z, -4, 4), until: this.time + 5 });
      this.events.push({ type: 'shield', team: a.team, x: side(a.team) * .4, z: a.z });
    } else if (a.role === 'blaster') {
      if (a.resources < 2) return '오염 폭탄에는 투척 자원 2개가 필요해요.';
      a.resources -= 2; this.launch(a, aim, true);
    } else {
      const targets = this.trash.filter(t => t.team === a.team && distance(t, a) <= 3.8 && (t.claimed === null || t.claimed === a.id))
        .sort((t, u) => distance(t, a) - distance(u, a)).slice(0, 3);
      if (!targets.length) return '흡입할 쓰레기가 주변에 없어요.';
      this.cancelClean(a);
      targets.forEach(t => this.removeTrash(a, t));
      this.events.push({ type: 'suction', team: a.team, x: a.x, z: a.z, amount: targets.length });
    }
    a.skillReady = this.time + ROLE_INFO[a.role].cooldown;
    return null;
  }
  private ai(a: Actor, dt: number) {
    const aim = { x: -side(a.team) * (3 + this.random() * 9), z: -7 + this.random() * 14 };
    const incoming = this.shots.find(s => s.targetTeam === a.team && !s.crossed);
    if (a.role === 'guardian' && incoming && this.time >= a.skillReady) {
      if (Math.abs(a.x) > 3) { this.move(a, side(a.team) * 2 - a.x, clamp(incoming.to.z, -4, 4) - a.z, dt); return; }
      this.skill(a, aim);
    }
    if (a.role === 'cleaner' && this.trash.filter(t => t.team === a.team && distance(t, a) <= 3.8 && t.claimed === null).length >= 2) this.skill(a, aim);
    if (a.role === 'blaster' && a.resources >= 2 && this.time >= a.skillReady) { this.skill(a, aim); a.aiAttack = false; }
    const attackCost = a.role === 'blaster' && this.time < a.skillReady ? 1 : 3;
    if (a.resources >= attackCost && this.time >= a.throwReady && !a.target) a.aiAttack = true;
    if (a.aiAttack) {
      if (Math.abs(a.x) > 3.1) { this.move(a, side(a.team) * 2.6 - a.x, 0, dt); return; }
      this.throw(a, aim); a.aiAttack = false;
    }
    if (a.target !== null) { a.moving = false; return; }
    let t = this.nearest(a);
    if (a.role === 'cleaner' && t && this.time >= a.skillReady) {
      const candidates = this.trash.filter(t => t.team === a.team && t.claimed === null);
      t = candidates.reduce((best, item) => {
        const value = (p: Trash) => candidates.filter(n => distance(n, p) < 3.3).length * 2 - distance(a, p) * .15;
        return value(item) > value(best) ? item : best;
      }, t);
    }
    if (t && distance(a, t) > 1.2) this.move(a, t.x - a.x, t.z - a.z, dt);
    else if (t) this.clean(a);
    else a.moving = false;
  }
  update(dt: number) {
    if (this.finished || dt <= 0) return;
    dt = Math.min(dt, this.duration - this.time);
    this.time += dt;
    this.shields = this.shields.filter(s => s.until > this.time);
    for (const a of this.actors) {
      if (!a.player) this.ai(a, dt);
      if (a.target === null) continue;
      const t = this.trash.find(t => t.id === a.target);
      if (!t || distance(t, a) > 1.75) { this.cancelClean(a); continue; }
      a.cleaning += dt;
      if (a.cleaning >= 1) { this.removeTrash(a, t); this.cancelClean(a); }
    }
    for (const shot of [...this.shots]) {
      const t = clamp((this.time - shot.start) / shot.duration, 0, 1);
      const x = shot.from.x + (shot.to.x - shot.from.x) * t;
      if (!shot.crossed && side(shot.targetTeam) * x >= 0) {
        shot.crossed = true;
        const crossT = -shot.from.x / (shot.to.x - shot.from.x);
        const z = shot.from.z + (shot.to.z - shot.from.z) * crossT;
        const shield = this.shields.find(s => s.team === shot.targetTeam && Math.abs(s.z - z) <= 4.5);
        if (shield) {
          shot.from = { x: side(shot.targetTeam) * .1, z };
          shot.to = this.bound(other(shot.targetTeam), { x: -shot.to.x, z: shot.to.z });
          shot.team = shot.targetTeam; shot.targetTeam = other(shot.targetTeam);
          shot.start = this.time; shot.duration = .65; shot.reflected = true;
          this.events.push({ type: 'reflect', team: shield.team, x: 0, z });
          continue;
        }
      }
      if (t < 1) continue;
      const count = shot.bomb ? 5 : 1;
      for (let i = 0; i < count; i++) {
        const angle = i * Math.PI * 2 / count;
        this.addTrash(shot.targetTeam, { x: shot.to.x + (count > 1 ? Math.cos(angle) * 1.4 : 0), z: shot.to.z + (count > 1 ? Math.sin(angle) * 1.4 : 0) }, false);
      }
      this.events.push({ type: shot.bomb ? 'bomb' : 'throw', team: shot.targetTeam, ...shot.to });
      this.shots = this.shots.filter(s => s.id !== shot.id);
    }
    if (this.time >= this.nextWave && this.nextWave < this.duration) {
      for (let i = 0; i < 12; i++) {
        const p = { x: 2 + this.random() * 11, z: -7.5 + this.random() * 15 };
        this.addTrash('blue', { x: -p.x, z: p.z }, true, i % 4);
        this.addTrash('red', p, true, i % 4);
      }
      this.nextWave += 16;
      this.events.push({ type: 'wave', team: 'blue', x: 0, z: 0, amount: 12 });
    }
    if (this.time >= this.duration) {
      this.time = this.duration; this.finished = true;
      this.actors.forEach(a => { this.cancelClean(a); a.moving = false; });
      this.events.push({ type: 'finish', team: 'blue', x: 0, z: 0 });
    }
  }
}
