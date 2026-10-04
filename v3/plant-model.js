// Relix plant model — Saint-Gobain hierarchy Plant > Zone > Line > Step, assets (fixed + mobile), storage areas, mobile-asset reservations.
// Storage: cmms.assets.v1 (asset overrides/new). Events: cmms-asset, cmms-asset-wizard.
const AKEY = 'cmms.assets.v1';
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const emit = (n, d) => { try { window.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} };

export const PLANT = { id: 'THO', name: 'Thourotte Plant', code: 'FR-THO' };
export const ZONE_LOOK = { MEL: ['local_fire_department', '#C4320A', '#FEF0E6'], FOR: ['conveyor_belt', '#2456B8', '#EAF1FD'], UTL: ['bolt', '#6941C6', '#F3EEFC'], WHS: ['warehouse', '#0B6B4A', '#E6F4EE'] };
// [id, name, kind, parent, extra]
const H = [
  ['MEL', 'Melting', 'zone'], ['FOR', 'Fiberizing & Forming', 'zone'], ['UTL', 'Utilities', 'zone'], ['WHS', 'Warehousing', 'zone'],
  ['MEL-BH', 'Batch House', 'line', 'MEL'], ['MEL-BH-WG', 'Weighing', 'step', 'MEL-BH'], ['MEL-BH-MX', 'Mixing', 'step', 'MEL-BH'],
  ['MEL-FU', 'Furnace F1', 'line', 'MEL'], ['MEL-FU-ML', 'Melting tank', 'step', 'MEL-FU'], ['MEL-FU-RG', 'Regenerators', 'step', 'MEL-FU'],
  ['FOR-FL', 'Float Line', 'line', 'FOR'], ['FOR-FL-TB', 'Tin bath', 'step', 'FOR-FL'], ['FOR-FL-AL', 'Annealing lehr', 'step', 'FOR-FL'], ['FOR-FL-CE', 'Cold end', 'step', 'FOR-FL'], ['FOR-FL-ST', 'Float Line store', 'step', 'FOR-FL', 'storage'],
  ['FOR-TL', 'Tempering Line', 'line', 'FOR'], ['FOR-TL-HT', 'Heating', 'step', 'FOR-TL'], ['FOR-TL-QC', 'Quench & cooling', 'step', 'FOR-TL'], ['FOR-TL-PU', 'Pumping', 'step', 'FOR-TL'],
  ['FOR-CL', 'Cutting Line', 'line', 'FOR'], ['FOR-CL-CT', 'Cutting', 'step', 'FOR-CL'],
  ['UTL-CA', 'Compressed Air', 'line', 'UTL'], ['UTL-CA-CP', 'Compression', 'step', 'UTL-CA'], ['UTL-CA-DR', 'Drying', 'step', 'UTL-CA'],
  ['UTL-CW', 'Cooling Water', 'line', 'UTL'], ['UTL-CW-CT', 'Cooling tower', 'step', 'UTL-CW'],
  ['UTL-WS', 'Maintenance Workshop', 'line', 'UTL'], ['UTL-WS-PR', 'Press area', 'step', 'UTL-WS'], ['UTL-WS-ST', 'Workshop store', 'step', 'UTL-WS', 'storage'],
  ['WHS-PK', 'Packaging', 'line', 'WHS'], ['WHS-PK-PL', 'Palletizing', 'step', 'WHS-PK'], ['WHS-PK-WR', 'Wrapping', 'step', 'WHS-PK'],
  ['WHS-SP', 'Spare parts stores', 'line', 'WHS'], ['WHS-SP-MS', 'Main store', 'step', 'WHS-SP', 'storage'],
  ['WHS-ME', 'Mobile equipment', 'line', 'WHS'], ['WHS-ME-BY', 'Equipment bay', 'step', 'WHS-ME', 'bay'],
];
export const NODES = H.map(([id, name, kind, parent, extra]) => ({ id, name, kind, parent: parent || 'THO', storage: extra === 'storage', bay: extra === 'bay' }));
export const node = id => NODES.find(n => n.id === id) || null;
export const children = id => NODES.filter(n => n.parent === id);
export const zones = () => children('THO');
export const chain = id => { const out = []; let n = node(id); while (n) { out.unshift(n); n = node(n.parent); } return out; };
export const pathOf = id => chain(id).map(n => n.name).join(' › ');
export const zoneOf = id => chain(id)[0] || null;
export const lineOf = id => chain(id)[1] || null;
export const storages = () => NODES.filter(n => n.storage);
export const storageByName = name => NODES.find(n => n.storage && n.name === name) || null;

