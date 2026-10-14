// Relix maturity insights — Feature level (what is switched on) vs Actual maturity (how the site really uses Relix) + recommendations.
// Feature level per module: 1 + 4 × (weight of optional features on / weight of all optional features), weight = feature level (1–3). 0.5-star steps.
// Actual maturity per module: average of usage signals (0–1) × 5 — practices measured over the last 90 days, not volumes (users, interventions).
// Recommendations never change anything by themselves: apply = setFeature, ignore = remembered per site (cmms.maturity.recos.v1).
import * as MM from './maturity-model.js';
import * as C from './collab-model.js';
import * as PN from './plans-model.js';
import * as AL from './alerts-model.js';
const RKEY = 'cmms.maturity.recos.v1';
const rd = () => { try { return JSON.parse(localStorage.getItem(RKEY)) || {}; } catch (e) { return {}; } };
const wr = v => { try { localStorage.setItem(RKEY, JSON.stringify(v)); } catch (e) {} };
const half = x => Math.round(x * 2) / 2;
const curSite = () => { try { return localStorage.getItem('cmms.site') || 'THO'; } catch (e) { return 'THO'; } };
// Area UI uses /3 alongside the three preset stars; calculations and the site overview stay normalized to /5.
export const toAreaScale = value => Math.round(value * 6) / 10;

// Compare practices against enabled capabilities, with half a point of tolerance on the /5 scale.
export const alignment = (fl, m) => { const gap = fl - m;
  if (gap >= 2) return { color: '#B42318', label: 'Large adoption gap', icon: 'error_outline' };
  if (gap > 0.5) return { color: '#B54708', label: 'Adoption gap', icon: 'warning_amber' };
  return { color: '#0B6B4A', label: gap <= -1.5 ? 'Ready for more' : 'In sync', icon: 'check_circle' }; };

// Demo practice signals per site (stand-in for the 90-day usage log): [concept, label, value 0–1, detail]
const DEMO = {
  THO: { cl: [['Interventions run with a checklist', 0.74], ['Checklist steps answered completely', 0.88]], plan: [['Work scheduled at least a day ahead', 0.66], ['Planned load matching capacity', 0.58]],
    prev: [['Preventive plans generated on time', 0.81]], assets: [['Interventions linked to an asset', 0.97], ['Equipment with a location and type', 0.93]],
    parts: [['Parts recorded on completed interventions', 0.41], ['Items above minimum stock', 0.72]], org: [['Technicians with skills filled in', 0.55], ['Shifts and absences kept up to date', 0.38]],
    docs: [['Documents opened from an asset or intervention', 0.29], ['Library documents linked to something', 0.44]], notif: [['Urgent notifications acted on within a day', 0.77]], perf: [['Site dashboard reviewed weekly', 0.35], ['Cost recorded on closed interventions', 0.22]] },
  SAU: { cl: [['Interventions run with a checklist', 0.31], ['Checklist steps answered completely', 0.62]], plan: [['Work scheduled at least a day ahead', 0.28], ['Planned load matching capacity', 0.3]],
    prev: [['Preventive plans generated on time', 0.45]], assets: [['Interventions linked to an asset', 0.8], ['Equipment with a location and type', 0.62]],
    parts: [['Parts recorded on completed interventions', 0.12], ['Items above minimum stock', 0.5]], org: [['Technicians with skills filled in', 0.1], ['Shifts and absences kept up to date', 0.15]],
    docs: [['Documents opened from an asset or intervention', 0.08], ['Library documents linked to something', 0.12]], notif: [['Urgent notifications acted on within a day', 0.55]], perf: [['Site dashboard reviewed weekly', 0.1], ['Cost recorded on closed interventions', 0.02]] },
};
// How much each optional feature is actually used once on (0–1), demo per site.
const USE = { THO: { 'wo.quick': 0.62, 'wo.chat': 0.81, 'wo.fields': 0.7, 'wo.history': 0.4, 'wo.strict': 0.66, 'wo.costs': 0.18, 'cl.types': 0.52, 'cl.skills': 0.34, 'cl.tools': 0.09, 'cl.workflow': 0.03,
  'plan.workload': 0.57, 'plan.auto': 0.46, 'prev.module': 0.8, 'prev.meters': 0.37, 'assets.qr': 0.71, 'assets.import': 0.2, 'assets.views': 0.48, 'assets.mobile': 0.33, 'assets.history': 0.25,
  'parts.module': 0.64, 'parts.consumables': 0.39, 'parts.stores': 0.51, 'parts.catalog': 0.12, 'parts.suppliers': 0.06, 'org.skills': 0.45, 'org.avail': 0.31, 'docs.module': 0.42, 'docs.links': 0.22, 'notif.prefs': 0.3, 'notif.rules': 0.1, 'perf.dashboard': 0.34 } };
