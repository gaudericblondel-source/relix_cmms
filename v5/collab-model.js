// Relix shared collaboration model — intervention store, participants, chat (WO / team / site), chat notifications.
// Used by WorkOrderPanel, QuickIntervention, Interventions, Intervention, Intervention, Home, TopBar, ChatThread.
import * as AC from './access-model.js';
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
// Team comes from Teams & users (access-model); users invited later fall back to their access profile.
export const person = k => { const t = (AC.teamsOf(k)[0] || {}).name; let p = PEOPLE[k]; if (!p) { const u = AC.user(k); p = u ? [u.name, AC.role(u.role).name, '#EEF1F4', '#475467', u.name.split(' ')[0], ''] : ['Unknown', '', '#F2F4F7', '#98A2B3', '?', '']; } return { key: k, name: p[0], role: p[1], avBg: p[2], avFg: p[3], handle: p[4], team: t || p[5], initials: k }; };

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const emit = (n, d) => { try { window.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} };
const pad = n => String(n).padStart(2, '0');
export const clock = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// ---------- Interventions ----------
const SEED_WO = {
  'WO-1339859': { task: 'Seal replacement', asset: 'Pump P-101', loc: 'Tempering Line', type: 'Corrective', prio: 'Critical', status: 'Scheduled', assignee: 'SM', assignments: [{ key: 'SM', skills: ['ELE'], minutes: 15, offset: 0, label: 'Step 1' }, { key: 'PL', skills: ['MEC'], minutes: 50, offset: 15, label: 'Steps 2–6' }, { key: 'SM', skills: ['ELE'], minutes: 10, offset: 65, label: 'Step 7' }, { key: 'PL', skills: ['MEC'], minutes: 20, offset: 75, label: 'Steps 8–11' }], participants: [['GD', 'Maintenance manager'], ['SL', 'Specialist'], ['LB', 'Follower']], checklists: ['pump-seal'] },
  'WO-1339850': { task: 'Abnormal fan noise', asset: 'Fan V-12', loc: 'Float Line', type: 'Corrective', prio: 'High', status: 'In progress', assignee: 'AM', participants: [['GD', 'Maintenance manager'], ['MD', 'Additional technician']], checklists: ['standard'] },
  'home-p2': { task: 'Filter replacement', asset: 'Compressor C-01', loc: 'Utilities', type: 'Preventive', prio: 'Medium', status: 'In progress', assignee: 'SM', participants: [['GD', 'Maintenance manager'], ['SL', 'Specialist']], checklists: ['standard'] },
  'home-p1': { task: 'Abnormal vibration', asset: 'Fan V-12', loc: 'Float Line', type: 'Corrective', prio: 'High', status: 'In progress', assignee: 'GD', participants: [['MD', 'Additional technician'], ['CM', 'Specialist']], checklists: ['standard'] },
};
const DISPLAY = { 'home-p1': 'WO-1339852', 'home-p2': 'WO-1339844' };
export const displayId = key => { if (!key) return ''; if (/^WO-/.test(key)) return key; if (DISPLAY[key]) return DISPLAY[key]; let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 9000; return 'WO-133' + String(1000 + h).padStart(4, '0'); };
export const woHref = (key, w) => { w = w || getWo(key) || {}; return 'WorkOrder.dc.html?' + new URLSearchParams({ wo: key, task: w.task || '', asset: w.asset || '', loc: w.loc || '', type: w.type || 'Corrective', prio: w.prio || 'Medium', status: w.status || 'Scheduled' }).toString(); };
export const getWo = key => { const st = read(WKEY, {}); return st[key] ? { ...(SEED_WO[key] || {}), ...st[key], key } : SEED_WO[key] ? { ...SEED_WO[key], key } : null; };
// Audit trail: every tracked change is appended to w.history [{at, by, what | field/from/to}].
const TRACK = { status: 'Status', prio: 'Priority', assignee: 'Assigned to', due: 'Planned date', waiting: 'Waiting', type: 'Type', task: 'Title', asset: 'Asset' };
export const saveWo = (key, patch) => { const st = read(WKEY, {}); const prev = st[key] || SEED_WO[key] || {}, exists = !!(st[key] || SEED_WO[key]), h = (prev.history || []).slice(), now = Date.now();
  if (!patch.history) { if (patch.created && !prev.created) h.push({ at: now, by: patch.createdBy === 'system' ? 'system' : (patch.createdBy || ME), what: patch.generatedBy ? 'Generated from maintenance plan' : patch.quick ? 'Quick intervention started' : 'Created' });
    else if (exists) Object.keys(TRACK).forEach(f => { if (f in patch && String(patch[f] ?? '') !== String(prev[f] ?? '')) h.push({ at: now, by: ME, field: TRACK[f], from: prev[f] ?? '', to: patch[f] ?? '' }); });
    if (patch.completion && !prev.completion) h.push({ at: now, by: ME, what: 'Completed' + (patch.logged ? ' (recorded after the fact)' : '') }); }
  st[key] = { ...prev, ...patch, history: patch.history || h.slice(-60) }; write(WKEY, st); emit('cmms-wo', { key }); return getWo(key); };
