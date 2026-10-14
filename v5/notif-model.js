// Relix notifications — deliberately simple: 6 everyday types (+ 'alert' = Smart alerts, only listed when the maturity feature notif.rules is on), each on/off, urgent ones stay on screen until dismissed.
// Personal prefs in localStorage cmms.notif.prefs.v2 = { off: { [type]: true }, email: bool }. Event cmms-notif-prefs. window.RelixNotif.
const PKEY = 'cmms.notif.prefs.v2';
// [key, label, description, icon, urgent]
const T = [
  ['assigned', 'Assigned to me', 'An intervention is assigned to you', 'assignment_ind', 0],
  ['request', 'Request to review', 'Someone requests an intervention from you or your team', 'campaign', 0],
  ['overdue', 'My intervention is late', 'An intervention assigned to you passes its date', 'schedule', 1],
  ['breakdown', 'Equipment breakdown', 'A critical asset stops, a safety issue is reported or a measurement leaves its limits', 'report', 1],
  ['part', 'Part missing', 'A part needed for one of your interventions is out of stock', 'block', 0],
  ['message', 'Messages for me', 'Direct messages, @mentions and requests to take over a job', 'chat', 0],
  ['alert', 'Smart alerts', 'A smart alert rule you receive is triggered (advanced · Notification settings › Smart alerts)', 'notifications_active', 0],
];
export const TYPES = Object.fromEntries(T.map(([key, label, desc, icon, urgent]) => [key, { key, label, desc, icon, urgent: !!urgent }]));
export const ORDER = T.map(t => t[0]);
// Older notification keys → simple type (null = no longer notified).
const ALIAS = { 'wo-assigned': 'assigned', 'wo-request': 'request', 'int-overdue': 'overdue', 'eq-critical': 'breakdown', 'part-unavailable': 'part', dm: 'message', mention: 'message', reassign: 'message',
  'wo-priority': null, 'wo-created': null, 'wo-followup': null, 'int-paused': null, 'int-completed': null, 'eq-status': null, 'part-low': null, 'plan-due': null, 'alert-rule': 'alert', cbm: 'breakdown', 'plan-change': null, 'wo-message': null, 'team-message': null };
export const keyOf = k => k in TYPES ? k : (k in ALIAS ? ALIAS[k] : null);
const DEF = { off: {}, email: true };
export const prefs = () => { try { const p = JSON.parse(localStorage.getItem(PKEY)); return p ? { ...DEF, ...p, off: { ...(p.off || {}) } } : { ...DEF, off: {} }; } catch (e) { return { ...DEF, off: {} }; } };
const emit = () => { try { window.dispatchEvent(new CustomEvent('cmms-notif-prefs')); } catch (e) {} };
export const save = p => { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} emit(); };
export const reset = () => { try { localStorage.removeItem(PKEY); } catch (e) {} emit(); };
export const isOn = (k, p = prefs()) => { const t = keyOf(k); return !!t && !p.off[t]; };
export const setOn = (k, on) => { const p = prefs(); if (on) delete p.off[k]; else p.off[k] = true; save(p); };
export const typeOf = k => TYPES[keyOf(k)] || null;
// 'toast' = bell + pop-up · 'off' = not shown. (Kept as levelOf for existing callers.)
export const levelOf = k => isOn(k) ? 'toast' : 'off';
export const setting = k => ({ level: levelOf(k), email: isOn(k) && prefs().email && !!(typeOf(k) || {}).urgent });
export const look = k => { const t = typeOf(k) || { icon: 'notifications', urgent: false };
  return { icon: t.icon, urgent: t.urgent, imp: t.urgent ? 'crit' : 'info', tileBg: t.urgent ? '#C00018' : '#F2F4F7', tileFg: t.urgent ? '#fff' : '#344054', edge: t.urgent ? '#C00018' : 'transparent', kindColor: t.urgent ? '#B42318' : '#667085', rowBg: t.urgent ? '#FEF6F6' : '#fff', ttl: t.urgent ? 0 : 6000 }; };
if (typeof window !== 'undefined') window.RelixNotif = { TYPES, ORDER, keyOf, prefs, save, reset, isOn, setOn, typeOf, levelOf, setting, look };
