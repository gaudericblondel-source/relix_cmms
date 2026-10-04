// Relix shared collaboration model — work order store, participants, chat (WO / team / site), chat notifications.
// Used by WorkOrderPanel, QuickIntervention, Work Orders, Work Order, Intervention, Home, TopBar, ChatThread.
const WKEY = 'cmms.wo.store.v1', CKEY = 'cmms.chat.v2', NKEY = 'cmms.notif.chat.v1';
export const ME = 'GD';
export const PEOPLE = {
  GD: ['Gaudéric Durand', 'Maintenance Manager', '#FBE7EA', '#A30014', 'Gaudéric', 'Mechanical team'],
  MD: ['Marc Dupont', 'Mechanic', '#E6F4EE', '#0B6B4A', 'Marc', 'Mechanical team'],
  PL: ['Pierre Leroy', 'Mechanic', '#E8EEF9', '#2456B8', 'Pierre', 'Mechanical team'],
  AM: ['Alex Martin', 'Maintenance Technician', '#FEF3E2', '#B54708', 'Alex', 'Mechanical team'],
  SM: ['Sophie Martin', 'Electrician', '#F3EEFC', '#6941C6', 'Sophie', 'Electrical team'],
  SB: ['Sofia Benali', 'Electrician', '#E3F4F7', '#0E7490', 'Sofia', 'Electrical team'],
  JM: ['Julie Martin', 'Technician', '#FDECEC', '#B42318', 'Julie', 'Float Line team'],
  SL: ['Sarah Lambert', 'Storekeeper', '#E6F4EE', '#0B6B4A', 'Sarah', 'Stores'],
  HP: ['Hugo Petit', 'Maintenance Planner', '#E8EEF9', '#2456B8', 'Hugo', 'Planning'],
  CM: ['Claire Moreau', 'Reliability Engineer', '#F3EEFC', '#6941C6', 'Claire', 'Engineering'],
  LB: ['Lucas Bernard', 'Production Supervisor', '#EEF1F4', '#475467', 'Lucas', 'Production'],
  ER: ['Emma Roux', 'HSE', '#E6F4EE', '#0B6B4A', 'Emma', 'HSE'],
};
export const ROLES = ['Additional technician', 'Supervisor', 'Maintenance manager', 'Specialist', 'Follower'];
export const byName = n => Object.keys(PEOPLE).find(k => PEOPLE[k][0] === n);
export const person = k => { const p = PEOPLE[k] || ['Unknown', '', '#F2F4F7', '#98A2B3', '?', '']; return { key: k, name: p[0], role: p[1], avBg: p[2], avFg: p[3], handle: p[4], team: p[5], initials: k }; };

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const emit = (n, d) => { try { window.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} };
const pad = n => String(n).padStart(2, '0');
export const clock = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// ---------- Work orders ----------
const SEED_WO = {
  'WO-1339859': { task: 'Seal replacement', asset: 'Pump P-101', loc: 'Tempering Line', type: 'Corrective', prio: 'Critical', status: 'Overdue', assignee: 'SM', assignments: [{ key: 'SM', skills: ['ELE'], minutes: 15, offset: 0, label: 'Step 1' }, { key: 'PL', skills: ['MEC'], minutes: 50, offset: 15, label: 'Steps 2–6' }, { key: 'SM', skills: ['ELE'], minutes: 10, offset: 65, label: 'Step 7' }, { key: 'PL', skills: ['MEC'], minutes: 20, offset: 75, label: 'Steps 8–11' }], participants: [['GD', 'Maintenance manager'], ['SL', 'Specialist'], ['LB', 'Follower']], checklists: ['pump-seal'] },
  'WO-1339850': { task: 'Abnormal fan noise', asset: 'Fan V-12', loc: 'Float Line', type: 'Corrective', prio: 'High', status: 'In progress', assignee: 'AM', participants: [['GD', 'Maintenance manager'], ['MD', 'Additional technician']], checklists: ['standard'] },
  'home-p2': { task: 'Filter replacement', asset: 'Compressor C-01', loc: 'Utilities', type: 'Preventive', prio: 'Medium', status: 'In progress', assignee: 'SM', participants: [['GD', 'Maintenance manager'], ['SL', 'Specialist']], checklists: ['standard'] },
  'home-p1': { task: 'Abnormal vibration', asset: 'Fan V-12', loc: 'Float Line', type: 'Corrective', prio: 'High', status: 'In progress', assignee: 'GD', participants: [['MD', 'Additional technician'], ['CM', 'Specialist']], checklists: ['standard'] },
};
const DISPLAY = { 'home-p1': 'WO-1339852', 'home-p2': 'WO-1339844' };
export const displayId = key => { if (!key) return ''; if (/^WO-/.test(key)) return key; if (DISPLAY[key]) return DISPLAY[key]; let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 9000; return 'WO-133' + String(1000 + h).padStart(4, '0'); };
export const woHref = (key, w) => { w = w || getWo(key) || {}; return 'Work Order.dc.html?' + new URLSearchParams({ wo: key, task: w.task || '', asset: w.asset || '', loc: w.loc || '', type: w.type || 'Corrective', prio: w.prio || 'Medium', status: w.status || 'Scheduled' }).toString(); };
export const getWo = key => { const st = read(WKEY, {}); return st[key] ? { ...(SEED_WO[key] || {}), ...st[key], key } : SEED_WO[key] ? { ...SEED_WO[key], key } : null; };
export const saveWo = (key, patch) => { const st = read(WKEY, {}); st[key] = { ...(st[key] || SEED_WO[key] || {}), ...patch }; write(WKEY, st); emit('cmms-wo', { key }); return getWo(key); };
export const createdWos = () => { const st = read(WKEY, {}); return Object.keys(st).filter(k => st[k].created).map(k => ({ ...st[k], key: k })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); };
export const nextKey = () => { const st = read(WKEY, {}); const n = Object.keys(st).filter(k => st[k].created).length; return 'WO-' + (1339912 + n); };
export const createWo = w => { const key = w.key || nextKey(); saveWo(key, { ...w, created: true, createdAt: Date.now() }); return key; };
export const assigneesOf = w => [...new Set([...(w.assignments || []).map(a => a.key), w.assignee].filter(Boolean))];
export const participantsOf = key => { const w = getWo(key); if (!w) return []; const out = []; assigneesOf(w).forEach(k => out.push([k, 'Assigned to'])); (w.participants || []).forEach(p => { if (!out.some(o => o[0] === p[0])) out.push(p); }); return out; };
export const missingInfo = w => { if (!w) return []; const m = []; if (!w.prio) m.push('Priority'); if (!w.assignee) m.push('Assigned to'); if (!w.desc && w.quick) m.push('Description'); if (w.quick && !w.cat) m.push('Failure category'); return m; };

