// Relix access model (window.RelixAccess) — users, teams, roles & permissions, Financial permission, Super Admin, scoped Super users.
// Storage: cmms.users.v1 · cmms.teams.v1 · cmms.roles.v1 · cmms.superusers.v1 · cmms.preview-as (permission preview, demo). Event: cmms-access.
import * as SI from './sites-model.js';
const UKEY = 'cmms.users.v1', TKEY = 'cmms.teams.v1', RKEY = 'cmms.roles.v1', SKEY = 'cmms.superusers.v1', PKEY = 'cmms.preview-as';
const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const emit = d => { try { window.dispatchEvent(new CustomEvent('cmms-access', { detail: d })); } catch (e) {} };
export const SIGNED_IN = 'GD';

// ---------- Modules & levels ----------
export const MODULES = [['assets', 'Assets'], ['workorders', 'Interventions'], ['plans', 'Maintenance plans & checklists'], ['planning', 'Planning'], ['parts', 'Spare parts'], ['suppliers', 'Suppliers'], ['documents', 'Documents'], ['teams', 'Teams & users'], ['admin', 'Site configuration']];
export const LEVEL = { F: ['check_circle', '#0B6B4A', 'Full', '#E6F4EE', 'Create, edit, delete, configure'], E: ['edit', '#2456B8', 'Edit', '#EAF1FD', 'Create and edit, no delete'], V: ['visibility', '#475467', 'View', '#F2F4F7', 'Read only'], '-': ['block', '#98A2B3', 'None', '#fff', 'Module hidden'] };
export const CODES = ['F', 'E', 'V', '-'];
const RANK = { F: 3, E: 2, V: 1, '-': 0 };
// Which module a page belongs to (used by the TopBar guard and the Sidebar).
export const PAGE_MODULE = [[/Asset/i, 'assets'], [/WorkOrder|Intervention/i, 'workorders'], [/MaintenancePlans|Maintenance Plans|Checklist/i, 'plans'], [/Planning/i, 'planning'], [/SpareParts|Spare Parts/i, 'parts'], [/Suppliers/i, 'suppliers'], [/Documents/i, 'documents'], [/TeamsUsers|Teams and Users/i, 'teams'], [/Administration/i, 'admin'], [/SuperAdmin/i, 'superadmin']];
export const moduleOfPath = p => { const f = decodeURIComponent((p || '').split('/').pop() || ''); const m = PAGE_MODULE.find(([re]) => re.test(f)); return m ? m[1] : null; };

// ---------- Roles ----------
const SEED_ROLES = [
  { id: 'admin', name: 'Administrator', desc: 'Full access to the site, including configuration and users', locked: true },
  { id: 'manager', name: 'Maintenance manager', desc: 'Manages work, plans, stock and teams' },
  { id: 'planner', name: 'Planner', desc: 'Schedules interventions and preventive plans' },
  { id: 'tech', name: 'Technician', desc: 'Executes assigned work, consumes parts' },
  { id: 'req', name: 'Requester', desc: 'Submits intervention requests and follows them' },
];
const SEED_MX = { assets: 'FFVVV', workorders: 'FFFEV', plans: 'FFEV-', planning: 'FFFV-', parts: 'FFVE-', suppliers: 'FFVV-', documents: 'FFEEV', teams: 'FEV--', admin: 'FE---' };
const seedRoles = () => ({ roles: SEED_ROLES.map(r => ({ ...r })), mx: Object.fromEntries(MODULES.map(([m]) => [m, Object.fromEntries(SEED_ROLES.map((r, i) => [r.id, SEED_MX[m][i]]))])) });
export const roleSet = () => { const v = rd(RKEY, null); return v && v.roles ? v : seedRoles(); };
export const roles = () => roleSet().roles;
export const role = id => roles().find(r => r.id === id) || { id, name: id || '—', desc: '' };
export const saveRoleSet = v => { wr(RKEY, v); emit({ roles: true }); };
export const resetRoles = () => { try { localStorage.removeItem(RKEY); } catch (e) {} emit({ roles: true }); };
export const levelOf = (roleId, mod) => { if (roleId === 'admin') return 'F'; const m = roleSet().mx[mod]; return (m && m[roleId]) || '-'; };

