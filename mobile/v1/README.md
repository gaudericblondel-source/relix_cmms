# Relix Mobile – CMMS field app prototype

Clickable prototype of the mobile app that complements the Relix CMMS web app.
Open: https://gaudericblondel-source.github.io/relix_cmms/mobile/v1/

Single self-contained page (`index.html`, vanilla JS, no build). Same design language as the web app:
IBM Plex Sans / Mono, Material Symbols, nav #34050D, accent #C00018, priority and status pills.
Persona: Marc Dupont, mechanic, Thourotte Plant. Fake data; state kept in the browser (localStorage `relix.mobile.v1`).

## Navigation
Bottom bar: **To do · Search · Scan (center) · Chat · Me**. Connection pill (Online / Offline · pending count) in every header.

## 1. To do
- My work / My team tabs, 3 KPIs (overdue, to do today, done today)
- "Pick up where you left off" card for paused / in-progress interventions (progress per step, Resume)
- Today / Upcoming / Completed lists with Start / Resume buttons; overdue rows in red
- Work order detail: essentials, discussion, documents, equipment, sticky Start/Resume

## Intervention (same wizard as web)
- Full screen, one step at a time, "Step N of M", segmented progress, timer, Pause (with reason)
- Step types: confirm list (safety), number with normal range (anomaly if out), yes/no, photo, spare part quantity, text
- Step documents as a chip, available offline
- **Chat on demand**: floating chat button with unread badge + last-message preview; opens a bottom sheet
  (thread, quick replies "Step done / Need help / Waiting for part", composer) without leaving the step
- Review & close: equipment operational?, completion comment, handover note

## 2. Search
One field with recent searches and nearby equipment; filters All / Equipment / Work orders / Spare parts / Documents / People; highlighted matches.

## 3. Chat
All conversations in one list: Direct, Teams, Site, Work orders; unread badges; new direct message.

## 4. QR scanner – Scan → Understand → Act
Scan → equipment card with only the essentials (state, criticality, open work orders, last intervention) and 3 actions:
**Start / Resume intervention** (uses your work order if one exists, otherwise a quick intervention),
**Report an incident** (problem type in one tap, production stopped toggle, photo, comment; send or fix it now),
**Full equipment details** (specs, documents, history). Demo: tap a chip or type a code (P-101, V-12, CNV-3, C-2, B-4).

## 5. Offline
Toggle in Me or the connection pill (also follows the real browser online/offline events).
Everything keeps working offline; actions are queued (started, photos, messages, completed, incidents) and shown as
"Not synced" / "waiting for network"; when the network is back they sync automatically.