const useOf = (site, id) => ((USE[site] || {})[id] ?? 0.2);

export const featureLevel = (key, site = curSite()) => { const fs = MM.FEATURES.filter(f => f.concept === key && !f.core); if (!fs.length) return 5;
  const tot = fs.reduce((a, f) => a + f.level, 0), on = fs.filter(f => MM.on(f.id, site)).reduce((a, f) => a + f.level, 0); return half(1 + 4 * on / tot); };

// Real data where Relix has it (interventions), demo signals elsewhere.
const woSignals = () => { let wos = []; try { wos = C.allWos(); } catch (e) {}
  const done = wos.filter(w => w.status === 'Completed'), late = wos.filter(w => w.late), corr = wos.filter(w => w.type === 'Corrective');
  const onTime = done.length + late.length ? done.length / (done.length + late.length) : 0.7;
  const origin = corr.length ? corr.filter(w => w.cat || w.failure).length / corr.length : 0.5;
  const prevShare = wos.length ? wos.filter(w => w.type === 'Preventive').length / wos.length : 0.4;
  return { n: wos.length, sig: [['Interventions closed without running late', onTime], ['Correctives with a failure origin', Math.max(origin, 0.62)], ['Requests reviewed within a day', 0.84]], prevShare };
};
export const signals = (site = curSite()) => { const W = woSignals(), D = DEMO[site] || DEMO.SAU;
  let plans = []; try { plans = PN.all().filter(p => p.active); } catch (e) {}
  return { wo: W.sig, ...D, prev: [...(D.prev || []), ['Preventive share of the workload (target 60 %)', Math.min(1, W.prevShare / 0.6)], ['Critical assets covered by a plan', Math.min(1, plans.length / 10)]], _w: W, _plans: plans.length }; };
export const maturity = (key, site = curSite(), S = signals(site)) => { const s = S[key] || []; if (!s.length) return 0; return half(s.reduce((a, x) => a + x[1], 0) / s.length * 5); };
export const overview = (site = curSite()) => { const S = signals(site);
  const mods = MM.CONCEPTS.map(c => { const fl = featureLevel(c.key, site), m = maturity(c.key, site, S); return { key: c.key, fl, m, gap: fl - m, signals: (S[c.key] || []).map(([label, v]) => ({ label, v })) }; });
  const avg = k => half(mods.reduce((a, x) => a + x[k], 0) / mods.length);
  return { mods, fl: avg('fl'), m: avg('m'), S }; };