// ---------- Chat ----------
export const CHANNELS = {
  team: { kind: 'team', title: 'Mechanical team', icon: 'groups', members: ['GD', 'MD', 'PL', 'AM', 'SL', 'HP'], info: '6 members · 4 on shift' },
  'team-leads': { kind: 'team', title: 'Maintenance leads', icon: 'groups', members: ['GD', 'HP', 'CM', 'LB', 'SL'], info: 'Managers, planning, reliability, stores' },
  'team-elec': { kind: 'team', title: 'Electrical team', icon: 'groups', members: ['SM', 'SB', 'JM', 'HP'], info: '4 members' },
  site: { kind: 'site', title: 'Site channel', icon: 'factory', members: Object.keys(PEOPLE), info: 'Thourotte Plant · maintenance, production, HSE' },
};
export const myTeams = (me = ME) => Object.keys(CHANNELS).filter(k => CHANNELS[k].kind === 'team' && CHANNELS[k].members.includes(me)).map(k => ({ key: k, ...CHANNELS[k] }));
export const REFS = [
  ['Equipment', 'Pump P-101', 'Tempering Line', 'Asset Detail.dc.html'],
  ['Equipment', 'Conveyor Line 3', 'Float Line', 'Asset Detail.dc.html'],
  ['Work order', 'Pump P-101 — Seal replacement', 'WO-1339859', woHref('WO-1339859', SEED_WO['WO-1339859'])],
  ['Work order', 'Fan V-12 — Abnormal fan noise', 'WO-1339850', woHref('WO-1339850', SEED_WO['WO-1339850'])],
  ['Intervention', 'Fan V-12 — Abnormal vibration', 'Paused · 3 of 7', woHref('home-p1', SEED_WO['home-p1'])],
  ['Spare part', 'Drive belt BPU280', '2 in stock', 'Spare Parts.dc.html?q=BLT-BPU280'],
  ['Spare part', 'Mechanical seal 45 mm', '3 in stock', 'Spare Parts.dc.html?q=SEAL-M45'],
].map(([kind, label, meta, href]) => ({ kind, label, meta, href }));
const R = l => REFS.find(r => r.label === l) || null;
const S = (id, who, t, text, x = {}) => ({ id, who, t, text, ...x });
const SEED_CHAT = {
  team: [
    S('t1', 'MD', '07:52', 'Shift handover: Annealing Lehr rollers still out of alignment on the drive side. Dial gauge left on the cart.', { tag: 'Handover' }),
    S('t2', 'SM', '08:40', 'Filter housing on C-01 is cracked — paused the intervention, progress is saved. Need a new housing before I can finish.'),
    S('t3', 'PL', '09:05', '@Gaudéric can someone check this pump after the current intervention? Seal is weeping again.', { ref: R('Pump P-101'), tag: 'Help' }),
    S('t4', 'GD', '09:12', "I'll take it right after the sensor check on Conveyor 3.", { ref: R('Pump P-101 — Seal replacement') }),
    S('t5', 'SL', '09:20', 'Only 2 BPU280 belts left — I reserved one for Dryer S-01.', { ref: R('Drive belt BPU280') }),
    S('t6', 'AM', '09:48', "Called to the Tin Bath breakdown — I've asked for someone to take over Fan V-12.", { ref: R('Fan V-12 — Abnormal fan noise') }),
  ],
  'team-leads': [
    S('l1', 'HP', '07:45', 'Backlog review moved to 15:00 today. I added the Tin Bath roller replacement — needs a decision on overtime.', { ref: R('Pump P-101 — Seal replacement') }),
    S('l2', 'CM', '08:20', 'Vibration trend on Fan V-12 keeps climbing. Suggest we switch it to predictive monitoring weekly.', { ref: R('Fan V-12 — Abnormal vibration') }),
    S('l3', 'SL', '08:52', 'Supplier confirms ATV320 drive delivery Oct 6. I will reserve it on the Conveyor 3 work order.'),
  ],
  'team-elec': [S('e1', 'SM', '08:10', 'Thermography on cabinet E-4 moved to 16:00.')],
  site: [
    S('s1', 'LB', '07:30', 'Float Line speed reduced to 80% from 14:00 for the glass thickness change.', { ref: R('Conveyor Line 3') }),
    S('s2', 'ER', '08:05', 'Reminder: hot work permits required in the Tempering zone all week.'),
    S('s3', 'HP', '08:50', 'Planned shutdown of Line 2 on Oct 8. Please submit work orders for it by Friday.'),
  ],
  'WO-1339859': [
    S('w1', 'sys', '07:31', 'Work order created by L. Petit · night shift'),
    S('w2', 'PL', '07:40', 'Seal is weeping again on the drive side. @Sarah can you check whether we have the 45 mm seal in stock?', { tag: 'Missing part' }),
    S('w3', 'SL', '07:52', '3 in stock, store A-07. I reserved one on this work order.', { ref: R('Mechanical seal 45 mm') }),
    S('w4', 'GD', '08:05', 'Thanks. @Pierre start as soon as Conveyor 3 is done — production wants the backup line freed by noon.'),
    S('w5', 'PL', '08:10', 'OK. Lockout planned for 09:30.'),
  ],
  'WO-1339850': [
    S('f1', 'AM', '09:02', 'Started — the vibration is clearly on the motor-side bearing.', { photo: true }),
    S('f2', 'sys', '09:46', 'Intervention paused at step 3 of 6'),
    S('f3', 'AM', '09:48', "I've been called to another breakdown on the Tin Bath. Can someone take this intervention? Progress is saved at step 3.", { tag: 'Reassignment' }),
  ],
  'home-p2': [
    S('p1', 'sys', '08:38', 'Intervention paused at step 4 of 6'),
    S('p2', 'SM', '08:40', 'Filter housing is cracked — paused here, progress saved. @Sarah do we have a C-01 housing in stock?', { tag: 'Missing part', photo: true }),
    S('p3', 'SL', '08:58', 'None in stock. Ordered this morning, delivery expected Oct 1.'),
  ],
  'home-p1': [
    S('h1', 'GD', '08:55', 'Paused at step 4 — waiting for the bearing puller from the workshop.', { tag: 'Handover' }),
    S('h2', 'MD', '09:10', 'Puller is on the cart next to the press, help yourself.'),
  ],
};
const chatState = () => read(CKEY, { msgs: {}, seen: {} });
export const messages = ch => { const st = chatState(); return st.msgs[ch] || SEED_CHAT[ch] || []; };
export const channelInfo = ch => {
  if (CHANNELS[ch]) return { kind: ch, ...CHANNELS[ch] };
  const w = getWo(ch);
  return { kind: 'wo', title: w ? `${w.asset} — ${w.task}` : displayId(ch), icon: 'build', woKey: ch, displayId: displayId(ch), href: woHref(ch, w), members: participantsOf(ch).map(p => p[0]), status: w && w.status };
};
export const unread = ch => { const st = chatState(); const n = messages(ch).length; const seen = st.seen[ch] != null ? st.seen[ch] : (ch === 'team' ? n - 2 : ch === 'team-leads' ? n - 1 : ch === 'team-elec' ? n : ch === 'site' ? n - 1 : ch === 'WO-1339850' ? n - 1 : n); return Math.max(0, n - seen); };
export const markSeen = ch => { const st = chatState(); st.seen[ch] = messages(ch).length; write(CKEY, st); emit('cmms-chat', { ch, seen: true }); };
export const woThreads = (me = ME) => {
  const keys = new Set([...Object.keys(SEED_CHAT).filter(k => !CHANNELS[k]), ...Object.keys(chatState().msgs).filter(k => !CHANNELS[k])]);
  return [...keys].filter(k => participantsOf(k).some(p => p[0] === me)).map(k => { const m = messages(k), last = m[m.length - 1]; return { key: k, ...channelInfo(k), last, unread: unread(k) }; })
    .sort((a, b) => (b.unread - a.unread) || ((b.last && b.last.t) || '').localeCompare((a.last && a.last.t) || ''));
};
export const parse = text => { const out = []; const re = /@([A-Za-zÀ-ÿ]+)/g; let i = 0, m; while ((m = re.exec(text))) { const k = Object.keys(PEOPLE).find(p => PEOPLE[p][4].toLowerCase() === m[1].toLowerCase()); if (!k) continue; if (m.index > i) out.push({ t: text.slice(i, m.index) }); out.push({ t: '@' + PEOPLE[k][4], mention: k }); i = m.index + m[0].length; } if (i < text.length) out.push({ t: text.slice(i) }); return out; };
export const mentionsOf = text => parse(text).filter(s => s.mention).map(s => s.mention);
const linkTo = (ch, id) => { const info = channelInfo(ch); return info.kind === 'wo' ? `${info.href}&chat=1&msg=${id}` : `Home.dc.html?chat=${ch}&msg=${id}`; };