// ---------- Types ----------
export const TYPES = {
  fixed: [['Furnace', 'local_fire_department'], ['Conveyor', 'conveyor_belt'], ['Pump', 'water_pump'], ['Fan', 'mode_fan'], ['Compressor', 'compress'], ['Robot', 'precision_manufacturing'], ['Press', 'compress'], ['Dryer', 'heat'], ['Cutter', 'content_cut'], ['Mixer', 'blender'], ['Scale', 'scale'], ['Cooling tower', 'water'], ['Wrapper', 'package_2'], ['Electrical cabinet', 'electrical_services']],
  mobile: [['Crane', 'construction'], ['Lift', 'elevator'], ['Forklift', 'forklift'], ['Measuring instrument', 'speed'], ['Tool kit', 'home_repair_service']],
};
export const typeIcon = t => ([...TYPES.fixed, ...TYPES.mobile].find(x => x[0] === t) || [t, 'precision_manufacturing'])[1];
export const SPEC_SUGGEST = {
  Furnace: ['Max temperature', 'Power', 'Heating zones', 'Capacity'], Conveyor: ['Length', 'Belt width', 'Speed', 'Motor power'], Pump: ['Flow rate', 'Head', 'Power', 'Speed'], Fan: ['Air flow', 'Pressure', 'Power', 'Speed'],
  Compressor: ['Free air delivery', 'Pressure', 'Power', 'Oil type'], Robot: ['Payload', 'Reach', 'Axes', 'Controller'], Press: ['Force', 'Stroke', 'Oil volume'], Dryer: ['Flow', 'Dew point', 'Power'], Cutter: ['Table size', 'Cutting speed'],
  Mixer: ['Capacity', 'Power', 'Speed'], Scale: ['Capacity', 'Accuracy'], 'Cooling tower': ['Cooling capacity', 'Flow'], Wrapper: ['Pallet size', 'Cycle time'], 'Electrical cabinet': ['Voltage', 'Rated current', 'IP rating'],
  Crane: ['Capacity', 'Reach', 'Energy'], Lift: ['Working height', 'Capacity', 'Energy'], Forklift: ['Capacity', 'Lift height', 'Energy'], 'Measuring instrument': ['Range', 'Accuracy', 'Calibration due'], 'Tool kit': ['Contents', 'Calibration due'],
};
export const DOC_KINDS = { Manual: ['menu_book', '#2456B8', '#EAF1FD'], Drawing: ['architecture', '#6941C6', '#F3EEFC'], Datasheet: ['description', '#0E7490', '#E3F4F7'], Procedure: ['checklist', '#0B6B4A', '#E6F4EE'], Certificate: ['verified', '#B54708', '#FEF3E2'] };
export const STATUS = { 'In service': ['#E6F4EE', '#0B6B4A'], Stopped: ['#FDECEC', '#B42318'], 'Out of service': ['#EEF1F4', '#475467'] };
export const CRIT = { Critical: '#C00018', High: '#E0591B', Medium: '#E3A008', Low: '#98A2B3' };

