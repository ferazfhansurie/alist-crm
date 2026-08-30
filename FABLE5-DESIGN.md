# FABLE5 redesign — a-list crm

Full-site frontend redesign on branch `fable5/full-site-redesign`. One original product:
not a frappe skin, not the old spreadsheet with decoration. Everything below runs against
the existing `alist_crm.api.*` endpoints unchanged — no backend edits, no data behavior changes.

## design system — "marque"

**Canvas & surfaces.** Warm paper canvas (`#f6f5f1`) with white surfaces and warm-gray
hairlines (`#e7e5de` / `#efede7`). The old app sat on a cold neutral gray; the warm base is
what makes the product read as editorial print rather than generic SaaS. Depth comes from
tonal steps and dividers, not shadows — the only real shadow in the app is on menus and the
bulk-action bar.

**Ink & red.** Near-black ink (`#17181c`) does the structural work: primary buttons, the
navigation rail, active states, the funnel's stage rail. A-list red (`#e8384f`) is reserved
for signal — the wordmark's A, the create-lead action, active tab underlines, selected-row
spines, overdue markers. Red never fills large areas and is never decorative.

**Type.** Inter for all UI, with tabular numerals (`.num`) everywhere a number columns up.
Fraunces (serif, optical sizing) appears only at display moments: page titles, the pace
numbers on the daily report, empty-state headlines. That single serif accent is the main
"custom at first glance" move, borrowed from editorial design rather than CRM convention.
Labels are 10.5–11px uppercase Inter with wide tracking — they carry the information scent
so the content itself can stay dense.

