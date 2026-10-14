// Shared checklist model — used by Checklist Editor (both views), StepEditor, Intervention, Intervention.
const KEY = 'cmms.checklists.v1';
const PREVIEW_KEY = 'cmms.checklists.preview';

export const TYPES = {
  yesno: { label: 'Yes / No', icon: 'rule', group: 'Input', answer: true },
  single: { label: 'Single choice', icon: 'radio_button_checked', group: 'Input', answer: true },
  multi: { label: 'Multiple choice', icon: 'checklist', group: 'Input', answer: true },
  number: { label: 'Number', icon: 'speed', group: 'Input', answer: true },
  text: { label: 'Text', icon: 'short_text', group: 'Input', answer: false },
  comment: { label: 'Comment', icon: 'chat', group: 'Input', answer: false },
  instruction: { label: 'Instruction', icon: 'menu_book', group: 'Action', answer: false },
  confirm: { label: 'Checkbox', icon: 'check_box', group: 'Action', answer: false },
  photo: { label: 'Take photo', icon: 'photo_camera', group: 'Action', answer: false },
  file: { label: 'Attachment', icon: 'attach_file', group: 'Action', answer: false },
  parts: { label: 'Spare parts', icon: 'settings', group: 'Action', answer: false },
  consumables: { label: 'Consumables', icon: 'water_drop', group: 'Action', answer: false },
};
export const GROUP_COLORS = { Input: ['#EAF1FD', '#2456B8'], Action: ['#E6F4EE', '#0B6B4A'], Content: ['#F3EEFC', '#6941C6'], Logic: ['#FEF3E2', '#B54708'] };
export const GROUPS = [
  ['Input', ['yesno', 'single', 'multi', 'number', 'text', 'comment']],
  ['Action', ['instruction', 'confirm', 'photo', 'file', 'parts', 'consumables']],
];
export const MEDIA = { image: ['Image', 'image'], video: ['Video', 'smart_display'], pdf: ['PDF / document', 'picture_as_pdf'] };
// Materials catalogue for checklist steps & interventions — read live from the Spare parts module (parts-model). Rows: [ref, name, unit, stock, kind].
import * as PA from './parts-model.js';
const rows = f => PA.parts().filter(f).map(p => [p.ref, p.name, p.unit, p.qty, PA.kindOf(p)]);
export const CATALOG = { get parts() { return rows(p => !PA.isConsumable(p)); }, get consumables() { return rows(PA.isConsumable); }, get all() { return rows(() => true); } };
export const item = ref => PA.part(ref);
export const usageOf = ref => PA.usageOf(PA.part(ref));

let n = 0;
export const uid = () => 's' + Date.now().toString(36) + (n++).toString(36);
const base = (id, title, type, o = {}) => ({ id, title, type, skills: [], minutes: '', tools: [], required: false, desc: '', expected: '', unit: '', min: '', max: '', options: [], media: [], parts: [], rules: [], after: 'next', afterTarget: '', conditional: false, flagWhen: '', outOfRange: 'warn', minPhotos: '', minChars: '', ...o });
export const defaultsFor = type => type === 'confirm' ? { options: ['Done'] } : (type === 'single' || type === 'multi') ? { options: ['Option 1', 'Option 2'] } : {};
export const newStep = (title, type, o = {}) => base(uid(), title, type, { ...defaultsFor(type), ...o });
export const clone = x => JSON.parse(JSON.stringify(x));