// ---------- Notifications from chat ----------
const SEED_NOTIF = [
  { id: 'c-t3', type: 'mention', lvl: 'imp', icon: 'alternate_email', kind: 'Pierre Leroy mentioned you', title: '“Can someone check this pump after the current intervention?”', sub: 'Mechanical team · Pump P-101', ago: '45 min', ch: 'team', msg: 't3' },
  { id: 'c-f3', type: 'reassign', lvl: 'imp', icon: 'swap_horiz', kind: 'Reassignment requested', title: 'Fan V-12 — Abnormal fan noise', sub: 'Alex Martin: “Can someone take this intervention?”', ago: '20 min', ch: 'WO-1339850', msg: 'f3' },
  { id: 'c-h2', type: 'wo-message', lvl: 'info', icon: 'forum', kind: 'New message in your work order', title: 'Fan V-12 — Abnormal vibration', sub: 'Marc Dupont: “Puller is on the cart next to the press…”', ago: '1 h', ch: 'home-p1', msg: 'h2' },
];
export const notifications = () => read(NKEY, null) || SEED_NOTIF.map(n => ({ ...n }));
export const notifHref = n => linkTo(n.ch, n.msg);
const pushNotif = n => { const all = notifications(); const item = { ...n, ago: 'now', id: 'c-' + n.msg + '-' + Date.now().toString(36) }; all.unshift(item); write(NKEY, all.slice(0, 30)); emit('cmms-notif', { ...item, href: linkTo(n.ch, n.msg) }); };

