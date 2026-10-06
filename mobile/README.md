# Relix Mobile — field app for maintenance technicians (v2)

Clickable prototype of the mobile app that complements the Relix CMMS web app.

- **Open:** https://gaudericblondel-source.github.io/relix_cmms/mobile/ (on a phone: open it directly, then *Add to Home Screen*)
- **Demo QR codes to print:** [`qr.html`](qr.html) — scan them with the app, or with the phone camera (opens the app on the equipment)
- **Previous version:** [`v1/`](v1/)

Fake data, nothing is sent; state stays in the browser (`localStorage` key `relix.mobile.v2`, *Me › Reset the demo*).
Persona: **Pierre Leroy**, mechanic, Mechanical team, Thourotte Plant — Tuesday, September 29.

## 1. What the web app is (analysis)

| Area | Web app (desktop, 1440 px) |
|---|---|
| Shell | Burgundy top bar (#34050D) with global search (Ctrl+K), site switcher, notifications, profile; collapsible sidebar (Home, Site dashboard, Assets, Work orders, Planning, Spare parts, Maintenance setup, Documents, Teams & users, Suppliers, Site configuration) |
| Home | KPI strip, *My to-do / Team to-do* (paused card first, then Overdue / Today / Tomorrow with Start / Resume), most failures, activity + chat hub (Activity, Direct, Teams, Site, Work orders) |
| Work orders | Board / list, detail page (description, checklists, spare parts, costs, people, docs, discussion), 4-step creation panel (Essentials → Checklists → People → Details) |
| Intervention | Focus mode, no sidebar: one step at a time, *Step N of M*, Previous / Next, Pause, timer, *Review & close* (result, equipment operational, comment, follow-up). Work-order chat docked on the right |
| Checklists | 12 step types (Yes/No, single/multi choice, number with normal range, text, comment, instruction, checkbox, photo, attachment, spare parts, consumables), branching rules, anomalies |
| Assets | Plant › Zone › Line › Step hierarchy, asset sheet (details, specs, spare parts, documents, history), QR code per asset |
| Quick intervention | Equipment (search / scan) → Issue → Start, creates an "information incomplete" work order |
| Collaboration | One chat component everywhere: work order threads, teams, site, direct messages, @mentions, tags (Missing part, Handover, Help, Reassignment) |
| Design language | IBM Plex Sans + Mono (IDs, times), Material Symbols Outlined, accent #C00018 for the primary action only, neutral greys, 1 px borders, radius 6–8, no shadows; status colours Requested violet → Scheduled blue → In progress green → Completed grey, Overdue red, *Waiting* amber flag; Critical priority = solid red pill with bolt |

## 2. Mobile principles

1. **Not the web app on a small screen.** Only what a technician needs in front of the machine: what to do, do it, ask, find, scan.
2. **One primary action per screen**, in red, at thumb height. Everything else is quiet (white, hairlines, grey meta text).
3. **Status in one word**, not a pile of pills. Priority shown only when it matters (Critical / High).
4. **Same vocabulary as the web**: work order titles "Asset — Task", WO IDs in mono, same step types, same statuses and colours.
5. **No AI look**: no gradients, no sparkles, no chat bubbles, no assistant. Messages are laid out like the web discussion (avatar, name, role, time).
6. **Glove-friendly**: 52 px buttons, 56–76 px answer targets, large step titles.
7. **Offline is a normal state**, not an error.

## 3. Screens

**Navigation** — bottom bar: To do · Search · **Scan** (centre, burgundy) · Chat · Me.

**To do** — large title, one sync icon, *Mine / Team* switch. A single "current intervention" block (paused or running) with progress and one *Resume* button; then plain rows grouped *Overdue / Today / Tomorrow* (time in mono, "Asset — Task", type · zone, priority only if High/Critical). Completed items collapsed. *Team* shows "Needs someone" first (help requested, not assigned) with the assignee avatar.

**Work order** — title, ID, status · time · priority, description, then a short list: equipment, checklist, reserved parts, documents, people, chat preview. Sticky *Start / Resume / Take over / Assign to me and start*.

**Intervention** — same wizard as the web: burgundy focus header (back keeps it running, explicit *Pause* with a reason), *STEP N OF M*, segmented progress, timer. All web step types and rules (branching, anomalies, required photo, out-of-range comment, parts/consumables steppers). Footer: Previous · **Chat** · Next. The chat opens as a bottom sheet over the step (the step stays open underneath), with an unread badge on the chat button and a one-line preview when a message arrives. *Review & close* lists every answer, highlights anomalies and proposes a follow-up.

**Scan** — full-screen camera (real QR decoding: BarcodeDetector, jsQR fallback), torch, manual code entry. Result sheet: **Scan → Understand → Act** — equipment, status, criticality, your open work order or the team's, last intervention; then *Start / Resume*, *Report an incident*, *Equipment details*.

**Report an incident** — what is wrong (6 big choices), production stopped?, photo, details → creates a *Requested* work order (Critical if production is stopped). *Fix it now* starts the intervention immediately.

**Search** — one field, filters (All, Equipment, Work orders, Spare parts, Documents, People), recent searches and recently viewed, grouped results with highlighted matches, scan shortcut in the field.

**Chat** — one list for everything: work orders, teams, site, direct messages, sorted by last message, unread counts, filters. Quick messages on work-order threads (Need help, Missing part, Can someone take over?, Handover note).

**Me / Offline** — connection state, *Work offline* demo switch, list of changes waiting to sync, what is kept on the phone (my work orders + checklists, equipment of my zones, documents), settings.

## 4. Offline

- The app is a PWA: a service worker caches the app and fonts, so it opens and works with no network once visited.
- Everything a technician does is recorded locally first: start / pause / close an intervention, answers, photos, incident reports, messages.
- Offline, the header shows *Offline · n*, rows and messages carry a "not synced" mark, the incident confirmation says "saved on this phone".
- When the network is back (real `online` event or the demo switch) the queue syncs automatically: *Back online · n changes synced*.

## 5. Deliberately left to the web app

Planning, maintenance plans and checklist editing, work-order creation with full details, site dashboard and KPIs, spare parts management, suppliers, teams & users, site configuration.

## Files

`index.html` (stage + phone frame) · `app.css` · `app.js` (views, wizard engine, sync queue, scanner) · `data.js` (demo data) · `sw.js` + `manifest.webmanifest` (offline / install) · `qr.html` (printable codes) · `vendor/jsQR.min.js` (Apache-2.0).
