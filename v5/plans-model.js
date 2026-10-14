// Relix maintenance plans — shared model (storage cmms.plans.v1, event cmms-plans). window.RelixPlans.
// Active plans generate preventive interventions into the WO store (collab-model) when they fall due within their lead time.
// Calendar plans: next = last + every unit. Meter plans: next threshold = lastAt + every, ETA from the asset meter (plant-model meterOf).
import * as C from './collab-model.js';
import * as PL from './plant-model.js';
const KEY = 'cmms.plans.v1';
export const TODAY = '2026-09-29';
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const emit = d => { try { window.dispatchEvent(new CustomEvent('cmms-plans', { detail: d })); } catch (e) {} };
const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const D = iso => new Date(iso.slice(0, 10) + 'T12:00');
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fmt = s => { if (!s) return '—'; const d = D(s); return `${M[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== 2026 ? ', ' + d.getFullYear() : ''}`; };
export const daysFrom = (s, from = TODAY) => Math.round((D(s) - D(from)) / 864e5);
export const addDays = (s, n) => { const d = D(s); d.setDate(d.getDate() + n); return iso(d); };
const addUnit = (s, n, unit) => { const d = D(s); if (unit === 'days') d.setDate(d.getDate() + n); else if (unit === 'weeks') d.setDate(d.getDate() + 7 * n); else if (unit === 'months') d.setMonth(d.getMonth() + n); else if (unit === 'years') d.setFullYear(d.getFullYear() + n); return iso(d); };
export const UNITS = { time: ['days', 'weeks', 'months', 'years'], meter: ['operating hours', 'cycles', 'km'] };
export const CHECKLISTS = ['Conveyor maintenance', 'Hydraulic press service', 'Electrical check', 'Safety inspection', 'General lubrication', 'Industrial cleaning', 'Instrument calibration', 'Lifting equipment inspection'];
const CL_ID = { 'Conveyor maintenance': 'conveyor', 'Hydraulic press service': 'press', 'Electrical check': 'electrical', 'Safety inspection': 'safety' };
export const ICONS = [['conveyor_belt', '#E6F4EE', '#0B6B4A'], ['oil_barrel', '#F3EEFC', '#6941C6'], ['bolt', '#FEF3E2', '#B54708'], ['health_and_safety', '#FDECEC', '#B42318'], ['water_drop', '#EAF1FD', '#2456B8'], ['cleaning_services', '#EEF1F4', '#475467'], ['straighten', '#E3F4F7', '#0E7490']];
const SEED = [
  ['500 h conveyor service', 'Main conveyor', 0, ['CV-L3'], 'meter', 500, 'operating hours', 'Conveyor maintenance', '01:30', true, { lastAt: 12000 }],
  ['Monthly press service', 'Hydraulic press', 1, ['PH-030'], 'time', 1, 'months', 'Hydraulic press service', '02:00', true, { last: '2026-09-01' }],
  ['Quarterly electrical check', 'Furnace 2 electrical cabinet', 2, ['FT2-FR-001'], 'time', 3, 'months', 'Electrical check', '01:00', true, { last: '2026-06-30', type: 'Inspection', who: 'Sofia Martin' }],
  ['Safety inspection', 'All machines', 3, ['CV-L3', 'CV-L2', 'FT2-FR-001', 'FT1-FR-001', 'PH-030', 'RP-01', 'C-01', 'P-101', 'V-12', 'S-01', 'PK-L1'], 'time', 6, 'months', 'Safety inspection', '00:15', true, { last: '2026-04-26', type: 'Inspection' }],
  ['General lubrication', 'Production equipment', 4, ['CV-L3', 'CV-L2', 'RP-01', 'C-01', 'P-101', 'V-12', 'S-01', 'PK-L1'], 'time', 2, 'weeks', 'General lubrication', '00:45', true, { last: '2026-09-21' }],
  ['Industrial cleaning', 'Production equipment', 5, ['CV-L3', 'CV-L2', 'FT2-FR-001', 'FT1-FR-001', 'RP-01', 'PK-L1'], 'time', 2, 'weeks', 'Industrial cleaning', '00:30', false, { last: '2026-09-14' }],
  ['Thermal camera calibration', 'Regulatory calibration · FLIR T840', 6, ['TC-01'], 'time', 1, 'years', 'Instrument calibration', '00:30', true, { last: '2025-10-20', type: 'Inspection', lead: 14 }],
  ['Annual lifting inspection', 'Regulatory control · mobile crane', 3, ['MC-01'], 'time', 1, 'years', 'Lifting equipment inspection', '02:00', true, { last: '2025-10-12', type: 'Inspection', lead: 14 }],
].map(([name, desc, ic, assets, trig, every, unit, checklist, dur, active, x], i) => ({ id: 'p' + i, name, desc, ic, assets, trig, every, unit, checklist, dur, active, who: '', type: 'Preventive', lead: 3, last: '', lastAt: 0, gens: [], ...x }));

export const all = () => rd(KEY, null) || SEED.map(p => JSON.parse(JSON.stringify(p)));
const put = rows => { wr(KEY, rows); emit({}); };
export const get = id => all().find(p => p.id === id) || null;
export const save = p => { const rows = all(), i = rows.findIndex(x => x.id === p.id); if (i >= 0) rows[i] = { ...rows[i], ...p }; else rows.unshift({ gens: [], lead: 3, type: 'Preventive', last: TODAY, lastAt: 0, ...p, id: p.id || 'p' + Date.now().toString(36) }); put(rows); return p.id || rows[0].id; };
export const remove = id => put(all().filter(p => p.id !== id));
export const setActive = (id, active) => { const p = get(id); if (p) save({ ...p, active }); };
export const reset = () => { try { localStorage.removeItem(KEY); } catch (e) {} emit({}); };
export const durH = d => { const [h, m] = String(d || '01:00').split(':'); return Math.max(0.25, (+h || 0) + (+m || 0) / 60); };
export const freqLabel = p => `Every ${p.every} ${p.every === 1 ? p.unit.replace(/s$/, '') : p.unit.replace('operating hours', 'h')}`;

