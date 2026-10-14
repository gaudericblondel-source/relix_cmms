// Relix site configuration — reference data used across the app (window.RelixConfig).
// Storage cmms.config.v1 = { items: { [section]: [...] }, units: { [siteId]: { [quantity]: unit } } }. Event: cmms-config { sec }.
const KEY = 'cmms.config.v1';
const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const wr = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
const emit = (n, d) => { try { window.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} };
let seq = 0;
export const uid = p => (p || 'x') + Date.now().toString(36) + (seq++).toString(36);
export const currentSite = () => { try { return localStorage.getItem('cmms.site') || 'THO'; } catch (e) { return 'THO'; } };

export const PALETTE = { Amber: ['#B54708', '#FEF3E2'], Blue: ['#2456B8', '#EAF1FD'], Purple: ['#6941C6', '#F3EEFC'], Teal: ['#0E7490', '#E3F4F7'], Green: ['#0B6B4A', '#E6F4EE'], Red: ['#B42318', '#FDECEC'], Grey: ['#475467', '#EEF1F4'] };
export const FIELD_TYPES = { decimal: ['Decimal number', 'decimal_increase'], integer: ['Whole number', 'pin'], text: ['Text', 'text_fields'], choice: ['Choice list', 'list'], date: ['Date', 'calendar_today'], boolean: ['Yes / No', 'toggle_on'] };
export const ENTITIES = ['Asset', 'Intervention', 'Spare part'];
export const QUANTITIES = {
  temperature: ['Temperature', ['°C', '°F', 'K']], pressure: ['Pressure', ['bar', 'mbar', 'kPa', 'MPa', 'psi']], length: ['Length / size', ['mm', 'cm', 'm', 'in', 'ft']],
  mass: ['Mass', ['g', 'kg', 't', 'lb']], flow: ['Flow rate', ['m³/h', 'L/min', 'L/s', 'gpm']], speed: ['Linear speed', ['m/s', 'm/min', 'km/h', 'ft/min']], rotation: ['Rotation speed', ['rpm', 'Hz']],
  power: ['Power', ['W', 'kW', 'MW', 'hp']], voltage: ['Voltage', ['V', 'kV', 'mV']], current: ['Current', ['A', 'mA', 'kA']], volume: ['Volume', ['L', 'm³', 'mL', 'gal']],
  duration: ['Duration', ['s', 'min', 'h', 'days']], vibration: ['Vibration velocity', ['mm/s', 'in/s']], torque: ['Torque', ['N·m', 'kN·m', 'lbf·ft']], percent: ['Percentage', ['%']],
};
const UNIT_SEED = {
  THO: { temperature: '°C', pressure: 'bar', length: 'mm', mass: 'kg', flow: 'm³/h', speed: 'm/min', rotation: 'rpm', power: 'kW', voltage: 'V', current: 'A', volume: 'L', duration: 'h', vibration: 'mm/s', torque: 'N·m', percent: '%' },
  SAU: { pressure: 'kPa', flow: 'L/min', duration: 'min' },
  AVI: { pressure: 'bar', length: 'mm' },
  HZR: { pressure: 'MPa', speed: 'm/s' },
};
export const PART_UNITS = ['pcs', 'kit', 'set', 'pair', 'cartridge', 'pack', 'tube', 'roll', 'can', 'L', 'mL', 'm', 'cm', 'kg', 'g'];
const ADDED = { partCats: ['pc-SAF'] }; // seed items added later — merged into stored lists unless the user deleted them