export const historyOf = key => { const w = getWo(key); return (w && w.history) || []; };
export const logWo = (key, what) => { const w = getWo(key) || {}; saveWo(key, { history: [...(w.history || []), { at: Date.now(), by: ME, what }].slice(-60) }); };
export const createdWos = () => { const st = read(WKEY, {}); return Object.keys(st).filter(k => st[k].created).map(k => ({ ...st[k], key: k })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); };
// Every known intervention (seed + created in Relix), normalised status, with lateness against the reference day.
// Interventions list seed (same rows as WorkOrders.dc.html), as lightweight records for counts and alerts.
const LIST_SEED = {"WO-1339859":{"task":"Seal replacement","type":"Corrective","assetCode":"P-101","asset":"P-101","status":"Scheduled","prio":"Critical","due":"2026-09-27T08:00","waiting":"","late":true},"WO-1339855":{"task":"Bearing replacement","type":"Corrective","assetCode":"FT2-FR-001","asset":"FT2-FR-001","status":"Scheduled","prio":"Critical","due":"2026-09-28T14:00","waiting":"","late":true},"WO-1339861":{"task":"High motor temperature","type":"Inspection","assetCode":"CV-L3","asset":"CV-L3","status":"Scheduled","prio":"High","due":"2026-09-30T09:00","waiting":"","late":false},"WO-1339848":{"task":"1000 h preventive service","type":"Preventive","assetCode":"CV-L2","asset":"CV-L2","status":"Scheduled","prio":"Medium","due":"2026-10-02T10:00","waiting":"","late":false},"WO-1339835":{"task":"Variable speed drive replacement","type":"Corrective","assetCode":"CV-L3","asset":"CV-L3","status":"In progress","prio":"High","due":"2026-09-29T13:00","waiting":"","late":false},"WO-1339850":{"task":"Abnormal fan noise","type":"Corrective","assetCode":"V-12","asset":"V-12","status":"In progress","prio":"High","due":"2026-09-29T11:00","waiting":"","late":false},"WO-1339836":{"task":"Hydraulic leak repair","type":"Corrective","assetCode":"PH-030","asset":"PH-030","status":"In progress","prio":"High","due":"2026-09-29T08:30","waiting":"parts","late":false},"WO-1339851":{"task":"Safety sensor check","type":"Inspection","assetCode":"RP-01","asset":"RP-01","status":"Scheduled","prio":"Medium","due":"2026-10-01T10:00","waiting":"","late":false},"WO-1339828":{"task":"Drive replacement ATV320","type":"Corrective","assetCode":"CV-L3","asset":"CV-L3","status":"Not scheduled","prio":"High","due":"","waiting":"parts","late":false},"WO-1339826":{"task":"Temperature sensor replacement","type":"Corrective","assetCode":"FT1-FR-001","asset":"FT1-FR-001","status":"Scheduled","prio":"Medium","due":"2026-10-04T09:00","waiting":"parts","late":false},"WO-1339870":{"task":"Abnormal noise on belt","type":"Corrective","assetCode":"CV-L2","asset":"CV-L2","status":"Requested","prio":"Medium","due":"","waiting":"","late":false},"WO-1339872":{"task":"Compressor pressure drop","type":"Corrective","assetCode":"C-01","asset":"C-01","status":"Not scheduled","prio":"High","due":"","waiting":"supplier","late":false},"WO-1339815":{"task":"Bearing lubrication","type":"Preventive","assetCode":"CV-L2","asset":"CV-L2","status":"Completed","prio":"Low","due":"2026-09-26T09:00","waiting":"","late":false},"WO-1339814":{"task":"Air filter cleaning","type":"Preventive","assetCode":"C-01","asset":"C-01","status":"Completed","prio":"Medium","due":"2026-09-25T14:00","waiting":"","late":false}};
export const allWos = () => { const keys = [...new Set([...Object.keys(LIST_SEED), ...Object.keys(SEED_WO), ...createdWos().map(w => w.key)])]; return keys.map(k => { const g = getWo(k), l = LIST_SEED[k]; return l ? { ...l, ...(g || {}), key: k, due: (g && g.due) || l.due, status: (g && read(WKEY, {})[k] && read(WKEY, {})[k].status) || l.status } : g; }).filter(Boolean).map(w => { const n = norm(w.status, w.waiting, w.due); return { ...w, status: n.status, waiting: n.waiting, late: (w.late && w.status !== 'Completed') || n.overdue || (w.status !== 'Completed' && w.status !== 'Rejected' && !!w.due && w.due.slice(0, 10) < '2026-09-29') }; }); };
export const nextKey = () => { const st = read(WKEY, {}); const n = Object.keys(st).filter(k => st[k].created).length; return 'WO-' + (1339912 + n); };
export const createWo = w => { const key = w.key || nextKey(); saveWo(key, { ...w, created: true, createdAt: Date.now() }); return key; };
export const assigneesOf = w => [...new Set([...(w.assignments || []).map(a => a.key), w.assignee].filter(Boolean))];
export const participantsOf = key => { const w = getWo(key); if (!w) return []; const out = []; assigneesOf(w).forEach(k => out.push([k, 'Assigned to'])); (w.participants || []).forEach(p => { if (!out.some(o => o[0] === p[0])) out.push(p); }); return out; };