// ---------- Assets ----------
const D = (name, kind, size, added = 'Sep 12, 2026') => ({ name, kind, size, added });
const SEED = [
  ['MX-02', 'Mixer 02', 'Mixer', 'MEL-BH-MX', 'In service', 'Medium', 'SB', 'Eirich', 'R19', 'E-48812', 2017],
  ['WG-01', 'Batch scale W-01', 'Scale', 'MEL-BH-WG', 'In service', 'Low', 'JM', 'Mettler Toledo', 'PFK989', 'MT-20931', 2019],
  ['FU-01', 'Melting furnace F1', 'Furnace', 'MEL-FU-ML', 'In service', 'Critical', 'GD', 'Sorg', 'Float 800', 'SG-F1-2011', 2011],
  ['RG-01', 'Regenerator fan R-01', 'Fan', 'MEL-FU-RG', 'In service', 'High', 'MD', 'Howden', 'ANT-1400', 'HW-7731', 2011],
  ['TB-01', 'Tin Bath', 'Furnace', 'FOR-FL-TB', 'Stopped', 'Critical', 'MD', 'Fives Stein', 'TB-4.2', 'FS-0912', 2011],
  ['V-12', 'Fan V-12', 'Fan', 'FOR-FL-TB', 'In service', 'High', 'AM', 'Ziehl-Abegg', 'ZN100', 'ZA-55120', 2015],
  ['AL-01', 'Annealing Lehr', 'Furnace', 'FOR-FL-AL', 'In service', 'High', 'MD', 'Fives Stein', 'Lehr 180', 'FS-0913', 2011],
  ['V-08', 'Fan V-08', 'Fan', 'FOR-FL-AL', 'In service', 'Medium', 'AM', 'Ziehl-Abegg', 'ZN80', 'ZA-55093', 2015],
  ['CV-L3', 'Conveyor Line 3', 'Conveyor', 'FOR-FL-CE', 'In service', 'High', 'GD', 'Bystronic', 'Cold-end 3', 'BY-3317', 2016],
  ['CV-L2', 'Conveyor Line 2', 'Conveyor', 'FOR-FL-CE', 'In service', 'Medium', 'PL', 'Bystronic', 'Cold-end 2', 'BY-3302', 2016],
  ['FT1-FR-001', 'Tempering Furnace 1', 'Furnace', 'FOR-TL-HT', 'In service', 'Critical', 'PL', 'Glaston', 'FC500', 'GL-500-118', 2018],
  ['FT2-FR-001', 'Tempering Furnace 2', 'Furnace', 'FOR-TL-HT', 'In service', 'Critical', 'PL', 'Glaston', 'FC500', 'GL-500-204', 2020],
  ['QC-01', 'Quench blower Q-01', 'Fan', 'FOR-TL-QC', 'Out of service', 'Medium', 'SM', 'Nicotra', 'AT 18-18', 'NI-77301', 2018],
  ['P-101', 'Pump P-101', 'Pump', 'FOR-TL-PU', 'Stopped', 'Critical', 'PL', 'KSB', 'Etanorm 65-200', 'KSB-9921', 2014],
  ['BC-548', 'Bottero 548 Cutter', 'Cutter', 'FOR-CL-CT', 'In service', 'High', 'AM', 'Bottero', '548 LAM', 'BT-548-77', 2019],
  ['C-01', 'Compressor C-01', 'Compressor', 'UTL-CA-CP', 'In service', 'High', 'SM', 'Atlas Copco', 'GA 90', 'AC-90-4471', 2016],
  ['C-02', 'Compressor C-02', 'Compressor', 'UTL-CA-CP', 'In service', 'Medium', 'SM', 'Atlas Copco', 'GA 75', 'AC-75-1182', 2021],
  ['S-01', 'Dryer S-01', 'Dryer', 'UTL-CA-DR', 'In service', 'Medium', 'MD', 'Atlas Copco', 'FD 300', 'AC-FD-0811', 2016],
  ['CT-01', 'Cooling Tower', 'Cooling tower', 'UTL-CW-CT', 'In service', 'High', 'JM', 'Baltimore Aircoil', 'VXT-215', 'BAC-2210', 2012],
  ['PH-030', 'Hydraulic Press PH-030', 'Press', 'UTL-WS-PR', 'In service', 'Medium', 'PL', 'Lasco', 'HP 300', 'LA-300-09', 2009],
  ['RP-01', 'Palletizing Robot 1', 'Robot', 'WHS-PK-PL', 'In service', 'High', 'AM', 'FANUC', 'M-410iC', 'FA-41077', 2020],
  ['PK-L1', 'Packaging Line 1', 'Conveyor', 'WHS-PK-PL', 'In service', 'Medium', 'AM', 'Grenzebach', 'PL-1', 'GZ-1190', 2020],
  ['WR-01', 'Stretch wrapper W-01', 'Wrapper', 'WHS-PK-WR', 'In service', 'Low', 'JM', 'Robopac', 'Rotoplat 708', 'RP-7080', 2021],
  ['MC-01', 'Mobile crane 5 t', 'Crane', 'WHS-ME-BY', 'In service', 'High', 'MD', 'Manitou', 'MRT 2150', 'MN-2150-31', 2019, 'mobile'],
  ['SL-01', 'Scissor lift 12 m', 'Lift', 'WHS-ME-BY', 'In service', 'Medium', 'JM', 'Haulotte', 'Compact 12', 'HA-C12-88', 2020, 'mobile'],
  ['FL-03', 'Forklift 3 t', 'Forklift', 'WHS-ME-BY', 'In service', 'Medium', 'AM', 'Linde', 'E30', 'LI-E30-551', 2022, 'mobile'],
  ['TC-01', 'Thermal camera FLIR T840', 'Measuring instrument', 'WHS-ME-BY', 'In service', 'Medium', 'SB', 'FLIR', 'T840', 'FL-T840-21', 2023, 'mobile'],
  ['LA-01', 'Laser alignment kit', 'Tool kit', 'UTL-WS-ST', 'In service', 'Medium', 'MD', 'SKF', 'TKSA 51', 'SKF-51-904', 2021, 'mobile'],
  ['VA-02', 'Vibration analyzer', 'Measuring instrument', 'UTL-WS-ST', 'In service', 'Medium', 'SB', 'Fluke', '810', 'FK-810-337', 2022, 'mobile'],
];
const SPECS = {
  'FT2-FR-001': [['Max temperature', '720 °C'], ['Power', '850 kW'], ['Heating zones', '12'], ['Capacity', '2.4 × 4.2 m glass']],
  'FT1-FR-001': [['Max temperature', '700 °C'], ['Power', '800 kW'], ['Heating zones', '10'], ['Capacity', '2.4 × 3.6 m glass']],
  'P-101': [['Flow rate', '90 m³/h'], ['Head', '48 m'], ['Power', '18.5 kW'], ['Speed', '2,950 rpm']],
  'C-01': [['Free air delivery', '16.4 m³/min'], ['Pressure', '7.5 bar'], ['Power', '90 kW'], ['Oil type', 'Roto-Inject Fluid']],
  'TB-01': [['Max temperature', '1,100 °C'], ['Capacity', '800 t/day'], ['Heating zones', '6']],
  'CV-L3': [['Length', '64 m'], ['Belt width', '4.2 m'], ['Speed', '0–25 m/min'], ['Motor power', '4 × 7.5 kW']],
  'MC-01': [['Capacity', '5 t'], ['Reach', '15 m'], ['Energy', 'Diesel']], 'SL-01': [['Working height', '12 m'], ['Capacity', '450 kg'], ['Energy', 'Battery']],
  'TC-01': [['Range', '−20 to 1,500 °C'], ['Accuracy', '±1 °C'], ['Calibration due', 'Mar 2027']], 'LA-01': [['Contents', '2 measuring units, brackets, tablet'], ['Calibration due', 'Jan 2027']],
};
const DOCS = {
  'FT2-FR-001': [D('Glaston FC500 operating manual', 'Manual', '18.4 MB'), D('Heating zone wiring diagram', 'Drawing', '2.1 MB'), D('Element replacement procedure', 'Procedure', '640 KB'), D('Pressure equipment certificate', 'Certificate', '320 KB', 'Jan 08, 2026')],
  'P-101': [D('KSB Etanorm manual', 'Manual', '9.8 MB'), D('Seal replacement procedure', 'Procedure', '1.2 MB'), D('Pump curve datasheet', 'Datasheet', '410 KB')],
  'C-01': [D('Atlas Copco GA 90 manual', 'Manual', '22.0 MB'), D('Compressed air network P&ID', 'Drawing', '3.4 MB')],
  'MC-01': [D('Manitou MRT 2150 manual', 'Manual', '14.2 MB'), D('Annual lifting inspection', 'Certificate', '280 KB', 'Jun 02, 2026')],
};
const base = () => SEED.map(([id, name, type, loc, status, crit, owner, manufacturer, model, serial, year, cls]) => ({ id, name, type, loc, status, crit, owner, manufacturer, model, serial, year: String(year), cls: cls || 'fixed', specs: SPECS[id] || [], docs: DOCS[id] || [], desc: '' }));
export const assets = () => { const o = rd(AKEY, {}); const b = base().map(a => o[a.id] ? { ...a, ...o[a.id] } : a); Object.keys(o).filter(k => !b.some(a => a.id === k) && !o[k].deleted).forEach(k => b.unshift({ ...o[k], id: k })); return b.filter(a => !(o[a.id] && o[a.id].deleted)); };
export const asset = id => assets().find(a => a.id === id || a.name === id) || null;
export const saveAsset = (id, data) => { const o = rd(AKEY, {}); o[id] = { ...(o[id] || {}), ...data }; wr(AKEY, o); emit('cmms-asset', { id }); };
export const mobileAssets = () => assets().filter(a => a.cls === 'mobile');
export const suggestCode = (type, loc) => { const l = lineOf(loc), t = (type || 'AS').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase(); const n = assets().filter(a => a.loc && lineOf(a.loc) && l && lineOf(a.loc).id === l.id).length + 1; return `${l ? l.id.split('-')[1] : 'NEW'}-${t}-${String(n).padStart(3, '0')}`; };
export const openWizard = id => emit('cmms-asset-wizard', { id: id || null });