export const SEEDS = {
  'pump-seal': {
    id: 'pump-seal', name: 'Pump seal replacement', desc: 'Mechanical seal replacement on centrifugal pumps, with pressure and leak test.', status: 'published', est: 90, updated: '2026-09-29T09:12', updatedBy: 'G. Durand',
    steps: [
      base('s1', 'Secure the pump', 'confirm', { skills: ['ELE'], minutes: 15, required: true, desc: 'Isolate the pump before any work.', options: ['Pump stopped and valves closed', 'Lockout / tagout applied', 'Zero energy verified at the motor'], media: [{ kind: 'pdf', name: 'Lockout procedure.pdf' }] }),
      base('s2', 'Is a leak visible?', 'yesno', { skills: ['MEC'], minutes: 5, required: true, desc: 'Look at the seal area and the pump body for drips or damage.', flagWhen: 'yes', rules: [{ when: 'yes', action: 'require', need: 'photo' }, { when: 'yes', action: 'goto', target: 's3' }, { when: 'no', action: 'goto', target: 's7' }] }),
      base('s3', 'Where does the leak come from?', 'single', { skills: ['MEC'], minutes: 5, required: true, conditional: true, desc: 'A cracked casing cannot be repaired on site — the checklist ends and a follow-up is planned.', options: ['Mechanical seal', 'Pipe fitting', 'Pump casing', 'Other'], flagWhen: 'Pump casing', rules: [{ when: 'Pump casing', action: 'finish' }] }),
      base('s4', 'Replace the mechanical seal', 'instruction', { skills: ['MEC'], minutes: 35, tools: ['LA-01'], desc: 'Drain the pump casing into the retention tray\nRemove the coupling guard and the motor coupling\nReplace the mechanical seal and the O-rings\nTighten the flange bolts to 45 N·m in a cross pattern', expected: 'New seal fitted, shaft turns freely by hand', media: [{ kind: 'video', name: 'Seal replacement — 4 min.mp4' }, { kind: 'image', name: 'Seal exploded view.png' }, { kind: 'pdf', name: 'Seal replacement procedure.pdf' }] }),
      base('s5', 'Spare parts used', 'parts', { skills: ['MEC'], minutes: 3, parts: [{ ref: 'SEAL-M45', qty: 1 }, { ref: 'GSK-P101', qty: 1 }, { ref: 'ORG-KIT', qty: 1 }] }),
      base('s6', 'Consumables used', 'consumables', { skills: ['MEC'], minutes: 2 }),
      base('s7', 'Discharge pressure', 'number', { skills: ['ELE'], minutes: 10, required: true, desc: 'Remove your lockout, restart the pump and measure after 5 minutes.', unit: 'bar', min: '3.5', max: '4.5', outOfRange: 'comment', media: [{ kind: 'image', name: 'Gauge location.png' }] }),
      base('s8', 'Any leak after 10 minutes?', 'yesno', { skills: ['MEC'], minutes: 10, required: true, desc: 'Watch the seal area with the pump running.', flagWhen: 'yes', rules: [{ when: 'yes', action: 'goto', target: 's9' }] }),
      base('s9', 'Tighten the flange and re-test', 'instruction', { skills: ['MEC'], minutes: 10, conditional: true, desc: 'Stop the pump\nRe-tighten the flange bolts to 45 N·m\nRestart and watch for 5 minutes' }),
      base('s10', 'Photo after repair', 'photo', { skills: ['MEC'], minutes: 2 }),
      base('s11', 'Clean up and hand over', 'confirm', { skills: ['MEC'], minutes: 8, required: true, options: ['Tools and old parts removed', 'Area cleaned, retention tray emptied', 'Operator informed the pump is back in service'] }),
    ],
  },
  standard: {
    id: 'standard', name: 'Standard intervention', desc: 'Default checklist for corrective interventions.', status: 'published', est: 60, updated: '2026-09-18T14:30', updatedBy: 'C. Moreau',
    steps: [
      base('t1', 'Secure the equipment', 'confirm', { skills: ['ELE'], minutes: 15, required: true, options: ['Equipment stopped', 'Lockout / tagout applied'], media: [{ kind: 'pdf', name: 'Lockout procedure.pdf' }] }),
      base('t2', 'Is the equipment in normal condition?', 'yesno', { skills: ['ELE'], minutes: 15, required: true, flagWhen: 'no', rules: [{ when: 'no', action: 'require', need: 'photo' }] }),
      base('t3', 'Carry out the work', 'instruction', { skills: ['MEC'], minutes: 20, desc: 'Follow the intervention description\nReplace worn parts if needed\nReassemble and check all fixings' }),
      base('t4', 'Spare parts used', 'parts', { skills: ['MEC'], minutes: 2 }),
      base('t5', 'Does it run normally after restart?', 'yesno', { skills: ['MEC'], minutes: 5, required: true, flagWhen: 'no', rules: [{ when: 'no', action: 'require', need: 'comment' }] }),
      base('t6', 'Clean up and hand over', 'confirm', { skills: ['MEC'], minutes: 3, required: true, options: ['Tools removed', 'Area cleaned', 'Operator informed'] }),
    ],
  },
};