// Next due of a plan. Meter plans use the first asset that has a meter.
export const nextDue = p => {
  if (!p.active) return { iso: '', days: null, label: '—', sub: 'plan inactive', overdue: false };
  if (p.trig === 'meter') {
    const id = (p.assets || []).find(a => PL.meterOf(a)) || p.assets[0], m = PL.meterOf(id);
    const target = (p.lastAt || 0) + (+p.every || 0), cur = m ? m.value : 0, left = target - cur, short = PL.meterShort(p.unit);
    const days = m ? Math.ceil(left / Math.max(1, m.rate)) : 30, due = addDays(TODAY, days);
    return { iso: due, days, label: fmt(due), sub: left <= 0 ? `due now · ${cur.toLocaleString('en-US')} ${short} (target ${target.toLocaleString('en-US')})` : `in ${days} d · at ${target.toLocaleString('en-US')} ${short}`, overdue: left <= 0 && days < 0, meter: { id, cur, target, left, unit: p.unit, short, at: m ? m.at : '' } };
  }
  const due = addUnit(p.last || TODAY, +p.every || 1, p.unit), days = daysFrom(due);
  return { iso: due, days, label: fmt(due), sub: days < 0 ? `overdue by ${-days} day${days === -1 ? '' : 's'}` : days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`, overdue: days < 0 };
};

const assetRow = id => { const a = PL.asset(id); return a ? { id: a.id, name: a.name, line: (PL.lineOf(a.loc) || {}).name || '' } : { id, name: id, line: '' }; };
// Creates one preventive intervention per asset for the given due date and advances the plan.
export const generate = (id, { manual = false } = {}) => {
  const p = get(id); if (!p) return [];
  const nd = nextDue(p), due = manual && (!nd.iso || nd.days > 1) ? addDays(TODAY, 1) : (nd.iso || addDays(TODAY, 1));
  const whoKey = C.byName(p.who) || '';
  const keys = (p.assets || []).map(aid => { const a = assetRow(aid); return C.createWo({ task: p.name, asset: a.name, assetCode: a.id, loc: a.line, type: p.type || 'Preventive', prio: p.type === 'Inspection' ? 'Medium' : 'Medium', status: 'Scheduled', due: `${due}T08:00`, dur: durH(p.dur), checklists: CL_ID[p.checklist] ? [CL_ID[p.checklist]] : [], checklistName: p.checklist, assignee: whoKey, assignments: [], participants: [], desc: `Generated from maintenance plan “${p.name}” (${freqLabel(p).toLowerCase()}).`, planId: p.id, generatedBy: p.id, createdBy: 'system' }); });
  const patch = { gens: [{ due, keys, at: Date.now(), manual }, ...(p.gens || [])].slice(0, 12) };
  if (p.trig === 'meter') patch.lastAt = (p.lastAt || 0) + (+p.every || 0); else if (!manual || nd.days <= 1) patch.last = nd.iso || due;
  save({ ...p, ...patch });
  const first = assetRow(p.assets[0]);
  C.notify && C.notify({ id: 'plan-' + p.id + '-' + due, type: 'plan-due', lvl: 'imp', icon: 'event_upcoming', kind: 'Preventive due soon', title: keys.length > 1 ? `${p.name} — ${keys.length} assets` : `${first.name} — ${p.name}`, sub: `Generated from “${p.name}” · due ${fmt(due)}${daysFrom(due) < 0 ? ' · overdue' : ''}`, href: C.woHref(keys[0]) });
  try { window.dispatchEvent(new CustomEvent('cmms-plan-generated', { detail: { plan: p.id, keys, due } })); } catch (e) {}
  return keys;
};
// Automatic generation: every active plan falling due within its lead time (run on each page load by the TopBar).
export const runDue = () => { const out = []; all().filter(p => p.active).forEach(p => { const nd = nextDue(p); if (nd.iso && nd.days <= (+p.lead || 3) && !(p.gens || []).some(g => g.due === nd.iso)) out.push(...generate(p.id)); }); return out; };
export const forAsset = assetId => { const a = PL.asset(assetId); return all().filter(p => (p.assets || []).some(x => x === assetId || (a && (x === a.id || x === a.name)))); };
export const wosOf = planId => { const p = get(planId); return p ? (p.gens || []).flatMap(g => g.keys) : []; };
// Calibration / regulatory-control reminders = upcoming Inspection plans + "Calibration due" specifications.
export const reminders = (horizon = 60) => {
  const out = [];
  all().filter(p => p.active && p.type === 'Inspection').forEach(p => { const nd = nextDue(p); if (nd.iso && nd.days <= horizon) p.assets.slice(0, p.assets.length > 3 ? 1 : 3).forEach(aid => { const a = assetRow(aid); out.push({ key: p.id + aid, title: p.name, asset: p.assets.length > 3 ? `${p.assets.length} assets` : a.name, assetId: a.id, due: nd.iso, days: nd.days, kind: /calibrat/i.test(p.name + p.checklist) ? 'Calibration' : 'Control', href: 'MaintenancePlans.dc.html?plan=' + p.id }); }); });
  return out.sort((x, y) => x.days - y.days);
};
if (typeof window !== 'undefined') window.RelixPlans = { TODAY, UNITS, CHECKLISTS, ICONS, fmt, daysFrom, addDays, all, get, save, remove, setActive, reset, durH, freqLabel, nextDue, generate, runDue, forAsset, wosOf, reminders };
