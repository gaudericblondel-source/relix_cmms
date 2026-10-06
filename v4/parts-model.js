// Relix spare parts & suppliers (window.RelixParts). Storage: cmms.parts.v2 (full list once edited), cmms.suppliers.v1. Events: cmms-parts, cmms-suppliers.
const PK = 'cmms.parts.v2', SK = 'cmms.suppliers.v1';
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const emit = (n, d) => { try { window.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} };

// ---------- GTIN / EAN ----------
export const gtinCheckDigit = body => { const d = String(body).split('').reverse().map(Number); const sum = d.reduce((a, n, i) => a + n * (i % 2 === 0 ? 3 : 1), 0); return (10 - (sum % 10)) % 10; };
export const gtinValid = code => { const c = String(code || '').replace(/\s/g, ''); if (!/^\d+$/.test(c) || ![8, 12, 13, 14].includes(c.length)) return false; return gtinCheckDigit(c.slice(0, -1)) === +c.slice(-1); };
export const gtinKind = code => ({ 8: 'EAN-8', 12: 'UPC-A', 13: 'EAN-13', 14: 'GTIN-14' })[String(code || '').replace(/\s/g, '').length] || 'GTIN';
const ean = b12 => b12 + gtinCheckDigit(b12);

// ---------- Suppliers ----------
// types: 'parts' (spare parts & consumables), 'service' (external labour / contractors), 'rental' (equipment hire). Service fields: hourly €/h, travel € per visit, rates [{ id, name, unit: 'h'|'visit'|'day'|'fixed', price }].
export const SUP_TYPES = { parts: ['Spare parts & consumables', 'inventory_2'], service: ['External services', 'engineering'], rental: ['Equipment rental', 'forklift'] };
export const RATE_UNITS = { h: 'per hour', visit: 'per visit', day: 'per day', fixed: 'fixed price' };
const R = (id, name, unit, price) => ({ id, name, unit, price });
const SERVICE = {
  'sup-atlas': { types: ['parts', 'service'], hourly: 95, travel: 120, rates: [R('r-ac1', 'Compressor annual service', 'fixed', 1450), R('r-ac2', 'Emergency call-out', 'visit', 380)] },
  'sup-skf': { types: ['parts', 'service'], hourly: 88, travel: 150, rates: [R('r-skf1', 'Laser shaft alignment', 'visit', 640), R('r-skf2', 'Vibration analysis report', 'visit', 520)] },
  'sup-jc': { types: ['parts', 'service'], hourly: 92, travel: 140, rates: [R('r-jc1', 'Seal repair & re-lapping', 'fixed', 480)] },
  'sup-glaston': { types: ['service'], hourly: 110, travel: 250, rates: [R('r-gl1', 'Furnace inspection day', 'day', 1650), R('r-gl2', 'Remote diagnosis', 'h', 85)] },
  'sup-apave': { types: ['service'], hourly: 85, travel: 60, rates: [R('r-ap1', 'Lifting equipment inspection', 'visit', 420), R('r-ap2', 'Pressure equipment inspection', 'visit', 680), R('r-ap3', 'Electrical installation check', 'day', 980)] },
  'sup-elec': { types: ['service'], hourly: 72, travel: 45, rates: [R('r-el1', 'Electrician on call (night)', 'h', 98)] },
  'sup-loxam': { types: ['rental'], hourly: '', travel: 90, rates: [R('r-lx1', 'Scissor lift 12 m', 'day', 145), R('r-lx2', 'Mobile crane 25 t with operator', 'day', 890), R('r-lx3', 'Forklift 3 t', 'day', 110), R('r-lx4', 'Industrial dehumidifier', 'day', 65)] },
};
export const typesOf = s => (s && s.types && s.types.length ? s.types : ['parts']);
const SUP_SEED = [
  ['sup-skf', 'SKF France', 'Bearings & transmission', 'Claire Fontaine', 'Key account manager', '+33 1 30 12 73 00', '+33 6 21 44 58 10', 'c.fontaine@skf-france.example', 'www.skf.com', '34 avenue des Trois Peuples, 78180 Montigny-le-Bretonneux', 'FR-THO-10442', 3, '60 days', 5, 'Active', '#0F4C9B'],
  ['sup-gates', 'Gates Europe', 'Belts & transmission', 'Tom Vermeulen', 'Sales engineer', '+32 53 76 27 11', '', 'orders.fr@gates.example', 'www.gates.com', 'Dr. Carlierlaan 30, 9320 Erembodegem, Belgium', 'GE-55120', 7, '45 days', 4, 'Active', '#C8102E'],
  ['sup-parker', 'Parker Hannifin', 'Hydraulics & filtration', 'Julien Morel', 'Customer service', '+33 4 50 25 80 25', '', 'service.fr@parker.example', 'www.parker.com', '142 rue de la Forêt, 74130 Contamine-sur-Arve', 'PH-77812', 10, '60 days', 3, 'Active', '#1C1C1C'],
  ['sup-wika', 'WIKA', 'Instrumentation', 'Nadia Keller', 'Inside sales', '+33 1 78 77 30 30', '', 'info@wika.example', 'www.wika.fr', '38 avenue du Gros Chêne, 95220 Herblay', 'WK-30019', 5, '30 days', 4, 'Active', '#004B87'],
  ['sup-jc', 'John Crane', 'Seals', 'Marc Lefèbvre', 'Field service', '+33 1 34 90 76 00', '+33 6 80 12 33 45', 'm.lefebvre@johncrane.example', 'www.johncrane.com', '1 rue du Bois Sauvage, 91000 Évry', 'JC-1189', 6, '45 days', 5, 'Active', '#00843D'],
  ['sup-total', 'TotalEnergies', 'Lubricants', 'Service Lubrifiants', 'Order desk', '+33 1 41 35 40 00', '', 'lubrifiants@totalenergies.example', 'www.totalenergies.fr', 'Tour Coupole, 92078 Paris La Défense', 'TE-880211', 4, '30 days', 4, 'Active', '#ED0000'],
  ['sup-sick', 'Sick', 'Sensors & encoders', 'Lea Brunner', 'Account manager', '+33 1 64 62 35 00', '', 'info@sick.example', 'www.sick.com', '44 rue Jean Pierre Timbaud, 78190 Trappes', 'SK-44100', 8, '60 days', 4, 'Active', '#007CC1'],
  ['sup-schneider', 'Schneider Electric', 'Electrical & drives', 'Antoine Girard', 'Distributor contact', '+33 1 41 29 70 00', '+33 6 11 25 90 72', 'a.girard@se.example', 'www.se.com', '35 rue Joseph Monier, 92500 Rueil-Malmaison', 'SE-120448', 5, '60 days', 4, 'Active', '#3DCD58'],
  ['sup-atlas', 'Atlas Copco', 'Compressed air', 'Service Centre Nord', 'Service desk', '+33 3 44 23 60 00', '', 'service.nord@atlascopco.example', 'www.atlascopco.com', 'ZI du Bois de Plaisance, 60200 Compiègne', 'AC-66012', 4, '45 days', 5, 'Active', '#0099CC'],
  ['sup-ksb', 'KSB', 'Pumps & spare kits', 'Hélène Dubois', 'Spare parts', '+33 1 41 47 75 00', '', 'pieces@ksb.example', 'www.ksb.com', '4 allée des Barbanniers, 92635 Gennevilliers', 'KSB-2201', 12, '60 days', 3, 'On hold', '#003F7D'],
  ['sup-wurth', 'Würth France', 'Fasteners & consumables', 'Kevin Roux', 'Field sales', '+33 3 88 64 53 00', '+33 6 70 45 11 08', 'k.roux@wurth.example', 'www.wurth.fr', 'Z.I. Ouest, 67158 Erstein', 'WU-90117', 2, '30 days', 4, 'Active', '#CC0000'],
  ['sup-glaston', 'Glaston Services', 'Furnace OEM service', 'Mikko Laine', 'Field service manager', '+358 10 500 500', '+33 6 44 20 18 07', 'service.fr@glaston.example', 'www.glaston.net', 'Vehmaistenkatu 5, 33730 Tampere, Finland', 'GL-SRV-118', 10, '30 days', 5, 'Active', '#00558C'],
  ['sup-apave', 'Apave', 'Inspection & certification', 'Bureau Compiègne', 'Planning desk', '+33 3 44 38 50 00', '', 'compiegne@apave.example', 'www.apave.com', '12 rue Clément Ader, 60200 Compiègne', 'AP-77310', 5, '30 days', 4, 'Active', '#E30613'],
  ['sup-loxam', 'Loxam', 'Equipment rental', 'Agence Compiègne', 'Rental desk', '+33 3 44 20 11 90', '', 'compiegne@loxam.example', 'www.loxam.fr', 'ZA de Jaux, 60880 Jaux', 'LX-40118', 1, '30 days', 4, 'Active', '#E4002B'],
  ['sup-elec', 'Élec Picardie', 'Electrical contractor', 'Damien Leclerc', 'Site manager', '+33 3 44 86 22 10', '+33 6 12 77 40 51', 'd.leclerc@elecpicardie.example', 'www.elecpicardie.fr', '8 rue des Artisans, 60150 Thourotte', 'EP-2210', 2, '45 days', 4, 'Active', '#F2A900'],
].map(([id, name, category, contact, role, phone, mobile, email, website, address, account, leadDays, terms, rating, status, color]) => ({ id, name, category, contact, role, phone, mobile, email, website, address, account, leadDays, terms, rating, status, color, image: '', notes: '', ...(SERVICE[id] || { types: ['parts'], hourly: '', travel: '', rates: [] }) }));
export const suppliers = () => { const st = rd(SK, null); if (!st) return SUP_SEED.map(s => ({ ...s, rates: (s.rates || []).map(r => ({ ...r })) })); const extra = SUP_SEED.filter(s => SERVICE[s.id] && !st.some(x => x.id === s.id) && !(rd(SK + '.removed', [])).includes(s.id)); return [...st.map(x => x.types ? x : { ...x, ...(SERVICE[x.id] || { types: ['parts'], hourly: '', travel: '', rates: [] }) }), ...extra]; };
export const supplier = id => suppliers().find(s => s.id === id || s.name === id) || null;
export const saveSupplier = (id, data) => { const all = suppliers(); const nid = id || 'sup-' + Date.now().toString(36); const i = all.findIndex(s => s.id === nid); const row = { ...(i >= 0 ? all[i] : { status: 'Active', rating: 3, color: '#475467', image: '' }), ...data, id: nid }; if (i >= 0) all[i] = row; else all.unshift(row); if (!wr(SK, all)) return null; emit('cmms-suppliers', { id: nid }); return nid; };
export const deleteSupplier = id => { wr(SK, suppliers().filter(s => s.id !== id)); wr(SK + '.removed', [...rd(SK + '.removed', []), id]); const ps = parts(); if (ps.some(p => p.supplier === id)) { wr(PK, ps.map(p => p.supplier === id ? { ...p, supplier: '' } : p)); emit('cmms-parts', {}); } emit('cmms-suppliers', { id, deleted: true }); };
export const initials = name => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// ---------- Parts ----------
const SEED = [
  ['BRG-6205', 'ART-100245', ean('400638133393'), 'Ball bearing 6205-2RS', 'Bearings', 'WHS-SP-MS', 'A-03-2', 42, 10, 60, 'pcs', 12.4, 'sup-skf', '6205-2RSH', ['CV-L3', 'PH-030', 'V-12'], 'CC-FOR-200', 4],
  ['BLT-BPU280', 'ART-100311', ean('501234567801'), 'Drive belt BPU280', 'Belts', 'FOR-FL-ST', 'F-01-4', 2, 5, 20, 'pcs', 38.9, 'sup-gates', 'BPU-280', ['CV-L2', 'S-01'], 'CC-FOR-200', 0],
  ['FLT-HX10', 'ART-100478', ean('401234500012'), 'Hydraulic filter HX-10', 'Filters', 'UTL-WS-ST', 'W-02-1', 0, 4, 12, 'pcs', 54.0, 'sup-parker', '937399Q', ['PH-030'], 'CC-UTL-300', 0],
  ['SEN-PT100', 'ART-100502', ean('404040100230'), 'Temperature probe PT100', 'Sensors', 'WHS-SP-MS', 'B-11-3', 6, 3, 10, 'pcs', 86.5, 'sup-wika', 'TR10-C', ['FT1-FR-001', 'FT2-FR-001'], 'CC-FOR-210', 2],
  ['SEAL-M45', 'ART-100617', ean('500200300400'), 'Mechanical seal 45 mm', 'Seals & gaskets', 'WHS-SP-MS', 'A-07-1', 3, 2, 8, 'pcs', 142.0, 'sup-jc', 'T21-45', ['P-101'], 'CC-FOR-210', 1],
  ['GSK-P101', 'ART-100618', ean('400600700810'), 'Pump casing gasket', 'Seals & gaskets', 'WHS-SP-MS', 'A-07-2', 4, 2, 10, 'pcs', 18.6, 'sup-ksb', '400.01', ['P-101'], 'CC-FOR-210', 0],
  ['ORG-KIT', 'ART-100702', ean('402330044012'), 'O-ring kit NBR', 'Seals & gaskets', 'UTL-WS-ST', 'W-04-3', 12, 4, 20, 'kit', 24.9, 'sup-wurth', '0890 120', ['P-101', 'PH-030'], 'CC-UTL-300', 0],
  ['GRS-LT2', 'ART-100811', ean('330015060012'), 'Lithium grease LT2 400 g', 'Lubricants', 'UTL-WS-ST', 'W-05-2', 18, 6, 40, 'cartridge', 7.8, 'sup-total', 'MULTIS EP2', ['RP-01', 'CV-L3'], 'CC-WHS-400', 0],
  ['ENC-500', 'ART-100903', ean('403012345678'), 'Incremental encoder 500 ppr', 'Electrical', 'WHS-SP-MS', 'C-02-4', 1, 2, 6, 'pcs', 212.0, 'sup-sick', 'DFS60B', ['PK-L1'], 'CC-WHS-400', 0],
  ['VFD-ATV320', 'ART-101020', ean('338991234567'), 'Variable speed drive ATV320', 'Drives', 'WHS-SP-MS', 'C-09-1', 0, 1, 3, 'pcs', 684.0, 'sup-schneider', 'ATV320U40N4B', ['CV-L3'], 'CC-FOR-200', 0],
  ['FLT-AIR-C01', 'ART-101134', ean('731000123456'), 'Air intake filter C-01', 'Filters', 'WHS-SP-MS', 'B-04-2', 7, 4, 12, 'pcs', 31.2, 'sup-atlas', '1613 7407 00', ['C-01'], 'CC-UTL-300', 0],
  ['CTR-LC1D', 'ART-101207', ean('338991400118'), 'Contactor LC1D18', 'Electrical', 'WHS-SP-MS', 'C-05-3', 11, 4, 16, 'pcs', 48.6, 'sup-schneider', 'LC1D18M7', ['V-12', 'FT2-FR-001'], 'CC-FOR-200', 0],
].map(([ref, code, gtin, name, cat, store, bin, qty, min, max, unit, cost, supplier, supplierRef, assets, costCenter, reserved]) => ({ ref, code, gtin, name, cat, store, bin, qty, min, max, unit, cost, supplier, supplierRef, assets, costCenter, reserved, image: '', desc: '', custom: {}, moves: [] }));
export const parts = () => rd(PK, null) || SEED.map(p => ({ ...p, assets: [...p.assets], custom: {}, moves: [] }));
export const part = ref => parts().find(p => p.ref === ref) || null;
export const savePart = (ref, data) => { const all = parts(); const i = ref ? all.findIndex(p => p.ref === ref) : -1; const row = { ...(i >= 0 ? all[i] : { qty: 0, reserved: 0, moves: [], custom: {}, assets: [], image: '' }), ...data }; if (i >= 0) all[i] = row; else all.unshift(row); if (!wr(PK, all)) return false; emit('cmms-parts', { ref: row.ref }); return true; };
export const deletePart = ref => { wr(PK, parts().filter(p => p.ref !== ref)); emit('cmms-parts', { ref, deleted: true }); };
export const adjust = (ref, delta, reason, sub) => { const p = part(ref); if (!p) return; const qty = Math.max(0, p.qty + delta); savePart(ref, { qty, moves: [[delta < 0 ? 'remove' : 'add', reason, sub || 'Manual entry · G. Durand', (delta < 0 ? '−' : '+') + Math.abs(delta), 'Just now', delta < 0 ? '#B42318' : '#0B6B4A'], ...(p.moves || [])].slice(0, 20) }); };
export const partsOfSupplier = id => parts().filter(p => p.supplier === id);
export const partsOfAsset = id => parts().filter(p => (p.assets || []).includes(id));
export const status = p => p.qty === 0 ? ['Out of stock', '#FDECEC', '#B42318', '#D92D20'] : p.qty < p.min ? ['Low stock', '#FEF3E2', '#B54708', '#F79009'] : ['In stock', '#E6F4EE', '#0B6B4A', '#12A06E'];
export const eur = n => '€' + (+n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Resize an uploaded image to a small JPEG data URL (keeps localStorage light).
export const readImage = (file, max = 360) => new Promise((res, rej) => { if (!file || !/^image\//.test(file.type)) return rej(new Error('Not an image')); const fr = new FileReader(); fr.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.82)); }; img.onerror = rej; img.src = fr.result; }; fr.onerror = rej; fr.readAsDataURL(file); });

if (typeof window !== 'undefined') window.RelixParts = { SUP_TYPES, RATE_UNITS, typesOf, gtinCheckDigit, gtinValid, gtinKind, suppliers, supplier, saveSupplier, deleteSupplier, initials, parts, part, savePart, deletePart, adjust, partsOfSupplier, partsOfAsset, status, eur, readImage };