const readAll = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const norm = cl => { if (!cl) return cl; const seed = SEEDS[cl.id]; cl.steps.forEach(st => { const ss = seed && seed.steps.find(x => x.id === st.id); if (!Array.isArray(st.skills)) st.skills = ss ? [...ss.skills] : []; if (st.minutes == null) st.minutes = ss ? ss.minutes : ''; if (!Array.isArray(st.tools)) st.tools = ss ? [...(ss.tools || [])] : []; }); return cl; };
export const toolsOf = cls => [...new Set((cls || []).flatMap(cl => (cl.steps || []).flatMap(s => s.tools || [])))];
export const totalMinutes = cl => (cl.steps || []).filter(s => !s.conditional && !s.detached).reduce((a, s) => a + (+s.minutes || 0), 0);
export const load = id => { const all = readAll(); return norm(all[id] ? clone(all[id]) : SEEDS[id] ? clone(SEEDS[id]) : null); };
export const save = cl => { const all = readAll(); all[cl.id] = cl; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} };
export const savePreview = cl => { try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(cl)); } catch (e) {} };
export const loadPreview = () => { try { return JSON.parse(localStorage.getItem(PREVIEW_KEY)); } catch (e) { return null; } };
export const checklistFor = asset => /P-101/.test(asset || '') ? 'pump-seal' : 'standard';
const PARTS_FOR = { conveyor: [{ ref: 'BRG-6205', qty: 2 }, { ref: 'BLT-BPU280', qty: 1 }], press: [{ ref: 'FLT-HX10', qty: 1 }], electrical: [{ ref: 'CTR-LC1D', qty: 1 }] };
// Required spare parts declared in checklist 'parts' steps, merged by ref → [{ ref, name, unit, stock, qty, from: [checklist names] }]
// Required materials (spare parts AND consumables) declared in checklist 'parts' / 'consumables' steps, merged by ref → [{ ref, name, kind, unit (usage unit), mode, stock, qty (expected, usage unit), from }]
export const partsOf = cls => { const out = []; (cls || []).forEach(cl => (cl.steps || []).filter(st => (st.type === 'parts' || st.type === 'consumables') && (!st.conditional || (st.parts || []).length)).forEach(st => (st.parts || []).forEach(p => { const it = PA.part(p.ref), u = PA.usageOf(it), q = p.qty === '' || p.qty == null ? u.def : +p.qty; const ex = out.find(x => x.ref === p.ref); if (ex) { ex.qty = Math.max(ex.qty, q); if (!ex.from.includes(cl.name)) ex.from.push(cl.name); } else out.push({ ref: p.ref, name: it ? it.name : p.ref, kind: PA.kindOf(it), unit: u.unit, mode: u.mode, stock: it ? it.qty : 0, stockLabel: it ? PA.fmtStock(it) : '', qty: q, from: [cl.name] }); }))); return out; };
export const fromName = (id, name) => {
  if (id === 'new') return { id: uid(), name: 'New checklist', desc: '', status: 'draft', est: '', updated: null, updatedBy: '', steps: [] };
  const SK = { conveyor: [['ELE'], ['MEC']], press: [['ELE'], ['HYD']], electrical: [['ELE'], ['ELE']], safety: [[], []] }[id] || [[], []];
  return { id, name, desc: '', status: 'published', est: 45, updated: '2026-09-22T10:00', updatedBy: 'P. Leroy', steps: [
    newStep('Secure the equipment', 'confirm', { required: true, options: ['Equipment stopped', 'Lockout / tagout applied'], skills: SK[0], minutes: 10 }),
    newStep('Check general condition', 'yesno', { required: true, flagWhen: 'no', skills: SK[0], minutes: 10 }),
    newStep('Clean and lubricate', 'instruction', { desc: 'Clean surfaces\nGrease lubrication points', skills: SK[1], minutes: 15 }),
    ...(PARTS_FOR[id] ? [newStep('Spare parts used', 'parts', { skills: SK[1], minutes: 3, parts: PARTS_FOR[id] })] : []),
    newStep('Take a photo', 'photo', { skills: SK[1], minutes: 2 }),
    newStep('Confirm equipment is operational', 'yesno', { required: true, flagWhen: 'no', skills: SK[1], minutes: 8 }),
  ] };
};

export const guessType = t => {
  const s = (t || '').toLowerCase();
  if (!s.trim()) return 'confirm';
  if (/photo|picture/.test(s)) return 'photo';
  if (/attach|upload|document|file/.test(s)) return 'file';
  if (/spare part|parts used/.test(s)) return 'parts';
  if (/consumable|grease used|oil used/.test(s)) return 'consumables';
  if (/pressure|temperature|reading|measure|level|voltage|current|speed|torque|hours|value/.test(s)) return 'number';
  if (/comment|remark|note|observation/.test(s)) return 'comment';
  if (s.trim().endsWith('?') || /^(is|are|does|do|has|can|was)\b/.test(s)) return 'yesno';
  if (/^(follow|read|procedure|instruction)/.test(s)) return 'instruction';
  return 'confirm';
};

