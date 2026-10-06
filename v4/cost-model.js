// Relix intervention costs (window.RelixCost) — Labor · Spare parts · Consumables · External services · Equipment & rental.
// Manual lines live on the work order (collab-model saveWo): costs { consumables: [{ ref, qty }], services: [{ sup, rate, qty, note }], rentals: [{ sup, rate, qty, note }] }.
// rate = 'hourly' | 'travel' | rate id from the supplier. Internal mobile equipment (wo.tools) is costed automatically at an internal hourly rate.
import * as PA from './parts-model.js';
export const CATS = { labor: ['Labor', 'engineering', '#2456B8'], parts: ['Spare parts', 'settings', '#0B6B4A'], consumables: ['Consumables', 'water_drop', '#0E7490'], services: ['External services', 'handshake', '#6941C6'], rentals: ['Equipment & rental', 'forklift', '#B54708'] };
export const ROLE_RATES = { 'Maintenance Manager': 78, 'Maintenance manager': 78, Planner: 60, Reliability: 66, Electrician: 54, Mechanic: 52, 'Hydraulic technician': 56, Specialist: 64, HSE: 60 };
export const laborRate = person => (person && ROLE_RATES[person.role]) || 55;
export const TOOL_RATES = { 'MC-01': 45, 'SL-01': 18, 'FL-03': 15, 'TC-01': 12, 'LA-01': 10, 'VA-02': 8 };
export const CONS_COST = { 'GRS-LT2': 7.8, 'SEAL-TH': 6.4, 'CLN-RAG': 9.5, 'OIL-H46': 4.2, 'GLV-NIT': 0.35 };
export const CONSUMABLES = [['GRS-LT2', 'Lithium grease LT2 400 g', 'cartridge'], ['SEAL-TH', 'Thread sealant 50 ml', 'tube'], ['CLN-RAG', 'Cleaning cloths', 'pack'], ['OIL-H46', 'Hydraulic oil HLP 46', 'L'], ['GLV-NIT', 'Nitrile gloves', 'pair']];
export const eur = n => '€' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const eur0 = n => '€' + Math.round(+n || 0).toLocaleString('en-US');
const unitShort = { h: 'h', visit: 'visit', day: 'day', fixed: '' };
// All billable options of external providers: kind 'services' | 'rentals'
export const offers = kind => PA.suppliers().filter(s => s.status !== 'Inactive' && PA.typesOf(s).includes(kind === 'services' ? 'service' : 'rental')).flatMap(s => [
  ...(kind === 'services' && s.hourly ? [{ sup: s.id, rate: 'hourly', supName: s.name, name: 'Labour', unit: 'h', price: +s.hourly }] : []),
  ...(s.rates || []).map(r => ({ sup: s.id, rate: r.id, supName: s.name, name: r.name, unit: r.unit, price: +r.price })),
  ...(s.travel ? [{ sup: s.id, rate: 'travel', supName: s.name, name: kind === 'rentals' ? 'Delivery & pick-up' : 'Travel / call-out fee', unit: 'visit', price: +s.travel }] : []),
]);
export const offerOf = (sup, rate) => { const s = PA.supplier(sup); if (!s) return null; if (rate === 'hourly') return { sup, rate, supName: s.name, name: 'Labour', unit: 'h', price: +s.hourly || 0 }; if (rate === 'travel') return { sup, rate, supName: s.name, name: PA.typesOf(s).includes('rental') && !PA.typesOf(s).includes('service') ? 'Delivery & pick-up' : 'Travel / call-out fee', unit: 'visit', price: +s.travel || 0 }; const r = (s.rates || []).find(x => x.id === rate); return r ? { sup, rate, supName: s.name, name: r.name, unit: r.unit, price: +r.price } : null; };
// people: (key) => { name, role }. opts: { parts: [{ ref, qty }], actualMs, plant (plant-model) }
export const costOf = (w, people, opts = {}) => {
  w = w || {}; const c = w.costs || {}, L = { labor: [], parts: [], consumables: [], services: [], rentals: [] };
  const asg = (w.assignments || []).filter(a => a.key && +a.minutes);
  const estH = +w.dur || (asg.reduce((a, x) => a + +x.minutes, 0) / 60) || 1;
  const actualH = opts.actualMs != null ? Math.max(0.25, Math.round(opts.actualMs / 9e5) / 4) : null;
  const k = actualH != null ? actualH / estH : 1;
  if (asg.length) asg.forEach(a => { const p = people(a.key), h = Math.round(+a.minutes / 60 * k * 4) / 4 || 0.25, r = laborRate(p); L.labor.push({ label: p.name, sub: p.role, qty: h, unit: 'h', price: r }); });
  else if (w.assignee) { const p = people(w.assignee), r = laborRate(p); L.labor.push({ label: p.name, sub: p.role, qty: actualH != null ? actualH : estH, unit: 'h', price: r }); }
  (opts.parts || w.parts || []).forEach(x => { const pt = PA.part(x.ref); L.parts.push({ label: pt ? pt.name : x.name || x.ref, sub: x.ref, qty: +x.qty || 1, unit: pt ? pt.unit : 'pcs', price: pt ? +pt.cost || 0 : 0 }); });
  (c.consumables || []).forEach((x, i) => { const cs = CONSUMABLES.find(y => y[0] === x.ref) || [x.ref, x.ref, 'pcs']; L.consumables.push({ label: cs[1], sub: x.ref, qty: +x.qty || 1, unit: cs[2], price: CONS_COST[x.ref] || 0, manual: true, i }); });
  (c.services || []).forEach((x, i) => { const o = offerOf(x.sup, x.rate) || { supName: 'Provider removed', name: '', unit: 'fixed', price: +x.price || 0 }; L.services.push({ label: `${o.supName} · ${o.name}`, sub: x.note || '', qty: +x.qty || 1, unit: unitShort[o.unit] || '', price: o.price, manual: true, i }); });
  const toolH = actualH != null ? actualH : estH, PL = opts.plant;
  (w.tools || []).forEach(t => { const a = PL && PL.asset ? PL.asset(t) : null; L.rentals.push({ label: a ? a.name : t, sub: 'Internal equipment', qty: toolH, unit: 'h', price: TOOL_RATES[t] || 10 }); });
  (c.rentals || []).forEach((x, i) => { const o = offerOf(x.sup, x.rate) || { supName: 'Provider removed', name: '', unit: 'fixed', price: +x.price || 0 }; L.rentals.push({ label: `${o.supName} · ${o.name}`, sub: x.note || 'External rental', qty: +x.qty || 1, unit: unitShort[o.unit] || '', price: o.price, manual: true, i }); });
  const totals = {}; Object.keys(L).forEach(key => { L[key].forEach(l => { l.total = Math.round(l.qty * l.price * 100) / 100; }); totals[key] = L[key].reduce((a, l) => a + l.total, 0); });
  return { lines: L, totals, total: Object.values(totals).reduce((a, b) => a + b, 0), actual: actualH != null, hours: actualH != null ? actualH : estH };
};
if (typeof window !== 'undefined') window.RelixCost = { CATS, ROLE_RATES, laborRate, TOOL_RATES, CONS_COST, CONSUMABLES, eur, eur0, offers, offerOf, costOf };