// ---------- Intervention workflow: Requested → Not scheduled → Scheduled → In progress → Completed. "Waiting" is a flag that can coexist with any open status.
// Requested = a request not accepted yet (accept or reject). Not scheduled = accepted, no date. Scheduled = accepted with a date.
export const FLOW = ['Requested', 'Not scheduled', 'Scheduled', 'In progress', 'Completed'];
export const STATUS_LOOK = { Requested: ['#F3EEFC', '#6941C6', '#7F56D9'], 'Not scheduled': ['#F0F4F8', '#3E5470', '#7A8CA5'], Scheduled: ['#EAF1FD', '#2456B8', '#2E6BE6'], 'In progress': ['#E6F4EE', '#0B6B4A', '#12A06E'], Completed: ['#EEF1F4', '#475467', '#98A2B3'], Rejected: ['#EEF1F4', '#667085', '#C4CAD4'], Overdue: ['#FDECEC', '#B42318', '#D92D20'] };
export const WAIT = { parts: ['Waiting for spare parts', 'inventory_2'], paused: ['Intervention paused', 'pause_circle'], dependency: ['Waiting for another job', 'link'], access: ['Waiting for equipment access', 'lock_clock'], approval: ['Waiting for approval', 'approval'], supplier: ['Waiting for external provider', 'handshake'] };
export const WAIT_LOOK = ['#FEF3E2', '#B54708'];
// Normalises legacy values ("Waiting for parts", "Overdue") into { status, waiting, overdue }.
export const norm = (status, waiting, date) => { let st = status || 'Requested', w = waiting || '', overdue = false;
  if (st === 'Waiting for parts') { st = date ? 'Scheduled' : 'Not scheduled'; w = w || 'parts'; }
  if (st === 'Paused') { st = 'In progress'; w = w || 'paused'; }
  if (st === 'Overdue') { st = 'Scheduled'; overdue = true; }
  return { status: st, waiting: w, overdue }; };