const C = (id, name, code, x = {}) => ({ id, name, code, active: true, ...x });
const SEED = {
  assetTypes: [['Furnace', 'FUR', 'Equipment', 'local_fire_department', 'Critical'], ['Conveyor', 'CNV', 'Equipment', 'conveyor_belt', 'High'], ['Pump', 'PMP', 'Equipment', 'water_pump', 'High'], ['Fan', 'FAN', 'Equipment', 'mode_fan', 'Medium'],
    ['Compressor', 'CMP', 'Equipment', 'compress', 'High'], ['Robot', 'ROB', 'Equipment', 'precision_manufacturing', 'High'], ['Press', 'PRS', 'Equipment', 'compress', 'High'], ['Dryer', 'DRY', 'Equipment', 'heat', 'Medium'],
    ['Cutter', 'CUT', 'Equipment', 'content_cut', 'Medium'], ['Mixer', 'MIX', 'Equipment', 'blender', 'Medium'], ['Scale', 'SCL', 'Equipment', 'scale', 'Low'], ['Cooling tower', 'CTW', 'Equipment', 'water', 'High'],
    ['Wrapper', 'WRP', 'Equipment', 'package_2', 'Low'], ['Electrical cabinet', 'ELC', 'Equipment', 'electrical_services', 'Medium'],
    ['Crane', 'CRN', 'Mobile asset', 'construction', 'High'], ['Lift', 'LFT', 'Mobile asset', 'elevator', 'Medium'], ['Forklift', 'FLK', 'Mobile asset', 'forklift', 'Medium'], ['Measuring instrument', 'MSR', 'Mobile asset', 'speed', 'Medium'], ['Tool kit', 'TLK', 'Mobile asset', 'home_repair_service', 'Medium']]
    .map(([name, code, cls, icon, crit]) => C('at-' + code, name, code, { cls, icon, crit })),
  crit: [['Critical', 'C1', '< 2 h', 'Red'], ['High', 'C2', '< 8 h', 'Amber'], ['Medium', 'C3', '< 3 days', 'Amber'], ['Low', 'C4', '< 2 weeks', 'Grey']].map(([name, code, response]) => C('cr-' + code, name, code, { response, system: true })),
  woTypes: [['Corrective', 'COR', 'build', 'Amber', 'Palliative / curative', true], ['Preventive', 'PRV', 'event_repeat', 'Blue', 'Systematic / condition-based', true], ['Predictive', 'PRD', 'insights', 'Purple', 'Condition-based', true],
    ['Inspection', 'INS', 'visibility', 'Teal', 'Regulatory / routine', true], ['Improvement', 'IMP', 'trending_up', 'Green', 'Continuous improvement', true]].map(([name, code, icon, color, strategy, active]) => C('wt-' + code, name, code, { icon, color, strategy, active })),
  problems: [['Leak', 'LEAK', 'water_drop'], ['Abnormal noise', 'NOISE', 'graphic_eq'], ['Vibration', 'VIB', 'vibration'], ['Overheating', 'HEAT', 'device_thermostat'], ["Won't start", 'START', 'power_off'], ['Electrical fault', 'ELEC', 'bolt'], ['Safety issue', 'SAFE', 'health_and_safety'], ['Other', 'OTH', 'more_horiz']].map(([name, code, icon]) => C('pb-' + code, name, code, { icon })),
  failures: [['Mechanical', 'MEC'], ['Electrical', 'ELE'], ['Hydraulic', 'HYD'], ['Pneumatic', 'PNE'], ['Instrumentation', 'INS'], ['Software / PLC', 'PLC'], ['Operator error', 'OPE']].map(([name, code]) => C('fc-' + code, name, code)),
  prio: [['Critical', 'P1', '4 h'], ['High', 'P2', '24 h'], ['Medium', 'P3', '7 days'], ['Low', 'P4', '30 days']].map(([name, code, due]) => C('pr-' + code, name, code, { due, system: true })),
  status: [['Requested', 'REQ', 'Request'], ['Not scheduled', 'NSC', 'Open'], ['Scheduled', 'SCH', 'Open'], ['Overdue', 'OVD', 'Computed'], ['In progress', 'INP', 'Open'], ['Waiting (flag on open interventions)', 'WAI', 'Flag'], ['Completed', 'CMP', 'Closed']].map(([name, code, stage]) => C('st-' + code, name, code, { stage, system: true })),
  partCats: [['Bearings', 'BRG', 'settings', 'pcs'], ['Belts', 'BLT', 'conveyor_belt', 'pcs'], ['Filters', 'FLT', 'filter_alt', 'pcs'], ['Sensors', 'SEN', 'sensors', 'pcs'], ['Seals & gaskets', 'SEAL', 'radio_button_unchecked', 'pcs'],
    ['Electrical', 'ELE', 'bolt', 'pcs'], ['Drives', 'DRV', 'memory', 'pcs'], ['Safety', 'SAF', 'health_and_safety', 'pair']].map(([name, code, icon, unit]) => C('pc-' + code, name, code, { icon, unit })),
  consCats: [['Lubricants', 'LUB', 'water_drop', 'cartridge'], ['Oils & fluids', 'OIL', 'oil_barrel', 'L'], ['Cleaning', 'CLN', 'cleaning_services', 'roll'], ['Adhesives & sealants', 'ADH', 'format_color_fill', 'tube'], ['Abrasives', 'ABR', 'texture', 'pcs']].map(([name, code, icon, unit]) => C('pc-' + code, name, code, { icon, unit })),
  costCenters: [['Melting maintenance', 'CC-MEL-100', 'MD', 'MEL', 420000], ['Float & forming maintenance', 'CC-FOR-200', 'PL', 'FOR', 780000], ['Tempering line', 'CC-FOR-210', 'PL', 'FOR', 260000],
    ['Utilities', 'CC-UTL-300', 'SM', 'UTL', 190000], ['Logistics & packaging', 'CC-WHS-400', 'AM', 'WHS', 120000], ['Site general & HSE', 'CC-GEN-900', 'GD', '', 80000]]
    .map(([name, code, owner, zone, budget]) => C('cc-' + code, name, code, { owner, zone, budget, desc: '' })),
  customFields: [
    C('cf-optemp', 'Operating temperature', 'op_temp', { entity: 'Asset', type: 'decimal', quantity: 'temperature', decimals: 1, min: '', max: '', required: false, types: ['Furnace', 'Dryer'], options: [], unit: '' }),
    C('cf-press', 'Working pressure', 'work_pressure', { entity: 'Asset', type: 'decimal', quantity: 'pressure', decimals: 2, min: '0', max: '', required: false, types: ['Pump', 'Compressor', 'Press'], options: [], unit: '' }),
    C('cf-atex', 'ATEX zone', 'atex', { entity: 'Asset', type: 'choice', quantity: '', decimals: 0, required: false, types: [], options: ['None', 'Zone 1', 'Zone 2', 'Zone 21', 'Zone 22'], unit: '' }),
    C('cf-meast', 'Measured temperature', 'meas_temp', { entity: 'Intervention', type: 'decimal', quantity: 'temperature', decimals: 1, required: false, types: [], options: [], unit: '' }),
    C('cf-down', 'Production downtime', 'downtime', { entity: 'Intervention', type: 'decimal', quantity: 'duration', decimals: 1, min: '0', required: false, types: [], options: [], unit: '' }),
    C('cf-permit', 'Safety permit', 'permit', { entity: 'Intervention', type: 'choice', quantity: '', required: false, types: [], options: ['None', 'Hot work', 'Confined space', 'Work at height', 'Electrical lockout'], unit: '' }),
    C('cf-size', 'Nominal size', 'nominal_size', { entity: 'Spare part', type: 'decimal', quantity: 'length', decimals: 0, required: false, types: [], options: [], unit: '' }),
    C('cf-shelf', 'Shelf life', 'shelf_life', { entity: 'Spare part', type: 'integer', quantity: '', decimals: 0, required: false, types: [], options: [], unit: 'months' }),
  ],
  labels: [['Square label', 'SQ-50', '50 × 50 mm', true], ['Wide label', 'WD-70', '70 × 35 mm', false], ['Large label', 'LG-100', '100 × 50 mm', false]].map(([name, code, size, def]) => C('lb-' + code, name, code, { size, def })),
  quantities: [],
  sites: [],
};
export const SECTIONS = Object.keys(SEED);

