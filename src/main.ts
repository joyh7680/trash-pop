import './style.css';
import { Game, ROLE_INFO, ROLES, type Role, type Point } from './game.ts';
import { GameView } from './view.ts';

const icons = {
  orbit: '<svg viewBox="0 0 32 32"><path d="m8 21 8-15 2 10 7-5-10 16-1-10z" fill="currentColor"/><ellipse cx="16" cy="16" rx="15" ry="6" transform="rotate(-32 16 16)" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>',
  shield: '<svg viewBox="0 0 32 32"><path d="m16 4 10 4v9c0 6-10 11-10 11S6 23 6 17V8z"/><path d="M16 10v11m-5-6h10"/></svg>',
  bomb: '<svg viewBox="0 0 32 32"><circle cx="15" cy="19" r="9"/><path d="m19 10 3-5 4 1m-1-4v3m3 2h3M10 16l3-2"/></svg>',
  suction: '<svg viewBox="0 0 32 32"><path d="M5 11c16-12 28 6 17 14-8 6-19-2-15-9 3-6 13-5 14 1 1 4-5 7-7 3"/><path d="m2 4 4 1-1 4m21 17 4 1-1 4"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="m11 5-5 4H3v6h3l5 4zM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24"><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>',
};
const roleIcon = (role: Role) => icons[role === 'guardian' ? 'shield' : role === 'blaster' ? 'bomb' : 'suction'];
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

