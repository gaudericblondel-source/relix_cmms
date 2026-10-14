// Relix autonomous maintenance — routine standards run by production operators, several rounds per day possible.
// Storage cmms.am.v1 { stds: {id: std|{deleted}}, recs: {"id|day|slot": {status, note, at, req}} }. Event cmms-am. window.RelixAM.
// Day index 0 = Mon Sep 28 2026 (same as Planning). TODAY = 1 (Tue), NOW = 10.4 h.
import * as C from './collab-model.js';
const KEY = 'cmms.am.v1', TODAY = 1, NOW = 10.4;
const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const wr = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
const emit = d => { try { window.dispatchEvent(new CustomEvent('cmms-am', { detail: d })); } catch (e) {} };
const SHIFT = ['06:00', '14:00', '22:00'];
// [id, line, task, days (0=Mon), run by, minutes, slots, missed days (week 0), anomaly days (week 0)]
const SEED = [
  ['am1', 'Float Line', 'Cold-end conveyor cleaning & visual check', [0, 1, 2, 3, 4, 5, 6], 'Operators · each shift', 15, SHIFT, [], [1]],
  ['am2', 'Float Line', 'Fan V-12 noise & temperature check', [0, 2, 4], 'Operators · Shift A', 5, ['07:00'], [], []],
  ['am3', 'Float Line', 'Lehr roller lubrication points', [1, 3], 'Operators · Shift B', 20, ['15:00'], [], []],
  ['am4', 'Tempering Line', 'Furnace roller cleaning', [0, 1, 2, 3, 4], 'Operators · Shift A', 20, ['07:30'], [0], []],
  ['am5', 'Tempering Line', 'Quench blower filter check', [0, 3], 'Operators · Shift B', 10, ['15:30'], [], [0]],
  ['am6', 'Tempering Line', 'Pump P-101 leak check', [0, 1, 2, 3, 4], 'Operators · each shift', 5, SHIFT, [], [0]],
  ['am7', 'Cutting Line', 'Cutter table cleaning & glass chips removal', [0, 1, 2, 3, 4], 'Operators · Shift A', 15, ['07:00', '11:30'], [], []],
  ['am8', 'Cutting Line', 'Cutting wheel & oil level check', [0, 2, 4], 'Operators · Shift A', 10, ['07:15'], [], []],
  ['am9', 'Packaging', 'Robot gripper pads visual check', [0, 1, 2, 3, 4], 'Operators · Shift B', 5, ['14:30'], [], []],
  ['am10', 'Packaging', 'Stretch wrapper cleaning', [4], 'Operators · Shift B', 20, ['20:00'], [], []],
  ['am11', 'Utilities', 'Compressor condensate drain & oil level', [0, 1, 2, 3, 4], 'Utilities operator', 10, ['08:00', '16:00'], [], []],
  ['am12', 'Utilities', 'Cooling tower basin visual check', [0, 3], 'Utilities operator', 10, ['09:00'], [], []],
  ['am13', 'Batch House', 'Mixer 02 cleaning & bolt tightness', [0, 2, 4], 'Batch operators', 25, ['06:30'], [], []],
  ['am14', 'Batch House', 'Batch scale zero check', [0, 1, 2, 3, 4], 'Batch operators', 5, ['06:15', '14:15'], [0], []],
];
export const LINES = ['Float Line', 'Tempering Line', 'Cutting Line', 'Packaging', 'Utilities', 'Batch House'];
const base = () => SEED.map(([id, line, task, days, by, mins, slots, miss, an]) => ({ id, line, task, days, by, mins, slots: [...slots], miss, an }));
export const stds = () => { const S = rd().stds || {}; const b = base().map(x => S[x.id] ? { ...x, ...S[x.id] } : x); Object.keys(S).filter(k => !b.some(x => x.id === k)).forEach(k => b.push(S[k])); return b.filter(x => !x.deleted).map(x => ({ ...x, slots: [...(x.slots || [])].sort() })); };
export const std = id => stds().find(x => x.id === id) || null;
export const saveStd = x => { const o = rd(); o.stds = o.stds || {}; const id = x.id || 'am' + Date.now().toString(36); o.stds[id] = { ...(o.stds[id] || {}), ...x, id }; wr(o); emit({ id }); return id; };
export const removeStd = id => { const o = rd(); o.stds = o.stds || {}; o.stds[id] = { id, deleted: true }; wr(o); emit({ id, removed: true }); };
const h = t => { const [a, b] = t.split(':').map(Number); return a + b / 60; };
export const isPast = (day, slot) => day < TODAY || (day === TODAY && h(slot) < NOW);
// planned | done | missed | anomaly | due (today, time passed, not recorded)
export const statusOf = (x, day, slot) => {
  const r = (rd().recs || {})[`${x.id}|${day}|${slot}`]; if (r) return r.status;
  if (!isPast(day, slot)) return 'planned';
  if (day >= 0 && day < 7) { const i = day; if ((x.miss || []).includes(i) && slot === x.slots[0]) return 'missed'; if ((x.an || []).includes(i) && slot === x.slots[0]) return 'anomaly'; }
  if (day === TODAY) return 'due';
  return 'done';
};
export const recOf = (x, day, slot) => (rd().recs || {})[`${x.id}|${day}|${slot}`] || null;
export const occurrences = (day, list = stds()) => { const dow = ((day % 7) + 7) % 7, out = [];
  list.filter(x => x.days.includes(dow)).forEach(x => x.slots.forEach(slot => out.push({ std: x, day, slot, status: statusOf(x, day, slot) })));
  return out.sort((a, b) => a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : a.std.line.localeCompare(b.std.line)); };
export const setStatus = (id, day, slot, status, note = '') => {
  const x = std(id); if (!x) return null; const o = rd(); o.recs = o.recs || {}; const k = `${id}|${day}|${slot}`;
  if (status === 'planned') { delete o.recs[k]; wr(o); emit({ id }); return null; }
  let req = (o.recs[k] || {}).req || null;
  if (status === 'anomaly' && !req && C.createRequest) { const r = C.createRequest({ asset: x.line, assetCode: '', loc: x.line, text: `Autonomous maintenance — ${x.task}: ${note || 'anomaly found during the round'}`, notify: ['GD'], source: 'am' }); req = r && r.id; }
  o.recs[k] = { status, note, at: Date.now(), req }; wr(o); emit({ id, day, slot, status }); return req;
};
if (typeof window !== 'undefined') window.RelixAM = { LINES, stds, std, saveStd, removeStd, statusOf, recOf, occurrences, setStatus, isPast };
