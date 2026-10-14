# Relix CMMS – simplified mockup (v4)

Based on the latest team mockup (Industrial CMMS Web MVP), revised with the review prompt of Oct 6, 2026.
Start at `Main.dc.html` (Home). Also published as a Claude Design canvas ("Relix CMMS Web — V2 simplifiée").

| View | Change |
|---|---|
| Home – header | "Good morning, Gaudéric 👋"; plant / team line removed; **Request intervention** button top right |
| Home – intervention requests | New lightweight request (asset, short description, optional photo, teams / people to notify → notification). Compact strip above To do (To review / All). From a request: view details, set Pending / Accepted / Not retained, or create a work order with the asset and description reused |
| Home – To do | Not scheduled first; single-line rows (horizontal scroll if needed); type filters as text; no type icons, labels, legend or counts — only Critical is highlighted; progress = bar + "3 of 7 steps"; Schedule → Today / Tomorrow / Later opens free time slots, or All day |
| Home – analytics & chat | Analytics can be hidden (Activity / Chat takes the space); Direct: unread conversations in bold, explanatory text removed |
| Planning | Create work order back top right; More filters (type, priority, status, team); no event counts; lighter events with one colour per technician (legend avatars also filter); All-day row (all-day work + absences / off-site); click a free slot to create a work order; "Suggest a slot" on Not scheduled cards; technician workload in a modal |
| Work orders – board & detail | **Mark as done** on Requested cards and on the detail page: who, when, time spent, result, equipment state, failure cause, comment, optional follow-up → Completed, flagged "Recorded after" |
| Edit work order | Status no longer selectable — it follows workflow actions |

Notes
- File names have no spaces (`WorkOrder.dc.html`, `WorkOrders.dc.html`, `AssetDetail.dc.html`…); the Home is `Main.dc.html`.
- New components: `RequestPanel.dc.html` (request intervention) and `QuickComplete.dc.html` (mark as done), mounted in the top bar.
- Requests are stored in `collab-model.js` (`cmms.requests.v1`, browser storage, demo data).