// ---------- Users ----------
const U = (key, name, role, x = {}) => ({ id: key, key, name, role, email: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.') + '@nordglass.com', sites: ['THO'], siteRoles: {}, status: 'Active', last: 'Today', financial: false, superAdmin: false, rate: 50, ...x });
const SEED_USERS = [
  U('GD', 'Gaudéric Durand', 'manager', { financial: true, superAdmin: true, rate: 78, last: 'Now', sites: ['THO', 'SAU'] }),
  U('MD', 'Marc Dupont', 'tech', { rate: 52, last: '1 h ago' }),
  U('PL', 'Pierre Leroy', 'tech', { rate: 56, last: '12 min ago' }),
  U('AM', 'Alex Martin', 'tech', { rate: 48 }),
  U('SM', 'Sophie Martin', 'tech', { rate: 54 }),
  U('SB', 'Sofia Benali', 'tech', { rate: 54, last: 'Yesterday' }),
  U('JM', 'Julie Martin', 'tech', { rate: 50, sites: ['THO', 'SAU'] }),
  U('SL', 'Sarah Lambert', 'tech', { rate: 42, financial: true }),
  U('HP', 'Hugo Petit', 'planner', { rate: 60 }),
  U('CM', 'Claire Moreau', 'planner', { rate: 66 }),
  U('LB', 'Lucas Bernard', 'req', { rate: 58 }),
  U('ER', 'Emma Roux', 'req', { rate: 60 }),
  U('TB', 'Thomas Bernard', 'admin', { financial: true, rate: 82, last: 'Sep 24', sites: ['THO', 'SAU'] }),
  U('LP', 'Lucas Petit', 'req', { status: 'Invited', last: '—', rate: 45 }),
  U('NH', 'Nadia Haddad', 'tech', { status: 'Deactivated', last: 'Jul 3', sites: ['SAU'], rate: 51 }),
];
export const users = () => { const o = rd(UKEY, null); if (!o) return SEED_USERS.map(u => ({ ...u })); return o; };
export const user = id => users().find(u => u.id === id) || null;
export const userByName = n => users().find(u => u.name === n) || null;
const saveUsers = list => { wr(UKEY, list); emit({ users: true }); };
export const saveUser = (id, patch) => { const list = users(); const i = list.findIndex(u => u.id === id); if (i >= 0) list[i] = { ...list[i], ...patch }; else list.push(U(id, patch.name || id, patch.role || 'tech', patch)); saveUsers(list); return user(id); };
export const newUserId = name => { const base = (name || 'U').split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase() || 'U'; let id = base, n = 2; while (user(id)) id = base + n++; return id; };
export const inviteUser = f => { const id = newUserId(f.name); saveUser(id, { ...f, id, key: id, status: 'Invited', last: '—' }); return id; };
export const ini = n => (n || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

// ---------- Current user (with permission preview for admins) ----------
export const signedIn = () => user(SIGNED_IN);
export const previewAs = () => { const id = rd(PKEY, null); return id && user(id) ? id : null; };
export const setPreviewAs = id => { if (id && id !== SIGNED_IN) wr(PKEY, id); else try { localStorage.removeItem(PKEY); } catch (e) {} emit({ preview: id }); };
export const me = () => previewAs() || SIGNED_IN;
export const meUser = () => user(me()) || signedIn();
export const roleOf = (uid = me(), site = SI.current().id) => { const u = user(uid); if (!u) return 'req'; return (u.siteRoles || {})[site] || scopeRole(uid, site) || u.role; };
export const isSuperAdmin = (uid = me()) => !!(user(uid) || {}).superAdmin;
// Module access for the current user on the current site. need: 'V' (see) | 'E' (create/edit) | 'F' (delete/configure)
export const level = (mod, uid = me()) => isSuperAdmin(uid) && !previewAs() ? 'F' : levelOf(roleOf(uid), mod);
export const can = (mod, need = 'V', uid = me()) => { if (mod === 'superadmin') return isSuperAdmin(uid); return RANK[level(mod, uid)] >= RANK[need]; };
// Financial is cumulative: it adds access to sensitive money values on top of any operational role.
export const canFinance = (uid = me()) => !!(user(uid) || {}).financial;
export const MASK = '•••';
// Hourly labor rate set per user in Teams & users (used by intervention costs).
export const rateOf = key => { const u = users().find(x => x.key === key || x.id === key); return u && +u.rate ? +u.rate : null; };

// ---------- Teams ----------
export const TEAM_COLORS = { Green: ['#E6F4EE', '#0B6B4A'], Amber: ['#FEF3E2', '#B54708'], Blue: ['#EAF1FD', '#2456B8'], Purple: ['#F3EEFC', '#6941C6'], Teal: ['#E3F4F7', '#0E7490'], Grey: ['#EEF1F4', '#475467'] };
export const TEAM_ICONS = ['build', 'bolt', 'conveyor_belt', 'groups', 'engineering', 'inventory_2', 'calendar_month', 'precision_manufacturing', 'water_drop', 'health_and_safety'];
const SEED_TEAMS = [
  { id: 'team', name: 'Mechanical team', spec: 'Mechanics, hydraulics, lubrication', icon: 'build', color: 'Green', lead: 'MD', members: ['GD', 'MD', 'PL', 'AM', 'SL', 'HP'], site: 'THO' },
  { id: 'team-elec', name: 'Electrical team', spec: 'Electrical, automation, instrumentation', icon: 'bolt', color: 'Amber', lead: 'SM', members: ['SM', 'SB', 'JM', 'HP'], site: 'THO' },
  { id: 'team-float', name: 'Float Line team', spec: 'Dedicated line maintenance', icon: 'conveyor_belt', color: 'Blue', lead: 'JM', members: ['JM', 'SB'], site: 'THO' },
  { id: 'team-leads', name: 'Maintenance leads', spec: 'Managers, planning, reliability, stores', icon: 'groups', color: 'Purple', lead: 'GD', members: ['GD', 'HP', 'CM', 'LB', 'SL'], site: 'THO' },
];
export const teams = () => rd(TKEY, null) || SEED_TEAMS.map(t => ({ ...t, members: [...t.members] }));
export const team = id => teams().find(t => t.id === id) || null;
const saveTeams = list => { wr(TKEY, list); emit({ teams: true }); };
export const saveTeam = (id, data) => { const list = teams(); let tid = id;
  if (!tid) { tid = 'team-' + (data.name || 'new').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18); let n = 2; const b = tid; while (list.some(t => t.id === tid)) tid = b + '-' + n++; list.push({ id: tid, icon: 'groups', color: 'Grey', members: [], site: SI.current().id, ...data }); }
  else { const i = list.findIndex(t => t.id === tid); if (i >= 0) list[i] = { ...list[i], ...data }; }
  list.forEach(t => { if (t.lead && !t.members.includes(t.lead)) t.members.unshift(t.lead); }); saveTeams(list); return tid; };
export const removeTeam = id => saveTeams(teams().filter(t => t.id !== id));
export const addMember = (tid, uid) => { const t = team(tid); if (t && !t.members.includes(uid)) saveTeam(tid, { members: [...t.members, uid] }); };
export const removeMember = (tid, uid) => { const t = team(tid); if (!t) return; saveTeam(tid, { members: t.members.filter(k => k !== uid), lead: t.lead === uid ? '' : t.lead }); };
export const teamsOf = uid => teams().filter(t => t.members.includes(uid));
export const teamColor = t => TEAM_COLORS[(t && t.color) || 'Grey'] || TEAM_COLORS.Grey;

// ---------- Super users: access scopes wider than one site ----------
// scope.type: 'business' | 'sub' | 'country' | 'sites'. Resolved dynamically, so sites added later under the business / country are included automatically.
export const SCOPE_TYPES = [['business', 'Business', 'domain'], ['sub', 'Sub-business', 'account_tree'], ['country', 'Country', 'public'], ['sites', 'Selected sites', 'factory']];
const SEED_SCOPES = [
  { id: 's1', uid: 'TB', type: 'business', ids: ['flat'], role: 'admin', note: 'Flat Glass maintenance director' },
  { id: 's2', uid: 'CM', type: 'country', ids: ['France'], role: 'planner', note: 'Reliability support for French plants' },
];
export const scopes = () => rd(SKEY, null) || SEED_SCOPES.map(s => ({ ...s }));
export const saveScopes = list => { wr(SKEY, list); emit({ scopes: true }); };
export const sitesOfScope = sc => SI.SITES.filter(s => !s.inactive && (sc.type === 'sites' ? sc.ids.includes(s.id) : sc.type === 'country' ? sc.ids.includes(s.country) : SI.businessPath(s).some(b => sc.ids.includes(b.id)))).map(s => s.id);
const scopeRole = (uid, site) => { const sc = scopes().find(x => x.uid === uid && sitesOfScope(x).includes(site)); return sc ? sc.role : null; };
export const scopeLabel = sc => { const t = SCOPE_TYPES.find(x => x[0] === sc.type); const names = sc.type === 'country' ? sc.ids : sc.type === 'sites' ? sc.ids.map(id => (SI.SITES.find(s => s.id === id) || { name: id }).name) : sc.ids.map(id => (SI.BUSINESSES.find(b => b.id === id) || { name: id }).name); return `${t ? t[1] : ''}: ${names.join(', ') || '—'}`; };
// Every site a user can open from the site switcher.
export const sitesFor = (uid = me()) => { if (isSuperAdmin(uid) && !previewAs()) return SI.SITES.map(s => s.id); const u = user(uid) || {}; return [...new Set([...(u.sites || []), ...Object.keys(u.siteRoles || {}), ...scopes().filter(x => x.uid === uid).flatMap(sitesOfScope)])]; };
export const adminsOf = site => users().filter(u => u.status !== 'Deactivated' && ((u.siteRoles || {})[site] === 'admin' || (u.role === 'admin' && (u.sites || []).includes(site))));

if (typeof window !== 'undefined') window.RelixAccess = { SIGNED_IN, MODULES, LEVEL, CODES, moduleOfPath, roleSet, roles, role, saveRoleSet, resetRoles, levelOf, users, user, userByName, saveUser, newUserId, inviteUser, ini, signedIn, previewAs, setPreviewAs, me, meUser, roleOf, isSuperAdmin, level, can, canFinance, MASK, rateOf,
  TEAM_COLORS, TEAM_ICONS, teams, team, saveTeam, removeTeam, addMember, removeMember, teamsOf, teamColor, SCOPE_TYPES, scopes, saveScopes, sitesOfScope, scopeLabel, sitesFor, adminsOf };