$('#app').innerHTML = `
  <main id="game-shell" class="home-mode">
    <div class="space-haze"></div><div id="viewport" aria-label="3D 우주 정화 경기장"></div><div id="labels" aria-hidden="true"></div>
    <header class="app-header">
      <a class="brand" href="#" aria-label="우주 정화 대전 시작 화면"><span class="brand-mark">${icons.orbit}</span><span>ORBIT<small>우주 정화 대전</small></span><span class="version">PROTOTYPE 01</span></a>
      <nav aria-label="게임 설정"><button id="sound" class="icon-button" aria-label="소리 끄기" title="소리 켜짐">${icons.sound}</button><button id="help" class="quiet-button"><span class="question">?</span> 플레이 가이드</button><button id="pause" class="icon-button hidden" aria-label="일시정지">${icons.pause}</button></nav>
    </header>

    <section id="home" class="home-panel">
      <div class="eyebrow"><span></span> 3 : 3 SPACE CLEANUP BATTLE</div>
      <h1>우주 <span class="title-star">✳</span><br>정화 대전<span class="title-dot">.</span></h1>
      <p class="hero-tagline">깨끗하게 치우고, 시원하게 던지세요!</p>
      <p class="hero-description">우주 쓰레기로 뒤덮인 경기장.<br>AI 동료와 힘을 합쳐 우리 구역을 지켜주세요.</p>
      <button id="start" class="primary-button start-button">게임 시작 <span>${icons.arrow}</span></button>
      <div class="play-note"><span class="live-dot"></span> 혼자서도 완벽한 팀플레이 <b>플레이어 1 + AI 5</b></div>
    </section>
    <div id="arena-caption"><span class="caption-line"></span><div><small>THE ARENA / 01</small><strong>오비트 정화 스테이션</strong><span>지구 궤도 · 408km</span></div><span class="coordinate">↗</span></div>
    <footer id="home-footer"><span>작은 청소가 만드는 커다란 승리.</span><div><span><b>3 vs 3</b> 팀 대결</span><i></i><span><b>180</b> 초의 승부</span><i></i><span class="pc-label">⌨ <b>PC</b> 키보드 + 마우스</span></div><span class="footer-number">001 — ORBIT</span></footer>

    <section id="hud" class="hidden" aria-label="경기 정보">
      <div class="scoreboard">
        <div class="team-score blue"><div class="team-heading"><span>● 블루팀 <small>우리 팀</small></span><b id="blue-score">0<small>%</small></b></div><div class="score-track"><i id="blue-bar"></i></div><p><span id="blue-trash">30</span>개 남음 <span>정화율</span></p></div>
        <div class="match-clock"><span>정화 대결</span><strong id="timer">03:00</strong><small id="match-status">3 : 3 AI MATCH</small></div>
        <div class="team-score red"><div class="team-heading"><b id="red-score">0<small>%</small></b><span><small>상대 팀</small> 레드팀 ●</span></div><div class="score-track"><i id="red-bar"></i></div><p><span>정화율</span><span><span id="red-trash">30</span>개 남음</span></p></div>
      </div>
      <div class="arena-label blue">BLUE SECTOR</div><div class="arena-label red">RED SECTOR</div>
      <div id="wave-note">다음 우주 쓰레기 유입 <b id="wave-time">16초</b></div>
      <div class="bottom-hud">
        <div class="player-card"><div id="player-portrait"></div><div><small>나 · 블루팀</small><strong id="player-name">클리너</strong><span id="clean-count">0개 정화</span></div></div>
        <div class="controls-strip"><span><span class="wasd"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span> 이동</span><i></i><span><kbd>Q</kbd> 길게 눌러 청소</span><i></i><span class="mouse-guide">⌖ 마우스로 조준</span></div>
        <div class="actions"><div class="resource-box"><div><span>투척 자원</span><small id="resource-count">1 / 5</small></div><div id="resource-pips"></div><small id="recycle-progress">기본 쓰레기 0 / 3</small></div><button id="throw-action" class="action-button" title="E: 경계선 근처에서 쓰레기 투척"><kbd>E</kbd>${icons.bomb}<span id="throw-state">투척</span></button><button id="skill-action" class="action-button skill-button" title="R: 고유 스킬"><kbd>R</kbd><span id="skill-icon">${icons.suction}</span><span id="skill-state">강력 흡입</span><i id="skill-shade"></i></button></div>
      </div>
      <div id="clean-prompt" class="hidden"><kbd>Q</kbd> <span>길게 눌러 청소</span></div>
      <div id="floating-texts" aria-hidden="true"></div>
    </section>

    <section id="selection" class="overlay hidden" aria-labelledby="selection-title">
      <div class="selection-panel"><button id="selection-back" class="back-button">← 시작 화면</button><div class="eyebrow">CHOOSE YOUR CREWMATE</div><h2 id="selection-title">어떤 대원이 되어볼까요?</h2><p class="section-description">모두 청소하고 던질 수 있어요. 나만의 스킬로 팀을 승리로 이끄세요.</p>
      <div class="character-grid">${ROLES.map((r, i) => `<button class="character-card${r === 'cleaner' ? ' selected' : ''}" data-role="${r}" aria-pressed="${r === 'cleaner'}" style="--role-color:${ROLE_INFO[r].color}"><div class="card-top"><span>0${i + 1} / ${ROLE_INFO[r].role}</span><span class="selected-tick">✓</span></div><div class="portrait"></div><div class="character-info"><h3>${ROLE_INFO[r].name}<small>${r.toUpperCase()}</small></h3><div class="skill-title">${roleIcon(r)}<b>${ROLE_INFO[r].skill}</b><span>${ROLE_INFO[r].cooldown}초</span></div><p>${ROLE_INFO[r].description}</p><small>${ROLE_INFO[r].hint}</small></div></button>`).join('')}</div>
      <div class="selection-bottom"><p><span class="live-dot"></span> 나머지 두 대원은 AI가 맡아요.</p><button id="deploy" class="primary-button">클리너로 출격 ${icons.arrow}</button></div></div>
    </section>

    <section id="guide" class="overlay hidden" aria-labelledby="guide-title"><div class="dialog guide-panel"><button id="guide-close" class="dialog-close icon-button" aria-label="가이드 닫기">${icons.close}</button><div class="eyebrow">MISSION BRIEFING</div><h2 id="guide-title">3분 동안, 우리 구역을 깨끗하게!</h2><p>경기가 끝났을 때 <b>정화율이 높은 팀</b>이 승리해요.</p><div class="guide-steps"><div><span class="step-art">⌨</span><h3><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동</h3><p>파란 구역에서 움직이세요.<br>경계선은 넘어갈 수 없어요.</p></div><div><span class="step-art lime">${icons.suction}</span><h3><kbd>Q</kbd> 길게 눌러 청소</h3><p>쓰레기 근처에서 1초간 청소!<br>기본 쓰레기 3개 → 투척 자원 1개</p></div><div><span class="step-art orange">${icons.bomb}</span><h3><kbd>E</kbd> 투척 · <kbd>R</kbd> 스킬</h3><p>마우스로 상대 구역을 조준해요.<br>투척은 경계선 가까이에서!</p></div></div><div class="guide-tip">${icons.sparkle}<p>공격보다 청소가 중요해요. 상대가 던진 쓰레기에서는 자원을 얻을 수 없어요.<br>주기적으로 양 팀에 같은 양의 쓰레기가 유입됩니다. <kbd>Esc</kbd> 일시정지</p></div><button id="guide-ready" class="primary-button">좋아요, 준비됐어요! ${icons.arrow}</button></div></section>
    <section id="pause-overlay" class="overlay hidden"><div class="dialog pause-panel"><div class="eyebrow">TAKE A BREATHER</div><h2>잠시 쉬어가요</h2><p>경기 시간도 함께 멈췄어요.</p><button id="resume" class="primary-button">경기 계속하기 ${icons.arrow}</button><button id="quit" class="text-button">캐릭터 다시 선택하기</button></div></section>
    <section id="result" class="overlay hidden" aria-labelledby="result-title"><div class="dialog result-panel"><div class="eyebrow">MISSION COMPLETE</div><div id="result-symbol">✦</div><h2 id="result-title">블루팀 승리!</h2><p id="result-message">우리의 작은 청소가 우주를 바꿨어요.</p><div class="result-scores"><div class="blue"><span>블루팀 · 우리 팀</span><strong id="result-blue">0%</strong></div><span>VS</span><div class="red"><span>레드팀 · 상대 팀</span><strong id="result-red">0%</strong></div></div><div class="personal-stats"><div><strong id="result-cleaned">0</strong><span>내가 정화한 쓰레기</span></div><div><strong id="result-throws">0</strong><span>내 투척 횟수</span></div></div><button id="replay" class="primary-button">다시하기 ${icons.arrow}</button><button id="reselect" class="text-button">다른 캐릭터 선택하기</button></div></section>
    <div id="countdown" class="hidden" aria-live="assertive"></div><div id="toast" role="status" aria-live="polite"></div>
    <div id="small-screen-notice">키보드와 마우스가 있는 PC에서 플레이해 주세요.<br>경기장 전체를 보려면 창을 넓혀주세요.</div>
  </main>`;