**Shape language.** 5–10px radii, rectangular tags with status dots instead of pill badges,
square color chips for PICs (matching the workbook's owner colors from settings), small
colored dots for channels. The one intentionally pill-free system in the app is the status
tag: dot + tinted rectangle, readable at 11px in a 54px row.

**Status palette.** Derived from the existing seven lead statuses, recalibrated for contrast
on warm white: New gray, Contacted amber, Meeting Set blue, Meeting Done violet, Converted
green, Disqualified red, Duplicate yellow. Same hues everywhere: funnel strip, table, stage
rail, detail header.

## screen architecture

**Shell.** The top navbar is gone. A fixed 212px ink rail (left) holds the wordmark,
workspace navigation and the signed-in user. Active items get a red inset spine. Below
`lg` the rail collapses into an ink top bar + right drawer. This deliberately differs from
both references: frappe's dark full sidebar and the old database's top tab bar.

**Leads workspace** (`/leads`). Three layers, top to bottom:
1. *Header row* — serif title + live total, refresh, and the only red button in the shell
   (Create lead).
2. *Funnel strip* — a proportional segmented bar of the five active statuses replaces the
   old row of five KPI cards. Each segment and its legend count filters the list; the right
   block keeps overdue follow-ups and out-of-funnel counts (Disqualified/Duplicate, also
   clickable) visible without a dashboard. This is the "funnel context without generic
   cards" requirement made literal.
3. *Command surface* — saved views (localStorage, capture full filter+sort state, deletable),
   `/`-focusable search, status/channel/PIC/month/sort controls, then the table.

The table itself is plain HTML (not Chakra Table) for row density: 54px rows, sticky header,
selection column, and hover-revealed row actions — WhatsApp, call, email, and a full
log-activity menu grouped exactly like the backend workflow (Outreach / Pipeline /
Qualification / Event, with the team's own language: "Dah contact", "Dah meeting").
Actions needing input (meeting datetime, confirmed value) open a small dialog. Selection
enables a floating ink bulk bar: pass-to-PIC and bulk activity logging, implemented as
sequential calls to the existing per-lead endpoints with a failure count in the toast.

**Lead detail** (`/leads/:leadId`, deep links preserved). Split panel at ≥xl (580px),
full-screen overlay below. Rebuilt around three ideas:
- *Identity block*: serif name, org + channel, status tag, then a five-segment stage rail
  that fills with ink as the lead moves New → Converted (turns red when Disqualified /
  Duplicate). Status is not directly editable — as in the backend, activities drive it —
  so the rail is a display of truth, not a control pretending to be one.
- *Facts before tabs*: phone, email, sales tahunan, lead-in time, next follow-up (with
  overdue emphasis) and last outcome sit in the header, plus an inline deal card
  (status/proposal/confirmed value) when a deal exists — replacing the old external link
  into native frappe, which is now gone entirely.
- *Composer + timeline*: a two-mode composer (Log activity / Comment) with quick chips for
  the four most common actions and a grouped menu for the rest. The timeline merges frappe
  activities, calls and imported workbook history into one vocabulary (log / comment /
  email / call / system / file), each with its own icon and color, filterable by chips.
  A-list structured logs ("Call: No Pickup · note…") are parsed back out of their HTML
  into typed entries rather than shown as anonymous comments.

**Daily report** (`/daily-report`). Rebuilt as a pace cockpit rather than six KPI cards:
- A single surface with two *pace blocks* — leads vs target and spend vs target — each with
  a serif actual, progress bar, and a run-rate sentence ("924 to go — needs 31 leads/day
  for the rest of the month") computed from the backend's own remaining/daily fields.
- An efficiency row (CPL, meetings + cost/meeting, awareness) under a divider.
- Channel performance with inline share bars in each channel's color; per-PIC table with a
  lead→meeting conversion column; daily breakdown with in-row lead bars, totals in a table
  footer. Sparklines are plain CSS — no chart library added.
- The manager-only spend input is a collapsible panel behind a "Log spend" toggle instead
  of a permanent form block.

**Summary** (`/summary`). Headline totals (with derived average CPL, stage-to-stage
percentages, and return-on-spend multiple), then the monthly funnel table with
month-over-month delta arrows on leads/meetings/closed, and the closings table with channel
tags. Deltas are computed client-side from adjacent months — no API change.

**Settings** (`/settings`). Calm and administrative: monthly targets (with a note about
what saving affects), assignment pools rendered as channel → PIC chip rows instead of the
old raw JSON dump, and a team color legend. Non-managers get a proper "managers only"
empty state instead of bare text.

**States.** Every route has loading (skeletons or spinner + top loading bar), empty
(EmptyState with serif headline and a next step), and error (ErrorBanner with retry)
treatments. Long content: truncation with tooltips in the table, `pre-wrap` in timeline and
remarks.

## intentional departures from the references

- **From frappe crm**: no dark theme, no left doctype tree, no generic "columns/filters/sort"
  toolbar chrome, no linking back into `/crm`. Kept its depth: composer, typed timeline,
  tasks/notes/files, ownership, dense list, fast editing.
- **From the old a-list database**: kept the light red/black identity, Inter, restraint;
  dropped the spreadsheet layout, the row of five stat cards, pastel pill overload, and the
  full-width status dropdown per row. The workbook's *language* (Dah contact, PIC names,
  sales tahunan/bulanan, channels) is kept verbatim so the excel transition costs nothing.
- **From the previous custom build**: replaced top navbar with the ink rail, KPI cards with
  the funnel strip, Chakra Table with a purpose-built grid, the single "update" dropdown
  with grouped quick actions, and the unstructured timeline with a classified, filterable one.

## known backend limits encountered (left as-is, per brief)

- `list_leads` accepts only equality filters on status/channel/stream/PIC + month bounds,
  and a fixed sort whitelist — so "overdue" is a visible count but not a server-side filter,
  and saved views can't sort by follow-up date.
- Lead `status` is not in `EDITABLE_FIELDS`; it changes only through `apply_lead_action`.
  The UI reflects that (stage rail is read-only; actions are the only status controls).
- No bulk endpoints exist; bulk bar loops the per-lead endpoints sequentially and reports
  partial failures.
- No create/complete endpoints for tasks or notes — they render read-only, so no dead
  controls are shown.
- `overrides/activities.py` stamps all A-List Lead Activity rows with the same synthetic
  owner, so the timeline can't attribute those log entries to a specific user; entries show
  type + content + time only.

## file map

```
frontend/src/
  theme.js                      tokens, palettes, chakra component variants
  styles.css                    shell/rail, tables, funnel, stage rail, timeline
  components/
    Shell.jsx                   ink rail + mobile bar/drawer (replaces Navigation)
    PageHeader.jsx              kicker + serif title header
    ui.jsx                      SectionLabel, StatusTag, OwnerTag, ChannelTag, Surface,
                                EmptyState, ErrorBanner, formatters
    leads/
      actions.js                workflow action catalog (mirrors lead_workflow.ACTIONS)
      FunnelStrip.jsx           proportional status funnel + overdue block
      LeadTable.jsx             dense grid, selection, hover row actions
      LeadDetail.jsx            identity header, stage rail, composer, typed timeline,
                                details/tasks/files (replaces LeadDrawer)
      CreateLeadModal.jsx       sectioned create flow
  pages/
    LeadsPage.jsx               workspace orchestration, saved views, bulk bar
    DailyReportPage.jsx         pace cockpit
    SummaryPage.jsx             funnel movement + closings
    SettingsPage.jsx            targets, pools, legend
alist_crm/www/alist.html        font preloads + cache-busted asset links
```

Removed: `Navigation.jsx`, `KpiCard.jsx`, `LeadDrawer.jsx`, `LeadGrid.jsx`, `OwnerChip.jsx`,
`StatusActions.jsx`, `StatusChips.jsx` (all superseded above).
