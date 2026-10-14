// Relix condition-based maintenance — measurement points per asset with limits; a reading out of limits creates an intervention.
// Storage cmms.cbm.v1 { points: {id: point|{deleted}}, readings: {pointId: [{v, at, by, note}]} }. Event cmms-cbm. window.RelixCBM.
import * as C from './collab-model.js';
import * as PL from './plant-model.js';
const KEY = 'cmms.cbm.v1', TODAY = '2026-09-29';
const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const wr = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
const emit = d => { try { window.dispatchEvent(new CustomEvent('cmms-cbm', { detail: d })); } catch (e) {} };
// [id, assetId, name, unit, min, max, action 'wo'|'alert', [[v, date]]]
const SEED = [
  ['mp1', 'V-12', 'Bearing vibration', 'mm/s', null, 7.1, 'wo', [[5.2, '2026-09-08'], [5.9, '2026-09-15'], [6.1, '2026-09-22'], [6.7, '2026-09-29']]],
  ['mp2', 'P-101', 'Discharge pressure', 'bar', 4, 8, 'wo', [[6.2, '2026-09-15'], [5.9, '2026-09-22'], [6.0, '2026-09-29']]],
  ['mp3', 'CV-L3', 'Drive motor temperature', '°C', null, 85, 'wo', [[71, '2026-09-15'], [76, '2026-09-22'], [80, '2026-09-29']]],
  ['mp4', 'C-01', 'Oil temperature', '°C', null, 95, 'alert', [[82, '2026-09-22'], [84, '2026-09-29']]],
];
const base = () => SEED.map(([id, assetId, name, unit, min, max, action, r]) => ({ id, assetId, name, unit, min, max, action, seed: r.map(([v, at]) => ({ v, at, by: 'Route reading' })) }));
export const points = () => { const o = rd(), P = o.points || {}; const b = base().map(p => P[p.id] ? { ...p, ...P[p.id] } : p); Object.keys(P).filter(k => !b.some(p => p.id === k)).forEach(k => b.push(P[k])); return b.filter(p => !p.deleted); };
export const pointsOf = assetId => points().filter(p => p.assetId === assetId);
export const point = id => points().find(p => p.id === id) || null;
export const readings = id => { const p = point(id); if (!p) return []; return [...(p.seed || []), ...((rd().readings || {})[id] || [])].sort((a, b) => (a.at > b.at ? 1 : a.at < b.at ? -1 : 0)); };
export const limitLabel = p => p.min != null && p.max != null ? `${p.min}–${p.max} ${p.unit}` : p.max != null ? `≤ ${p.max} ${p.unit}` : p.min != null ? `≥ ${p.min} ${p.unit}` : 'No limit';
// state: ok | warn (within 10 % of a limit) | alarm (out of limits) | none
export const stateOf = (p, v) => { if (v == null) return 'none'; if ((p.max != null && v > p.max) || (p.min != null && v < p.min)) return 'alarm';
  const span = p.max != null && p.min != null ? p.max - p.min : Math.abs(p.max ?? p.min) || 1;
  if ((p.max != null && v >= p.max - span * 0.1) || (p.min != null && v <= p.min + span * 0.1)) return 'warn'; return 'ok'; };
export const statusOf = p => { const r = readings(p.id), last = r[r.length - 1] || null; return { last, value: last ? last.v : null, at: last ? last.at : '', state: stateOf(p, last ? last.v : null), trend: r.slice(-6) }; };
export const openWoOf = id => C.allWos().find(w => w.cbm === id && w.status !== 'Completed' && w.status !== 'Rejected') || null;
export const savePoint = p => { const o = rd(); o.points = o.points || {}; const id = p.id || 'mp' + Date.now().toString(36); o.points[id] = { ...(o.points[id] || {}), ...p, id }; wr(o); emit({ id }); return id; };
export const removePoint = id => { const o = rd(); o.points = o.points || {}; o.points[id] = { ...(o.points[id] || {}), id, deleted: true }; wr(o); emit({ id, removed: true }); };
// Records a reading; out of limits → intervention (once while one is open) or breakdown notification. Returns { state, woKey }.
export const addReading = (id, v, note) => {
  const p = point(id); if (!p || v === '' || isNaN(+v)) return null;
  const o = rd(); o.readings = o.readings || {}; o.readings[id] = [...(o.readings[id] || []), { v: +v, at: TODAY, by: (C.person(C.ME) || [])[0] || 'Me', note: note || '' }]; wr(o);
  const state = stateOf(p, +v), a = PL.asset(p.assetId) || { name: p.assetId, id: p.assetId }; let woKey = null;
  if (state === 'alarm') {
    const msg = `${p.name} ${v} ${p.unit} · limit ${limitLabel(p)}`;
    if (p.action === 'wo') { const open = openWoOf(id);
      woKey = open ? open.key : C.createWo({ task: `${p.name} out of limits`, asset: a.name, assetCode: a.id, loc: (PL.lineOf(a.loc) || {}).name || '', type: 'Preventive', prio: 'High', status: 'Not scheduled', dur: '1', checklists: [], assignee: '', assignments: [], participants: [],
        desc: `Condition-based: ${msg}. Created automatically from the measurement point.`, cbm: id, generatedBy: 'cbm', createdBy: 'system' }); }
    C.notify && C.notify({ id: `cbm-${id}-${TODAY}`, type: 'cbm', lvl: 'crit', icon: 'sensors', kind: 'Measurement out of limits', title: a.name, sub: msg + (woKey ? ' · intervention ' + C.displayId(woKey) : ''), href: woKey ? C.woHref(woKey) : 'AssetDetail.dc.html?id=' + encodeURIComponent(a.id) + '&tab=prev' });
  }
  emit({ id, state, woKey }); return { state, woKey };
};
export const outOfLimits = () => points().map(p => ({ p, s: statusOf(p) })).filter(x => x.s.state === 'alarm');
if (typeof window !== 'undefined') window.RelixCBM = { points, pointsOf, point, readings, limitLabel, stateOf, statusOf, openWoOf, savePoint, removePoint, addReading, outOfLimits };
