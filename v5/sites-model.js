// Organization hierarchy — Business › Sub-business › Site. Managed by Super Admins only (SuperAdmin.dc.html), stored in cmms.org.v1.
// Shared by TopBar (site switcher), Site Dashboard, access-model (super-user scopes).
const KEY = 'cmms.site', OKEY = 'cmms.org.v1';
export const ORG_NAME = 'Nordglass Group';
const K0 = () => ({ overdue: 0, overdueCrit: 0, stopped: 0, stoppedCrit: 0, pm: 100, out: 0, low: 0, today: 0, todayDone: 0 });
// level: 'business' (top) | 'sub' (sub-business, parent = business)
const SEED_BIZ = [
  { id: 'flat', name: 'Flat Glass', parent: null, level: 'business' },
  { id: 'fge', name: 'Flat Glass Europe', parent: 'flat', level: 'sub' },
  { id: 'fgi', name: 'Flat Glass Iberia', parent: 'flat', level: 'sub' },
  { id: 'auto', name: 'Automotive Glass', parent: null, level: 'business' },
  { id: 'aue', name: 'Automotive Europe', parent: 'auto', level: 'sub' },
];
const SEED_SITES = [
  { id: 'THO', name: 'Thourotte Plant', business: 'fge', city: 'Thourotte', country: 'France', tz: 'Europe/Paris', lat: 49.47, lon: 2.88, assets: 1248, k: { overdue: 7, overdueCrit: 3, stopped: 3, stoppedCrit: 2, pm: 91, out: 5, low: 21, today: 14, todayDone: 5 } },
  { id: 'SAU', name: 'Saultain Plant', business: 'fge', city: 'Saultain', country: 'France', tz: 'Europe/Paris', lat: 50.34, lon: 3.58, assets: 864, k: { overdue: 2, overdueCrit: 0, stopped: 1, stoppedCrit: 0, pm: 97, out: 1, low: 9, today: 9, todayDone: 4 } },
  { id: 'AVI', name: 'Avilés Plant', business: 'fgi', city: 'Avilés', country: 'Spain', tz: 'Europe/Madrid', lat: 43.55, lon: -5.92, assets: 702, k: { overdue: 11, overdueCrit: 4, stopped: 5, stoppedCrit: 3, pm: 84, out: 7, low: 26, today: 12, todayDone: 3 } },
  { id: 'HZR', name: 'Herzogenrath Plant', business: 'aue', city: 'Herzogenrath', country: 'Germany', tz: 'Europe/Berlin', lat: 50.87, lon: 6.1, assets: 1530, k: { overdue: 0, overdueCrit: 0, stopped: 0, stoppedCrit: 0, pm: 99, out: 0, low: 6, today: 18, todayDone: 8 } },
];
const stored = (() => { try { return JSON.parse(localStorage.getItem(OKEY)) || null; } catch (e) { return null; } })();
export const BUSINESSES = (stored && stored.businesses) || SEED_BIZ.map(b => ({ ...b }));
export const SITES = ((stored && stored.sites) || SEED_SITES.map(s => ({ ...s }))).map(s => ({ k: K0(), assets: 0, ...s }));
const persist = () => { try { localStorage.setItem(OKEY, JSON.stringify({ businesses: BUSINESSES, sites: SITES })); } catch (e) {} try { window.dispatchEvent(new CustomEvent('cmms-org')); } catch (e) {} };
export const businessPath = site => { const out = []; let b = BUSINESSES.find(x => x.id === site.business); while (b) { out.unshift(b); b = BUSINESSES.find(x => x.id === b.parent); } return out; };
export const business = id => BUSINESSES.find(b => b.id === id) || null;
export const childrenOf = id => BUSINESSES.filter(b => (b.parent || null) === (id || null));
export const sitesUnder = id => SITES.filter(s => businessPath(s).some(b => b.id === id));
export const saveBusiness = b => { const i = BUSINESSES.findIndex(x => x.id === b.id); if (i >= 0) BUSINESSES[i] = { ...BUSINESSES[i], ...b }; else BUSINESSES.push({ parent: null, level: b.parent ? 'sub' : 'business', ...b }); persist(); };
export const removeBusiness = id => { const i = BUSINESSES.findIndex(x => x.id === id); if (i >= 0) BUSINESSES.splice(i, 1); persist(); };
export const saveSite = s => { const i = SITES.findIndex(x => x.id === s.id); if (i >= 0) SITES[i] = { ...SITES[i], ...s }; else SITES.push({ k: K0(), assets: 0, created: Date.now(), ...s }); persist(); };
export const removeSite = id => { const i = SITES.findIndex(x => x.id === id); if (i >= 0) SITES.splice(i, 1); persist(); };
export const resetOrg = () => { try { localStorage.removeItem(OKEY); } catch (e) {} };
export const current = () => { let id = null; try { id = localStorage.getItem(KEY); } catch (e) {} return SITES.find(s => s.id === id && !s.inactive) || SITES[0]; };
export const select = id => { try { localStorage.setItem(KEY, id); } catch (e) {} window.dispatchEvent(new CustomEvent('cmms-site', { detail: id })); };
export const localTime = site => { try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: site.tz }).format(new Date()); } catch (e) { return ''; } };
if (typeof window !== 'undefined') window.CMMSSites = { ORG_NAME, BUSINESSES, SITES, businessPath, business, childrenOf, sitesUnder, saveBusiness, removeBusiness, saveSite, removeSite, current, select, localTime };