// One-time migration v2: consumable categories move out of partCats into consCats; 'Work order' entity → 'Intervention'; Not scheduled status.
try { const k = 'cmms.config.v1', st = JSON.parse(localStorage.getItem(k) || 'null'); if (st && st.items && !st.v2) { const CONS = ['LUB', 'CLN', 'ADH'];
  if (st.items.partCats) { const moved = st.items.partCats.filter(x => CONS.includes(x.code)); st.items.partCats = st.items.partCats.filter(x => !CONS.includes(x.code)); if (moved.length && !st.items.consCats) st.items.consCats = [...moved, ...SEED.consCats.filter(s => !moved.some(m => m.code === s.code))]; }
  if (st.items.customFields) st.items.customFields = st.items.customFields.map(f => f.entity === 'Work order' ? { ...f, entity: 'Intervention' } : f);
  if (st.items.status) delete st.items.status; st.v2 = 1; localStorage.setItem(k, JSON.stringify(st)); } } catch (e) {}
// One-time migration: the Improvement intervention type is active by default (spec §1).
try { const k = 'cmms.config.v1', st = JSON.parse(localStorage.getItem(k) || 'null'); if (st && st.items && st.items.woTypes && !st.impOn) { st.items.woTypes = st.items.woTypes.map(x => x.code === 'IMP' ? { ...x, active: true } : x); st.impOn = 1; localStorage.setItem(k, JSON.stringify(st)); } } catch (e) {}
export const list = (sec, opts = {}) => { const st = rd(); let items = (st.items && st.items[sec]) || SEED[sec] || [];
  if (st.items && st.items[sec] && ADDED[sec]) { const gone = (st.removed || {})[sec] || []; items = [...items, ...SEED[sec].filter(x => ADDED[sec].includes(x.id) && !gone.includes(x.id) && !items.some(i => i.id === x.id || i.name === x.name))]; } return opts.active ? items.filter(i => i.active !== false) : items.map(i => ({ ...i })); };