export const waitLabel = w => (WAIT[w] || [w ? 'Waiting' : ''])[0];
// Drag & drop / manual status changes must follow the real operational workflow.
// ok:false + action 'accept' | 'schedule' → the caller opens the accept / schedule dialog (window.RelixAccept).
export const moveCheck = (from, to) => {
  if (from === to) return { ok: false, silent: true };
  if (from === 'Completed') return { ok: false, reason: 'A completed intervention cannot be moved. Reopen it from the intervention if more work is needed.' };
  if (to === 'Requested') return { ok: false, reason: from === 'In progress' ? 'The intervention has already started.' : 'This intervention has already been accepted — it cannot go back to Requested. Reject or cancel it instead.' };
  if (from === 'Requested' && (to === 'Not scheduled' || to === 'Scheduled')) return { ok: false, dialog: true, action: 'accept', mode: to === 'Scheduled' ? 'schedule' : 'later' };
  if (to === 'In progress') return from === 'Requested' ? { ok: false, reason: 'A request must be accepted before work starts.', action: 'accept', actionLabel: 'Accept request' } : { ok: false, reason: 'An intervention becomes In progress only when it is started.', action: 'start', actionLabel: 'Start intervention' };
  if (to === 'Completed') return from === 'In progress' ? { ok: false, reason: 'An intervention is completed only when it is closed (Review & close).', action: 'resume', actionLabel: 'Resume intervention' } : from === 'Requested' ? { ok: false, reason: 'A request must be accepted before it can be completed.', action: 'accept', actionLabel: 'Accept request' } : { ok: false, reason: 'The intervention has not started yet — it cannot be completed.', action: 'start', actionLabel: 'Start intervention' };
  if (from === 'In progress') return { ok: false, reason: 'The intervention has already started. To stop working on it, pause it — it stays In progress and is flagged Waiting.', action: 'wait', actionLabel: 'Mark as waiting' };
  if (from === 'Not scheduled' && to === 'Scheduled') return { ok: false, dialog: true, action: 'schedule', mode: 'schedule' };
  if (from === 'Scheduled' && to === 'Not scheduled') return { ok: true, patch: { due: '' }, note: 'Date removed — back in Not scheduled.' };
  return { ok: true };
};
// Accept a request (an R- intervention request or an intervention in Requested): no date → Not scheduled, date → Scheduled.
export const acceptRequest = (id, o = {}) => { const date = o.date || '', status = date ? 'Scheduled' : 'Not scheduled';
  if (/^R-/.test(id)) { const r = getRequest(id); if (!r) return null; const title = o.title || r.problem || shortReq(r.text);
    const key = createWo({ task: title, asset: r.asset, assetCode: r.assetCode, loc: r.loc, type: 'Corrective', prio: o.prio || 'Medium', status, due: date, desc: r.text, problem: r.problem || '', fromRequest: id, createdBy: ME, assignee: o.assignee || '', participants: [[r.by, 'Follow-up']] });
    updateRequest(id, { status: 'accepted', wo: key, woTask: title, woPrio: o.prio || 'Medium', decidedBy: ME });
    emit('cmms-wo-created', { key, title: `${r.asset} — ${title}`, asset: r.assetCode || r.asset, type: 'Corrective', prio: o.prio || 'Medium', status, date, fromRequest: id }); return { key, status }; }
  saveWo(id, { status, due: date, ...(o.prio ? { prio: o.prio } : {}), ...(o.assignee ? { assignee: o.assignee } : {}), acceptedBy: ME }); return { key: id, status }; };
export const scheduleWo = (key, date) => saveWo(key, { status: date ? 'Scheduled' : 'Not scheduled', due: date || '' });
export const rejectRequest = (id, note = '') => { if (/^R-/.test(id)) return updateRequest(id, { status: 'rejected', note, decidedBy: ME }); return saveWo(id, { status: 'Rejected', rejectNote: note }); };
const shortReq = t => { const s = String(t || '').split(/[.—–\-]/)[0].trim(); return s.length > 48 ? s.slice(0, 46) + '…' : s || 'Intervention request'; };
export const setWaiting = (key, waiting, note) => saveWo(key, { waiting: waiting || '', waitNote: note || '' });
export const missingInfo = w => { if (!w) return []; const m = []; if (!w.prio) m.push('Priority'); if (!w.assignee) m.push('Assigned to'); if (!w.desc && w.quick) m.push('Description'); if (w.quick && !w.cat) m.push('Failure origin'); return m; };

// ---------- Chat ----------
export const CHANNELS = {
  team: { kind: 'team', title: 'Mechanical team', icon: 'groups', members: ['GD', 'MD', 'PL', 'AM', 'SL', 'HP'], info: '6 members · 4 on shift' },
  'team-leads': { kind: 'team', title: 'Maintenance leads', icon: 'groups', members: ['GD', 'HP', 'CM', 'LB', 'SL'], info: 'Managers, planning, reliability, stores' },
  'team-elec': { kind: 'team', title: 'Electrical team', icon: 'groups', members: ['SM', 'SB', 'JM', 'HP'], info: '4 members' },
  site: { kind: 'site', title: 'Site channel', icon: 'factory', members: Object.keys(PEOPLE), info: 'Thourotte Plant · maintenance, production, HSE' },
};
// Team channels mirror the teams managed in Teams & users (one channel per team, members kept in sync).
const syncTeams = () => { Object.keys(CHANNELS).forEach(k => { if (CHANNELS[k].kind === 'team') delete CHANNELS[k]; });
  AC.teams().forEach(t => { CHANNELS[t.id] = { kind: 'team', title: t.name, icon: t.icon || 'groups', members: [...t.members], info: `${t.members.length} member${t.members.length === 1 ? '' : 's'}${t.spec ? ' · ' + t.spec : ''}` }; }); };
