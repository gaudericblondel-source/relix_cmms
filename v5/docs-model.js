// Relix documents library — one document can be linked to many assets, interventions and checklist steps.
// Storage cmms.docs.v1 ({ rows: [...] } full library once edited). Event cmms-docs. window.RelixDocs.
const KEY = 'cmms.docs.v1';
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const emit = d => { try { window.dispatchEvent(new CustomEvent('cmms-docs', { detail: d })); } catch (e) {} };

export const CATS = { Plan: ['#EAF1FD', '#2456B8', 'architecture'], Manual: ['#F3EEFC', '#6941C6', 'menu_book'], Procedure: ['#E6F4EE', '#0B6B4A', 'checklist'], Datasheet: ['#E3F4F7', '#0E7490', 'description'], Certificate: ['#FEF3E2', '#B54708', 'verified'], Photo: ['#FEF0E6', '#C4320A', 'image'], Report: ['#FDECEC', '#B42318', 'analytics'], Other: ['#EEF1F4', '#475467', 'draft'] };
export const FT = { PDF: ['#FDECEC', '#B42318'], DOCX: ['#EAF1FD', '#2456B8'], XLSX: ['#E6F4EE', '#0B6B4A'], JPG: ['#FEF3E2', '#B54708'], PNG: ['#FEF3E2', '#B54708'], DWG: ['#F3EEFC', '#6941C6'], MP4: ['#E3F4F7', '#0E7490'] };
export const DISCIPLINES = ['Mechanical', 'Electrical', 'Hydraulic', 'Pneumatic', 'Automation', 'Safety', 'Condition monitoring', 'Maintenance'];
// Known interventions a document can be linked to (seed + created ones from collab-model when available).
const SEED_WOS = [['WO-1339859', 'Pump P-101 — Seal replacement'], ['WO-1339850', 'Fan V-12 — Abnormal fan noise'], ['home-p1', 'Fan V-12 — Abnormal vibration'], ['home-p2', 'Compressor C-01 — Filter replacement'], ['WO-1339851', 'Tempering Furnace 2 — Temperature check'], ['WO-1339846', 'Conveyor Line 3 — Sensor check'], ['WO-1339840', 'Hydraulic Press PH-030 — Oil leak']];
export const knownWos = () => { const C = typeof window !== 'undefined' && window.RelixCollab; const extra = C && C.createdWos ? C.createdWos().map(w => [w.key, `${w.asset} — ${w.task}`]) : []; return [...extra, ...SEED_WOS].filter((x, i, a) => a.findIndex(y => y[0] === x[0]) === i); };
export const woTitle = k => (knownWos().find(w => w[0] === k) || [k, k])[1];
// Checklist steps that can carry documents: [ref 'checklistId:stepId', checklist name, step title]
export const STEP_REFS = [['pump-seal:s1', 'Pump seal replacement', 'Secure the pump'], ['pump-seal:s4', 'Pump seal replacement', 'Replace the mechanical seal'], ['pump-seal:s7', 'Pump seal replacement', 'Discharge pressure'], ['standard:t1', 'Standard intervention', 'Secure the equipment'], ['standard:t3', 'Standard intervention', 'Carry out the work']];
export const stepLabel = ref => { const r = STEP_REFS.find(x => x[0] === ref); if (r) return { cl: r[1], step: r[2] }; const [cl, st] = (ref || '').split(':'); return { cl: cl || '', step: st || ref }; };