let mid = 0;
export const post = (ch, who, text, x = {}) => {
  const st = chatState(); const list = (st.msgs[ch] || SEED_CHAT[ch] || []).slice();
  const msg = { id: 'm' + Date.now().toString(36) + (mid++), who, t: clock(), text, ...x };
  list.push(msg); st.msgs[ch] = list; if (who === ME) st.seen[ch] = list.length; write(CKEY, st);
  const info = channelInfo(ch), where = info.kind === 'wo' ? info.title : info.title, p = person(who);
  const mentioned = mentionsOf(text);
  if (who !== ME) {
    if (mentioned.includes(ME)) pushNotif({ type: 'mention', lvl: 'imp', icon: 'alternate_email', kind: `${p.name} mentioned you`, title: `“${text.length > 80 ? text.slice(0, 78) + '…' : text}”`, sub: where, ch, msg: msg.id });
    else if (x.tag === 'Reassignment') pushNotif({ type: 'reassign', lvl: 'imp', icon: 'swap_horiz', kind: 'Reassignment requested', title: where, sub: `${p.name}: “${text.slice(0, 60)}…”`, ch, msg: msg.id });
    else if (info.kind === 'wo' && participantsOf(ch).some(q => q[0] === ME) && (x.tag || x.photo)) pushNotif({ type: 'wo-message', lvl: 'info', icon: 'forum', kind: 'New message in your work order', title: where, sub: `${p.name}: “${text.slice(0, 60)}”`, ch, msg: msg.id });
  }
  emit('cmms-chat', { ch, id: msg.id });
  // Demo: people you @mention answer back a moment later.
  if (who === ME) mentioned.filter(k => k !== ME).slice(0, 1).forEach(k => setTimeout(() => post(ch, k, k === 'SL' ? '@Gaudéric checking the store now — I\'ll reserve it on this work order if we have it.' : '@Gaudéric seen — I\'ll get back to you here in a few minutes.'), 2600));
  return msg;
};

if (typeof window !== 'undefined') window.RelixCollab = { assigneesOf, myTeams, displayId, ME, PEOPLE, ROLES, byName, person, woHref, getWo, saveWo, createdWos, nextKey, createWo, participantsOf, missingInfo, CHANNELS, REFS, messages, channelInfo, unread, markSeen, woThreads, parse, mentionsOf, notifications, notifHref, post, clock };