syncTeams();
if (typeof window !== 'undefined') window.addEventListener('cmms-access', e => { if (!e.detail || e.detail.teams || e.detail.users) { syncTeams(); emit('cmms-chat', { teams: true }); } });
export const isDm = ch => /^dm-/.test(ch || '');
export const dmKey = k => 'dm-' + k;
export const myTeams = (me = ME) => Object.keys(CHANNELS).filter(k => CHANNELS[k].kind === 'team' && CHANNELS[k].members.includes(me)).map(k => ({ key: k, ...CHANNELS[k] }));
export const REFS = [
  ['Equipment', 'Pump P-101', 'Tempering Line', 'AssetDetail.dc.html'],
  ['Equipment', 'Conveyor Line 3', 'Float Line', 'AssetDetail.dc.html'],
  ['Intervention', 'Pump P-101 — Seal replacement', 'WO-1339859', woHref('WO-1339859', SEED_WO['WO-1339859'])],
  ['Intervention', 'Fan V-12 — Abnormal fan noise', 'WO-1339850', woHref('WO-1339850', SEED_WO['WO-1339850'])],
  ['Intervention', 'Fan V-12 — Abnormal vibration', 'Paused · 3 of 7', woHref('home-p1', SEED_WO['home-p1'])],
  ['Spare part', 'Drive belt BPU280', '2 in stock', 'SpareParts.dc.html?q=BLT-BPU280'],
  ['Spare part', 'Mechanical seal 45 mm', '3 in stock', 'SpareParts.dc.html?q=SEAL-M45'],
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
    S('l3', 'SL', '08:52', 'Supplier confirms ATV320 drive delivery Oct 6. I will reserve it on the Conveyor 3 intervention.'),
  ],
  'team-elec': [S('e1', 'SM', '08:10', 'Thermography on cabinet E-4 moved to 16:00.')],
  'dm-MD': [
    S('d1', 'MD', '07:58', 'Morning — can I take the Annealing Lehr alignment after lunch instead? The dial gauge is with the electrical team until noon.'),
    S('d2', 'GD', '08:02', 'Yes, go ahead. Keep me posted if it slips again.', { ref: R('Pump P-101') }),
    S('d3', 'MD', '09:34', 'Done with the press cones. I left the absorbent next to PH-030, can you sign the waste form when you pass by?'),
  ],
  'dm-PL': [
    S('d4', 'GD', '07:35', 'Pierre, P-101 is now critical — please start right after Conveyor 3.', { ref: R('Pump P-101 — Seal replacement') }),
    S('d5', 'PL', '07:41', 'Understood. Lockout around 09:30.'),
  ],
  'dm-SL': [
    S('d6', 'SL', '08:47', 'Supplier says the ATV320 drive ships Oct 6. Do you want me to reserve it for Conveyor 3 straight away?'),
    S('d7', 'GD', '08:51', 'Yes please, and flag it on the intervention.'),
    S('d8', 'SL', '09:15', 'Done. Also: only 2 BPU280 belts left — I raised a reorder.', { ref: R('Drive belt BPU280') }),
  ],
  'dm-HP': [S('d9', 'HP', 'Yesterday', 'Can you review next week\'s plan before Thursday? Two preventive jobs overlap on the Float Line.')],
  'dm-CM': [S('d10', 'CM', 'Yesterday', 'Sending you the vibration trend for Fan V-12 — worth discussing at the leads meeting.', { ref: R('Fan V-12 — Abnormal vibration') })],
  site: [
    S('s1', 'LB', '07:30', 'Float Line speed reduced to 80% from 14:00 for the glass thickness change.', { ref: R('Conveyor Line 3') }),
    S('s2', 'ER', '08:05', 'Reminder: hot work permits required in the Tempering zone all week.'),
    S('s3', 'HP', '08:50', 'Planned shutdown of Line 2 on Oct 8. Please submit interventions for it by Friday.'),
  ],
  'WO-1339859': [
    S('w1', 'sys', '07:31', 'Intervention created by L. Petit · night shift'),
    S('w2', 'PL', '07:40', 'Seal is weeping again on the drive side. @Sarah can you check whether we have the 45 mm seal in stock?', { tag: 'Missing part' }),
    S('w3', 'SL', '07:52', '3 in stock, store A-07. I reserved one on this intervention.', { ref: R('Mechanical seal 45 mm') }),
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
  if (isDm(ch)) { const k = ch.slice(3), p = person(k); return { kind: 'dm', title: p.name, icon: 'person', other: k, members: [ME, k], info: `${p.role} · ${p.team}`, href: `Main.dc.html?chat=${ch}` }; }
  const w = getWo(ch);
  return { kind: 'wo', title: w ? `${w.asset} — ${w.task}` : displayId(ch), icon: 'build', woKey: ch, displayId: displayId(ch), href: woHref(ch, w), members: participantsOf(ch).map(p => p[0]), status: w && w.status };
};
export const unread = ch => { const st = chatState(); const n = messages(ch).length; const seen = st.seen[ch] != null ? st.seen[ch] : (ch === 'dm-MD' || ch === 'dm-SL' ? n - 1 : isDm(ch) ? n : ch === 'team' ? n - 2 : ch === 'team-leads' ? n - 1 : ch === 'team-elec' ? n : ch === 'site' ? n - 1 : ch === 'WO-1339850' ? n - 1 : n); return Math.max(0, n - seen); };
export const markSeen = ch => { const st = chatState(); st.seen[ch] = messages(ch).length; write(CKEY, st); emit('cmms-chat', { ch, seen: true }); };
export const woThreads = (me = ME) => {
  const keys = new Set([...Object.keys(SEED_CHAT).filter(k => !CHANNELS[k] && !isDm(k)), ...Object.keys(chatState().msgs).filter(k => !CHANNELS[k] && !isDm(k))]);
  return [...keys].filter(k => participantsOf(k).some(p => p[0] === me)).map(k => { const m = messages(k), last = m[m.length - 1]; return { key: k, ...channelInfo(k), last, unread: unread(k) }; })
    .sort((a, b) => (b.unread - a.unread) || ((b.last && b.last.t) || '').localeCompare((a.last && a.last.t) || ''));
};
const allChannels = () => [...new Set([...Object.keys(SEED_CHAT), ...Object.keys(chatState().msgs)])];
// Direct conversations of ME, newest/unread first. withMessages=false also lists people never messaged.
export const dmThreads = () => allChannels().filter(isDm).map(ch => { const m = messages(ch), last = m[m.length - 1]; return { key: ch, other: ch.slice(3), person: person(ch.slice(3)), last, unread: unread(ch), n: m.length }; })
  .filter(t => t.n).sort((a, b) => (b.unread - a.unread) || ((b.last && b.last.at) || 0) - ((a.last && a.last.at) || 0) || ((b.last && b.last.t) || '').localeCompare((a.last && a.last.t) || ''));