type State = 'home' | 'selection' | 'tutorial' | 'countdown' | 'playing' | 'paused' | 'result';
let state: State = 'home';
let selected: Role = 'cleaner';
let game = new Game(selected);
let view: GameView;
let aim: Point = { x: 8, z: 0 };
let keys = new Set<string>();
let countdown = 3.2;
let guideReturn: State = 'home';
let tutorialSeen = false;
let sound = true;
let audio: AudioContext | null = null;
let toastUntil = 0;
let lastToast = '';
let previousTime = performance.now();
let displayClock = 0;
let reportedFinish = false;
let resumeState: 'playing' | 'countdown' = 'playing';

function beep(frequency: number, length = .08, volume = .025) {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(frequency, audio.currentTime); osc.frequency.exponentialRampToValueAtTime(frequency * .65, audio.currentTime + length);
    gain.gain.setValueAtTime(volume, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
    osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + length);
  } catch { /* Audio is optional when the browser blocks it. */ }
}
function show(id: string, visible: boolean) {
  $(`#${id}`).classList.toggle('hidden', !visible);
  if (!['selection', 'guide', 'pause-overlay', 'result'].includes(id)) return;
  const dialogs = [...document.querySelectorAll<HTMLElement>('.overlay')];
  const active = dialogs.find(d => d.id === 'guide' && !d.classList.contains('hidden')) ?? dialogs.find(d => !d.classList.contains('hidden'));
  for (const root of [$('.app-header'), $('#home'), $('#hud'), ...dialogs]) root.inert = !!active && root !== active;
}
function notify(message: string) {
  if (message === lastToast && performance.now() < toastUntil) return;
  $('#toast').textContent = message; $('#toast').classList.add('visible');
  lastToast = message; toastUntil = performance.now() + 2700;
}
function setState(next: State) {
  if (next === 'paused' && (state === 'playing' || state === 'countdown')) resumeState = state;
  state = next; keys.clear();
  if (next !== 'playing') game.player.moving = false;
  const atHome = next === 'home' || next === 'selection';
  $('#game-shell').classList.toggle('home-mode', atHome);
  show('home', next === 'home'); show('home-footer', next === 'home'); show('arena-caption', next === 'home');
  show('selection', next === 'selection'); show('hud', !atHome); show('pause', !atHome);
  show('pause-overlay', next === 'paused'); show('result', next === 'result'); show('countdown', next === 'countdown');
  view.setMode(atHome);
  const focus = next === 'selection' ? $('#deploy') : next === 'home' ? $('#start') : next === 'paused' ? $('#resume') : next === 'result' ? $('#replay') : null;
  focus?.focus();
}
function pick(role: Role) {
  selected = role;
  document.querySelectorAll<HTMLButtonElement>('.character-card').forEach(card => {
    const active = card.dataset.role === role; card.classList.toggle('selected', active); card.setAttribute('aria-pressed', String(active));
  });
  $('#deploy').innerHTML = `${ROLE_INFO[role].name}${role === 'guardian' ? '으로' : '로'} 출격 ${icons.arrow}`;
  beep(500);
}
function startMatch() {
  game = new Game(selected); view.reset(); reportedFinish = false; aim = { x: 8, z: 0 };
  $('#player-name').textContent = ROLE_INFO[selected].name;
  $('#skill-icon').innerHTML = roleIcon(selected);
  $('#skill-action').style.setProperty('--skill-color', ROLE_INFO[selected].color);
  const portrait = $<HTMLImageElement>(`[data-role="${selected}"] img`);
  $('#player-portrait').innerHTML = `<img src="${portrait.src}" alt="">`;
  countdown = 3.2; beep(600, .12);
  if (!tutorialSeen) { setState('tutorial'); guideReturn = 'countdown'; show('guide', true); $('#guide-ready').focus(); }
  else setState('countdown');
  updateHud();
}
function openGuide() {
  if (state === 'tutorial') return;
  guideReturn = state === 'playing' || state === 'countdown' ? 'paused' : state;
  if (state === 'playing' || state === 'countdown') setState('paused');
  show('guide', true); $('#guide-ready').focus();
}
function closeGuide() {
  show('guide', false);
  if (state === 'tutorial') { tutorialSeen = true; setState('countdown'); }
  else setState(guideReturn);
}
function pause() { if (state === 'playing' || state === 'countdown') { setState('paused'); $('#resume').focus(); } }
function action(type: 'throw' | 'skill') {
  if (state !== 'playing') return;
  const error = type === 'throw' ? game.throw(game.player, aim) : game.skill(game.player, aim);
  if (error) { notify(error); beep(170, .08, .015); }
  else beep(type === 'throw' ? 330 : 700, .15);
}
function results() {
  reportedFinish = true;
  const winner = game.winner;
  $('#result-title').textContent = winner === 'draw' ? '멋진 승부, 무승부!' : winner === 'blue' ? '블루팀 승리!' : '레드팀 승리!';
  $('#result-message').textContent = winner === 'blue' ? '우리의 작은 청소가 우주를 바꿨어요.' : winner === 'draw' ? '두 팀 모두 우주를 깨끗하게 만들었어요.' : '다음 임무에서는 우리가 더 깨끗하게!';
  $('#result-symbol').style.color = winner === 'red' ? '#ff829f' : '#b6f879';
  $('#result-blue').textContent = `${game.purity('blue').toFixed(1)}%`; $('#result-red').textContent = `${game.purity('red').toFixed(1)}%`;
  $('#result-cleaned').textContent = String(game.player.cleaned); $('#result-throws').textContent = String(game.player.throws);
  setState('result'); beep(880, .5); $('#replay').focus();
}
function updateHud() {
  for (const team of ['blue', 'red'] as const) {
    const purity = game.purity(team);
    $(`#${team}-score`).innerHTML = `${Math.round(purity)}<small>%</small>`;
    $(`#${team}-bar`).style.width = `${purity}%`;
    $(`#${team}-trash`).textContent = String(game.trash.filter(t => t.team === team).length);
  }
  const remaining = Math.max(0, Math.ceil(game.duration - game.time));
  $('#timer').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  $('#timer').classList.toggle('urgent', remaining <= 30);
  $('#match-status').textContent = game.purity('blue') > game.purity('red') ? '블루팀이 앞서고 있어요' : game.purity('blue') < game.purity('red') ? '지금부터 역전해요!' : '청소할 준비 완료!';
  $('#wave-note').classList.toggle('hidden', game.nextWave >= 180);
  $('#wave-time').textContent = `${Math.max(0, Math.ceil(game.nextWave - game.time))}초`;
  const p = game.player, cooldown = Math.max(0, p.skillReady - game.time), throwCd = Math.max(0, p.throwReady - game.time);
  $('#resource-count').textContent = `${p.resources} / 5`;
  $('#resource-pips').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < p.resources ? 'filled' : ''}"></i>`).join('');
  $('#recycle-progress').textContent = p.resources === 5 ? '자원이 가득 찼어요!' : `기본 쓰레기 ${p.recycled} / 3`;
  $('#clean-count').textContent = `${p.cleaned}개 정화`;
  $('#skill-state').textContent = cooldown > 0 ? `${cooldown.toFixed(1)}초` : ROLE_INFO[p.role].skill;
  $('#skill-shade').style.height = `${cooldown / ROLE_INFO[p.role].cooldown * 100}%`;
  $('#skill-action').classList.toggle('cooling', cooldown > 0);
  $('#throw-state').textContent = throwCd > 0 ? `${throwCd.toFixed(1)}초` : '투척';
  $('#throw-action').classList.toggle('unavailable', throwCd > 0 || p.resources === 0 || Math.abs(p.x) > 4.2);
  const nearest = game.nearest(p, 1.7);
  show('clean-prompt', state === 'playing' && !!nearest);
  if (nearest) {
    const pos = view.project(p, .1);
    $('#clean-prompt').style.left = `${pos.x}px`; $('#clean-prompt').style.top = `${pos.y + 18}px`;
    $('#clean-prompt span').textContent = p.target !== null ? `정화 중 ${Math.min(100, Math.floor(p.cleaning * 100))}%` : '길게 눌러 청소';
  }
}