export const whenOptions = st => st.type === 'yesno' ? [['yes', 'Yes'], ['no', 'No']]
  : (st.type === 'single' || st.type === 'multi') ? st.options.filter(o => o.trim()).map(o => [o, o])
  : st.type === 'number' ? [['out', 'Out of expected range'], ['in', 'Within expected range']] : [];
export const whenLabel = (st, w) => (whenOptions(st).find(o => o[0] === w) || [w, w])[1];
const num = v => v === '' || v == null || isNaN(+v) ? null : +v;
export const isOut = (st, v) => { const x = num(v); if (x === null) return false; const lo = num(st.min), hi = num(st.max); return (lo !== null && x < lo) || (hi !== null && x > hi); };
export const matches = (st, when, v) => {
  if (st.type === 'multi') return Array.isArray(v) && v.includes(when);
  if (st.type === 'number') return num(v) !== null && (when === 'out' ? isOut(st, v) : !isOut(st, v));
  return v === when;
};
export const rangeText = st => { const lo = num(st.min), hi = num(st.max), u = st.unit ? ' ' + st.unit : ''; return lo !== null && hi !== null ? `${lo} – ${hi}${u}` : hi !== null ? `max ${hi}${u}` : lo !== null ? `min ${lo}${u}` : ''; };

export const firstStep = cl => { if (cl.start && cl.steps.some(x => x.id === cl.start)) return cl.start; const s = cl.steps.find(x => !x.conditional && !x.detached) || cl.steps[0]; return s ? s.id : 'END'; };
export const defaultNext = (cl, id) => { const i = cl.steps.findIndex(x => x.id === id); for (let j = i + 1; j < cl.steps.length; j++) if (!cl.steps[j].conditional && !cl.steps[j].detached) return cl.steps[j].id; return 'END'; };
const exists = (cl, id) => (typeof id === 'string' && id.startsWith('END')) || cl.steps.some(x => x.id === id);
export const afterTarget = (cl, st) => st.after === 'finish' || st.after === 'none' ? 'END' : st.after === 'goto' && st.afterTarget && exists(cl, st.afterTarget) ? st.afterTarget : defaultNext(cl, st.id);
export const nextStep = (cl, id, v) => {
  const st = cl.steps.find(x => x.id === id); if (!st) return 'END';
  for (const r of st.rules) {
    if (r.action !== 'goto' && r.action !== 'finish') continue;
    if (!matches(st, r.when, v)) continue;
    if (r.action === 'finish') return 'END';
    if (r.target && exists(cl, r.target)) return r.target;
  }
  return afterTarget(cl, st);
};
export const requirements = (st, v) => { const need = {}; st.rules.forEach(r => { if (r.action === 'require' && matches(st, r.when, v)) need[r.need] = whenLabel(st, r.when); }); return need; };
export const flagged = (st, v) => {
  if (st.type === 'number') return isOut(st, v);
  if (!st.flagWhen) return false;
  return st.type === 'multi' ? Array.isArray(v) && v.includes(st.flagWhen) : v === st.flagWhen;
};
export const predictPath = (cl, answers, fromId) => {
  const out = []; let id = fromId || firstStep(cl), guard = 0;
  while (id && id !== 'END' && guard++ < cl.steps.length * 2) { out.push(id); id = nextStep(cl, id, answers[id]); }
  return out;
};
const stepRef = (cl, id) => { if (id === 'END') return 'finish'; const i = cl.steps.findIndex(x => x.id === id); return i < 0 ? '?' : `#${i + 1} ${cl.steps[i].title}`; };
export const logicSummary = (cl, st) => {
  const idx = cl.steps.findIndex(x => x.id === st.id), parts = [];
  st.rules.forEach(r => {
    const w = whenLabel(st, r.when);
    if (r.action === 'finish') parts.push(`${w} → finish`);
    else if (r.action === 'require') parts.push(`${w} → ${r.need} required`);
    else if (r.target) { const ti = cl.steps.findIndex(x => x.id === r.target); parts.push(`${w} → ${ti > idx + 1 && !cl.steps[ti].conditional ? 'skip to ' : ''}${stepRef(cl, r.target)}`); }
  });
  if (st.after === 'finish') parts.push('then finish');
  if (st.after === 'goto' && st.afterTarget) parts.push(`then ${stepRef(cl, st.afterTarget)}`);
  return parts.join(' · ');
};
export const cleanRefs = (cl, removedId) => {
  cl.steps.forEach(s => { s.rules = s.rules.filter(r => r.target !== removedId); if (s.afterTarget === removedId) { s.after = 'next'; s.afterTarget = ''; } });
  if (cl.start === removedId) delete cl.start; if (cl.layout) delete cl.layout[removedId];
  return cl;
};