export const get = (sec, idOrName) => list(sec).find(i => i.id === idOrName || i.name === idOrName || i.code === idOrName) || null;
const put = (sec, items) => { const st = rd(); st.items = { ...(st.items || {}), [sec]: items }; wr(st); emit('cmms-config', { sec }); };
export const saveAll = put;
export const upsert = (sec, item) => { const items = list(sec); const id = item.id || uid(sec.slice(0, 2) + '-'); const i = items.findIndex(x => x.id === id); const row = { active: true, ...(i >= 0 ? items[i] : {}), ...item, id }; if (i >= 0) items[i] = row; else items.push(row); put(sec, items); return id; };
export const remove = (sec, id) => { if (ADDED[sec] && ADDED[sec].includes(id)) { const st = rd(); st.removed = { ...(st.removed || {}), [sec]: [...((st.removed || {})[sec] || []), id] }; wr(st); } put(sec, list(sec).filter(x => x.id !== id)); };
export const setActive = (sec, id, on) => put(sec, list(sec).map(x => x.id === id ? { ...x, active: on } : x));
export const resetSection = sec => { const st = rd(); if (st.items) delete st.items[sec]; wr(st); emit('cmms-config', { sec }); };
export const names = sec => list(sec, { active: true }).map(i => i.name);

// ---------- Units ----------
export const quantities = () => ({ ...QUANTITIES, ...Object.fromEntries(list('quantities').map(q => [q.code, [q.name, q.units || []]])) });
export const siteUnits = site => { const st = rd(); const base = { ...UNIT_SEED.THO, ...(UNIT_SEED[site] || {}) }; return { ...base, ...((st.units || {})[site] || {}), ...Object.fromEntries(list('quantities').filter(q => !((st.units || {})[site] || {})[q.code]).map(q => [q.code, (q.units || [])[0] || ''])) }; };
export const setUnit = (site, q, u) => { const st = rd(); st.units = { ...(st.units || {}), [site]: { ...((st.units || {})[site] || {}), [q]: u } }; wr(st); emit('cmms-config', { sec: 'units' }); };
export const unitFor = (q, site = currentSite()) => q ? siteUnits(site)[q] || ((quantities()[q] || [])[1] || [])[0] || '' : '';