try {
  view = new GameView($('#viewport'), $('#labels'));
  view.renderPortraits($('#selection'));
} catch (error) {
  $('#app').innerHTML = '<div class="fatal-error"><h1>3D 경기장을 열 수 없어요.</h1><p>WebGL을 지원하는 최신 Chrome 또는 Edge에서 하드웨어 가속을 켜고 다시 실행해 주세요.</p></div>';
  throw error;
}
$('#start').addEventListener('click', () => { setState('selection'); beep(650); });
$('#selection-back').addEventListener('click', () => setState('home'));
document.querySelectorAll<HTMLButtonElement>('.character-card').forEach(card => card.addEventListener('click', () => pick(card.dataset.role as Role)));
$('#deploy').addEventListener('click', startMatch);
$('#replay').addEventListener('click', startMatch);
$('#reselect').addEventListener('click', () => setState('selection'));
$('#pause').addEventListener('click', pause);
$('#resume').addEventListener('click', () => setState(resumeState));
$('#quit').addEventListener('click', () => { show('guide', false); setState('selection'); });
$('#help').addEventListener('click', openGuide);
$('#guide-close').addEventListener('click', closeGuide);
$('#guide-ready').addEventListener('click', closeGuide);
$('#throw-action').addEventListener('click', () => action('throw'));
$('#skill-action').addEventListener('click', () => action('skill'));
$('.brand').addEventListener('click', e => { e.preventDefault(); if (state === 'home' || state === 'selection' || state === 'result') setState('home'); else pause(); });
$('#sound').addEventListener('click', () => {
  sound = !sound; $('#sound').classList.toggle('muted', !sound);
  $('#sound').setAttribute('aria-label', sound ? '소리 끄기' : '소리 켜기'); $('#sound').title = sound ? '소리 켜짐' : '소리 꺼짐'; beep(600);
});
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  if (e.code === 'Tab') {
    const dialog = document.querySelector<HTMLElement>('.overlay:not(.hidden):not([inert])');
    const buttons = dialog?.querySelectorAll<HTMLButtonElement>('button');
    if (buttons?.length) {
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    return;
  }
  if (e.code === 'Escape' && !e.repeat) {
    if (!$('#guide').classList.contains('hidden')) closeGuide();
    else if (state === 'paused') setState(resumeState);
    else pause();
    return;
  }
  if (state !== 'playing') return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (!e.repeat && e.code === 'KeyQ') { const error = game.clean(game.player); if (error) notify(error); }
  if (!e.repeat && e.code === 'KeyE') action('throw');
  if (!e.repeat && e.code === 'KeyR') action('skill');
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => { keys.clear(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pointermove', e => { const p = view.pointer(e.clientX, e.clientY); if (p) aim = p; });

function frame(now: number) {
  const dt = Math.min(.25, Math.max(0, (now - previousTime) / 1000)); previousTime = now; displayClock += dt;
  if (state === 'home' || state === 'selection') {
    if (!game.finished) game.update(dt * .45);
    if (game.finished) { game = new Game(selected); view.reset(); }
    game.events = [];
  }
  if (state === 'countdown') {
    const previous = Math.ceil(countdown); countdown -= dt;
    $('#countdown').innerHTML = `<span>우리 구역을 깨끗하게!</span><strong>${countdown > .2 ? Math.ceil(countdown - .2) : 'GO!'}</strong><small>블루팀 · ${ROLE_INFO[selected].name}</small>`;
    if (Math.ceil(countdown) !== previous) beep(500 + (3 - Math.ceil(countdown)) * 150, .12);
    if (countdown <= -.4) { setState('playing'); notify('출격! Q를 길게 눌러 쓰레기를 청소하세요.'); }
  }
  if (state === 'playing') {
    const x = Number(keys.has('KeyD')) - Number(keys.has('KeyA')), z = Number(keys.has('KeyS')) - Number(keys.has('KeyW'));
    const move = view.movement(x, z);
    for (let remaining = dt; remaining > .000001; remaining -= .05) {
      const step = Math.min(.05, remaining);
      game.move(game.player, move.x, move.z, step);
      if (keys.has('KeyQ') && !x && !z) game.clean(game.player);
      game.update(step);
    }
    for (const e of game.events) {
      view.event(e);
      if (e.type === 'wave') notify(`우주 쓰레기 유입! 양 팀에 ${e.amount}개씩 추가됐어요.`);
      if (e.type === 'reflect') { notify('반사막 가동! 쓰레기를 되돌려 보냈어요.'); beep(850, .16); }
      if (e.type === 'clean' && e.team === 'blue') {
        if (Math.hypot(e.x - game.player.x, e.z - game.player.z) < 4) beep(950, .065, .012);
        const pos = view.project(e, 1.4), label = document.createElement('span');
        label.className = 'floating-score'; label.textContent = '+ 정화'; label.style.left = `${pos.x}px`; label.style.top = `${pos.y}px`;
        $('#floating-texts').append(label); setTimeout(() => label.remove(), 1000);
      }
    }
    game.events = [];
    if (game.finished && !reportedFinish) results();
  }
  if (state !== 'home' && state !== 'selection') updateHud();
  if (now > toastUntil) $('#toast').classList.remove('visible');
  view.render(game, dt, displayClock, aim, state === 'playing');
}
view.renderer.setAnimationLoop(frame);
document.querySelectorAll('.overlay').forEach(dialog => { dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); });
