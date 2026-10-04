// Relix notification catalogue + personal delivery preferences (localStorage cmms.notif.prefs.v1).
// level: 'activity' (Home live activity only) | 'bell' (notification centre + badge) | 'toast' (bell + on-screen pop-up)
const PKEY = 'cmms.notif.prefs.v1';
export const CATS = {
  wo: { label: 'Work orders', icon: 'build', bg: '#FBE7EA', fg: '#A30014' },
  int: { label: 'Interventions', icon: 'play_circle', bg: '#EAF1FD', fg: '#2456B8' },
  eq: { label: 'Equipment', icon: 'precision_manufacturing', bg: '#EEF1F4', fg: '#475467' },
  parts: { label: 'Spare parts', icon: 'inventory_2', bg: '#FEF3E2', fg: '#B54708' },
  plan: { label: 'Planning', icon: 'calendar_month', bg: '#F3EEFC', fg: '#6941C6' },
  chat: { label: 'Communication', icon: 'forum', bg: '#E3F4F7', fg: '#0E7490' },
};
export const IMP = {
  crit: { label: 'Critical', edge: '#C00018', fg: '#B42318', bg: '#FDECEC', rowBg: '#FEF6F6', ttl: 0 },
  imp: { label: 'Important', edge: '#F79009', fg: '#B54708', bg: '#FEF3E2', rowBg: '#fff', ttl: 9000 },
  info: { label: 'Informational', edge: '#98A2B3', fg: '#475467', bg: '#EEF1F4', rowBg: '#fff', ttl: 6000 },
};
// key: [category, label, description, importance, icon, default level, email, push]
const T = [
  ['wo-assigned', 'wo', 'Work order assigned to me', 'You become responsible for a work order', 'imp', 'assignment_ind', 'toast', 1, 1],
  ['wo-priority', 'wo', 'Priority changed', 'Priority of a work order you are on goes up or down', 'imp', 'priority_high', 'bell', 0, 0],
  ['wo-created', 'wo', 'New work order in my team', 'A request is created for your team', 'info', 'add_circle', 'activity', 0, 0],
  ['wo-followup', 'wo', 'Follow-up created', 'A follow-up is created from a work order you closed', 'info', 'subdirectory_arrow_right', 'bell', 0, 0],
  ['int-overdue', 'int', 'Intervention overdue', 'A work order assigned to you passes its due date', 'crit', 'schedule', 'toast', 1, 1],
  ['int-paused', 'int', 'Intervention paused', 'Someone pauses an intervention you follow', 'imp', 'pause_circle', 'bell', 0, 0],
  ['int-completed', 'int', 'Intervention completed', 'An intervention you follow is closed', 'info', 'task_alt', 'activity', 0, 0],
  ['eq-critical', 'eq', 'Critical equipment issue', 'Breakdown or safety issue on equipment', 'crit', 'report', 'toast', 1, 1],
  ['eq-status', 'eq', 'Equipment status changed', 'In service / out of service changes', 'info', 'precision_manufacturing', 'activity', 0, 0],
  ['part-unavailable', 'parts', 'Required part unavailable', 'A part reserved on your work order is out of stock', 'imp', 'block', 'toast', 1, 0],
  ['part-low', 'parts', 'Low stock', 'A part drops below its minimum stock', 'imp', 'inventory_2', 'bell', 0, 0],
  ['plan-change', 'plan', 'Planning change', 'Your scheduled work is moved or reassigned', 'info', 'event', 'bell', 1, 0],
  ['mention', 'chat', 'Mentions', 'Someone @mentions you in any conversation', 'imp', 'alternate_email', 'toast', 0, 1],
  ['reassign', 'chat', 'Reassignment request', 'A technician asks for someone to take over', 'imp', 'swap_horiz', 'toast', 0, 1],
  ['wo-message', 'chat', 'Messages on my work orders', 'Tagged messages (help, missing part, handover, photos)', 'info', 'forum', 'bell', 0, 0],
  ['team-message', 'chat', 'Team chat messages', 'Every message in your team channels', 'info', 'groups', 'activity', 0, 0],
];
export const TYPES = Object.fromEntries(T.map(([key, cat, label, desc, imp, icon, level, email, push]) => [key, { key, cat, label, desc, imp, icon, level, email: !!email, push: !!push }]));
export const LEVELS = [['activity', 'Activity only', 'Shown in Home live activity, no badge'], ['bell', 'Notification', 'Badge + notification centre'], ['toast', 'Pop-up', 'Notification + on-screen pop-up']];
const DEF = { channels: { email: true, push: true }, quiet: true, digest: false, scope: { wo: 'involved', int: 'involved', eq: 'site', parts: 'involved', plan: 'involved', chat: 'involved' }, types: {} };
export const prefs = () => { try { const p = JSON.parse(localStorage.getItem(PKEY)); return p ? { ...DEF, ...p, channels: { ...DEF.channels, ...p.channels }, scope: { ...DEF.scope, ...p.scope }, types: { ...p.types } } : JSON.parse(JSON.stringify(DEF)); } catch (e) { return JSON.parse(JSON.stringify(DEF)); } };
export const save = p => { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} try { window.dispatchEvent(new CustomEvent('cmms-notif-prefs')); } catch (e) {} };
export const reset = () => { try { localStorage.removeItem(PKEY); } catch (e) {} try { window.dispatchEvent(new CustomEvent('cmms-notif-prefs')); } catch (e) {} };
export const typeOf = k => TYPES[k] || TYPES['wo-message'];
export const setting = (k, p = prefs()) => { const t = typeOf(k), o = p.types[t.key] || {}; let level = o.level || t.level; if (t.imp === 'crit' && level === 'activity') level = 'bell'; return { level, email: o.email ?? t.email, push: o.push ?? t.push }; };
export const levelOf = k => setting(k).level;
export const look = k => { const t = typeOf(k), c = CATS[t.cat], i = IMP[t.imp]; return { icon: t.icon, tileBg: t.imp === 'crit' ? '#C00018' : c.bg, tileFg: t.imp === 'crit' ? '#fff' : c.fg, edge: i.edge, kindColor: i.fg, rowBg: i.rowBg, impLabel: i.label, imp: t.imp, ttl: i.ttl, cat: c.label }; };
if (typeof window !== 'undefined') window.RelixNotif = { CATS, IMP, TYPES, LEVELS, prefs, save, reset, setting, levelOf, look, typeOf };
