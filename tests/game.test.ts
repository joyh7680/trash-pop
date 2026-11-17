import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, ROLES, ROLE_INFO, side, type Role } from '../src/game.ts';

function random(seed = 42) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function solo(role: Role = 'cleaner') {
  const g = new Game(role, random()); g.actors.forEach(a => { a.player = true; }); return g;
}
function advance(g: Game, seconds: number) {
  for (let t = 0; t < seconds - .000001; t += .05) g.update(Math.min(.05, seconds - t));
}

test('six actors, one player, three distinct roles per team and mirrored starting trash', () => {
  for (const role of ROLES) {
    const g = new Game(role, random());
    assert.equal(g.actors.length, 6); assert.equal(g.actors.filter(a => a.player).length, 1);
    assert.equal(g.player.role, role);
    for (const team of ['blue', 'red'] as const) {
      assert.deepEqual(g.actors.filter(a => a.team === team).map(a => a.role).sort(), [...ROLES].sort());
      assert.equal(g.trash.filter(t => t.team === team).length, 30); assert.equal(g.purity(team), 0);
    }
    const blue = g.trash.filter(t => t.team === 'blue'), red = g.trash.filter(t => t.team === 'red');
    blue.forEach((t, i) => { assert.equal(t.x, -red[i].x); assert.equal(t.z, red[i].z); assert.equal(t.kind, red[i].kind); });
  }
});
test('movement is normalized, bounded to team sector and stops at match end', () => {
  const g = solo(), p = g.player; p.x = -8; p.z = 0;
  g.move(p, 1, 1, .1); assert.ok(Math.abs(Math.hypot(p.x + 8, p.z) - .72) < 1e-9);
  g.move(p, 1, 0, 10); assert.equal(p.x, -.75);
  g.move(p, -1, -1, 100); assert.equal(p.x, -14.2); assert.equal(p.z, -8.2);
  const red = g.actors[3]; g.move(red, -1, 0, 100); assert.equal(red.x, .75);
  g.finished = true; g.move(p, 1, 0, 1); assert.equal(p.x, -14.2);
});
test('cleaning takes one second and raises purity', () => {
  const g = solo(), p = g.player;
  for (let i = 0; i < 3; i++) {
    const t = g.trash.find(t => t.team === 'blue')!; p.x = t.x; p.z = t.z;
    assert.equal(g.clean(p), null); advance(g, .95); assert.ok(g.trash.includes(t)); advance(g, .1); assert.ok(!g.trash.includes(t));
  }
  assert.equal(p.cleaned, 3);
  assert.ok(Math.abs(g.purity('blue') - 10) < .0001);
});
test('moving cancels cleaning and releases the claim', () => {
  const g = solo(), p = g.player, t = g.trash.find(t => t.team === 'blue')!;
  Object.assign(p, { x: t.x, z: t.z }); g.clean(p); advance(g, .5); g.move(p, 1, 0, .1);
  assert.equal(p.target, null); assert.equal(t.claimed, null); advance(g, 1); assert.ok(g.trash.includes(t));
});
test('two teammates cannot claim or absorb the same trash', () => {
  const g = solo(), p = g.player, friend = g.actors[1]; g.trash = [];
  const t = g.addTrash('blue', p, true); Object.assign(friend, { x: p.x, z: p.z, role: 'cleaner' });
  assert.equal(g.clean(p), null); assert.ok(g.clean(friend)); assert.ok(g.skill(friend, { x: 5, z: 0 }));
  assert.equal(t.claimed, p.id); advance(g, 1.05); assert.equal(p.cleaned, 1); assert.equal(friend.cleaned, 0);
});
test('opponent debris can be cleaned and raises purity', () => {
  const g = solo(), p = g.player; g.trash = [];
  for (let i = 0; i < 3; i++) g.addTrash('blue', p, false);
  assert.equal(g.skill(p, { x: 5, z: 0 }), null); assert.equal(p.cleaned, 3); assert.equal(g.purity('blue'), 100);
});
test('all characters can throw repeatedly without resources or cooldown but must be near the boundary', () => {
  for (const role of ROLES) {
    const g = solo(role);
    for (const a of g.actors) {
      assert.ok(g.throw(a, { x: 8, z: 0 })); assert.equal(a.throws, 0);
      a.x = side(a.team) * 2;
      for (let i = 0; i < 10; i++) assert.equal(g.throw(a, { x: 100, z: 100 }), null);
      assert.equal(a.throws, 10);
      a.x = side(a.team) * 8;
      assert.ok(g.throw(a, { x: 8, z: 0 })); assert.equal(a.throws, 10);
    }
    assert.equal(g.time, 0); assert.equal(g.shots.length, 60);
    for (const shot of g.shots) { assert.equal(Math.abs(shot.to.x), 14.2); assert.equal(shot.to.z, 8.2); }
    advance(g, 1.1);
    for (const team of ['blue', 'red'] as const) assert.equal(g.trash.filter(t => t.team === team).length, 60);
  }
});
test('bomb is free, creates five scraps and respects cooldown', () => {
  const g = solo('blaster'), p = g.player;
  assert.equal(g.skill(p, { x: 8, z: 0 }), null);
  assert.equal(p.skillReady, 15); assert.ok(g.skill(p, { x: 8, z: 0 })); assert.equal(g.shots.length, 1);
  advance(g, 1.3);
  assert.equal(g.trash.filter(t => t.team === 'red').length, 35); assert.equal(g.trash.filter(t => !t.natural).length, 5);
  advance(g, 13.75); assert.equal(g.skill(p, { x: 8, z: 0 }), null);
});
test('every character can use its skill immediately when its position and targets are valid', () => {
  for (const role of ROLES) {
    const g = solo(role), p = g.player; p.x = -2; p.z = 0; g.trash = [];
    g.addTrash('blue', p, false);
    assert.equal(g.skill(p, { x: 8, z: 0 }), null);
    assert.equal(p.skillReady, ROLE_INFO[role].cooldown);
  }
});
test('blaster AI fires its bomb immediately', () => {
  const g = solo(), ai = g.actors.find(a => a.team === 'red' && a.role === 'blaster')!;
  ai.player = false;
  g.update(.05);
  assert.ok(g.shots.some(s => s.actor === ai.id && s.bomb));
  assert.equal(ai.skillReady, 15.05);
});
test('AI can throw repeatedly without waiting and still chooses cleaning between attacks', () => {
  const g = solo(), ai = g.actors[1]; ai.player = false; ai.x = -2; ai.z = 0; ai.aiAttack = true;
  g.addTrash('blue', ai, true);
  g.update(.05); assert.equal(ai.throws, 1); assert.notEqual(ai.target, null);
  assert.equal(g.throw(ai, { x: 8, z: 0 }), null); assert.equal(ai.throws, 2);
});
test('guardian shield reflects basic debris and bombs and expires after five seconds', () => {
  for (const bomb of [false, true]) {
    const g = solo('guardian'), p = g.player, enemy = g.actors[4];
    p.x = -2; p.z = 0; enemy.x = 2; enemy.z = 0; enemy.role = 'blaster';
    assert.equal(g.skill(p, { x: 8, z: 0 }), null); assert.equal(p.skillReady, 15);
    if (bomb) g.skill(enemy, { x: -8, z: 0 }); else g.throw(enemy, { x: -8, z: 0 });
    advance(g, 2); assert.equal(g.trash.filter(t => t.team === 'blue').length, 30);
    assert.equal(g.trash.filter(t => t.team === 'red').length, bomb ? 35 : 31);
    assert.ok(g.events.some(e => e.type === 'reflect')); advance(g, 3.1); assert.equal(g.shields.length, 0);
  }
});
test('shield covers a local boundary segment rather than the entire map', () => {
  const g = solo('guardian'), p = g.player, enemy = g.actors[3]; p.x = -2; p.z = -4; enemy.x = 2; enemy.z = 8;
  g.skill(p, { x: 8, z: 0 }); g.throw(enemy, { x: -8, z: 8 }); advance(g, 1.1);
  assert.equal(g.trash.filter(t => t.team === 'blue').length, 31); assert.ok(!g.events.some(e => e.type === 'reflect'));
});
test('cleaner removes at most three nearby scraps and cannot ignore an eight-second cooldown', () => {
  const g = solo(), p = g.player; g.trash = [];
  for (let i = 0; i < 5; i++) g.addTrash('blue', { x: p.x + i * .1, z: p.z }, true);
  g.addTrash('blue', { x: -1, z: 8 }, true);
  assert.equal(g.skill(p, { x: 8, z: 0 }), null); assert.equal(p.cleaned, 3); assert.equal(g.trash.length, 3);
  assert.equal(p.skillReady, 8); assert.ok(g.skill(p, { x: 8, z: 0 })); assert.equal(g.trash.length, 3);
});
test('purity stays between zero and one hundred and decreases with extra debris', () => {
  const g = solo(); g.trash = []; assert.equal(g.purity('blue'), 100);
  g.addTrash('blue', { x: -5, z: 0 }, false); assert.ok(g.purity('blue') < 100);
  for (let i = 0; i < 40; i++) g.addTrash('blue', { x: -5, z: 0 }, false); assert.equal(g.purity('blue'), 0);
});
test('incoming waves contain equal mirrored natural debris for both teams', () => {
  const g = solo(); advance(g, 16.1);
  const blue = g.trash.filter(t => t.team === 'blue').slice(30), red = g.trash.filter(t => t.team === 'red').slice(30);
  assert.equal(blue.length, 12); assert.equal(red.length, 12);
  blue.forEach((t, i) => { assert.equal(t.x, -red[i].x); assert.equal(t.z, red[i].z); assert.equal(t.kind, red[i].kind); assert.ok(t.natural); });
});
test('match ends at exactly 180 seconds, freezes actions and chooses purity winner', () => {
  const g = solo(); g.nextWave = 180; g.trash = g.trash.filter(t => t.team === 'red'); advance(g, 181);
  assert.equal(g.time, 180); assert.ok(g.finished); assert.equal(g.winner, 'blue');
  const before = [g.trash.length, g.shots.length, g.player.throws];
  g.throw(g.player, { x: 8, z: 0 }); g.skill(g.player, { x: 8, z: 0 }); g.clean(g.player); g.update(1);
  assert.deepEqual([g.trash.length, g.shots.length, g.player.throws], before);
  const tie = solo(); advance(tie, 180); assert.equal(tie.winner, 'draw');
});
test('restarting constructs a clean match for every character', () => {
  for (const role of ROLES) {
    const g = new Game(role); assert.equal(g.time, 0); assert.equal(g.trash.length, 60);
    assert.equal(g.player.cleaned, 0); assert.equal(g.player.throws, 0); assert.equal(g.player.skillReady, 0); assert.equal(g.finished, false);
  }
});
test('five AIs clean, attack and use all three skills during complete matches', () => {
  for (const role of ROLES) {
    const g = new Game(role, random());
    const usedSkills = new Set<Role>(); let shots = 0;
    const readyTimes = new Map<number, number>();
    for (let i = 0; i < 3601; i++) {
      g.update(.05);
      for (const a of g.actors) {
        assert.ok(side(a.team) * a.x >= .75 && Math.abs(a.x) <= 14.2 && Math.abs(a.z) <= 8.2);
        assert.ok(a.skillReady <= g.time + ROLE_INFO[a.role].cooldown + .001);
        const previous = readyTimes.get(a.id) ?? 0;
        if (a.skillReady > previous) {
          assert.ok(g.time + .001 >= previous, `${a.name} must wait for its skill cooldown`);
          readyTimes.set(a.id, a.skillReady);
        }
        if (a.skillReady > 0) usedSkills.add(a.role);
      }
      shots = Math.max(shots, g.actors.reduce((sum, a) => sum + a.throws, 0)); g.events = [];
    }
    assert.ok(g.finished); assert.ok(shots > 0);
    assert.deepEqual([...usedSkills].sort(), [...ROLES].sort());
    for (const ai of g.actors.filter(a => !a.player)) assert.ok(ai.cleaned > 0, `${role}: ${ai.name} should clean`);
  }
});

test('active player cleaning changes a complete match compared with standing idle', () => {
  const idle = new Game('cleaner', random()), active = new Game('cleaner', random());
  for (let i = 0; i < 3601; i++) {
    const p = active.player, t = active.nearest(p);
    if (t && p.target === null) {
      if (Math.hypot(t.x - p.x, t.z - p.z) > 1.2) active.move(p, t.x - p.x, t.z - p.z, .05);
      else active.clean(p);
    }
    active.skill(p, { x: 8, z: 0 }); active.update(.05); idle.update(.05);
    active.events = []; idle.events = [];
  }
  assert.ok(active.player.cleaned >= 30);
  assert.ok(active.purity('blue') > idle.purity('blue'));
});
