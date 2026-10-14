// Relix people model — skills catalogue (Site configuration), user profiles, availability, skill-based suggestions.
// Storage: cmms.skills.v1 (catalogue), cmms.profiles.v1 (per-user overrides). Events: cmms-skills, cmms-profile, cmms-profile-open.
const SKEY = 'cmms.skills.v1', PKEY = 'cmms.profiles.v1';
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const emit = (n, d) => { try { window.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} };

// ---------- Skills catalogue ----------
export const SKILL_CATS = { Trade: ['#EAF1FD', '#2456B8'], Technique: ['#E6F4EE', '#0B6B4A'], Certification: ['#FEF3E2', '#B54708'] };
const SEED_SKILLS = [
  ['ELE', 'Electrical', 'Trade', 'bolt', '#6941C6', '#F3EEFC'],
  ['MEC', 'Mechanical', 'Trade', 'build', '#B54708', '#FEF3E2'],
  ['HYD', 'Hydraulics', 'Trade', 'water_drop', '#2456B8', '#EAF1FD'],
  ['PNE', 'Pneumatics', 'Trade', 'air', '#0E7490', '#E3F4F7'],
  ['PLC', 'Automation / PLC', 'Trade', 'memory', '#344054', '#EEF1F4'],
  ['INS', 'Instrumentation', 'Trade', 'sensors', '#0B6B4A', '#E6F4EE'],
  ['WLD', 'Welding', 'Technique', 'local_fire_department', '#B42318', '#FDECEC'],
  ['LUB', 'Lubrication', 'Technique', 'oil_barrel', '#7A5B00', '#FBF3D9'],
  ['VIB', 'Vibration analysis', 'Technique', 'vibration', '#6941C6', '#F3EEFC'],
  ['THM', 'Thermography', 'Technique', 'device_thermostat', '#C4320A', '#FEF0E6'],
  ['HAB', 'Electrical clearance B2V', 'Certification', 'verified_user', '#B54708', '#FEF3E2'],
  ['HGT', 'Work at height', 'Certification', 'height', '#B54708', '#FEF3E2'],
];
export const skills = () => rd(SKEY, null) || SEED_SKILLS.map(([id, name, cat, icon, fg, bg]) => ({ id, name, cat, icon, fg, bg, active: true }));
export const saveSkills = list => { wr(SKEY, list); emit('cmms-skills'); };
export const skill = id => skills().find(s => s.id === id) || { id, name: id, cat: 'Trade', icon: 'handyman', fg: '#475467', bg: '#EEF1F4', active: true };
export const skillNames = ids => (ids || []).map(id => skill(id).name).join(' + ') || 'Any technician';
export const LEVELS = ['', 'Basic', 'Qualified', 'Expert'];