// ---------- Workflow graph (free-form editor) ----------
// End blocks: cl.ends (ids starting with END, default ['END']). Rules/after 'finish' may carry end / afterEnd to pick which End block they draw to.
export const endsOf = cl => (cl.ends && cl.ends.length ? cl.ends : ['END']);
export const isEnd = id => typeof id === 'string' && id.startsWith('END');
// Ports of a step: [{ when, label }] — when null = single output.
export const portsOf = st => {
  const T = TYPES[st.type]; if (!T || !T.answer) return [{ when: null, label: '' }];
  if (st.type === 'yesno') return [{ when: 'yes', label: 'Yes' }, { when: 'no', label: 'No' }];
  if (st.type === 'number') return [{ when: 'in', label: 'Normal' }, { when: 'out', label: 'Out of range' }];
  if (st.type === 'single') { const o = whenOptions(st); if (o.length && o.length <= 3) return o.map(([v, l]) => ({ when: v, label: l })); const ruled = new Set(st.rules.filter(r => r.action === 'goto' || r.action === 'finish').map(r => r.when)); return [...o.filter(([v]) => ruled.has(v)).map(([v, l]) => ({ when: v, label: l })), { when: '*', label: 'Other answers' }]; }
  return [{ when: null, label: '' }];
};
const endFor = (cl, e) => endsOf(cl).includes(e) ? e : endsOf(cl)[0];
// Where each port leads: { when, label, target (step id | END id | null), explicit }
export const outputsOf = (cl, st) => portsOf(st).map(p => {
  const r = p.when && p.when !== '*' ? st.rules.find(x => x.when === p.when && (x.action === 'goto' || x.action === 'finish')) : null;
  if (r) return { ...p, explicit: true, target: r.action === 'finish' ? endFor(cl, r.end) : (exists(cl, r.target) ? r.target : null) };
  if (st.after === 'none') return { ...p, explicit: false, target: null };
  if (st.after === 'finish') return { ...p, explicit: true, target: endFor(cl, st.afterEnd) };
  if (st.after === 'goto' && st.afterTarget && exists(cl, st.afterTarget)) return { ...p, explicit: true, target: st.afterTarget };
  const d = defaultNext(cl, st.id); return { ...p, explicit: false, target: d === 'END' ? endsOf(cl)[0] : d };
});
export const reachable = cl => { const seen = new Set(), q = [firstStep(cl)]; while (q.length) { const id = q.shift(); if (!id || seen.has(id)) continue; seen.add(id); if (isEnd(id)) continue; const st = cl.steps.find(x => x.id === id); if (st) outputsOf(cl, st).forEach(o => o.target && q.push(o.target)); } return seen; };
// Marks steps outside the Start → End flow as detached (kept as drafts, never executed).
export const markDetached = cl => { const r = reachable(cl); cl.steps.forEach(s => { s.detached = !r.has(s.id); }); return cl; };

// Every step of every other checklist (seeds, saved checklists, plan checklists) — used to reuse existing tasks.
export const stepLibrary = exclude => { const all = readAll(), seen = new Set(), out = [];
  const cls = [...Object.keys(SEEDS).map(id => load(id)), ...Object.keys(all).filter(id => !SEEDS[id]).map(id => load(id)), ...[['conveyor', 'Conveyor maintenance'], ['press', 'Hydraulic press service'], ['electrical', 'Electrical check'], ['safety', 'Safety inspection']].map(([id, n]) => fromName(id, n))].filter(c => c && c.id !== exclude);
  cls.forEach(c => (c.steps || []).forEach(st => { const k = (st.title || '').trim().toLowerCase() + '|' + st.type; if (!st.title || seen.has(k)) return; seen.add(k); out.push({ clId: c.id, clName: c.name, step: st }); })); return out; };
if (typeof window !== 'undefined') window.CMMSChecklist = { stepLibrary, item, usageOf, endsOf, isEnd, portsOf, outputsOf, reachable, markDetached, totalMinutes, TYPES, GROUP_COLORS, GROUPS, MEDIA, CATALOG, uid, newStep, defaultsFor, clone, SEEDS, load, save, savePreview, loadPreview, checklistFor, fromName, guessType, whenOptions, whenLabel, isOut, matches, rangeText, firstStep, defaultNext, afterTarget, nextStep, requirements, flagged, predictPath, logicSummary, cleanRefs };