// Everything exchanged with person k outside the direct conversation: channels where they wrote or were mentioned with ME present.
export const sharedWith = k => allChannels().filter(ch => !isDm(ch)).map(ch => { const info = channelInfo(ch); if (!(info.members || []).includes(ME) && info.kind !== 'site') return null;
  const ms = messages(ch).filter(m => m.who === k || (m.who === ME && mentionsOf(m.text || '').includes(k)) || (m.who !== 'sys' && mentionsOf(m.text || '').includes(k)));
  return ms.length ? { key: ch, kind: info.kind, title: info.title, icon: info.icon, href: info.href, msgs: ms, last: ms[ms.length - 1] } : null; }).filter(Boolean);
export const parse = text => { const out = []; const re = /@([A-Za-zÀ-ÿ]+)/g; let i = 0, m; while ((m = re.exec(text))) { const k = Object.keys(PEOPLE).find(p => PEOPLE[p][4].toLowerCase() === m[1].toLowerCase()); if (!k) continue; if (m.index > i) out.push({ t: text.slice(i, m.index) }); out.push({ t: '@' + PEOPLE[k][4], mention: k }); i = m.index + m[0].length; } if (i < text.length) out.push({ t: text.slice(i) }); return out; };
export const mentionsOf = text => parse(text).filter(s => s.mention).map(s => s.mention);
const linkTo = (ch, id) => { const info = channelInfo(ch); return info.kind === 'wo' ? `${info.href}&chat=1&msg=${id}` : `Main.dc.html?chat=${ch}&msg=${id}`; };

// ---------- Notifications from chat ----------
const SEED_NOTIF = [
  { id: 'c-t3', type: 'mention', lvl: 'imp', icon: 'alternate_email', kind: 'Pierre Leroy mentioned you', title: '“Can someone check this pump after the current intervention?”', sub: 'Mechanical team · Pump P-101', ago: '45 min', ch: 'team', msg: 't3' },
  { id: 'c-f3', type: 'reassign', lvl: 'imp', icon: 'swap_horiz', kind: 'Reassignment requested', title: 'Fan V-12 — Abnormal fan noise', sub: 'Alex Martin: “Can someone take this intervention?”', ago: '20 min', ch: 'WO-1339850', msg: 'f3' },
  { id: 'c-h2', type: 'wo-message', lvl: 'info', icon: 'forum', kind: 'New message in your intervention', title: 'Fan V-12 — Abnormal vibration', sub: 'Marc Dupont: “Puller is on the cart next to the press…”', ago: '1 h', ch: 'home-p1', msg: 'h2' },
  { id: 'c-r1048', type: 'wo-request', lvl: 'imp', icon: 'campaign', kind: 'Intervention request', title: 'Conveyor Line 3 — Belt slipping at the drive end', sub: 'Lucas Bernard → Mechanical team', ago: '12 min', href: 'Main.dc.html?req=R-1048' },
  { id: 'c-r1047', type: 'wo-request', lvl: 'imp', icon: 'campaign', kind: 'Intervention request', title: 'Hydraulic Press PH-030 — Small oil drip under the main cylinder', sub: 'Emma Roux (HSE) → you', ago: '1 h', href: 'Main.dc.html?req=R-1047' },
];
export const notifications = () => read(NKEY, null) || SEED_NOTIF.map(n => ({ ...n }));
export const notifHref = n => n.href || linkTo(n.ch, n.msg);