// ---------- Profiles ----------
const W = (from, to, site = 'THO', days = [1, 2, 3, 4, 5]) => days.map(d => ({ d, from, to, site }));
export const SITES = { THO: 'Thourotte Plant', SAU: 'Saultain Plant' };
const SEED = {
  GD: { skills: [['ELE', 3], ['MEC', 2], ['PLC', 2], ['HAB', 3]], shift: W(8, 17), absences: [], phone: '+33 6 12 48 90 11', ext: '2210', email: 'g.durand@thourotte-plant.com', langs: ['French', 'English'], joined: '2014', manager: 'Plant director', accent: '#34050D',
    status: 'Covering the morning meeting until 09:00', bio: 'Maintenance manager for the Thourotte float and tempering lines. Former electrician — happy to help on drives and PLC issues.',
    certs: [['Electrical clearance B2V / BR', '2027-03'], ['SST first aid', '2026-11']], stats: { done: 18, avg: 74, ftf: 88, onTime: 91, hours: 32, open: 7 }, top: ['Pump P-101', 'Tempering Furnace 2', 'Conveyor Line 3'] },
  MD: { skills: [['MEC', 3], ['HYD', 2], ['WLD', 2], ['LUB', 2]], shift: W(7, 17), absences: [{ date: '2026-10-02', from: 13, to: 17, label: 'Medical appointment' }], phone: '+33 6 22 31 07 54', ext: '2231', email: 'm.dupont@thourotte-plant.com', langs: ['French'], joined: '2009', manager: 'Gaudéric Durand', accent: '#0B6B4A',
    status: 'Annealing Lehr rollers this week', bio: 'Mechanic, 17 years on the float line. Rollers, gearboxes and anything that turns.', certs: [['Welding MIG/MAG', '2027-06'], ['Forklift CACES 3', '2026-12']], stats: { done: 41, avg: 68, ftf: 92, onTime: 87, hours: 138, open: 5 }, top: ['Annealing Lehr', 'Conveyor Line 3', 'Hydraulic Press PH-030'] },
  PL: { skills: [['MEC', 3], ['HYD', 3], ['PNE', 2]], shift: W(7, 18, 'THO', [1, 2, 3, 4]).concat(W(7, 12, 'THO', [5])), absences: [], phone: '+33 6 40 18 22 63', ext: '2240', email: 'p.leroy@thourotte-plant.com', langs: ['French', 'Portuguese'], joined: '2016', manager: 'Gaudéric Durand', accent: '#2456B8',
    status: '', bio: 'Hydraulics and pumps. Short Fridays (4×10 schedule).', certs: [['Hydraulic systems level 2', '2028-01']], stats: { done: 37, avg: 81, ftf: 85, onTime: 90, hours: 129, open: 6 }, top: ['Pump P-101', 'Hydraulic Press PH-030', 'Tempering Furnace 1'] },
  AM: { skills: [['MEC', 2], ['LUB', 2], ['VIB', 1]], shift: W(8, 18), absences: [{ date: '2026-10-05', until: '2026-10-09', label: 'Holiday' }], phone: '+33 6 71 90 44 02', ext: '2252', email: 'a.martin@thourotte-plant.com', langs: ['French', 'English', 'Spanish'], joined: '2021', manager: 'Gaudéric Durand', accent: '#B54708',
    status: 'On holiday next week', bio: 'Maintenance technician. Learning vibration analysis with Claire.', certs: [['Vibration analysis ISO 18436 cat. I', '2027-09']], stats: { done: 29, avg: 77, ftf: 79, onTime: 84, hours: 121, open: 4 }, top: ['Palletizing Robot 1', 'Fan V-12', 'Packaging Line 1'] },
  SM: { skills: [['ELE', 3], ['PLC', 3], ['THM', 2], ['INS', 1], ['HAB', 3]], shift: W(8, 16), absences: [], phone: '+33 6 15 63 28 90', ext: '2264', email: 's.martin@thourotte-plant.com', langs: ['French', 'English'], joined: '2012', manager: 'Gaudéric Durand', accent: '#6941C6',
    status: 'Waiting for the C-01 filter housing', bio: 'Electrician and PLC programmer. Siemens S7 / TIA Portal.', certs: [['Electrical clearance B2V / BR', '2026-11'], ['Thermography level 1', '2027-04']], stats: { done: 33, avg: 64, ftf: 91, onTime: 93, hours: 118, open: 4 }, top: ['Compressor C-01', 'Tempering Furnace 2', 'Electrical cabinets'] },
  SB: { skills: [['ELE', 2], ['INS', 3], ['THM', 3], ['VIB', 2], ['HAB', 2]], shift: W(7, 16), absences: [{ date: '2026-10-01', label: 'Training — B2V renewal' }], phone: '+33 6 88 02 17 45', ext: '2271', email: 's.benali@thourotte-plant.com', langs: ['French', 'Arabic', 'English'], joined: '2019', manager: 'Gaudéric Durand', accent: '#0E7490',
    status: 'Condition monitoring round on Tuesdays', bio: 'Instrumentation and condition monitoring: thermography, vibration and oil analysis.', certs: [['Thermography level 2', '2027-02'], ['Electrical clearance B2V / BR', '2026-10']], stats: { done: 44, avg: 52, ftf: 95, onTime: 96, hours: 126, open: 5 }, top: ['Tin Bath', 'Compressor C-01', 'Mixer 02'] },
  JM: { skills: [['MEC', 2], ['PNE', 2], ['ELE', 1], ['HGT', 2]], shift: W(7, 17, 'THO', [1, 2, 3]).concat(W(7, 17, 'SAU', [4]), W(7, 12, 'THO', [5])), absences: [], phone: '+33 6 31 77 50 26', ext: '2280', email: 'j.martin@thourotte-plant.com', langs: ['French'], joined: '2018', manager: 'Gaudéric Durand', accent: '#B42318',
    status: 'Thursdays at Saultain', bio: 'Float line technician, shared with the Saultain plant on Thursdays.', certs: [['Work at height', '2027-01']], stats: { done: 26, avg: 70, ftf: 83, onTime: 88, hours: 104, open: 3 }, top: ['Cooling Tower', 'Annealing Lehr', 'Fan V-12'] },
};
const P0 = { skills: [], shift: W(8, 16), absences: [], phone: '', ext: '', email: '', langs: ['French'], joined: '', manager: '', accent: '#475467', status: '', bio: '', certs: [], stats: { done: 0, avg: 0, ftf: 0, onTime: 0, hours: 0, open: 0 }, top: [] };
export const TECHS = ['GD', 'MD', 'PL', 'AM', 'SM', 'SB', 'JM'];
export const profile = key => { const o = rd(PKEY, {})[key] || {}; const b = SEED[key] || P0; return { ...b, ...o, key }; };
export const saveProfile = (key, patch) => { const all = rd(PKEY, {}); all[key] = { ...(all[key] || {}), ...patch }; wr(PKEY, all); emit('cmms-profile', { key }); };
export const resetProfile = key => { const all = rd(PKEY, {}); delete all[key]; wr(PKEY, all); emit('cmms-profile', { key }); };
export const skillLevel = (key, id) => { const s = profile(key).skills.find(x => x[0] === id); return s ? s[1] : 0; };
export const hasSkills = (key, req) => (req || []).every(id => skillLevel(key, id) > 0);

