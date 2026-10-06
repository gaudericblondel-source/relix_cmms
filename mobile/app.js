/* Relix Mobile — field app prototype. Vanilla JS, no build. State in localStorage `relix.mobile.v2`. */
(function () {
  'use strict';
  const RX = window.RX, ME = RX.ME;
  const KEY = 'relix.mobile.v2', VERSION = 3;
  const clone = x => JSON.parse(JSON.stringify(x));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ms = (n, c = '') => `<span class="ms ${c}" aria-hidden="true">${n}</span>`;
  const pad = n => String(n).padStart(2, '0');
  const clock = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const dur = t => { t = Math.max(0, Math.floor(t / 1000)); return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`; };
  const P = k => { const p = RX.PEOPLE[k] || ['Unknown', '', '#F2F4F7', '#667085', '']; return { key: k, name: p[0], role: p[1], bg: p[2], fg: p[3], team: p[4], short: p[0].split(' ')[0] + ' ' + (p[0].split(' ')[1] || '')[0] + '.' }; };
  const av = (k, c = '') => { const p = P(k); return `<span class="av ${c}" style="background:${p.bg};color:${p.fg}" aria-hidden="true">${k}</span>`; };

  // ---------------- state ----------------
  const fresh = () => ({ v: VERSION, tab: 'todo', prevTab: 'todo', stack: [], seg: 'mine', showDone: false, chatF: 'all', q: '', qf: 'all', recent: ['P-101', 'seal 45', 'Tin Bath'],
    simOff: false, queue: [], wos: clone(RX.WOS), runs: clone(RX.RUNS), chans: clone(RX.CHANNELS), read: clone(RX.READ), openRun: null, sheet: null, nextId: 1339915, lastSync: '09:42', welcomed: false });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || S.v !== VERSION) S = fresh();
  const T = { toast: null, syncing: false, photos: {}, cam: null, draft: {} }; // transient
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const online = () => navigator.onLine !== false && !S.simOff;
  const wo = id => S.wos.find(w => w.id === id);
  const asset = id => RX.ASSETS[id] || { name: id, type: '', loc: '', status: '', crit: '', specs: [], docs: [], parts: [], history: [] };
  const woTitle = w => `${asset(w.asset).name} — ${w.task}`;
  const zone = a => (a.loc || '').split(' › ')[0];
  const mine = w => w.who.includes(ME);
  const cl = w => RX.CHECKLISTS[w.cl] || RX.CHECKLISTS.standard;
  const stepOf = (c, id) => c.steps.find(s => s.id === id);
  const icon = a => RX.TYPE_ICON[a.type] || 'precision_manufacturing';

  // ---------------- sync / offline ----------------
  function record(label, sub) { // every write goes through here: synced at once online, queued offline
    if (online()) { S.lastSync = clock(); return false; }
    S.queue.push({ label, sub, at: clock() }); return true;
  }
  function flush() {
    if (!online() || T.syncing) return;
    const n = S.queue.length + pendingMsgs();
    if (!n) return;
    T.syncing = true; render();
    setTimeout(() => {
      S.queue = []; S.wos.forEach(w => delete w.pending);
      Object.values(S.chans).forEach(c => c.msgs.forEach(m => delete m.pending));
      S.lastSync = clock(); T.syncing = false; save();
      toast(`Back online · ${n} change${n > 1 ? 's' : ''} synced`, 'cloud_done');
    }, 1600);
  }
  const pendingMsgs = () => Object.values(S.chans).reduce((a, c) => a + c.msgs.filter(m => m.pending).length, 0);
  const pendingCount = () => S.queue.length + pendingMsgs();
  window.addEventListener('online', () => { render(); flush(); });
  window.addEventListener('offline', () => { toast('You are offline · keep working, changes sync automatically', 'cloud_off'); render(); });

  function syncPill() {
    const n = pendingCount();
    if (T.syncing) return `<button class="sync busy" data-a="tab" data-v="me">${ms('sync', 's20')}Syncing</button>`;
    if (!online()) return `<button class="sync off" data-a="tab" data-v="me" aria-label="Offline, ${n} changes waiting">${ms('cloud_off', 's20')}Offline${n ? ' · ' + n : ''}</button>`;
    return `<button class="ib" data-a="tab" data-v="me" aria-label="All changes synced" title="Synced ${S.lastSync}" style="color:var(--muted);margin-top:-6px">${ms('cloud_done')}</button>`;
  }

  // ---------------- toast ----------------
  let toastTimer;
  function toast(text, ic = 'check_circle', o = {}) {
    T.toast = { text, ic, ...o }; render();
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { T.toast = null; render(); }, o.ms || 3200);
  }

  // ---------------- chat helpers ----------------
  const chan = k => S.chans[k];
  const chanTitle = k => { const c = chan(k); if (!c) return k; if (c.kind === 'dm') return P(c.other).name; return c.title; };
  const unread = k => { const c = chan(k); return c ? Math.max(0, c.msgs.filter(m => m.who !== 'sys').length - (S.read[k] || 0)) : 0; };
  const markRead = k => { const c = chan(k); if (c) S.read[k] = c.msgs.filter(m => m.who !== 'sys').length; };
  const totalUnread = () => Object.keys(S.chans).reduce((a, k) => a + unread(k), 0);
  function ensureWoChan(w) { if (!S.chans[w.id]) S.chans[w.id] = { kind: 'wo', title: woTitle(w), sub: `${w.id} · ${Math.max(1, w.who.length)} people`, msgs: [] }; return S.chans[w.id]; }
  function post(k, text, x = {}) {
    const c = chan(k); if (!c) return;
    const pend = !online();
    c.msgs.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), who: x.who || ME, t: clock(), text, ...x, pending: x.who && x.who !== ME ? undefined : (pend || undefined) });
    if ((x.who || ME) === ME) markRead(k);
  }
  function sysMsg(k, text) { const c = chan(k); if (c) c.msgs.push({ id: 's' + Date.now().toString(36), who: 'sys', t: clock(), text }); }
  function fmt(text) { return esc(text).replace(/@([A-Za-zÀ-ÿ]+)/g, '<span class="mt">@$1</span>'); }
  function msgHtml(m) {
    if (m.who === 'sys') return `<div class="sys">${ms('info', 's18')}${esc(m.text)} · ${esc(m.t)}</div>`;
    const p = P(m.who), me = m.who === ME;
    const tag = m.tag ? `<span class="tag ${m.tag === 'Handover' ? 'blue' : ''}">${esc(m.tag)}</span>` : '';
    const ref = m.ref ? `<div class="ref">${ms(m.ref[0] === 'Spare part' ? 'inventory_2' : m.ref[0] === 'Work order' ? 'build' : 'precision_manufacturing', 's20')}<span class="x"><small>${esc(m.ref[0])}</small><b>${esc(m.ref[1])}</b></span><em>${esc(m.ref[2])}</em></div>` : '';
    const ph = m.photo ? `<div class="ph att">${ms('image')}<em>Photo</em></div>` : '';
    const time = m.pending ? `<span class="q">${ms('schedule')}Sends when back online</span>` : '';
    return `<div class="msg">${av(m.who, 'l')}<div><div class="h"><b>${me ? 'You' : esc(p.name)}</b><small>${esc(p.role)} · ${esc(m.t)}</small>${tag}</div><p>${fmt(m.text)}</p>${ref}${ph}${time}</div></div>`;
  }
  const replyFor = { 'Need help': ['GD', "I'll come by in 10 minutes."], 'Missing part': ['SL', 'Checking the store now — I will reserve it on this work order.'], 'Take over': ['MD', 'I can take it after my sensor check, around 11:00.'] };

  // ---------------- runs (intervention engine, same rules as the web wizard) ----------------
  const ansVal = a => (a && typeof a === 'object' && !Array.isArray(a)) ? a.value : a;
  function nextOf(c, s, answers) {
    const v = ansVal(answers[s.id]);
    for (const r of s.rules || []) if (r.when === v) { if (r.finish) return null; if (r.goto) return r.goto; }
    const i = c.steps.indexOf(s);
    for (let j = i + 1; j < c.steps.length; j++) if (!c.steps[j].conditional) return c.steps[j].id;
    return null;
  }
  function remaining(c, id, answers) { let n = 0, s = stepOf(c, id), guard = 0; while (s && guard++ < 60) { const nx = nextOf(c, s, answers); if (!nx) break; n++; s = stepOf(c, nx); } return n; }
  const isOut = (s, v) => v !== '' && v != null && !isNaN(+v) && ((s.min != null && +v < s.min) || (s.max != null && +v > s.max));
  function flagged(s, a) {
    const v = ansVal(a);
    if ((s.type === 'yesno' || s.type === 'single') && s.flagWhen && v === s.flagWhen) return true;
    if (s.type === 'number' && isOut(s, v)) return true;
    return false;
  }
  function valid(run, s) {
    const a = run.answers[s.id], v = ansVal(a), photos = (run.photos && run.photos[s.id]) || 0;
    switch (s.type) {
      case 'confirm': return !s.required || (Array.isArray(a) && s.options.every(o => a.includes(o)));
      case 'yesno': return !!v && !(s.photoWhen && v === s.photoWhen && !photos);
      case 'single': return !!v || !s.required;
      case 'number': if (v === '' || v == null || isNaN(+v)) return !s.required; return !isOut(s, v) || !!(a.comment || '').trim();
      case 'photo': return !s.required || photos > 0;
      default: return true;
    }
  }
  function summary(s, run) {
    const a = run.answers[s.id], v = ansVal(a), photos = (run.photos && run.photos[s.id]) || 0;
    switch (s.type) {
      case 'confirm': return `${(a || []).length} / ${s.options.length} confirmed`;
      case 'yesno': case 'single': return v || '—';
      case 'number': return v ? `${v} ${s.unit}` : '—';
      case 'photo': return photos ? `${photos} photo${photos > 1 ? 's' : ''}` : '—';
      case 'parts': { const n = Object.values(a || {}).reduce((x, y) => x + y, 0); return n ? `${n} part${n > 1 ? 's' : ''}` : 'None'; }
      case 'consumables': { const n = Object.values(a || {}).filter(Boolean).length; return n ? `${n} item${n > 1 ? 's' : ''}` : 'None'; }
      case 'comment': case 'text': return (a || '').trim() ? 'Added' : '—';
      default: return 'Done';
    }
  }
  function startRun(id) {
    const w = wo(id); if (!w) return;
    const fresh = !S.runs[id];
    if (fresh) {
      const c = cl(w); const first = c.steps.find(s => !s.conditional);
      S.runs[id] = { cl: w.cl, path: [first.id], answers: {}, photos: {}, elapsed: 0, status: 'running', resumedAt: Date.now(), touched: Date.now() };
      ensureWoChan(w); sysMsg(id, `Intervention started by ${P(ME).name}`);
      if (id === 'WO-1339859') scheduleIncoming();
    } else { const r = S.runs[id]; r.touched = Date.now(); if (r.status !== 'running') { r.status = 'running'; r.resumedAt = Date.now(); sysMsg(id, 'Intervention resumed'); } }
    if (!w.who.includes(ME)) w.who = [ME, ...w.who.filter(k => k !== ME)];
    w.status = 'In progress'; w.waiting = ''; w.started = true; delete w.help;
    w.pending = record(fresh ? 'Intervention started' : 'Intervention resumed', woTitle(w)) || w.pending;
    S.openRun = id; S.sheet = null; save(); render();
  }
  const elapsed = r => r.elapsed + (r.status === 'running' && r.resumedAt ? Date.now() - r.resumedAt : 0);
  let incomingTimer;
  function scheduleIncoming() {
    clearTimeout(incomingTimer);
    incomingTimer = setTimeout(() => {
      const k = 'WO-1339859'; if (!S.runs[k]) return;
      chan(k).msgs.push({ id: 'in1', who: 'SL', t: clock(), text: 'Seal and gasket are on the cart next to the pump. O-ring kit is in drawer A-09.', ref: ['Spare part', 'Mechanical seal 45 mm', 'Reserved'] });
      save();
      if (S.openRun === k && !(S.sheet && S.sheet.t === 'chat')) toast('Seal and gasket are on the cart next to the pump.', 'chat', { peek: true, who: 'SL', ch: k, ms: 5200 });
      else render();
    }, 9000);
  }

  // ---------------- navigation ----------------
  const top = () => S.stack[S.stack.length - 1];
  function push(v) { S.stack.push(v); S.sheet = null; save(); render(); }
  function back() { if (S.sheet) { S.sheet = null; } else S.stack.pop(); save(); render(); }

  // ================= VIEWS =================
  function tabs() {
    const t = S.tab, u = totalUnread();
    const b = (id, ic, label, extra = '') => `<button data-a="tab" data-v="${id}" ${t === id ? 'aria-current="page"' : ''}>${ms(ic)}${label}${extra}</button>`;
    const n = S.wos.filter(w => mine(w) && w.status !== 'Completed').length;
    return `<nav class="tabs" aria-label="Main">
      ${b('todo', 'checklist', 'To do')}
      ${b('search', 'search', 'Search')}
      <button data-a="tab" data-v="scan" ${t === 'scan' ? 'aria-current="page"' : ''}><span class="scan">${ms('qr_code_scanner')}</span>Scan</button>
      ${b('chat', 'forum', 'Chat', u ? `<span class="b">${u}</span>` : '')}
      ${b('me', 'person', 'Me', pendingCount() ? `<span class="b" style="background:var(--warn)">${pendingCount()}</span>` : '')}
    </nav>`;
  }

  // ---------- To do ----------
  function prioMark(w) {
    if (w.prio === 'Critical') return `<span class="prio critical">${ms('bolt', 'f')}Critical</span>`;
    if (w.prio === 'High') return `<span class="prio high">${ms('bolt', 'f')}High</span>`;
    return '';
  }
  function todoRow(w, team) {
    const a = asset(w.asset), done = w.status === 'Completed';
    let meta = `${w.type} · ${zone(a)}`, mc = '';
    if (team) {
      if (w.help) { meta = 'Help requested · ' + P(w.who[0]).name; mc = 'warn'; }
      else if (!w.who.length) { meta = 'Not assigned · ' + (w.reported ? 'reported ' + w.time : zone(a)); mc = 'crit'; }
      else if (w.waiting) { meta = w.waiting; mc = 'warn'; }
      else if (w.status === 'In progress') meta = 'In progress · ' + P(w.who[0]).name;
      else meta = `${w.type} · ${P(w.who[0]).name}`;
    } else if (S.runs[w.id] && w.status !== 'Completed') { const [n, t] = runPos(w); meta = `${S.runs[w.id].status === 'running' ? 'In progress' : 'Paused'} · step ${n} of ${t}${w.waiting ? ' · ' + w.waiting : ''}`; mc = 'warn'; }
    else if (w.waiting && w.status !== 'Completed') { meta = w.waiting; mc = 'warn'; }
    const end = team ? (w.who.length ? av(w.who[0]) : '<span class="av none" aria-label="Not assigned"></span>') : '';
    const tm = done ? `${ms('check', 's18')}` : w.late ? `<span class="tm late">${esc(w.late)}</span>` : `<span class="tm">${esc(w.time)}</span>`;
    return `<button class="row ${done ? 'done' : ''}" data-a="openWo" data-v="${w.id}">
      ${done ? `<span class="tm" style="color:var(--ok)">${tm}</span>` : tm}
      <span class="x"><span class="t">${esc(woTitle(w))}</span><span class="m ${mc}">${esc(meta)}</span></span>
      <span class="end">${w.pending ? `<span class="pend" title="Not synced">${ms('cloud_upload', 's20')}</span>` : ''}${done ? '' : prioMark(w)}${end}</span>
    </button>`;
  }
  function nowId() {
    const list = S.wos.filter(w => mine(w) && w.status === 'In progress' && S.runs[w.id]);
    if (!list.length) return null;
    const score = w => (S.runs[w.id].status === 'running' ? 1e15 : 0) + (S.runs[w.id].touched || 0);
    list.sort((a, b) => score(b) - score(a));
    return list[0].id;
  }
  function runPos(w) { const r = S.runs[w.id], c = cl(w), cur = r.path[r.path.length - 1]; return [r.path.length, r.path.length + remaining(c, cur, r.answers)]; }
  function nowBlock() {
    const id = nowId(); if (!id) return '';
    return [wo(id)].map(w => {
      const r = S.runs[w.id], c = cl(w), cur = r.path[r.path.length - 1];
      const n = r.path.length, total = n + remaining(c, cur, r.answers), running = r.status === 'running';
      const bars = Array.from({ length: total }, (_, i) => `<i class="${i < n - 1 ? 'on' : i === n - 1 ? 'cur' : ''}"></i>`).join('');
      return `<section class="now" aria-label="Current intervention">
        <div class="k ${running ? 'run' : ''}">${ms(running ? 'play_circle' : 'pause_circle', 'f')}${running ? 'In progress' : 'Paused'}${!running && w.waiting ? ` · <span style="font-weight:500">${esc(w.waiting)}</span>` : ''}</div>
        <div class="t">${esc(woTitle(w))}</div>
        <div class="bars" aria-hidden="true">${bars}</div>
        <div class="p"><span>${r.review ? 'Review & close' : `Step ${n} of ${total}`}</span><span class="mono" data-clock="${w.id}">${dur(elapsed(r))}</span></div>
        <button class="btn pri" data-a="run" data-v="${w.id}">${ms('play_arrow', 'f')}${running ? 'Continue' : 'Resume'}</button>
      </section>`;
    }).join('');
  }
  function vTodo() {
    const team = S.seg === 'team';
    const nowIds = new Set([nowId()].filter(Boolean));
    const mineOpen = S.wos.filter(w => mine(w) && w.status !== 'Completed');
    const teamAll = S.wos.filter(w => !mine(w));
    let body = '';
    if (!team) {
      const open = mineOpen.filter(w => !nowIds.has(w.id));
      const sec = (label, list, cls = '') => list.length ? `<div class="sl ${cls}">${label}<span class="c">${list.length}</span></div><div class="list">${list.map(w => todoRow(w)).join('')}</div>` : '';
      const by = k => open.filter(w => w.when === k).sort((a, b) => (a.time > b.time) - (a.time < b.time));
      const done = S.wos.filter(w => mine(w) && w.status === 'Completed');
      body = nowBlock() + sec('Overdue', by('overdue'), 'crit') + sec('Today', by('today')) + sec('Tomorrow', by('tomorrow'))
        + (done.length ? `<button class="more" data-a="toggleDone" aria-expanded="${S.showDone}">${ms(S.showDone ? 'keyboard_arrow_up' : 'keyboard_arrow_down', 's20')}${done.length} completed today</button>${S.showDone ? `<div class="list">${done.map(w => todoRow(w)).join('')}</div>` : ''}` : '');
      if (!open.length && !nowIds.size) body += `<div class="empty">${ms('task_alt')}Nothing left for today.</div>`;
    } else {
      const need = teamAll.filter(w => w.status !== 'Completed' && (w.help || !w.who.length));
      const rest = teamAll.filter(w => w.status !== 'Completed' && !need.includes(w)).sort((a, b) => (a.time > b.time) - (a.time < b.time));
      const done = teamAll.filter(w => w.status === 'Completed');
      body = (need.length ? `<div class="sl">Needs someone<span class="c">${need.length}</span></div><div class="list">${need.map(w => todoRow(w, true)).join('')}</div>` : '')
        + `<div class="sl">Today<span class="c">${rest.length}</span></div><div class="list">${rest.map(w => todoRow(w, true)).join('')}</div>`
        + (done.length ? `<button class="more" data-a="toggleDone">${ms(S.showDone ? 'keyboard_arrow_up' : 'keyboard_arrow_down', 's20')}${done.length} completed today</button>${S.showDone ? `<div class="list">${done.map(w => todoRow(w, true)).join('')}</div>` : ''}` : '');
    }
    const teamOpen = teamAll.filter(w => w.status !== 'Completed').length;
    return `<div class="screen"><div class="scroll" data-k="todo-${S.seg}">
      <header class="lt"><div class="x"><h1>To do</h1><div class="sub">${RX.TODAY}</div></div>${syncPill()}</header>
      <div class="seg" role="group" aria-label="Whose work">
        <button data-a="seg" data-v="mine" aria-pressed="${!team}">Mine <span class="c">${mineOpen.length}</span></button>
        <button data-a="seg" data-v="team" aria-pressed="${team}">Team <span class="c">${teamOpen}</span></button>
      </div>
      ${body}<div class="pad-b"></div></div>${tabs()}</div>`;
  }

  // ---------- Work order detail ----------
  function statusWord(w) {
    const L = { Requested: ['#6941C6', 'Requested'], Scheduled: ['#2456B8', 'Scheduled'], 'In progress': ['#0B6B4A', 'In progress'], Completed: ['#667085', 'Completed'] };
    let [c, t] = L[w.status] || L.Scheduled;
    if (w.late && w.status === 'Scheduled') { c = '#B42318'; t = 'Overdue · ' + w.late; }
    if (w.status === 'In progress' && S.runs[w.id] && S.runs[w.id].status === 'paused') { c = '#B54708'; t = 'Paused'; }
    return `<span class="st"><i style="background:${c}"></i>${t}</span>`;
  }
  function vWo(id) {
    const w = wo(id); if (!w) return vTodo();
    const a = asset(w.asset), c = cl(w), r = S.runs[w.id], ch = chan(w.id);
    const last = ch && [...ch.msgs].reverse().find(m => m.who !== 'sys');
    const when = w.when === 'done' ? `Done ${w.time}` : w.when === 'overdue' ? `Was due ${w.time}` : w.when === 'tomorrow' ? `Tomorrow ${w.time}` : w.reported ? `Reported ${w.time}` : `Today ${w.time}`;
    const parts = (w.parts || []).map(([ref, q]) => RX.PARTS[ref] ? `${q} × ${RX.PARTS[ref][0]}` : '').filter(Boolean);
    const docs = a.docs || [];
    let cta = '';
    if (w.status === 'Completed') cta = `<button class="btn sec" disabled>${ms('check_circle')}Completed${w.result ? ' · ' + esc(w.result) : ''}</button>`;
    else if (r && r.status === 'running') cta = `<button class="btn pri" data-a="run" data-v="${w.id}">${ms('play_arrow', 'f')}Continue intervention</button>`;
    else if (r) cta = `<button class="btn pri" data-a="run" data-v="${w.id}">${ms('play_arrow', 'f')}Resume intervention</button>`;
    else if (mine(w)) cta = `<button class="btn pri" data-a="run" data-v="${w.id}">${ms('play_arrow', 'f')}Start intervention</button>`;
    else if (w.help) cta = `<button class="btn pri" data-a="run" data-v="${w.id}">${ms('front_hand')}Take over</button>`;
    else if (!w.who.length) cta = `<button class="btn pri" data-a="run" data-v="${w.id}">${ms('play_arrow', 'f')}Assign to me and start</button>`;
    else cta = `<button class="btn sec" data-a="chatSheet" data-v="${w.id}">${ms('forum')}Message ${esc(P(w.who[0]).short)}</button>`;
    return `<div class="screen">
      <header class="nh"><button class="ib" data-a="back" aria-label="Back">${ms('arrow_back')}</button><span class="t"></span>
        <button class="ib" data-a="chatSheet" data-v="${w.id}" aria-label="Work order chat">${ms('forum')}${unread(w.id) ? `<span class="dot">${unread(w.id)}</span>` : ''}</button></header>
      <div class="scroll" data-k="wo-${id}">
        <div class="title"><h1>${esc(woTitle(w))}</h1><div class="id">${w.id}</div></div>
        <div class="meta">${statusWord(w)}<span>${esc(when)}</span>${prioMark(w)}${w.pending ? `<span class="pend" style="display:flex;align-items:center;gap:4px;font-size:13px">${ms('cloud_upload', 's18')}Not synced</span>` : ''}</div>
        ${w.help ? `<div class="alert" style="margin:12px 20px 0">${ms('front_hand')}<span><b>${esc(P(w.who[0]).name)} asks for someone to take over.</b> Progress is saved at step 3.</span></div>` : ''}
        ${w.waiting && w.status !== 'Completed' ? `<div class="alert" style="margin:12px 20px 0">${ms('hourglass_top')}<span>${esc(w.waiting)}</span></div>` : ''}
        ${w.desc ? `<div class="blk" style="padding-top:14px"><p>${esc(w.desc)}</p></div>` : ''}
        <div class="kv" style="margin-top:10px">
          <button class="r" data-a="equip" data-v="${w.asset}"><span class="k">Equipment</span><span class="v">${esc(a.name)}<small>${esc(a.loc)}</small></span>${ms('chevron_right')}</button>
          <div class="r"><span class="k">Checklist</span><span class="v">${esc(c.name)}<small>${c.steps.filter(s => !s.conditional).length} steps · about ${c.est} min</small></span><span></span></div>
          ${parts.length ? `<div class="r"><span class="k">Spare parts</span><span class="v">${parts.length} reserved<small>${parts.map(esc).join('<br>')}</small></span><span></span></div>` : ''}
          ${docs.length ? `<button class="r" data-a="doc" data-v="${esc(docs[0].name)}"><span class="k">Documents</span><span class="v">${esc(docs[0].name)}<small>${docs.length > 1 ? `+ ${docs.length - 1} more · ` : ''}available offline</small></span>${ms('chevron_right')}</button>` : ''}
          <div class="r"><span class="k">Assigned</span><span class="v" style="display:flex;align-items:center;gap:10px">${w.who.length ? `<span class="avs">${w.who.map(k => av(k)).join('')}</span>${w.who.map(k => esc(P(k).short)).join(', ')}` : '<span style="color:var(--crit)">Not assigned</span>'}</span><span></span></div>
          <button class="r" data-a="chatSheet" data-v="${w.id}"><span class="k">Chat</span><span class="v">${last ? `${esc(last.who === ME ? 'You' : P(last.who).name.split(' ')[0])}: ${esc(last.text.length > 70 ? last.text.slice(0, 68) + '…' : last.text)}` : 'No messages yet'}<small>${ch ? ch.msgs.filter(m => m.who !== 'sys').length + ' messages' : 'Start the conversation'}${unread(w.id) ? ` · <b style="color:var(--accent)">${unread(w.id)} new</b>` : ''}</small></span>${ms('chevron_right')}</button>
        </div><div class="pad-b"></div>
      </div>
      <div class="foot">${cta}</div></div>`;
  }

  // ---------- Intervention (focus mode) ----------
  function runHeader(w, r) {
    return `<header class="rh"><button class="ib" data-a="leaveRun" aria-label="Back to list, intervention keeps running">${ms('arrow_back')}</button>
      <span class="x"><b>${esc(w.task)}</b><small>${esc(asset(w.asset).name)} · ${esc(zone(asset(w.asset)))}</small></span>
      ${!online() ? `<span class="offp">${ms('cloud_off', 's18')}Offline</span>` : ''}
      <button class="ib" data-a="pauseSheet" aria-label="Pause intervention" style="width:auto;padding:0 10px;gap:6px;display:flex;font-size:14px;font-weight:600">${ms('pause')}Pause</button></header>`;
  }
  function stepBody(w, r, s) {
    const a = r.answers[s.id];
    let h = `<h2>${esc(s.title)}</h2>${s.desc && s.type !== 'instruction' ? `<p class="d">${esc(s.desc)}</p>` : ''}`;
    const media = (s.media || []).map(m => docRow(m)).join('');
    if (s.type === 'instruction') {
      h += `<ol>${s.desc.split('\n').map(l => `<li>${esc(l)}</li>`).join('')}</ol>`;
      if (s.expected) h += `<div class="expect">${ms('verified')}<span><b>Expected result</b>${esc(s.expected)}</span></div>`;
      h += media;
    } else {
      h += media;
    }
    if (s.type === 'confirm') {
      const v = Array.isArray(a) ? a : [];
      h += `<div class="opts" role="group">${s.options.map((o, i) => `<button class="opt check" role="checkbox" aria-checked="${v.includes(o)}" data-a="tick" data-v="${i}"><span class="bx">${v.includes(o) ? ms('check') : ''}</span>${esc(o)}</button>`).join('')}</div>`;
    }
    if (s.type === 'yesno') {
      h += `<div class="yn" role="group">${['Yes', 'No'].map(o => `<button class="${s.flagWhen === o ? 'flag' : ''}" aria-pressed="${a === o}" data-a="answer" data-v="${o}">${ms(o === 'Yes' ? 'check' : 'close')}${o}</button>`).join('')}</div>`;
      if (a && s.flagWhen === a) h += `<div class="alert">${ms('warning')}<span><b>Anomaly.</b> It will be reported on the work order${s.photoWhen === a ? ' — add a photo to continue' : ''}.</span></div>`;
      if (s.photoWhen && a === s.photoWhen) h += photoGrid(s.id);
    }
    if (s.type === 'single') {
      h += `<div class="opts" role="radiogroup">${s.options.map(o => `<button class="opt radio ${s.flagWhen === o ? 'flag' : ''}" role="radio" aria-checked="${a === o}" data-a="answer" data-v="${esc(o)}"><span class="bx"></span>${esc(o)}</button>`).join('')}</div>`;
      if (a && s.flagWhen === a) h += `<div class="alert">${ms('warning')}<span><b>Anomaly.</b> ${s.rules.some(x => x.when === a && x.finish) ? 'The checklist ends here and a follow-up work order is proposed.' : 'It will be reported on the work order.'}</span></div>`;
    }
    if (s.type === 'number') {
      const v = ansVal(a) || '', out = isOut(s, v);
      h += `<label class="sr" for="num">${esc(s.title)} in ${esc(s.unit)}</label>
        <div class="num ${out ? 'out' : ''}" id="numbox"><input id="num" inputmode="decimal" autocomplete="off" placeholder="0.0" value="${esc(v)}" data-i="num"><span>${esc(s.unit)}</span></div>
        <div class="range">Normal range ${s.min} – ${s.max} ${esc(s.unit)}</div>
        <div id="outblk" ${out ? '' : 'hidden'} style="display:${out ? 'flex' : 'none'};flex-direction:column;gap:16px">
          <div class="alert">${ms('warning')}<span><b>Out of normal range.</b> An anomaly will be reported — add a comment to continue.</span></div>
          <label class="sr" for="outc">Comment</label><textarea class="ta" id="outc" placeholder="What did you observe?" data-i="numc">${esc((a && a.comment) || '')}</textarea>
        </div>`;
    }
    if (s.type === 'photo') h += photoGrid(s.id, true);
    if (s.type === 'parts') {
      const def = Object.fromEntries((s.parts && s.parts.length ? s.parts : (w.parts || [])).map(([ref, q]) => [ref, q]));
      const v = a || def; if (!a) r.answers[s.id] = { ...def };
      h += `<div class="parts">${Object.keys(v).map(ref => { const p = RX.PARTS[ref] || [ref, 'pcs', 0, '']; return `<div class="part"><span><b>${esc(p[0])}</b><small><span class="mono">${ref}</span> · ${esc(p[3])}</small></span>${stepper('qty', ref, v[ref])}</div>`; }).join('')}</div>
        <button class="btn ghost" data-a="addPart" style="justify-content:flex-start;padding:0">${ms('add')}Add a spare part</button>`;
    }
    if (s.type === 'consumables') {
      const v = a || {}; if (!a) r.answers[s.id] = {};
      h += `<div class="parts">${RX.CONSUMABLES.map(([ref, name, unit]) => `<div class="part"><span><b>${esc(name)}</b><small>${esc(unit)}</small></span>${stepper('qty', ref, v[ref] || 0)}</div>`).join('')}</div>`;
    }
    if (s.type === 'comment' || s.type === 'text') h += `<label class="sr" for="cm">${esc(s.title)}</label><textarea class="ta" id="cm" placeholder="Optional" data-i="text">${esc(a || '')}</textarea>`;
    return h;
  }
  const stepper = (k, ref, n) => `<span class="stepper"><button data-a="${k}" data-v="${ref}|-1" aria-label="Less">${ms('remove', 's20')}</button><output>${n}</output><button data-a="${k}" data-v="${ref}|1" aria-label="More">${ms('add', 's20')}</button></span>`;
  function docRow(m) {
    const k = (m.kind || 'PDF').toLowerCase();
    return `<button class="doc" data-a="doc" data-v="${esc(m.name)}"><span class="ft ${k}">${k === 'video' ? ms('play_arrow', 'f') : k === 'image' ? ms('image') : 'PDF'}</span><span class="x"><b>${esc(m.name)}</b><small>${ms('download_done')}Available offline · ${esc(m.size || '')}</small></span>${ms('chevron_right')}</button>`;
  }
  function photoGrid(sid, big) {
    const urls = T.photos[sid] || [], run = S.runs[S.openRun], n = (run && run.photos[sid]) || 0;
    let h = '<div class="photos">';
    for (let i = 0; i < n; i++) h += urls[i] ? `<div class="ph" style="background:url(${urls[i]}) center/cover"><em>Photo ${i + 1}</em></div>` : `<div class="ph">${ms('image')}<em>Photo ${i + 1}</em></div>`;
    h += `<label class="ph add">${ms('photo_camera')}${n ? 'Add' : 'Take photo'}<input type="file" accept="image/*" capture="environment" data-f="photo" data-v="${sid}" class="sr"></label></div>`;
    return h;
  }
  function vRun(id) {
    const w = wo(id), r = S.runs[id];
    if (!w || !r) { S.openRun = null; return vTodo(); }
    const c = cl(w);
    if (r.review) return vReview(w, r, c);
    const cur = stepOf(c, r.path[r.path.length - 1]);
    const n = r.path.length, total = n + remaining(c, cur.id, r.answers);
    const bars = Array.from({ length: total }, (_, i) => `<i class="${i < n - 1 ? 'on' : i === n - 1 ? 'cur' : ''}"></i>`).join('');
    const ok = valid(r, cur), u = unread(id);
    return `<div class="screen">${runHeader(w, r)}
      <div class="rp"><div class="l">STEP ${n} OF ${total}${cur.required ? '<span class="req">· Required</span>' : ''}<span style="margin-left:auto;color:var(--muted);font:500 13px var(--mono);letter-spacing:0" data-clock="${id}">${dur(elapsed(r))}</span></div><div class="bars" aria-hidden="true">${bars}</div></div>
      <div class="scroll" data-k="run-${id}-${cur.id}"><div class="stp">${stepBody(w, r, cur)}</div></div>
      <div class="rf">
        <button class="sq" data-a="prev" aria-label="Previous step" ${n < 2 ? 'disabled' : ''}>${ms('arrow_back')}</button>
        <button class="sq" data-a="chatSheet" data-v="${id}" aria-label="Work order chat${u ? `, ${u} new` : ''}">${ms('forum')}${u ? `<span class="dot">${u}</span>` : ''}</button>
        <button class="btn pri" id="next" data-a="next" ${ok ? '' : 'disabled'}>${nextOf(c, cur, r.answers) ? 'Next' : 'Review'}${ms('arrow_forward')}</button>
      </div></div>`;
  }
  function vReview(w, r, c) {
    const steps = r.path.map(id => stepOf(c, id));
    const flags = steps.filter(s => flagged(s, r.answers[s.id]));
    const rv = r.rv || (r.rv = { result: '', running: '', comment: '', follow: flags.length > 0 });
    const can = rv.result && rv.running;
    return `<div class="screen">${runHeader(w, r)}
      <div class="scroll" data-k="review-${w.id}"><div class="stp">
        <div><h2>Review & close</h2><p class="d" style="margin-top:4px">${steps.length} steps · ${flags.length ? `${flags.length} anomal${flags.length > 1 ? 'ies' : 'y'}` : 'no anomaly'} · <span class="mono" data-clock="${w.id}">${dur(elapsed(r))}</span></p></div>
        ${flags.length ? `<div class="alert">${ms('warning')}<span><b>${flags.length} anomal${flags.length > 1 ? 'ies' : 'y'} detected</b><br>${flags.map(s => `${esc(s.title)} — ${esc(summary(s, r))}${s.type === 'number' ? ` (normal ${s.min}–${s.max})` : ''}`).join('<br>')}</span></div>` : ''}
        <div class="sum">${steps.map((s, i) => `<button class="r ${flagged(s, r.answers[s.id]) ? 'flag' : ''}" data-a="goStep" data-v="${i}" style="width:100%;text-align:left">${ms(flagged(s, r.answers[s.id]) ? 'warning' : 'check_circle')}<span>${esc(s.title)}</span><span class="a">${esc(summary(s, r))}</span></button>`).join('')}</div>
        <div class="fl">Result</div>
        <div class="tri" role="group">${[['Completed', 'task_alt'], ['Partially done', 'clock_loader_40'], ['Not done', 'block']].map(([o, ic]) => `<button aria-pressed="${rv.result === o}" data-a="rv" data-v="result|${o}">${ms(ic, 's20')}${o}</button>`).join('')}</div>
        <div class="fl">Is the equipment back in service?</div>
        <div class="yn" role="group">${['Yes', 'No'].map(o => `<button style="height:56px;font-size:16px" aria-pressed="${rv.running === o}" data-a="rv" data-v="running|${o}">${ms(o === 'Yes' ? 'check' : 'close')}${o}</button>`).join('')}</div>
        <div class="fl">Comment <small>· optional</small></div>
        <label class="sr" for="rvc">Comment</label><textarea class="ta" id="rvc" placeholder="What was done, what the next shift should know" data-i="rvc">${esc(rv.comment)}</textarea>
        <button class="switch" role="switch" aria-checked="${rv.follow}" data-a="rv" data-v="follow|x"><span class="x">Follow-up work order<small>${flags.length ? 'Proposed because of the anomaly' : 'Create one for remaining work'}</small></span><span class="tg"></span></button>
      </div></div>
      <div class="rf" style="grid-template-columns:52px minmax(0,1fr)">
        <button class="sq" data-a="prev" aria-label="Back to last step">${ms('arrow_back')}</button>
        <button class="btn pri" id="next" data-a="closeRun" ${can ? '' : 'disabled'}>${ms('check')}Close intervention</button>
      </div></div>`;
  }

  // ---------- Search ----------
  const FILTERS = [['all', 'All'], ['equip', 'Equipment'], ['wo', 'Work orders'], ['part', 'Spare parts'], ['doc', 'Documents'], ['people', 'People']];
  function searchIndex() {
    const out = [];
    Object.entries(RX.ASSETS).forEach(([id, a]) => out.push({ k: 'equip', id, t: a.name, m: `${id} · ${a.loc}`, s: `${id} ${a.name} ${a.loc} ${a.type}`, ic: icon(a), a: 'equip' }));
    S.wos.forEach(w => out.push({ k: 'wo', id: w.id, t: woTitle(w), m: `${w.id} · ${w.status}${w.who.length ? ' · ' + P(w.who[0]).short : ''}`, s: `${w.id} ${woTitle(w)} ${w.type}`, ic: 'build', a: 'openWo' }));
    Object.entries(RX.PARTS).forEach(([ref, p]) => out.push({ k: 'part', id: ref, t: p[0], m: `${ref} · ${p[2] ? p[2] + ' in stock' : 'Out of stock'} · ${p[3]}`, s: `${ref} ${p[0]}`, ic: 'inventory_2', a: 'part' }));
    RX.DOCS.forEach(([n, m, k]) => out.push({ k: 'doc', id: n, t: n, m: `${k} · ${m}`, s: `${n} ${m}`, ic: 'description', a: 'doc' }));
    Object.keys(RX.PEOPLE).filter(k => k !== ME).forEach(k => { const p = P(k); out.push({ k: 'people', id: k, t: p.name, m: `${p.role} · ${p.team}`, s: `${p.name} ${p.role} ${p.team}`, av: k, a: 'dm' }); });
    return out;
  }
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function hl(text, q) { if (!q) return esc(text); const i = norm(text).indexOf(norm(q)); if (i < 0) return esc(text); return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length)); }
  function searchResults() {
    const q = S.q.trim();
    if (!q) {
      return `<div class="sl">Recent searches</div><div class="list">${S.recent.map(r => `<button class="row ic" data-a="setQ" data-v="${esc(r)}"><span class="tile" style="background:none">${ms('history')}</span><span class="x"><span class="t" style="font-weight:400">${esc(r)}</span></span><span class="end">${ms('north_west', 's20')}</span></button>`).join('')}</div>
        <div class="sl">Recently viewed</div><div class="list">${['P-101', 'V-12'].map(id => { const a = asset(id); return `<button class="row ic" data-a="equip" data-v="${id}"><span class="tile">${ms(icon(a))}</span><span class="x"><span class="t">${esc(a.name)}</span><span class="m">${id} · ${esc(a.loc)}</span></span><span class="end"></span></button>`; }).join('')}
        <button class="row ic" data-a="openWo" data-v="WO-1339859"><span class="tile">${ms('build')}</span><span class="x"><span class="t">Pump P-101 — Seal replacement</span><span class="m">WO-1339859 · Scheduled</span></span><span class="end"></span></button></div>`;
    }
    const words = norm(q).split(/\s+/).filter(Boolean);
    const hits = searchIndex().filter(x => (S.qf === 'all' || x.k === S.qf) && words.every(wd => norm(x.s).includes(wd)));
    if (!hits.length) return `<div class="empty">${ms('search_off')}No result for “${esc(q)}”.<br>Check the code or scan the equipment.</div>`;
    const groups = FILTERS.slice(1).map(([k, label]) => [label, hits.filter(h => h.k === k)]).filter(g => g[1].length);
    return groups.map(([label, list]) => `<div class="sl">${label}<span class="c">${list.length}</span></div><div class="list">${list.slice(0, S.qf === 'all' ? 4 : 50).map(x => `<button class="row ic" data-a="${x.a}" data-v="${esc(x.id)}">${x.av ? av(x.av, 'm') : `<span class="tile">${ms(x.ic)}</span>`}<span class="x"><span class="t">${hl(x.t, words[0])}</span><span class="m">${esc(x.m)}</span></span><span class="end"></span></button>`).join('')}</div>`).join('');
  }
  function vSearch() {
    return `<div class="screen"><header class="lt"><div class="x"><h1>Search</h1></div>${syncPill()}</header>
      <div class="sf">${ms('search')}<label class="sr" for="q">Search equipment, work orders, parts</label><input id="q" type="search" placeholder="Equipment, work order, part…" value="${esc(S.q)}" data-i="q" autocomplete="off" enterkeyhint="search">
        ${S.q ? `<button class="ib" data-a="setQ" data-v="" aria-label="Clear">${ms('close', 's20')}</button>` : ''}<button class="ib" data-a="tab" data-v="scan" aria-label="Scan a QR code">${ms('qr_code_scanner', 's20')}</button></div>
      <div class="chips" role="group" aria-label="Filter">${FILTERS.map(([k, l]) => `<button class="chip" data-a="qf" data-v="${k}" aria-pressed="${S.qf === k}">${l}</button>`).join('')}</div>
      <div class="scroll" id="sres" data-k="search">${searchResults()}<div class="pad-b"></div></div>${tabs()}</div>`;
  }

  // ---------- Chat ----------
  const CF = [['all', 'All'], ['dm', 'Direct'], ['team', 'Teams'], ['site', 'Site'], ['wo', 'Work orders']];
  const tKey = t => t === 'Yesterday' ? -1 : +t.replace(':', '');
  function vChat() {
    const keys = Object.keys(S.chans).filter(k => chan(k).msgs.length && (S.chatF === 'all' || chan(k).kind === S.chatF));
    const last = k => chan(k).msgs[chan(k).msgs.length - 1];
    keys.sort((a, b) => tKey(last(b).t) - tKey(last(a).t));
    const row = k => {
      const c = chan(k), m = last(k), u = unread(k);
      const lead = c.kind === 'dm' ? av(c.other) : `<span class="ic">${ms(c.kind === 'team' ? 'groups' : c.kind === 'site' ? 'factory' : 'build')}</span>`;
      const who = m.who === 'sys' ? '' : m.who === ME ? 'You: ' : c.kind === 'dm' ? '' : P(m.who).name.split(' ')[0] + ': ';
      return `<button class="cv ${u ? 'unread' : ''}" data-a="thread" data-v="${k}">${lead}<span class="x"><b>${esc(chanTitle(k))}</b><span>${m.pending ? ms('schedule', 's18') + ' ' : ''}${esc(who + m.text)}</span></span><span class="e"><small>${esc(m.t)}</small>${u ? `<span class="n">${u}</span>` : ''}</span></button>`;
    };
    return `<div class="screen"><div class="scroll" data-k="chat">
      <header class="lt"><div class="x"><h1>Chat</h1></div>${syncPill()}</header>
      <div class="chips" role="group" aria-label="Filter">${CF.map(([k, l]) => `<button class="chip" data-a="chatF" data-v="${k}" aria-pressed="${S.chatF === k}">${l}</button>`).join('')}</div>
      <div style="border-top:1px solid var(--hair);margin-top:4px">${keys.map(row).join('') || `<div class="empty">${ms('forum')}No conversation here yet.</div>`}</div>
      <div class="pad-b"></div></div>${tabs()}</div>`;
  }
  function composer(k, quick) {
    const qs = quick ? `<div class="quick">${[['Need help', 'sos'], ['Missing part', 'inventory_2'], ['Take over', 'swap_horiz'], ['Handover', 'assignment_return']].map(([l, ic]) => `<button data-a="quick" data-v="${l}">${ms(ic)}${l === 'Take over' ? 'Can someone take over?' : l === 'Handover' ? 'Handover note' : l}</button>`).join('')}</div>` : '';
    return `${qs}<div class="comp"><label class="ib" style="width:44px;height:44px;cursor:pointer" aria-label="Send a photo">${ms('photo_camera')}<input type="file" accept="image/*" capture="environment" data-f="chatphoto" data-v="${k}" class="sr"></label>
      <div class="in"><label class="sr" for="msg">Message</label><input id="msg" placeholder="${chan(k) && chan(k).kind === 'wo' ? 'Message the work order team' : 'Message'}" data-i="msg" data-v="${k}" autocomplete="off" enterkeyhint="send" value="${esc(T.draft[k] || '')}"></div>
      <button class="send ${T.draft[k] ? 'on' : ''}" id="send" data-a="send" data-v="${k}" aria-label="Send">${ms('send', 'f')}</button></div>`;
  }
  function vThread(k) {
    const c = chan(k); if (!c) return vChat();
    markRead(k);
    const sub = c.kind === 'dm' ? `${P(c.other).role} · ${P(c.other).team}` : c.sub;
    const head = c.kind === 'wo' ? `<button class="ib" data-a="openWo" data-v="${k}" aria-label="Open work order">${ms('build')}</button>` : '';
    return `<div class="screen"><header class="nh line"><button class="ib" data-a="back" aria-label="Back">${ms('arrow_back')}</button><span class="t">${esc(chanTitle(k))}<small>${esc(sub)}</small></span>${head}</header>
      <div class="scroll" data-k="th-${k}" data-bottom="1"><div class="msgs"><div class="day">Today</div>${c.msgs.map(msgHtml).join('')}</div></div>
      ${composer(k, c.kind === 'wo')}</div>`;
  }

  // ---------- Equipment ----------
  function vEquip(id) {
    const a = asset(id);
    const open = S.wos.filter(w => w.asset === id && w.status !== 'Completed');
    const stc = a.status === 'Stopped' ? '#B42318' : a.status === 'In service' ? '#0B6B4A' : '#667085';
    return `<div class="screen"><header class="nh"><button class="ib" data-a="back" aria-label="Back">${ms('arrow_back')}</button><span class="t"></span></header>
      <div class="scroll" data-k="eq-${id}">
        <div style="padding:0 20px"><div class="eq"><span class="tile">${ms(icon(a))}</span><div class="x"><h2>${esc(a.name)}</h2><div class="c">${id}</div><div class="loc">${esc(a.loc)}</div></div></div>
          <div class="meta" style="padding:12px 0 0"><span class="st"><i style="background:${stc}"></i>${esc(a.status)}</span><span>Criticality: ${esc(a.crit)}</span></div></div>
        <div class="sl">Open work orders<span class="c">${open.length}</span></div>
        <div class="list">${open.map(w => `<button class="row ic" data-a="openWo" data-v="${w.id}"><span class="tile">${ms('build')}</span><span class="x"><span class="t">${esc(w.task)}</span><span class="m">${w.who.length ? esc(P(w.who[0]).name) : 'Not assigned'} · ${esc(w.status)}</span></span><span class="end">${prioMark(w)}</span></button>`).join('') || '<div class="row" style="grid-template-columns:1fr;min-height:52px;color:var(--muted);font-size:14px">None</div>'}</div>
        ${a.history.length ? `<div class="sl">Last interventions</div><div class="list">${a.history.map(([d, t, who, res]) => `<div class="row"><span class="tm" style="font-family:var(--sans);font-weight:400;color:var(--muted)">${esc(d)}</span><span class="x"><span class="t" style="font-weight:400">${esc(t)}</span><span class="m">${esc(P(who).name)} · ${esc(res)}</span></span><span></span></div>`).join('')}</div>` : ''}
        ${a.docs.length ? `<div class="sl">Documents</div><div style="padding:0 20px;display:flex;flex-direction:column;gap:8px">${a.docs.map(docRow).join('')}</div>` : ''}
        ${a.specs.length ? `<div class="sl">Specifications</div><div class="specs" style="margin:0 20px">${[['Manufacturer', a.maker], ['Model', a.model], ['Serial number', a.serial], ['Installed', a.year], ...a.specs].map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
        ${a.parts.length ? `<div class="sl">Spare parts</div><div class="list">${a.parts.map(ref => { const p = RX.PARTS[ref]; return `<button class="row ic" data-a="part" data-v="${ref}"><span class="tile">${ms('inventory_2')}</span><span class="x"><span class="t">${esc(p[0])}</span><span class="m">${ref} · ${esc(p[3])}</span></span><span class="end" style="font-size:14px;font-weight:600;color:${p[2] ? 'var(--ok)' : 'var(--crit)'}">${p[2] ? p[2] + ' ' + p[1] : 'Out'}</span></button>`; }).join('')}</div>` : ''}
        <div class="pad-b"></div></div>
      <div class="foot row2"><button class="btn sec" data-a="report" data-v="${id}">${ms('report')}Report</button>${primaryFor(id, true)}</div></div>`;
  }
  function primaryFor(id, short) {
    const myW = S.wos.find(w => w.asset === id && mine(w) && w.status !== 'Completed');
    if (myW) { const r = S.runs[myW.id]; return `<button class="btn pri" data-a="run" data-v="${myW.id}">${ms('play_arrow', 'f')}${r ? (r.status === 'running' ? 'Continue' : 'Resume') : 'Start'}${short ? '' : ': ' + esc(myW.task)}</button>`; }
    return `<button class="btn pri" data-a="quickSheet" data-v="${id}">${ms('play_arrow', 'f')}Start${short ? '' : ' an intervention'}</button>`;
  }

  // ---------- Scan ----------
  function vScan() {
    const camOn = T.cam && T.cam.on;
    return `<div class="screen"><div class="cam">${camOn ? '<video id="vid" playsinline muted></video>' : '<div class="tex"></div>'}
      <div class="top"><button class="ib" data-a="closeScan" aria-label="Close scanner">${ms('close')}</button>${camOn ? `<button class="ib" data-a="torch" aria-label="Torch">${ms('flashlight_on')}</button>` : '<span></span>'}</div>
      <div class="ret" aria-hidden="true"><i></i><i></i><i></i><i></i>${camOn ? '' : `<span>${T.cam && T.cam.err ? esc(T.cam.err) : ''}</span>`}</div>
      <div class="bot"><p>Point at the equipment QR code</p>
        ${camOn ? '' : `<button class="btn" data-a="camOn">${ms('photo_camera')}Turn on camera</button>`}
        <button class="btn" data-a="manual">${ms('keyboard')}Enter the code</button>
        <div class="demo"><span>No QR code at hand? Try one:</span><div>${['P-101', 'TB-01', 'V-12', 'C-01'].map(c => `<button data-a="scanned" data-v="${c}">${c}</button>`).join('')}</div></div>
      </div></div></div>`;
  }
  function sScan(id) {
    const a = asset(id), myW = S.wos.find(w => w.asset === id && mine(w) && w.status !== 'Completed');
    const other = S.wos.filter(w => w.asset === id && !mine(w) && w.status !== 'Completed');
    const stc = a.status === 'Stopped' ? '#B42318' : '#0B6B4A';
    const h = a.history[0];
    let facts = '';
    if (myW) facts += `<button class="r" data-a="openWo" data-v="${myW.id}">${ms('assignment_ind')}<span><b>${esc(myW.task)}</b><small>Your work order · ${myW.late ? 'Overdue, ' + myW.late : myW.when === 'today' ? 'Today ' + myW.time : myW.when === 'tomorrow' ? 'Tomorrow ' + myW.time : myW.time}${myW.prio === 'Critical' || myW.prio === 'High' ? ' · ' + myW.prio : ''}</small></span>${ms('chevron_right', 's20')}</button>`;
    other.forEach(w => facts += `<button class="r" data-a="openWo" data-v="${w.id}">${ms('build')}<span><b>${esc(w.task)}</b><small>${w.who.length ? esc(P(w.who[0]).name) + ' · ' + w.status : 'Not assigned · ' + w.status + ' ' + w.time}</small></span>${ms('chevron_right', 's20')}</button>`);
    if (h) facts += `<div class="r">${ms('history')}<span><b>Last intervention</b><small>${esc(h[0])} · ${esc(h[1])} · ${esc(P(h[2]).short)}</small></span><span></span></div>`;
    return `<div class="scrim" data-a="closeSheet"></div><section class="sheet" role="dialog" aria-label="${esc(a.name)}"><div class="grab"></div>
      <div class="sb" style="padding-top:12px;display:flex;flex-direction:column;gap:14px">
        <div class="eq"><span class="tile">${ms(icon(a))}</span><div class="x"><h2>${esc(a.name)}</h2><div class="loc">${esc(a.loc)}</div>
          <div class="meta" style="padding:6px 0 0"><span class="st"><i style="background:${stc}"></i>${esc(a.status)}</span><span class="c" style="font:400 13px var(--mono);color:var(--muted)">${id}</span><span>${esc(a.crit)}</span></div></div></div>
        <div class="facts">${facts}</div>
        <div style="display:flex;flex-direction:column;gap:10px;padding-bottom:calc(var(--safe-b) + 8px)">
          ${primaryFor(id)}
          <button class="btn sec" data-a="report" data-v="${id}">${ms('report')}Report an incident</button>
          <button class="btn ghost" data-a="equip" data-v="${id}">Equipment details${ms('chevron_right', 's20')}</button>
        </div></div></section>`;
  }

  // ---------- Report incident ----------
  const ISSUES = [['Leak', 'water_drop'], ['Noise / vibration', 'graphic_eq'], ['Overheating', 'device_thermostat'], ['Won’t start', 'power_settings_new'], ['Electrical', 'bolt'], ['Other', 'more_horiz']];
  function vReport(id) {
    const a = asset(id), d = T.draft.rep || (T.draft.rep = { issue: '', stop: '', text: '', photos: 0 });
    const ok = d.issue && d.stop;
    return `<div class="screen"><header class="nh line"><button class="ib" data-a="back" aria-label="Cancel">${ms('close')}</button><span class="t">Report an incident<small>${esc(a.name)} · ${id}</small></span></header>
      <div class="scroll" data-k="rep-${id}"><div class="stp">
        <div class="fl">What is wrong?</div>
        <div class="grid2">${ISSUES.map(([l, ic]) => `<button class="issue" aria-pressed="${d.issue === l}" data-a="rep" data-v="issue|${l}">${ms(ic)}${l}</button>`).join('')}</div>
        <div class="fl">Is production stopped?</div>
        <div class="yn">${['Yes', 'No'].map(o => `<button style="height:56px;font-size:16px" aria-pressed="${d.stop === o}" data-a="rep" data-v="stop|${o}">${o}</button>`).join('')}</div>
        <div class="fl">Photo <small>· optional</small></div>
        <div class="photos">${Array.from({ length: d.photos }, (_, i) => (T.photos.rep || [])[i] ? `<div class="ph" style="background:url(${T.photos.rep[i]}) center/cover"></div>` : `<div class="ph">${ms('image')}</div>`).join('')}<label class="ph add">${ms('photo_camera')}Take photo<input type="file" accept="image/*" capture="environment" data-f="repphoto" class="sr"></label></div>
        <div class="fl">Details <small>· optional</small></div>
        <label class="sr" for="rept">Details</label><textarea class="ta" id="rept" placeholder="What you saw, where exactly" data-i="rept">${esc(d.text)}</textarea>
      </div></div>
      <div class="foot"><button class="btn pri" id="next" data-a="sendReport" data-v="${id}" ${ok ? '' : 'disabled'}>${ms('send')}Send report</button></div></div>`;
  }
  function vReported(id) {
    const w = wo(id); if (!w) return vTodo();
    const off = w.pending;
    return `<div class="screen"><div class="scroll" data-k="done-${id}"><div class="done-hero">
        <span class="ok ${off ? 'w' : ''}">${ms(off ? 'cloud_off' : 'check', 'f')}</span>
        <h2>${off ? 'Saved on this phone' : 'Incident reported'}</h2>
        <p>${off ? 'It will be sent automatically as soon as the network is back.' : 'The maintenance team has been notified.'}</p>
        <span class="id">${off ? 'ID assigned when synced' : w.id}</span><p style="margin-top:-6px;color:var(--ink)">${esc(woTitle(w))} · ${w.prio}</p></div></div>
      <div class="foot"><button class="btn pri" data-a="run" data-v="${id}">${ms('build')}Fix it now</button><button class="btn sec" data-a="home">Done</button></div></div>`;
  }

  // ---------- Me ----------
  function vMe() {
    const p = P(ME), on = online(), n = pendingCount();
    const pend = [...S.queue.map(q => [q.label, q.sub, q.at]), ...Object.entries(S.chans).flatMap(([k, c]) => c.msgs.filter(m => m.pending).map(m => ['Message', chanTitle(k), m.t]))];
    return `<div class="screen"><div class="scroll" data-k="me">
      <header class="lt"><div class="x"><h1>Me</h1></div></header>
      <div class="me">${av(ME, 'xl')}<span><b>${esc(p.name)}</b><small>${esc(p.role)} · ${esc(p.team)}</small></span></div>
      <div class="sl">Connection</div>
      <div class="cardless">
        <div class="r">${ms(T.syncing ? 'sync' : on ? 'cloud_done' : 'cloud_off')}<span>${T.syncing ? 'Syncing…' : on ? 'Online' : 'Offline'}<small>${on ? 'Last sync ' + S.lastSync : 'Everything keeps working on this phone'}</small></span><span></span></div>
        <button class="switch r" role="switch" aria-checked="${S.simOff}" data-a="simOff">${ms('flight')}<span class="x">Work offline<small>Demo: simulate no network</small></span><span class="tg"></span></button>
      </div>
      <div class="sl">Waiting to sync<span class="c">${n}</span></div>
      <div class="cardless">${pend.length ? pend.map(([l, s, t]) => `<div class="r">${ms('cloud_upload', 'pend')}<span>${esc(l)}<small>${esc(s)}</small></span><span class="v mono">${esc(t)}</span></div>`).join('') : `<div class="r">${ms('check_circle', 'okc')}<span>Everything is synced</span><span></span></div>`}</div>
      <div class="sl">On this phone</div>
      <div class="cardless">
        <div class="r">${ms('checklist')}<span>My work orders and checklists<small>${S.wos.filter(mine).length} work orders · 4 checklists</small></span>${ms('download_done', 'okc')}</div>
        <div class="r">${ms('precision_manufacturing')}<span>Equipment of my zones<small>Float Line, Tempering Line, Workshop · 38 assets</small></span>${ms('download_done', 'okc')}</div>
        <div class="r">${ms('description')}<span>Documents<small>24 files · 86 MB</small></span>${ms('download_done', 'okc')}</div>
      </div>
      <div class="sl">Settings</div>
      <div class="cardless">
        <div class="r">${ms('factory')}<span>Site</span><span class="v">Thourotte Plant</span></div>
        <div class="r">${ms('translate')}<span>Language</span><span class="v">English</span></div>
        <div class="r">${ms('notifications')}<span>Notifications</span><span class="v">Mentions, my work orders</span></div>
        <button class="r" data-a="reset">${ms('restart_alt')}<span>Reset the demo</span><span></span></button>
      </div><div class="pad-b"></div></div>${tabs()}</div>`;
  }

  // ---------- sheets ----------
  function sChat(k) {
    const c = chan(k); markRead(k);
    return `<div class="scrim" data-a="closeSheet"></div><section class="sheet tall" role="dialog" aria-label="Work order chat"><div class="grab"></div>
      <div class="sh"><span class="x"><h2>Work order chat</h2><small>${esc(c.sub || '')}${S.openRun === k ? ' · your step stays open' : ''}</small></span><button class="ib" data-a="closeSheet" aria-label="Close chat">${ms('keyboard_arrow_down')}</button></div>
      <div class="scroll" data-k="sc-${k}" data-bottom="1" style="border-top:1px solid var(--hair)"><div class="msgs">${c.msgs.map(msgHtml).join('')}</div></div>
      ${composer(k, true)}</section>`;
  }
  function sPause() {
    const d = T.draft.pause || (T.draft.pause = { reason: '', note: '' });
    const R = ['Waiting for spare parts', 'Waiting for equipment access', 'Called to another job', 'End of shift', 'Other reason'];
    return `<div class="scrim" data-a="closeSheet"></div><section class="sheet" role="dialog" aria-label="Pause intervention"><div class="grab"></div>
      <div class="sh"><span class="x"><h2>Pause intervention</h2><small>Progress is saved on this phone</small></span><button class="ib" data-a="closeSheet" aria-label="Close">${ms('close')}</button></div>
      <div class="sb" style="display:flex;flex-direction:column;gap:14px">
        <div class="opts" role="radiogroup">${R.map(o => `<button class="opt radio" role="radio" aria-checked="${d.reason === o}" data-a="pauseR" data-v="${o}" style="min-height:52px"><span class="bx"></span>${o}</button>`).join('')}</div>
        <label class="sr" for="pn">Note</label><input class="ti" id="pn" placeholder="Note for the team (optional)" data-i="pnote" value="${esc(d.note)}">
        <div style="display:flex;flex-direction:column;gap:10px;padding-bottom:calc(var(--safe-b) + 8px)"><button class="btn dark" id="next" data-a="doPause" ${d.reason ? '' : 'disabled'} style="${d.reason ? '' : 'background:var(--fill);color:var(--faint)'}">${ms('pause')}Pause</button><button class="btn sec" data-a="closeSheet">Keep working</button></div>
      </div></section>`;
  }
  function sDoc(name) {
    return `<div class="scrim" data-a="closeSheet"></div><section class="sheet tall" role="dialog" aria-label="${esc(name)}"><div class="grab"></div>
      <div class="sh"><span class="x"><h2>${esc(name)}</h2><small>Available offline</small></span><button class="ib" data-a="closeSheet" aria-label="Close">${ms('close')}</button></div>
      <div class="scroll" style="background:var(--bg);padding:16px"><div style="background:#fff;border:1px solid var(--line);border-radius:6px;padding:28px 22px;display:flex;flex-direction:column;gap:12px;min-height:520px">
        <b style="font-size:16px">${esc(name)}</b>${[92, 100, 84, 96, 70, 0, 100, 88, 94, 60, 0, 90, 100, 76].map(x => x ? `<i style="display:block;height:8px;border-radius:4px;background:#E9ECF1;width:${x}%"></i>` : '<i style="height:8px"></i>').join('')}
        <div class="ph" style="aspect-ratio:16/9;margin-top:8px">${ms('image')}</div></div></div></section>`;
  }
  function sPart(ref) {
    const p = RX.PARTS[ref]; if (!p) return '';
    const used = Object.entries(RX.ASSETS).filter(([, a]) => a.parts.includes(ref)).map(([id, a]) => [id, a.name]);
    return `<div class="scrim" data-a="closeSheet"></div><section class="sheet" role="dialog" aria-label="${esc(p[0])}"><div class="grab"></div>
      <div class="sh"><span class="x"><h2>${esc(p[0])}</h2><small class="mono">${ref}</small></span><button class="ib" data-a="closeSheet" aria-label="Close">${ms('close')}</button></div>
      <div class="sb"><div class="cardless" style="padding:0">
        <div class="r">${ms('inventory_2')}<span>Stock<small>${esc(p[3])}</small></span><span class="v" style="font-weight:600;color:${p[2] ? 'var(--ok)' : 'var(--crit)'}">${p[2] ? p[2] + ' ' + p[1] : 'Out of stock'}</span></div>
        ${used.map(([id, n]) => `<button class="r" data-a="equip" data-v="${id}">${ms('precision_manufacturing')}<span>${esc(n)}<small>Used on this equipment</small></span>${ms('chevron_right', 's20')}</button>`).join('')}
      </div><div style="padding:14px 0 calc(var(--safe-b) + 8px)"><button class="btn sec" data-a="dm" data-v="SL">${ms('forum')}Ask the store</button></div></div></section>`;
  }
  function sManual() {
    return `<div class="scrim" data-a="closeSheet"></div><section class="sheet" role="dialog" aria-label="Enter the code"><div class="grab"></div>
      <div class="sh"><span class="x"><h2>Enter the equipment code</h2><small>Printed under the QR code</small></span><button class="ib" data-a="closeSheet" aria-label="Close">${ms('close')}</button></div>
      <div class="sb" style="display:flex;flex-direction:column;gap:12px;padding-bottom:calc(var(--safe-b) + 16px)">
        <label class="sr" for="code">Code</label><input class="ti mono" id="code" placeholder="e.g. P-101" autocapitalize="characters" autocomplete="off" data-i="code" style="font-size:20px;height:56px">
        <button class="btn pri" data-a="findCode">Find equipment</button></div></section>`;
  }
  function sQuick(id) {
    const a = asset(id), d = T.draft.quick || (T.draft.quick = { pick: '', issue: '' });
    const open = S.wos.filter(w => w.asset === id && w.status !== 'Completed');
    const ok = d.pick && (d.pick !== 'new' || d.issue);
    return `<div class="scrim" data-a="closeSheet"></div><section class="sheet" role="dialog" aria-label="Start an intervention"><div class="grab"></div>
      <div class="sh"><span class="x"><h2>Start an intervention</h2><small>${esc(a.name)} · ${id}</small></span><button class="ib" data-a="closeSheet" aria-label="Close">${ms('close')}</button></div>
      <div class="sb" style="display:flex;flex-direction:column;gap:12px">
        <div class="opts" role="radiogroup">
          ${open.map(w => `<button class="opt radio" role="radio" aria-checked="${d.pick === w.id}" data-a="qpick" data-v="${w.id}"><span class="bx"></span><span>${esc(w.task)}<small style="display:block;font-size:13px;color:var(--muted)">${w.who.length ? esc(P(w.who[0]).name) : 'Not assigned'} · ${esc(w.status)}</small></span></button>`).join('')}
          <button class="opt radio" role="radio" aria-checked="${d.pick === 'new'}" data-a="qpick" data-v="new"><span class="bx"></span>Something else</button>
        </div>
        ${d.pick === 'new' ? `<div class="chips" style="padding:0;flex-wrap:wrap">${ISSUES.slice(0, 5).map(([l]) => `<button class="chip" data-a="qissue" data-v="${l}" aria-pressed="${d.issue === l}">${l}</button>`).join('')}</div>` : ''}
        <div style="padding:6px 0 calc(var(--safe-b) + 8px)"><button class="btn pri" data-a="quickGo" data-v="${id}" ${ok ? '' : 'disabled'}>${ms('play_arrow', 'f')}Start</button></div>
      </div></section>`;
  }
  function sAddPart() {
    return `<div class="scrim" data-a="closeSheet"></div><section class="sheet" role="dialog" aria-label="Add a spare part"><div class="grab"></div>
      <div class="sh"><span class="x"><h2>Add a spare part</h2></span><button class="ib" data-a="closeSheet" aria-label="Close">${ms('close')}</button></div>
      <div class="scroll"><div class="list">${Object.entries(RX.PARTS).map(([ref, p]) => `<button class="row ic" data-a="pickPart" data-v="${ref}"><span class="tile">${ms('inventory_2')}</span><span class="x"><span class="t">${esc(p[0])}</span><span class="m">${ref} · ${p[2] ? p[2] + ' in stock' : 'Out of stock'}</span></span><span class="end">${ms('add')}</span></button>`).join('')}</div><div class="pad-b"></div></div></section>`;
  }

  // ================= RENDER =================
  const app = document.getElementById('app');
  function view() {
    if (S.openRun) return vRun(S.openRun);
    const t = top();
    if (t) {
      if (t.v === 'wo') return vWo(t.id);
      if (t.v === 'equip') return vEquip(t.id);
      if (t.v === 'thread') return vThread(t.id);
      if (t.v === 'report') return vReport(t.id);
      if (t.v === 'reported') return vReported(t.id);
    }
    if (S.tab === 'search') return vSearch();
    if (S.tab === 'scan') return vScan();
    if (S.tab === 'chat') return vChat();
    if (S.tab === 'me') return vMe();
    return vTodo();
  }
  function sheet() {
    const s = S.sheet; if (!s) return '';
    if (s.t === 'chat') return sChat(s.id);
    if (s.t === 'pause') return sPause();
    if (s.t === 'doc') return sDoc(s.id);
    if (s.t === 'part') return sPart(s.id);
    if (s.t === 'scan') return sScan(s.id);
    if (s.t === 'manual') return sManual();
    if (s.t === 'quick') return sQuick(s.id);
    if (s.t === 'addPart') return sAddPart();
    return '';
  }
  function toastHtml() {
    const t = T.toast; if (!t) return '';
    if (t.peek) return `<button class="toast peek" data-a="chatSheet" data-v="${t.ch}">${av(t.who, 'l')}<span class="x"><b>${esc(P(t.who).name)}</b><span>${esc(t.text)}</span></span>${ms('chevron_right', 's20')}</button>`;
    return `<div class="toast ${S.sheet ? 'top' : ''}" role="status">${ms(t.ic)}<span>${esc(t.text)}</span></div>`;
  }
  let lastKeys = {};
  function render() {
    const before = {}; app.querySelectorAll('.scroll[data-k]').forEach(el => { before[el.dataset.k] = el.scrollTop; });
    const ae = document.activeElement, focusId = ae && ae.id && app.contains(ae) ? ae.id : null, sel = focusId && ae.selectionStart;
    app.innerHTML = view() + sheet() + toastHtml();
    app.querySelectorAll('.scroll[data-k]').forEach(el => {
      const k = el.dataset.k;
      if (el.dataset.bottom) el.scrollTop = el.scrollHeight;
      else if (k in before) el.scrollTop = before[k];
      else if (lastKeys[k] != null && k.startsWith('todo')) el.scrollTop = lastKeys[k];
    });
    lastKeys = { ...lastKeys, ...before };
    if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); try { if (sel != null) el.setSelectionRange(sel, sel); } catch (e) {} } }
    if (S.tab === 'scan' && !S.openRun && !top() && T.cam && T.cam.on) attachCam();
    save();
  }
  setInterval(() => { app.querySelectorAll('[data-clock]').forEach(el => { const r = S.runs[el.dataset.clock]; if (r) el.textContent = dur(elapsed(r)); }); }, 1000);

  // refresh only the parts that depend on typing (keeps focus and keyboard)
  function refreshRun() {
    const w = wo(S.openRun), r = S.runs[S.openRun]; if (!w || !r) return;
    const c = cl(w), cur = stepOf(c, r.path[r.path.length - 1]);
    const nx = document.getElementById('next');
    if (r.review) { if (nx) nx.disabled = !(r.rv.result && r.rv.running); return; }
    if (nx) nx.disabled = !valid(r, cur);
    if (cur.type === 'number') {
      const out = isOut(cur, ansVal(r.answers[cur.id]));
      const box = document.getElementById('numbox'), blk = document.getElementById('outblk');
      if (box) box.classList.toggle('out', out);
      if (blk) { blk.hidden = !out; blk.style.display = out ? 'flex' : 'none'; }
    }
  }

  // ================= ACTIONS =================
  const curRun = () => { const w = wo(S.openRun), r = S.runs[S.openRun]; return w && r ? { w, r, c: cl(w), s: stepOf(cl(w), r.path[r.path.length - 1]) } : null; };
  const A = {
    tab(v) { if (v === 'scan' && S.tab !== 'scan') S.prevTab = S.tab; if (S.tab !== 'scan' || v !== 'scan') stopCam(); S.tab = v; S.stack = []; S.sheet = null; if (v === 'scan') autoCam(); render(); },
    home() { S.stack = []; S.tab = 'todo'; S.sheet = null; render(); },
    seg(v) { S.seg = v; render(); },
    toggleDone() { S.showDone = !S.showDone; render(); },
    back,
    openWo(id) { push({ v: 'wo', id }); },
    equip(id) { stopCam(); if (S.tab === 'scan') { S.tab = S.prevTab || 'todo'; } push({ v: 'equip', id }); },
    report(id) { stopCam(); if (S.tab === 'scan') S.tab = S.prevTab || 'todo'; T.draft.rep = null; T.photos.rep = []; push({ v: 'report', id }); },
    run(id) { stopCam(); const w = wo(id); if (w && !w.who.includes(ME) && !S.runs[id]) { w.who = [ME, ...w.who]; } S.stack = S.stack.filter(x => x.v !== 'reported'); if (S.tab === 'scan') S.tab = S.prevTab || 'todo'; startRun(id); },
    leaveRun() { S.openRun = null; S.sheet = null; render(); },
    chatSheet(id) { const w = wo(id); if (w) ensureWoChan(w); T.toast = null; S.sheet = { t: 'chat', id }; render(); },
    closeSheet() { S.sheet = null; render(); },
    pauseSheet() { T.draft.pause = null; S.sheet = { t: 'pause' }; render(); },
    pauseR(v) { T.draft.pause.reason = v; render(); },
    doPause() {
      const x = curRun(); if (!x) return; const d = T.draft.pause;
      x.r.elapsed = elapsed(x.r); x.r.status = 'paused'; x.r.resumedAt = null; x.r.touched = Date.now();
      x.w.waiting = d.reason === 'Other reason' ? (d.note || 'Paused') : d.reason;
      const n = x.r.path.length, total = n + remaining(x.c, x.s.id, x.r.answers);
      sysMsg(x.w.id, `Intervention paused at step ${n} of ${total}`);
      if (d.note) post(x.w.id, d.note, { tag: 'Handover' });
      x.w.pending = record('Intervention paused', woTitle(x.w)) || x.w.pending;
      S.openRun = null; S.sheet = null; S.stack = []; S.tab = 'todo'; S.seg = 'mine';
      toast('Paused · progress saved', 'pause_circle');
    },
    tick(i) { const x = curRun(); const o = x.s.options[+i]; const a = Array.isArray(x.r.answers[x.s.id]) ? x.r.answers[x.s.id] : []; x.r.answers[x.s.id] = a.includes(o) ? a.filter(y => y !== o) : [...a, o]; render(); },
    answer(v) { const x = curRun(); x.r.answers[x.s.id] = v; render(); },
    qty(v) { const x = curRun(); const [ref, d] = v.split('|'); const a = x.r.answers[x.s.id] || {}; a[ref] = Math.max(0, (a[ref] || 0) + +d); x.r.answers[x.s.id] = a; render(); },
    addPart() { S.sheet = { t: 'addPart' }; render(); },
    pickPart(ref) { const x = curRun(); if (x) { const a = x.r.answers[x.s.id] || {}; a[ref] = (a[ref] || 0) + 1; x.r.answers[x.s.id] = a; } S.sheet = null; render(); },
    next() {
      const x = curRun(); if (!x || !valid(x.r, x.s)) return;
      const nx = nextOf(x.c, x.s, x.r.answers);
      if (nx) x.r.path.push(nx); else x.r.review = true;
      render();
    },
    prev() { const x = curRun(); if (!x) return; if (x.r.review) x.r.review = false; else if (x.r.path.length > 1) x.r.path.pop(); render(); },
    goStep(i) { const x = curRun(); if (!x) return; x.r.path = x.r.path.slice(0, +i + 1); x.r.review = false; render(); },
    rv(v) { const x = curRun(); const [k, val] = v.split('|'); if (k === 'follow') x.r.rv.follow = !x.r.rv.follow; else x.r.rv[k] = val; render(); },
    closeRun() {
      const x = curRun(); if (!x) return; const rv = x.r.rv;
      x.w.status = 'Completed'; x.w.when = 'done'; x.w.time = clock(); x.w.result = rv.result; x.w.waiting = '';
      sysMsg(x.w.id, `Intervention closed · ${rv.result}`); if (rv.comment) post(x.w.id, rv.comment, { tag: 'Handover' });
      const q = record('Intervention closed', woTitle(x.w)); x.w.pending = q || x.w.pending;
      if (rv.follow) { const id = 'WO-' + S.nextId++; S.wos.push({ id, asset: x.w.asset, task: 'Follow-up', type: 'Corrective', prio: 'Medium', status: 'Requested', who: [], when: 'tomorrow', time: '—', cl: 'standard', desc: 'Follow-up from ' + x.w.id + '.', parts: [], pending: q || undefined }); if (q) S.queue.push({ label: 'Follow-up work order', sub: asset(x.w.asset).name, at: clock() }); }
      delete S.runs[x.w.id]; S.openRun = null; S.stack = []; S.tab = 'todo'; S.seg = 'mine';
      toast(q ? 'Intervention closed · will sync when online' : 'Intervention closed', 'task_alt');
    },
    doc(name) { S.sheet = { t: 'doc', id: name }; render(); },
    part(ref) { S.sheet = { t: 'part', id: ref }; render(); },
    dm(k) { const key = 'dm-' + k; if (!S.chans[key]) S.chans[key] = { kind: 'dm', other: k, msgs: [] }; S.sheet = null; S.tab = 'chat'; S.stack = [{ v: 'thread', id: key }]; render(); },
    chatF(v) { S.chatF = v; render(); },
    thread(k) { push({ v: 'thread', id: k }); },
    send(k) {
      const text = (T.draft[k] || '').trim(); if (!text) return;
      post(k, text); T.draft[k] = ''; render();
    },
    quick(v) {
      const k = S.sheet && S.sheet.t === 'chat' ? S.sheet.id : top() && top().id; if (!k) return;
      const x = curRun(); const step = x && x.w.id === k ? ` (step ${x.r.path.length})` : '';
      const text = { 'Need help': `Need help on this one${step}.`, 'Missing part': `Missing part${step} — can someone check the store?`, 'Take over': `Can someone take over this intervention? Progress is saved${step}.`, Handover: 'Handover: ' }[v];
      if (v === 'Handover') { T.draft[k] = text; render(); const el = document.getElementById('msg'); if (el) { el.focus(); el.setSelectionRange(text.length, text.length); } return; }
      post(k, text, { tag: v === 'Take over' ? 'Reassignment' : v === 'Need help' ? 'Help' : v });
      const rep = replyFor[v];
      if (rep && online()) setTimeout(() => { chan(k).msgs.push({ id: 'r' + Date.now(), who: rep[0], t: clock(), text: rep[1] }); if (S.sheet && S.sheet.t === 'chat' && S.sheet.id === k) markRead(k); save(); render(); }, 4500);
      render();
    },
    setQ(v) { S.q = v; render(); const el = document.getElementById('q'); if (el && v) { el.focus(); } },
    qf(v) { S.qf = v; render(); },
    closeScan() { stopCam(); S.tab = S.prevTab || 'todo'; render(); },
    camOn() { startCam(); },
    torch() { try { const tr = T.cam.stream.getVideoTracks()[0]; T.cam.torch = !T.cam.torch; tr.applyConstraints({ advanced: [{ torch: T.cam.torch }] }); } catch (e) {} },
    manual() { S.sheet = { t: 'manual' }; render(); setTimeout(() => { const el = document.getElementById('code'); if (el) el.focus(); }, 50); },
    findCode() { const el = document.getElementById('code'); const id = parseCode(el ? el.value : ''); if (id) A.scanned(id); else toast('No equipment with this code', 'search_off'); },
    scanned(id) { stopCam(); if (S.tab !== 'scan') { S.prevTab = S.tab; S.tab = 'scan'; } S.stack = []; S.sheet = { t: 'scan', id }; if (navigator.vibrate) navigator.vibrate(30); render(); },
    quickSheet(id) { T.draft.quick = null; S.sheet = { t: 'quick', id }; render(); },
    qpick(v) { T.draft.quick.pick = v; render(); },
    qissue(v) { T.draft.quick.issue = v; render(); },
    quickGo(id) {
      const d = T.draft.quick; let wid = d.pick;
      if (wid === 'new') { wid = 'WO-' + S.nextId++; S.wos.push({ id: wid, asset: id, task: d.issue, type: 'Corrective', prio: 'Medium', status: 'Scheduled', who: [ME], when: 'today', time: clock(), cl: 'standard', desc: 'Quick intervention started from the equipment QR code. Information to complete on the web.', parts: [], quick: true }); record('Quick intervention created', asset(id).name + ' — ' + d.issue); }
      A.run(wid);
    },
    rep(v) { const [k, val] = v.split('|'); T.draft.rep[k] = val; render(); },
    sendReport(id) {
      const d = T.draft.rep; const wid = 'WO-' + S.nextId++;
      const off = !online();
      S.wos.push({ id: wid, asset: id, task: d.issue, type: 'Corrective', prio: d.stop === 'Yes' ? 'Critical' : 'High', status: 'Requested', who: [], when: 'today', time: clock(), reported: 'Reported by you', cl: 'standard', desc: (d.text || 'Reported from the field.') + (d.stop === 'Yes' ? ' Production stopped.' : ''), parts: [], pending: off || undefined });
      if (off) S.queue.push({ label: 'Incident report', sub: asset(id).name + ' — ' + d.issue, at: clock() }); else S.lastSync = clock();
      S.stack = [{ v: 'reported', id: wid }]; render();
    },
    simOff() { S.simOff = !S.simOff; if (S.simOff) toast('You are offline · keep working, changes sync automatically', 'cloud_off'); else { render(); flush(); } render(); },
    reset() { if (!confirm('Reset the demo data?')) return; stopCam(); S = fresh(); T.photos = {}; T.draft = {}; render(); toast('Demo reset', 'restart_alt'); },
    flow(v) { // desktop side panel shortcuts
      stopCam(); S.sheet = null; S.openRun = null; S.stack = [];
      if (v === 'todo') { S.tab = 'todo'; S.seg = 'mine'; }
      if (v === 'run') { S.tab = 'todo'; S.stack = [{ v: 'wo', id: 'WO-1339859' }]; }
      if (v === 'scan') { S.prevTab = 'todo'; S.tab = 'scan'; }
      if (v === 'search') { S.tab = 'search'; S.q = 'seal'; S.qf = 'all'; }
      if (v === 'chat') { S.tab = 'chat'; }
      if (v === 'offline') { S.tab = 'todo'; if (!S.simOff) { S.simOff = true; toast('You are offline · keep working, changes sync automatically', 'cloud_off'); } }
      render();
    },
  };
  const I = {
    q(v) { S.q = v; const r = document.getElementById('sres'); if (r) { r.innerHTML = searchResults() + '<div class="pad-b"></div>'; r.scrollTop = 0; } save(); },
    num(v) { const x = curRun(); const a = x.r.answers[x.s.id] || {}; x.r.answers[x.s.id] = { value: v.replace(',', '.'), comment: a.comment || '' }; refreshRun(); save(); },
    numc(v) { const x = curRun(); const a = x.r.answers[x.s.id] || { value: '' }; a.comment = v; x.r.answers[x.s.id] = a; refreshRun(); save(); },
    text(v) { const x = curRun(); x.r.answers[x.s.id] = v; save(); },
    rvc(v) { const x = curRun(); x.r.rv.comment = v; save(); },
    msg(v, el) { T.draft[el.dataset.v] = v; const b = document.getElementById('send'); if (b) b.classList.toggle('on', !!v.trim()); },
    pnote(v) { T.draft.pause.note = v; },
    rept(v) { T.draft.rep.text = v; },
    code() {},
  };
  const F = {
    photo(file, el) { const x = curRun(); const sid = el.dataset.v; (T.photos[sid] = T.photos[sid] || []).push(URL.createObjectURL(file)); x.r.photos[sid] = (x.r.photos[sid] || 0) + 1; if (!online()) S.queue.push({ label: 'Photo', sub: woTitle(x.w), at: clock() }); render(); },
    repphoto(file) { (T.photos.rep = T.photos.rep || []).push(URL.createObjectURL(file)); T.draft.rep.photos++; render(); },
    chatphoto(file, el) { post(el.dataset.v, 'Photo', { photo: true }); render(); },
  };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    const fn = A[el.dataset.a]; if (!fn) return;
    e.preventDefault(); fn(el.dataset.v, el, e);
  });
  document.addEventListener('input', e => { const el = e.target.closest('[data-i]'); if (el && I[el.dataset.i]) I[el.dataset.i](el.value, el, e); });
  document.addEventListener('change', e => { const el = e.target.closest('[data-f]'); if (el && el.files && el.files[0] && F[el.dataset.f]) F[el.dataset.f](el.files[0], el); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const el = e.target;
    if (el.id === 'msg') { e.preventDefault(); A.send(el.dataset.v); }
    if (el.id === 'code') { e.preventDefault(); A.findCode(); }
    if (el.id === 'q' && S.q.trim() && !S.recent.includes(S.q.trim())) { S.recent = [S.q.trim(), ...S.recent].slice(0, 5); save(); el.blur(); }
    if (el.id === 'num') { el.blur(); }
  });

  // ================= QR scanning (BarcodeDetector, jsQR fallback) =================
  function parseCode(text) {
    if (!text) return null; text = String(text).trim();
    const m = text.match(/(?:scan=|RELIX:|asset[=/:])([A-Za-z0-9-]+)/i);
    const raw = (m ? m[1] : text).toUpperCase();
    return Object.keys(RX.ASSETS).find(id => id.toUpperCase() === raw) || null;
  }
  function autoCam() { if (window.matchMedia && matchMedia('(pointer: coarse)').matches) setTimeout(startCam, 50); }
  async function startCam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { T.cam = { on: false, err: 'Camera not available in this browser.' }; render(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (S.tab !== 'scan') { stream.getTracks().forEach(t => t.stop()); return; }
      T.cam = { on: true, stream }; render();
    } catch (e) { T.cam = { on: false, err: 'Camera blocked. Enter the code or try a demo code below.' }; render(); }
  }
  function attachCam() {
    const v = document.getElementById('vid'); if (!v || !T.cam || !T.cam.stream) return;
    if (v.srcObject !== T.cam.stream) { v.srcObject = T.cam.stream; v.play().catch(() => {}); }
    if (!T.cam.loop) scanLoop();
  }
  async function scanLoop() {
    T.cam.loop = true;
    let detector = null;
    if ('BarcodeDetector' in window) { try { detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) {} }
    if (!detector && !window.jsQR) await new Promise(res => { const s = document.createElement('script'); s.src = 'vendor/jsQR.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
    const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    const tick = async () => {
      if (!T.cam || !T.cam.on) return;
      const v = document.getElementById('vid');
      if (v && v.readyState >= 2) {
        let text = null;
        try {
          if (detector) { const r = await detector.detect(v); if (r[0]) text = r[0].rawValue; }
          else if (window.jsQR) { const w = 480, h = Math.round(480 * v.videoHeight / v.videoWidth) || 360; cv.width = w; cv.height = h; cx.drawImage(v, 0, 0, w, h); const r = window.jsQR(cx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' }); if (r) text = r.data; }
        } catch (e) {}
        const id = parseCode(text);
        if (id) { A.scanned(id); return; }
      }
      setTimeout(tick, 180);
    };
    tick();
  }
  function stopCam() { if (T.cam && T.cam.stream) T.cam.stream.getTracks().forEach(t => t.stop()); T.cam = null; }

  // deep links from printed QR codes: …/mobile/#scan=P-101
  function route() { const id = parseCode(location.hash.replace(/^#/, '')); if (id) { history.replaceState(null, '', location.pathname); S.openRun = null; A.scanned(id); } }
  window.addEventListener('hashchange', route);
  window.RelixFlow = v => A.flow(v);

  render(); route();
  if (online()) flush();
  if (S.runs['WO-1339859'] && !chan('WO-1339859').msgs.some(m => m.id === 'in1')) scheduleIncoming();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
