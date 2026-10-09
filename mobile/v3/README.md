# Relix Mobile – rethought (v3)

Complete rethink of the mobile UX (review of Oct 9, 2026), not an iteration of v2.
Start at `index.html` (list of screens) or `Main.dc.html` (Home, technician). Also published as a Claude Design canvas ("Relix Mobile — rethought").

The whole app is one component, `Main.dc.html` (props `role` = operator / technician / manager, `maturity` = 1 / 2 / 3, `screen`); every other file opens it on a given screen, so each one is a starting point into the same clickable prototype.

| Need | Design |
|---|---|
| Scan a machine | Big Scan button in the middle of the tab bar (Home · Work · **Scan** · Messages · Me). After the scan the machine is identified and the next action is already chosen for the role: technician → Resume / Start; operator → Report a problem, with "Pierre is already on it" when a job is open; manager → machine status |
| Report a problem | 3 taps: what's wrong (6 large tiles) → is the machine stopped? yes / no → Send. Photo and voice are optional. No QR code → pick from "Near you" |
| Intervention | One step per screen, segmented progress, timer. Large mic: the voice note is saved and can answer the step ("No leak" ticks *No*). Spare parts of the step shown with picture, shelf and "picked" tick. Finish: is the machine running again? + voice note + follow-up job |
| Communicate | Messages: job chats, team, people, site; quick replies (On my way, Need help, Done, Missing part), voice messages, share a machine |
| Home by role | Operator: Scan, Report, today's round, my reports. Technician: job in progress + Resume, Scan / Report, later today. Manager: 3 KPIs, requests to review (→ create and assign, best matches first), team right now |
| Site maturity | Level 1 Starter: no checklist, "What did you do?" by voice. Level 2 Structured: step-by-step checklists and parts. Level 3 Advanced: operator rounds |
| Settings (same as web) | Site switching, language, notifications (push / email / quiet hours, Pop-up / Notification / Off per type), skills, availability with usual week and time off, work offline |

Notes
- Fake data; part pictures are drawings, request photos are placeholders.
- No status bar is drawn; screens keep a top safe area.
- `support.js` is the Design Component runtime needed to open the screens.