// ---------- Availability ----------
export const BASE = new Date(2026, 8, 28); // Planning day 0 = Mon Sep 28, 2026
const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dayIso = dayIdx => iso(new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + dayIdx));
export const endDate = a => (a.until || (typeof a.to === 'string' ? a.to : '') || a.date);
const inRange = (a, x) => x >= a.date && x <= endDate(a);
// part-day absence = has numeric from/to hours
export const partDay = a => typeof a.from === 'number' && typeof a.to === 'number';
export const absenceOn = (key, isoDate) => profile(key).absences.find(a => inRange(a, isoDate)) || null;
export const shiftOn = (key, isoDate) => { const d = new Date(isoDate + 'T12:00').getDay(); return profile(key).shift.find(s => s.d === d) || null; };
// returns { ok, reason, kind } for a time window (hours, decimals) on a date at a site
export const availability = (key, isoDate, from, to, site = 'THO') => {
  const sh = shiftOn(key, isoDate);
  if (!sh) return { ok: false, kind: 'off', reason: 'Not working that day' };
  if (sh.site !== site) return { ok: false, kind: 'site', reason: `At ${SITES[sh.site] || sh.site}` };
  const ab = absenceOn(key, isoDate);
  if (ab && (!partDay(ab) || from == null || (from < ab.to && to > ab.from))) return { ok: false, kind: 'absent', reason: ab.label };
  if (from != null && (from < sh.from || to > sh.to)) return { ok: false, kind: 'hours', reason: `Works ${hm(sh.from)}–${hm(sh.to)}` };
  return { ok: true, kind: 'ok', reason: `On shift ${hm(sh.from)}–${hm(sh.to)}` };
};
export const hoursOn = (key, isoDate, site = 'THO') => { const sh = shiftOn(key, isoDate); if (!sh || sh.site !== site) return 0; const ab = absenceOn(key, isoDate); if (ab && !partDay(ab)) return 0; return sh.to - sh.from - (ab ? Math.max(0, Math.min(ab.to, sh.to) - Math.max(ab.from, sh.from)) : 0); };
export const statusNow = (key, isoDate = dayIso(1), hour = 10.4) => {
  const ab = absenceOn(key, isoDate), sh = shiftOn(key, isoDate);
  if (ab && (!partDay(ab) || (hour >= ab.from && hour < ab.to))) return { label: ab.label, fg: '#B54708', bg: '#FEF3E2', icon: 'event_busy' };
  if (!sh) return { label: 'Off today', fg: '#475467', bg: '#EEF1F4', icon: 'bedtime' };
  if (sh.site !== 'THO') return { label: `At ${SITES[sh.site]}`, fg: '#2456B8', bg: '#EAF1FD', icon: 'factory' };
  if (hour >= sh.from && hour < sh.to) return { label: `On shift until ${hm(sh.to)}`, fg: '#0B6B4A', bg: '#E6F4EE', icon: 'radio_button_checked' };
  return { label: `Shift ${hm(sh.from)}–${hm(sh.to)}`, fg: '#475467', bg: '#EEF1F4', icon: 'schedule' };
};
export const hm = h => `${pad(Math.floor(h))}:${pad(Math.round((h % 1) * 60))}`;
export const dur = min => min >= 60 ? (min % 60 ? `${Math.floor(min / 60)} h ${pad(min % 60)}` : `${min / 60} h`) : `${min} min`;