// ---------- Intervention requests: a lightweight report (asset, short description, optional photo, people/teams to notify).
// Shown in the Requested column: Report issue → Notify → Accept (Not scheduled / Scheduled) or Reject.
const RKEY = 'cmms.requests.v1';
export const REQ_STATUS = { pending: ['Requested', '#B54708', '#FEF3E2', 'schedule'], accepted: ['Accepted', '#0B6B4A', '#E6F4EE', 'check_circle'], rejected: ['Rejected', '#475467', '#EEF1F4', 'do_not_disturb_on'] };
const SEED_REQ = [
  { id: 'R-1048', asset: 'Conveyor Line 3', assetCode: 'CV-L3', loc: 'Float Line', text: 'Belt slipping at the drive end — squealing noise when the line speeds up.', by: 'LB', at: 'Today 09:38', ago: '12 min', notify: ['team'], photo: true, status: 'pending' },
  { id: 'R-1047', asset: 'Hydraulic Press PH-030', assetCode: 'PH-030', loc: 'Workshop', text: 'Small oil drip under the main cylinder. Absorbent placed around the press.', by: 'ER', at: 'Today 08:52', ago: '1 h', notify: ['GD'], photo: false, status: 'pending' },
  { id: 'R-1046', asset: 'Packaging Line 1', assetCode: 'PK-L1', loc: 'Packaging', text: 'Label printer jams every 20 pallets or so — operators clear it by hand.', by: 'LB', at: 'Yesterday 16:10', ago: 'Yesterday', notify: ['team-elec', 'team'], photo: true, status: 'pending' },
  { id: 'R-1045', asset: 'Fan V-08', assetCode: 'V-08', loc: 'Float Line', text: 'Noisy bearing, getting louder since Monday.', by: 'JM', at: 'Sep 27, 14:05', ago: '2 d', notify: ['team'], photo: false, status: 'accepted', wo: 'home-u1', woTask: 'Noisy bearing', woPrio: 'High', decidedBy: 'GD' },
  { id: 'R-1044', asset: 'Cooling Tower', assetCode: 'CT-01', loc: 'Utilities', text: 'Water on the floor near the circulation pump.', by: 'HP', at: 'Sep 26, 10:20', ago: '3 d', notify: ['GD'], photo: true, status: 'rejected', decidedBy: 'GD', note: 'Condensation from the roof — no equipment issue.' },
];
export const requests = () => (read(RKEY, null) || SEED_REQ).map(r => ({ ...r }));
const saveReqs = list => { write(RKEY, list); emit('cmms-request', {}); };
export const getRequest = id => requests().find(r => r.id === id) || null;
export const notifyName = k => CHANNELS[k] ? CHANNELS[k].title : person(k).name;
export const notifyPeople = r => [...new Set((r.notify || []).flatMap(k => CHANNELS[k] && CHANNELS[k].kind === 'team' ? CHANNELS[k].members : [k]))].filter(k => k !== r.by);
// Relevant to me: I reported it, I was notified, or one of my teams was notified.
export const requestForMe = (r, me = ME) => r.by === me || (r.notify || []).some(k => k === me || (CHANNELS[k] && CHANNELS[k].kind === 'team' && CHANNELS[k].members.includes(me)));
export const myRequests = (me = ME) => requests().filter(r => requestForMe(r, me));
export const createRequest = r => {
  const list = requests(), n = list.filter(x => x.mine).length;
  const item = { id: 'R-' + (1049 + n), ...r, by: r.by || ME, at: 'Today ' + clock(), ago: 'now', createdAt: Date.now(), status: 'pending', mine: true };
  list.unshift(item); saveReqs(list); return item;
};
export const updateRequest = (id, patch) => { const list = requests().map(r => r.id === id ? { ...r, ...patch } : r); saveReqs(list); return list.find(r => r.id === id) || null; };