// ---------- Mobile-asset reservations (Planning day 0 = Mon Sep 28, 2026) ----------
export const RESERVATIONS = [
  ['MC-01', 1, 9, 12, 'Tin Bath — Roller replacement', 'AM'],
  ['TC-01', 1, 7, 8.5, 'Tempering Furnace 2 — Thermal imaging', 'SB'], ['TC-01', 2, 11, 13, 'Tin Bath — Thermal imaging', 'SB'],
  ['LA-01', 1, 13.5, 16.5, 'Annealing Lehr — Roller alignment', 'MD'],
  ['SL-01', 1, 15.5, 16.5, 'Fan V-12 — Bearing lubrication', 'JM'], ['SL-01', 3, 13, 15, 'Compressor C-01 — Annual inspection', 'SM'],
  ['VA-02', 1, 13, 14, 'Mixer 02 — Vibration analysis', 'SB'], ['VA-02', 2, 15, 16, 'Fan V-12 — Vibration analysis', 'SB'],
].map(([tool, day, from, to, wo, who]) => ({ tool, day, from, to, wo, who }));
export const reservationsOf = tool => RESERVATIONS.filter(r => r.tool === tool);

if (typeof window !== 'undefined') window.RelixPlant = { PLANT, ZONE_LOOK, NODES, node, children, zones, chain, pathOf, zoneOf, lineOf, storages, storageByName, TYPES, typeIcon, SPEC_SUGGEST, DOC_KINDS, STATUS, CRIT, assets, asset, saveAsset, mobileAssets, suggestCode, openWizard, RESERVATIONS, reservationsOf };