// ---------- Custom fields ----------
export const fieldsFor = (entity, ctx = {}) => list('customFields', { active: true }).filter(f => f.entity === entity && (!ctx.type || !(f.types || []).length || f.types.includes(ctx.type)));
export const fieldUnit = (f, site) => f.quantity ? unitFor(f.quantity, site) : (f.unit || '');
export const validate = (f, v) => {
  if (v === '' || v == null) return f.required ? 'Required' : '';
  if (f.type === 'decimal' || f.type === 'integer') { const n = Number(String(v).replace(',', '.')); if (isNaN(n)) return 'Enter a number'; if (f.type === 'integer' && !Number.isInteger(n)) return 'Whole number only';
    if (f.min !== '' && f.min != null && n < +f.min) return `Min ${f.min}`; if (f.max !== '' && f.max != null && n > +f.max) return `Max ${f.max}`; }
  return '';
};
export const fmt = (f, v, site) => {
  if (v === '' || v == null) return '—';
  if (f.type === 'boolean') return v === true || v === 'yes' ? 'Yes' : 'No';
  if (f.type === 'decimal' || f.type === 'integer') { const n = Number(String(v).replace(',', '.')); if (isNaN(n)) return String(v); const u = fieldUnit(f, site); return n.toLocaleString('en-US', { minimumFractionDigits: f.type === 'decimal' ? +f.decimals || 0 : 0, maximumFractionDigits: f.type === 'decimal' ? +f.decimals || 0 : 0 }) + (u ? (u === '%' ? '' : ' ') + u : ''); }
  if (f.type === 'date') { const d = new Date(v + 'T12:00'); return isNaN(d) ? v : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  return String(v);
};

// ---------- Lookups used by forms ----------
export const woType = name => { const t = get('woTypes', name) || { icon: 'build', color: 'Grey' }; const [fg, bg] = PALETTE[t.color] || PALETTE.Grey; return { name: t.name || name, icon: t.icon, fg, bg }; };
export const woTypes = () => list('woTypes', { active: true }).map(t => ({ ...t, ...woType(t.name) }));
export const itemCats = kind => list(kind === 'consumable' ? 'consCats' : 'partCats', { active: true });
export const allItemCats = () => [...list('partCats').map(x => ({ ...x, kind: 'part' })), ...list('consCats').map(x => ({ ...x, kind: 'consumable' }))];
export const problems = () => list('problems', { active: true });
export const assetTypes = cls => list('assetTypes', { active: true }).filter(t => !cls || t.cls === (cls === 'mobile' ? 'Mobile asset' : 'Equipment'));
export const fmtBudget = n => window.RelixAccess && !window.RelixAccess.canFinance() ? window.RelixAccess.MASK : '€' + Math.round(+n || 0).toLocaleString('en-US');

if (typeof window !== 'undefined') window.RelixConfig = { uid, currentSite, PALETTE, FIELD_TYPES, ENTITIES, QUANTITIES, PART_UNITS, SECTIONS, list, get, saveAll, upsert, remove, setActive, resetSection, names, quantities, siteUnits, setUnit, unitFor, fieldsFor, fieldUnit, validate, fmt, woType, woTypes, assetTypes, fmtBudget, itemCats, allItemCats, problems };
