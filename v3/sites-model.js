// Business / Site hierarchy — shared by TopBar (site switcher) and Site Dashboard.
const KEY = 'cmms.site';
export const BUSINESSES = [
  { id: 'ng', name: 'Nordglass Group', parent: null },
  { id: 'fge', name: 'Flat Glass Europe', parent: 'ng' },
  { id: 'fgi', name: 'Flat Glass Iberia', parent: 'ng' },
  { id: 'auto', name: 'Automotive Glass', parent: 'ng' },
];
export const SITES = [
  { id: 'THO', name: 'Thourotte Plant', business: 'fge', city: 'Thourotte', country: 'France', tz: 'Europe/Paris', lat: 49.47, lon: 2.88, assets: 1248, k: { overdue: 7, overdueCrit: 3, stopped: 3, stoppedCrit: 2, pm: 91, out: 5, low: 21, today: 14, todayDone: 5 } },
  { id: 'SAU', name: 'Saultain Plant', business: 'fge', city: 'Saultain', country: 'France', tz: 'Europe/Paris', lat: 50.34, lon: 3.58, assets: 864, k: { overdue: 2, overdueCrit: 0, stopped: 1, stoppedCrit: 0, pm: 97, out: 1, low: 9, today: 9, todayDone: 4 } },
  { id: 'AVI', name: 'Avilés Plant', business: 'fgi', city: 'Avilés', country: 'Spain', tz: 'Europe/Madrid', lat: 43.55, lon: -5.92, assets: 702, k: { overdue: 11, overdueCrit: 4, stopped: 5, stoppedCrit: 3, pm: 84, out: 7, low: 26, today: 12, todayDone: 3 } },
  { id: 'HZR', name: 'Herzogenrath Plant', business: 'auto', city: 'Herzogenrath', country: 'Germany', tz: 'Europe/Berlin', lat: 50.87, lon: 6.1, assets: 1530, k: { overdue: 0, overdueCrit: 0, stopped: 0, stoppedCrit: 0, pm: 99, out: 0, low: 6, today: 18, todayDone: 8 } },
];
export const businessPath = site => { const out = []; let b = BUSINESSES.find(x => x.id === site.business); while (b) { out.unshift(b); b = BUSINESSES.find(x => x.id === b.parent); } return out; };
export const current = () => { let id = null; try { id = localStorage.getItem(KEY); } catch (e) {} return SITES.find(s => s.id === id) || SITES[0]; };
export const select = id => { try { localStorage.setItem(KEY, id); } catch (e) {} window.dispatchEvent(new CustomEvent('cmms-site', { detail: id })); };
export const localTime = site => { try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: site.tz }).format(new Date()); } catch (e) { return ''; } };
if (typeof window !== 'undefined') window.CMMSSites = { BUSINESSES, SITES, businessPath, current, select, localTime };
