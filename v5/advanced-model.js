import { canFinance, MASK } from './access-model.js';
// Advanced features (in development) — visibility flag + demo data for lifecycle, obsolescence, contracts and live monitoring.
// Flag: localStorage 'cmms.advanced' ('0' = hidden, default shown), event 'cmms-advanced'. Accent #800080.
const KEY = 'cmms.advanced';
export const PURPLE = '#800080', TINT = '#F6EAF6', LINE = '#E2C4E2';
export const enabled = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } };
export const setEnabled = on => { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} try { window.dispatchEvent(new CustomEvent('cmms-advanced', { detail: { on: !!on } })); } catch (e) {} };

const hash = s => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
const rnd = (s, i) => (hash(s + ':' + i) % 1000) / 1000;
const TODAY = new Date(2026, 9, 7), NOWY = 2026;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = d => `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
export const eur0 = n => !canFinance() ? MASK : '€' + Math.round(+n || 0).toLocaleString('en-US');
const addDays = n => new Date(TODAY.getTime() + n * 864e5);

const LIFE = { Furnace: 25, Press: 20, Conveyor: 15, Fan: 15, Compressor: 15, Pump: 12, Robot: 12, Mixer: 18, Scale: 12, Crane: 20, Lift: 12, Forklift: 10 };
const REPL = { Furnace: 1200000, Press: 380000, Robot: 220000, Compressor: 90000, Conveyor: 60000, Mixer: 140000, Fan: 25000, Pump: 18000, Scale: 15000, Crane: 160000, Forklift: 38000 };
export const STAGES = ['Plan & acquire', 'Install & commission', 'Operate & maintain', 'Renew or overhaul', 'Decommission'];

export const lifecycleOf = a => {
  const year = +a.year || 2016, life = LIFE[a.type] || 15, age = Math.max(0, NOWY - year), pct = Math.min(1, age / life), repl = REPL[a.type] || 50000;
  const yearly = [0, 1, 2, 3, 4].map(i => Math.round(repl * 0.028 * (0.7 + pct) * (0.75 + 0.5 * rnd(a.id, 'y' + i)) * (1 + i * 0.07)));
  const cum = Math.round(yearly.reduce((s, v) => s + v, 0) / 5 * Math.max(1, age) * 0.9), ratio = cum / repl;
  const stage = a.status === 'Out of service' && pct > 0.9 ? 4 : age < 1 ? 1 : pct >= 0.8 || ratio > 0.55 ? 3 : 2;
  const renewal = Math.max(NOWY + 1, ratio > 0.6 ? NOWY + 1 : year + life);
  const rec = stage === 3 ? `Maintenance has cost ${Math.round(ratio * 100)}% of the replacement value — include renewal in the ${renewal} budget.` : ratio > 0.35 ? `Costs are rising — compare overhaul vs. replacement before ${renewal}.` : 'Costs in line with expectations for this age.';
  return { year, life, age, remaining: Math.max(0, life - age), endYear: year + life, pct, stage, repl, yearly, years: [0, 1, 2, 3, 4].map(i => String(NOWY - 4 + i)), cum, ratio, renewal, rec };
};

const PLC = [['Siemens S7-300', 1], ['Siemens S7-1500', 0], ['Schneider Modicon M340', 0], ['Allen-Bradley SLC 500', 1], ['ABB AC500', 0]];
export const obsolescenceOf = a => {
  const lc = lifecycleOf(a), eos = lc.year + lc.life - 3 + Math.floor(rnd(a.id, 'eos') * 5), eol = eos - 4;
  const f = [];
  if (eos < NOWY) f.push(['Manufacturer status', 30, `Model ${a.model || ''} out of support since ${eos}`.replace('  ', ' ')]);
  else if (eos - NOWY <= 2) f.push(['Manufacturer status', 22, `End of support announced for ${eos}`]);
  else if (eol <= NOWY) f.push(['Manufacturer status', 12, `No longer sold since ${eol} · supported until ${eos}`]);
  else f.push(['Manufacturer status', 4, `Current product · supported until ${eos}`]);
  const m = 4 + Math.floor(rnd(a.id, 'pm') * 4), dn = lc.pct > 0.45 ? 1 + Math.floor(rnd(a.id, 'pd') * 3) : 0;
  f.push(['Spare parts availability', dn * 8, dn ? `${dn} of ${m} critical spare parts discontinued` : `All ${m} critical spare parts available`]);
  const [plc, old] = PLC[hash(a.id) % PLC.length];
  f.push(['Control system / firmware', old ? 18 : 3, old ? `${plc} — phased out by the manufacturer` : `${plc} — current generation`]);
  const fails = Math.floor(rnd(a.id, 'fl') * 6);
  f.push(['Failure trend (12 months)', fails * 3, `${fails} breakdown${fails === 1 ? '' : 's'} · ${fails > 2 ? 'increasing' : 'stable'}`]);
  const cp = { Critical: 14, High: 10, Medium: 5, Low: 1 }[a.crit] ?? 5;
  f.push(['Asset criticality', cp, `${a.crit || 'Medium'} criticality — impact if the asset cannot be repaired`]);
  const score = Math.min(100, f.reduce((s, x) => s + x[1], 0));
  const level = score >= 60 ? ['High risk', '#FDECEC', '#B42318', '#D92D20'] : score >= 35 ? ['Medium risk', '#FEF3E2', '#B54708', '#F79009'] : ['Low risk', '#E6F4EE', '#0B6B4A', '#12A06A'];
  return { score, level, eol, eos, plc, factors: f.map(([k, pts, d]) => ({ k, pts, d, max: { 'Manufacturer status': 30, 'Spare parts availability': 24, 'Control system / firmware': 18, 'Failure trend (12 months)': 15, 'Asset criticality': 14 }[k] })), discontinued: dn };
};

const cStatus = days => days < 0 ? ['Expired', '#EEF1F4', '#475467'] : days <= 90 ? [`Expires in ${days} d`, '#FEF3E2', '#B54708'] : ['Active', '#E6F4EE', '#0B6B4A'];
const COVER = { Furnace: 'Burner & refractory inspection 2×/year · 48 h on-site', Robot: 'Preventive visit 1×/year · remote support · 24 h on-site', Compressor: 'Service kits & oil · 4 visits/year · 24 h on-site', Press: 'Hydraulic inspection 2×/year · 48 h on-site' };
export const contractsOf = a => {
  const lc = lifecycleOf(a), out = [];
  const wEnd = new Date(lc.year + (lc.year >= 2023 ? 3 : 2), 5, 30), wDays = Math.round((wEnd - TODAY) / 864e5);
  out.push({ kind: 'Manufacturer warranty', icon: 'verified', provider: a.manufacturer || 'Manufacturer', cover: 'Parts and labour on manufacturing defects', period: `${lc.year} – ${fmtDate(wEnd)}`, days: wDays, status: cStatus(wDays), cost: 'Included' });
  if (a.crit !== 'Low') {
    const days = Math.round(rnd(a.id, 'ct') * 460) - 50, end = addDays(days);
    out.push({ kind: 'Maintenance contract', icon: 'handshake', provider: `${a.manufacturer || 'OEM'} Service`, cover: COVER[a.type] || 'Preventive visit 2×/year · parts −10% · 24 h on-site', period: `Renews ${fmtDate(end)}`, days, status: cStatus(days), cost: eur0(Math.round((REPL[a.type] || 50000) * 0.04 / 100) * 100) + ' / year' });
  }
  return out;
};

// ---------- Live monitoring (simulated feed) ----------
const PROC = {
  Pump: [['Discharge pressure', 'bar', 4.1, 0.12, 3.5, 4.5, 1], ['Flow', 'm³/h', 62, 2.5, 50, 75, 0], ['Motor current', 'A', 21.4, 0.7, 18, 24, 1], ['Seal temperature', '°C', 49, 1.6, 20, 65, 0]],
  Furnace: [['Zone 2 temperature', '°C', 688, 5, 670, 710, 0], ['Gas flow', 'Nm³/h', 214, 7, 180, 240, 0], ['O₂ in flue gas', '%', 2.6, 0.18, 1.5, 3.5, 1], ['Roof temperature', '°C', 142, 3, 0, 160, 0]],
  Compressor: [['Outlet pressure', 'bar', 7.4, 0.12, 6.5, 8, 1], ['Oil temperature', '°C', 82, 1.8, 60, 95, 0], ['Motor current', 'A', 118, 3.5, 90, 140, 0], ['Dew point', '°C', 3.1, 0.3, -5, 5, 1]],
  _: [['Motor current', 'A', 32, 1.2, 25, 40, 1], ['Speed', 'rpm', 1480, 5, 1450, 1500, 0], ['Motor temperature', '°C', 61, 1.6, 0, 80, 0], ['Load', '%', 74, 3.5, 0, 95, 0]],
};
const wave = (seed, n, base, amp, t, drift = 0) => Array.from({ length: n }, (_, i) => base + drift * (i / (n - 1)) + amp * (Math.sin((i + t) / 2.6 + rnd(seed, 'ph') * 6) * 0.55 + (rnd(seed, i + t) - 0.5) * 0.9));
export const pts = (vals, w, h, lo, hi) => vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * h).toFixed(1)}`).join(' ');
export const liveOf = (a, t = 0) => {
  const proc = (PROC[a.type] || PROC._).map(([k, unit, base, amp, lo, hi, dec], i) => {
    const s = wave(a.id + k, 24, base, amp, t), v = s[s.length - 1], span = (hi - lo) || 1, ok = v >= lo && v <= hi;
    return { k, unit, v: v.toFixed(dec), range: lo > 0 ? `${lo}–${hi} ${unit}` : `< ${hi} ${unit}`, ok, color: ok ? '#0B6B4A' : '#B42318', pts: pts(s, 120, 26, Math.min(...s) - amp, Math.max(...s) + amp) };
  });
  const vib = wave(a.id + 'vib', 48, 2.5, 0.35, t, 2.4), bt = wave(a.id + 'bt', 48, 58, 1.2, t, 6);
  const vNow = vib[vib.length - 1], zone = vNow < 2.8 ? ['A · Good', '#0B6B4A'] : vNow < 4.5 ? ['B · Acceptable', '#B54708'] : vNow < 7.1 ? ['C · Alert', '#B42318'] : ['D · Danger', '#B42318'];
  const kw = Array.from({ length: 24 }, (_, i) => Math.round(42 + 14 * Math.sin((i - 6) / 4) * (i > 5 && i < 22 ? 1 : 0.3) + rnd(a.id + 'kw', i) * 6 + (i > 18 ? 4 : 0)));
  const prob = Array.from({ length: 31 }, (_, d) => 1 - Math.exp(-Math.pow(d / 48, 2.1)) + 0.04);
  return {
    proc, vib, vibNow: vNow.toFixed(1), zone, bt, btNow: bt[bt.length - 1].toFixed(0), kw, kwNow: Math.round(kw[kw.length - 1] + Math.sin(t) * 2), kwh: kw.reduce((s, v) => s + v, 0) * 0.62 | 0,
    prob, p30: Math.round(prob[30] * 100), rul: 46 - (t % 2), health: 62, component: /Furnace/.test(a.type) ? 'Combustion air fan bearing' : 'Drive-end bearing',
    anomalies: [['Today 09:42', 'Vibration DE', '+38% vs. learned baseline', 'High', 'Open'], ['Yesterday 22:10', 'Bearing temperature', '+6 °C above model', 'Medium', 'Open'], ['Oct 3, 14:05', 'Energy', '+9% energy per tonne produced', 'Medium', 'Intervention created'], ['Sep 29, 07:30', 'Motor current', 'Spike 2.1× nominal at start-up', 'Low', 'Dismissed']],
  };
};