// ---------- Checklist segments & suggestions ----------
// Groups consecutive steps with the same required skills (steps without skills join the previous block).
export const segmentsOf = checklists => {
  const segs = [];
  (checklists || []).forEach(cl => (cl.steps || []).forEach((st, i) => {
    if (st.conditional) return;
    const req = (st.skills || []).slice().sort(), min = +st.minutes || 0, last = segs[segs.length - 1];
    if (last && (!req.length || last.skills.join() === req.join()) && last.cl === cl.id) { last.minutes += min; last.to = i + 1; last.titles.push(st.title); }
    else if (last && !req.length) { last.minutes += min; last.titles.push(st.title); }
    else segs.push({ skills: req, minutes: min, from: i + 1, to: i + 1, cl: cl.id, clName: cl.name, titles: [st.title] });
  }));
  let off = 0; segs.forEach(s => { s.offset = off; off += s.minutes; s.label = s.from === s.to ? `Step ${s.from}` : `Steps ${s.from}–${s.to}`; });
  return segs;
};
export const TYPE_SKILL = { Corrective: ['MEC'], Preventive: ['MEC'], Predictive: ['VIB'], Inspection: ['INS'] };
// Rank people for a segment. ctx: { date (iso), from (h), busy: key => hours already planned that day }
export const suggest = (seg, ctx = {}) => {
  const date = ctx.date || dayIso(1);
  return TECHS.map(key => {
    const lv = seg.skills.map(id => skillLevel(key, id)), missing = seg.skills.filter((id, i) => !lv[i]);
    const from = ctx.from != null ? ctx.from + seg.offset / 60 : null, to = from != null ? from + seg.minutes / 60 : null;
    const av = availability(key, date, from, to), cap = hoursOn(key, date), busy = ctx.busy ? ctx.busy(key) : 0, free = Math.max(0, cap - busy);
    const score = (missing.length ? -100 : 0) + (av.ok ? 40 : -50) + lv.reduce((a, b) => a + b, 0) * 4 + Math.min(free, 6) * 2;
    return { key, missing, match: !missing.length, levels: lv, available: av.ok, reason: av.reason, kind: av.kind, free, cap, score };
  }).sort((a, b) => b.score - a.score);
};
export const autoAssign = (segs, ctx = {}) => {
  const out = []; let prev = null;
  segs.forEach((seg, i) => {
    const ranked = suggest(seg, ctx).filter(r => r.match && r.available);
    const keep = prev && ranked.find(r => r.key === prev);
    const pick = keep || ranked[0];
    out.push(pick ? pick.key : ''); prev = pick ? pick.key : prev;
  });
  return out;
};

export const openProfile = key => emit('cmms-profile-open', { key });
if (typeof window !== 'undefined') { window.RelixPeople = { partDay, endDate, SKILL_CATS, skills, saveSkills, skill, skillNames, LEVELS, SITES, TECHS, profile, saveProfile, resetProfile, skillLevel, hasSkills, BASE, iso, dayIso, absenceOn, shiftOn, availability, hoursOn, statusNow, hm, dur, segmentsOf, TYPE_SKILL, suggest, autoAssign, openProfile }; window.RelixProfile = openProfile; }
