# Relix Mobile – rethought (v3)

Complete rethink of the mobile UX (review of Oct 9, 2026), not an iteration of v2, then corrected the same day (Home, interventions, asset search, terminology).
Start at `index.html` (list of screens) or `Main.dc.html` (Home, technician). Also published as a Claude Design canvas ("Relix Mobile — rethought").

The whole app is one component, `Main.dc.html` (props `role` = operator / technician / manager, `maturity` = 1 / 2 / 3, `screen`); every other file opens it on a given screen, so each one is a starting point into the same clickable prototype.

| Need | Design |
|---|---|
| Home | Greeting, **Search an asset** + Scan, the intervention in progress (tap = details, Resume = wizard), then 3 actions: Report a problem · Quick intervention · New intervention. Every intervention row opens its details. Site and profile are in *Me* |
| Assets | Scan (tab bar, middle) **or** search by name, code or line — both also work when an asset must be picked for a report or an intervention. Asset page: status, Report an incident · Quick intervention · New intervention (asset pre-selected), related interventions, essential information, all information and documents |
| Report an incident | 3 taps: what's wrong (6 large tiles) → is the machine stopped? yes / no → Send. Photo and voice optional |
| Intervention · view | Detail screen: status, task, asset, priority, estimate, checklist, assignee, description, **spare parts with pictures**, shelf and status, tools and equipment, documents, one large **Start / Resume intervention** button |
| Intervention · execute | Start opens the step-by-step wizard (one step per screen, voice answers, parts of the step). Without a checklist (or on a level-1 site): timer + voice notes, then *What did you do?* |
| Create | New intervention: asset, kind (repair, preventive, inspection, improvement), what to do (voice), urgency, *Not scheduled* or a **free slot**. Quick intervention: asset + one tap → Start now; details at the end or later (*Details to complete* in Interventions). Managers create, assign and schedule from a request or an unassigned intervention |
| Communicate | Messages: intervention chats, team, people, site; quick replies, voice messages, share an asset |
| Site maturity | Level 1 Starter: no checklist. Level 2 Structured: checklists and parts. Level 3 Advanced: operator rounds |
| Settings (same as web) | Site switching, language, notifications (push / email / quiet hours, Pop-up / Notification / Off per type), skills, availability with usual week and time off, work offline |

Terminology: *Intervention / Interventions* everywhere (no "work order" or "job"). *Asset* = identify, report, view information and reach maintenance actions; *Intervention* = view, prepare, schedule, start and execute.

Notes
- Fake data; part pictures are drawings, request photos are placeholders.
- Every screen is shown centered in an iPhone frame (status bar, Dynamic Island, home indicator); the app itself is 390 × 844.
- `support.js` is the Design Component runtime needed to open the screens.