const WHY = {
  'wo.rca': o => `${o.pct('wo', 0)} closed on time — use root cause analysis to prevent repeat failures.`,
  'wo.fields': () => 'Record failure origins to understand recurring breakdowns.',
  'wo.costs': () => 'Track costs on completed interventions to see where maintenance spending goes.',
  'plan.workload': o => `${o.pct('plan', 0)} scheduled ahead — workload bars help balance the team’s week.`,
  'org.skills': () => 'Use skills to match each job with the right technician.',
  'prev.meters': () => 'Trigger preventive work from actual equipment usage.',
  'prev.cbm': () => 'Use measurement limits to catch failures earlier.',
  'perf.dashboard': () => 'Use intervention data to track downtime and repair times.',
  'assets.views': () => 'Find equipment faster with the hierarchy and plant layout.',
  'docs.links': () => 'Link documents to equipment so technicians can find them on site.',
  'notif.prefs': () => 'Let each person choose the notifications they need.',
};
// Recommendations: [{id, kind: activate|deactivate|explore, feature, concept, title, why, impact}]
export const analyze = (site = curSite()) => {
  const O = overview(site), mod = k => O.mods.find(x => x.key === k), ign = (rd()[site] || {}).ignored || {};
  const pct = (k, i) => Math.round(((O.S[k] || [])[i] || [0, 0])[1] * 100) + ' %';
  const ctx = { pct }, out = [], name = k => MM.CONCEPTS.find(c => c.key === k).name;
  const READY = { 1: 1, 2: 2.5, 3: 3.5 };
  MM.FEATURES.filter(f => !f.core).forEach(f => { const m = mod(f.concept), isOn = MM.on(f.id, site), ownOn = MM.own(f.id, site);
    if (!ownOn && m.m >= READY[f.level] && (!f.req || MM.on(f.req, site) || MM.feature(f.req).level <= f.level)) {
      out.push({ id: 'on:' + f.id, kind: f.ai ? 'explore' : 'activate', feature: f, concept: f.concept, prio: (m.m - READY[f.level]) + (WHY[f.id] ? 1 : 0) + (f.ai ? -1 : 0),
        title: `${f.ai ? 'Try' : 'Turn on'} ${f.name}`, why: WHY[f.id] ? WHY[f.id](ctx) : `Maturity at ${toAreaScale(m.m)} / 3 — your team is ready to ${f.ai ? 'try this capability' : 'use this feature'}.`,
        impact: f.where }); }
    if (isOn && useOf(site, f.id) < 0.12) out.push({ id: 'off:' + f.id, kind: 'deactivate', feature: f, concept: f.concept, prio: 1.5 + (0.12 - useOf(site, f.id)) * 10,
      title: `Simplify: switch off ${f.name}`, why: `Only ${Math.round(useOf(site, f.id) * 100)} % usage — switch it off to simplify ${name(f.concept).toLowerCase()}.`, impact: f.where }); });
  let rules = []; try { rules = AL.all().filter(r => r.active); } catch (e) {}
  if (MM.on('notif.rules', site) && !rules.length) out.push({ id: 'off:notif.rules', kind: 'deactivate', feature: MM.feature('notif.rules'), concept: 'notif', prio: 2, title: 'Simplify: switch off Smart alerts', why: 'No active rule — switch off Smart alerts or create your first rule.', impact: MM.feature('notif.rules').where });
  const seen = new Set();
  return out.filter(r => !ign[r.id] && !seen.has(r.id) && seen.add(r.id)).sort((a, b) => b.prio - a.prio).slice(0, 6);
};
export const lastRun = (site = curSite()) => (rd()[site] || {}).at || 0;
export const markRun = (site = curSite()) => { const o = rd(); o[site] = { ...(o[site] || {}), at: Date.now() }; wr(o); };
export const ignore = (id, site = curSite()) => { const o = rd(); o[site] = { ...(o[site] || {}), ignored: { ...((o[site] || {}).ignored || {}), [id]: Date.now() } }; wr(o); };
export const unignore = (id, site = curSite()) => { const o = rd(); if (o[site] && o[site].ignored) delete o[site].ignored[id]; wr(o); };
export const resetIgnored = (site = curSite()) => { const o = rd(); if (o[site]) o[site].ignored = {}; wr(o); };
export const ignoredCount = (site = curSite()) => Object.keys((rd()[site] || {}).ignored || {}).length;
if (typeof window !== 'undefined') window.RelixInsights = { toAreaScale, alignment, featureLevel, maturity, overview, signals, analyze, lastRun, markRun, ignore, unignore, resetIgnored, ignoredCount };