// ---------- Completion without a live intervention (work done on site, recorded afterwards) ----------
export const completeWithoutIntervention = (key, rec) => {
  const w = saveWo(key, { status: 'Completed', waiting: '', logged: true, completion: { ...rec, at: rec.at || '', by: rec.by || ME, loggedBy: ME, loggedAt: Date.now() }, actualMs: (+rec.mins || 0) * 60000 });
  post(key, 'sys', `Completed without live intervention · recorded by ${person(ME).name} · ${+rec.mins || 0} min`);
  emit('cmms-wo-completed', { key });
  return w;
};
export const notify = n => { const all = notifications(); const item = { ...n, ago: 'now', id: n.id || 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }; if (all.some(x => x.id === item.id)) return; all.unshift(item); write(NKEY, all.slice(0, 30)); emit('cmms-notif', { ...item, href: notifHref(item) }); };
const pushNotif = n => { const all = notifications(); const item = { ...n, ago: 'now', id: 'c-' + n.msg + '-' + Date.now().toString(36) }; all.unshift(item); write(NKEY, all.slice(0, 30)); emit('cmms-notif', { ...item, href: linkTo(n.ch, n.msg) }); };

let mid = 0;
export const post = (ch, who, text, x = {}) => {
  const st = chatState(); const list = (st.msgs[ch] || SEED_CHAT[ch] || []).slice();
  const msg = { id: 'm' + Date.now().toString(36) + (mid++), who, t: clock(), at: Date.now(), text, ...x };
  list.push(msg); st.msgs[ch] = list; if (who === ME) st.seen[ch] = list.length; write(CKEY, st);
  const info = channelInfo(ch), where = info.kind === 'wo' ? info.title : info.title, p = person(who);
  const mentioned = mentionsOf(text);
  if (who !== ME) {
    if (info.kind === 'dm') pushNotif({ type: 'dm', lvl: 'imp', icon: 'chat', kind: `Message from ${p.name}`, title: `“${text.length > 80 ? text.slice(0, 78) + '…' : text}”`, sub: 'Direct message', ch, msg: msg.id });
    else if (mentioned.includes(ME)) pushNotif({ type: 'mention', lvl: 'imp', icon: 'alternate_email', kind: `${p.name} mentioned you`, title: `“${text.length > 80 ? text.slice(0, 78) + '…' : text}”`, sub: where, ch, msg: msg.id });
    else if (x.tag === 'Reassignment') pushNotif({ type: 'reassign', lvl: 'imp', icon: 'swap_horiz', kind: 'Reassignment requested', title: where, sub: `${p.name}: “${text.slice(0, 60)}…”`, ch, msg: msg.id });
    else if (info.kind === 'wo' && participantsOf(ch).some(q => q[0] === ME) && (x.tag || x.photo)) pushNotif({ type: 'wo-message', lvl: 'info', icon: 'forum', kind: 'New message in your intervention', title: where, sub: `${p.name}: “${text.slice(0, 60)}”`, ch, msg: msg.id });
  }
  emit('cmms-chat', { ch, id: msg.id });
  // Demo: people you @mention answer back a moment later.
  if (who === ME && info.kind === 'dm') { clearTimeout(post._dm); post._dm = setTimeout(() => post(ch, info.other, ['OK, noted.', 'Thanks — I\'ll take a look shortly.', 'Got it, I\'ll come back to you.'][Math.floor(Math.random() * 3)]), 3000); }
  if (who === ME && info.kind !== 'dm') mentioned.filter(k => k !== ME).slice(0, 1).forEach(k => setTimeout(() => post(ch, k, k === 'SL' ? '@Gaudéric checking the store now — I\'ll reserve it on this intervention if we have it.' : '@Gaudéric seen — I\'ll get back to you here in a few minutes.'), 2600));
  return msg;
};

if (typeof window !== 'undefined') window.RelixCollab = { FLOW, STATUS_LOOK, WAIT, WAIT_LOOK, norm, waitLabel, moveCheck, setWaiting, isDm, dmKey, dmThreads, sharedWith, assigneesOf, myTeams, displayId, ME, PEOPLE, ROLES, byName, person, woHref, getWo, saveWo, createdWos, nextKey, createWo, participantsOf, missingInfo, CHANNELS, REFS, messages, channelInfo, unread, markSeen, woThreads, parse, mentionsOf, notifications, notifHref, post, clock,
  notify, historyOf, logWo, REQ_STATUS, requests, getRequest, notifyName, notifyPeople, requestForMe, myRequests, createRequest, updateRequest, completeWithoutIntervention };