const V = (n, last, note) => Array.from({ length: n }, (_, i) => n - i).map(v => ({ v: 'V' + v, note: v === n ? note : v === 1 ? 'Initial release' : 'Revised edition', who: ['P. Leroy', 'S. Martin', 'M. Dupont'][v % 3], when: v === n ? last : ['Jun 14, 2026', 'Mar 2, 2026', 'Jan 9, 2026'][v % 3] }));
const S = (id, name, cat, n, date, ft, size, disc, links, o = {}) => ({ id, name, cat, ver: 'V' + n, versions: V(n, date, o.note || 'Updated after review'), date, ft, size, disc, desc: o.desc || '', fav: !!o.fav, archived: !!o.archived, pages: ft === 'JPG' || ft === 'PNG' ? 1 : (name.length % 9) + 2, by: o.by || 'P. Leroy', links: { assets: links.a || [], wos: links.w || [], steps: links.s || [] } });
const SEED = [
  S('d01', 'Glaston FC500 operating manual', 'Manual', 2, 'Sep 12, 2026', 'PDF', '18.4 MB', 'Mechanical', { a: ['FT2-FR-001', 'FT1-FR-001'], w: ['WO-1339851'] }, { fav: true }),
  S('d02', 'Electrical drawing — Furnace 2 main cabinet', 'Plan', 4, 'Sep 2, 2026', 'PDF', '2.1 MB', 'Electrical', { a: ['FT2-FR-001'], w: ['WO-1339851'] }, { fav: true, note: 'Updated cabinet wiring after retrofit' }),
  S('d03', 'Heating element replacement procedure', 'Procedure', 3, 'Aug 30, 2026', 'DOCX', '640 KB', 'Electrical', { a: ['FT2-FR-001', 'FT1-FR-001'] }),
  S('d04', 'Pressure equipment certificate — Furnace 2', 'Certificate', 1, 'Jan 8, 2026', 'PDF', '320 KB', 'Safety', { a: ['FT2-FR-001'] }),
  S('d05', 'KSB Etanorm pump manual', 'Manual', 1, 'Aug 29, 2026', 'PDF', '9.8 MB', 'Mechanical', { a: ['P-101'], w: ['WO-1339859'] }),
  S('d06', 'Seal replacement procedure', 'Procedure', 3, 'Aug 28, 2026', 'PDF', '1.2 MB', 'Mechanical', { a: ['P-101'], w: ['WO-1339859'], s: ['pump-seal:s4'] }, { fav: true }),
  S('d07', 'Pump curve datasheet — Etanorm 65-200', 'Datasheet', 1, 'Aug 27, 2026', 'PDF', '410 KB', 'Mechanical', { a: ['P-101'], s: ['pump-seal:s7'] }),
  S('d08', 'Lockout / tagout procedure', 'Procedure', 2, 'Aug 24, 2026', 'PDF', '880 KB', 'Safety', { s: ['pump-seal:s1', 'standard:t1'], w: ['WO-1339859', 'WO-1339850'] }, { fav: true, desc: 'Site-wide energy isolation rules. Applies to all equipment.' }),
  S('d09', 'Atlas Copco GA 90 manual', 'Manual', 1, 'Aug 20, 2026', 'PDF', '22.0 MB', 'Mechanical', { a: ['C-01', 'C-02'], w: ['home-p2'] }),
  S('d10', 'Compressed air network P&ID', 'Plan', 3, 'Aug 18, 2026', 'DWG', '3.4 MB', 'Pneumatic', { a: ['C-01', 'C-02', 'S-01'] }),
  S('d11', 'Mechanical drawing — Conveyor Line 3', 'Plan', 2, 'Sep 1, 2026', 'PDF', '4.8 MB', 'Mechanical', { a: ['CV-L3'], w: ['WO-1339846'] }),
  S('d12', 'Bearing replacement procedure', 'Procedure', 3, 'Aug 30, 2026', 'DOCX', '1.1 MB', 'Mechanical', { a: ['CV-L3', 'CV-L2', 'PK-L1'], s: ['standard:t3'] }),
  S('d13', 'Vibration report — Fan V-12', 'Report', 1, 'Sep 29, 2026', 'PDF', '860 KB', 'Condition monitoring', { a: ['V-12'], w: ['WO-1339850', 'home-p1'] }),
  S('d14', 'Hydraulic circuit — Press PH-030', 'Plan', 1, 'Aug 20, 2026', 'DWG', '2.6 MB', 'Hydraulic', { a: ['PH-030'], w: ['WO-1339840'] }),
  S('d15', 'Manitou MRT 2150 manual', 'Manual', 1, 'Jun 2, 2026', 'PDF', '14.2 MB', 'Mechanical', { a: ['MC-01'] }),
  S('d16', 'Annual lifting inspection — Crane 5 t', 'Certificate', 1, 'Jun 2, 2026', 'PDF', '280 KB', 'Safety', { a: ['MC-01'] }),
  S('d17', 'Electrical cabinet A1 photo', 'Photo', 1, 'Aug 28, 2026', 'JPG', '2.4 MB', 'Electrical', {}),
  S('d18', 'Robot gripper setup photo', 'Photo', 1, 'Aug 8, 2026', 'JPG', '1.9 MB', 'Automation', { a: ['RP-01'] }),
  S('d19', '2026 intervention history', 'Report', 1, 'Aug 25, 2026', 'XLSX', '540 KB', 'Maintenance', {}),
  S('d20', 'Tin bath roller manual (2011 edition)', 'Manual', 1, 'Mar 3, 2021', 'PDF', '11.0 MB', 'Mechanical', { a: ['TB-01'] }, { archived: true, desc: 'Superseded by the 2024 retrofit manual.' }),
  S('d21', 'Old lockout procedure (2019)', 'Procedure', 1, 'Feb 1, 2019', 'PDF', '620 KB', 'Safety', {}, { archived: true }),
];
const state = () => rd(KEY, null);
export const all = () => { const st = state(); return ((st && st.rows) || SEED.map(d => JSON.parse(JSON.stringify(d)))).map(d => d.cat === 'Drawing' ? { ...d, cat: 'Plan' } : d); };
const put = rows => { wr(KEY, { rows }); emit({}); };
export const get = id => all().find(d => d.id === id) || null;
export const save = doc => { const rows = all(); const i = rows.findIndex(d => d.id === doc.id); if (i >= 0) rows[i] = { ...rows[i], ...doc }; else rows.unshift(doc); put(rows); return doc.id; };
export const remove = id => put(all().filter(d => d.id !== id));
export const setArchived = (id, archived) => { const d = get(id); if (d) save({ ...d, archived }); };
export const linkCount = d => d.links.assets.length + d.links.wos.length + d.links.steps.length;
const fld = { asset: 'assets', wo: 'wos', step: 'steps' };
// Documents linked to a target. kind: 'asset' | 'wo' | 'step'. For assets you can pass id or name.
export const linkedTo = (kind, ref, { archived = false } = {}) => all().filter(d => (archived || !d.archived) && d.links[fld[kind]].includes(ref));
export const link = (id, kind, ref) => { const d = get(id); if (!d || d.links[fld[kind]].includes(ref)) return; d.links[fld[kind]] = [...d.links[fld[kind]], ref]; save(d); };
export const unlink = (id, kind, ref) => { const d = get(id); if (!d) return; d.links[fld[kind]] = d.links[fld[kind]].filter(x => x !== ref); save(d); };
let n = 0;
export const create = (o, links = {}) => { const id = 'd' + Date.now().toString(36) + (n++); const ft = (o.ft || (o.file || '').split('.').pop() || 'PDF').toUpperCase(); save({ id, name: o.name, cat: o.cat || 'Other', ver: 'V1', versions: [{ v: 'V1', note: o.note || 'Initial release', who: 'G. Durand', when: 'Today' }], date: 'Today', ft: FT[ft] ? ft : 'PDF', size: o.size || '1.2 MB', disc: o.disc || 'Maintenance', desc: o.desc || '', fav: false, archived: false, pages: 3, by: 'G. Durand', links: { assets: links.assets || [], wos: links.wos || [], steps: links.steps || [] } }); return id; };
export const addVersion = (id, ver, note) => { const d = get(id); if (!d) return; save({ ...d, ver, date: 'Today', versions: [{ v: ver, note: note || 'New version', who: 'G. Durand', when: 'Today' }, ...d.versions] }); };
export const guessCat = nm => /manual/i.test(nm) ? 'Manual' : /drawing|diagram|p&id|dwg/i.test(nm) ? 'Plan' : /procedur/i.test(nm) ? 'Procedure' : /datasheet|curve/i.test(nm) ? 'Datasheet' : /certif/i.test(nm) ? 'Certificate' : /\.(jpe?g|png)$/i.test(nm) ? 'Photo' : /report/i.test(nm) ? 'Report' : 'Other';
export const fileInfo = f => ({ name: f.name.replace(/\.[^.]+$/, ''), ft: (f.name.split('.').pop() || 'pdf').toUpperCase(), size: f.size > 1e6 ? (f.size / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1e3)) + ' KB', cat: guessCat(f.name) });
export const href = id => 'Documents.dc.html?doc=' + encodeURIComponent(id);
export const reset = () => { try { localStorage.removeItem(KEY); } catch (e) {} emit({}); };

if (typeof window !== 'undefined') window.RelixDocs = { CATS, FT, DISCIPLINES, knownWos, woTitle, STEP_REFS, stepLabel, all, get, save, remove, setArchived, linkCount, linkedTo, link, unlink, create, addVersion, guessCat, fileInfo, href };
