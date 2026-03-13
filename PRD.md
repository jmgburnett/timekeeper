# Timekeeper — Product Requirements Document

**Version:** 1.0
**Author:** Josh Burnett / Flobot
**Date:** March 13, 2026
**Stack:** Next.js 15 + Convex + Tailwind CSS + Vercel

---

## Overview

Timekeeper is a team time-tracking tool that helps organizations understand how their team's time is allocated across accounts, projects, and clients each week. It integrates with Slack for frictionless time entry, Linear for automatic project-time capture, and Google Calendar for meeting-based time inference.

**Live:** https://app-seven-sigma-13.vercel.app
**Convex:** marvelous-cuttlefish-492
**GitHub:** github.com/jmgburnett/timekeeper

---

## What Exists Today (Phase 0 — Complete ✅)

### Schema
- `members` — team members with email, Slack ID, role (admin/member)
- `accounts` — trackable categories with name, code, color
- `time_entries` — weekly hour allocations (member × account × week)
- `weekly_submissions` — submission/approval workflow per member per week
- `slack_config` — Slack bot token, reminder schedule

### Backend (Convex)
- CRUD for members and accounts
- Weekly time entry upsert with member+week+account indexing
- Week summary aggregation by account
- Submission status tracking (pending → submitted → approved)
- Slack DM reminder action (sends to pending members)

### Frontend
- Single-page app with Log Time + Dashboard tabs
- Week navigator (prev/next arrows)
- Time entry rows per account with inline number inputs
- Submit Week button
- Dashboard: submission progress bar, hours-by-account breakdown
- Member selector dropdown

### What's Missing
- No navigation / multi-page layout
- No settings/admin pages
- No authentication
- No integrations (Linear, Google Calendar)
- No Slack interactive time entry (only outbound reminders)
- No charts or visual analytics
- No daily time entry (weekly only)

---

## Phase 1 — Navigation & Core UX

### 1.1 App Shell & Navigation
Add a persistent sidebar/nav with routes:

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Team-wide overview and analytics |
| `/log` | Log Time | Weekly time entry (current page) |
| `/history` | History | Past weeks with filters |
| `/team` | Team | Member management (admin) |
| `/accounts` | Accounts | Account/category management (admin) |
| `/settings` | Settings | Integrations, Slack config, preferences |

**Navigation component:**
- Collapsible sidebar on desktop, bottom tabs on mobile
- Active route highlighting
- User avatar + name at top (from member record)
- Quick-access: current week's total hours badge

### 1.2 Authentication
- Use Convex auth or simple email-based login (no passwords — magic link or Slack OAuth)
- Members table already has `email` field — use as identity
- Admin role gates access to Team, Accounts, Settings pages
- For MVP: keep the member-selector dropdown but add a "Remember me" cookie

### 1.3 Manual Time Entry Improvements
- Support **daily granularity** in addition to weekly totals
  - New field: `date` (optional) on `time_entries` — if null, treat as weekly allocation
  - Day-by-day grid view (Mon–Fri columns) with per-account rows
  - Tab between cells for fast entry
- Add `notes` field UI (expandable per row)
- "Copy from last week" button
- Keyboard shortcuts: Enter to save, Tab to next field
- Timer mode: start/stop timer that logs to an account

---

## Phase 2 — Dashboard & Analytics

### 2.1 Team Dashboard (/)
The main landing page showing:

**This Week at a Glance:**
- Donut/pie chart: hours by account (color-coded)
- Bar chart: hours by team member
- Submission progress: who's submitted, who hasn't
- Total team hours vs target (e.g., 200h for 5 people)

**Trends (multi-week):**
- Stacked area chart: account allocation over last 8 weeks
- Line chart: individual member hours over time
- Table: account × week matrix with hours

**Filters:**
- Date range picker (week, month, quarter, custom)
- Filter by member, account, or tag
- Export to CSV

### 2.2 Schema Additions
```typescript
// Add to schema for richer analytics
tags: defineTable({
  name: v.string(),
  color: v.optional(v.string()),
}),

// Add tags to time_entries
// time_entries.tagIds: v.optional(v.array(v.id("tags")))

// Add daily entries table
daily_entries: defineTable({
  memberId: v.id("members"),
  accountId: v.id("accounts"),
  date: v.string(), // ISO date "2026-03-13"
  hours: v.number(),
  notes: v.optional(v.string()),
  source: v.union(
    v.literal("manual"),
    v.literal("calendar"),
    v.literal("linear"),
    v.literal("slack"),
    v.literal("timer")
  ),
  sourceRef: v.optional(v.string()), // external ID (calendar event, linear issue)
  updatedAt: v.number(),
}).index("by_member_date", ["memberId", "date"])
  .index("by_account_date", ["accountId", "date"])
  .index("by_date", ["date"])
```

### 2.3 Chart Library
Use **Recharts** (already React-friendly, works with Next.js):
- `PieChart` for account distribution
- `BarChart` for member comparison
- `AreaChart` for trends over time
- Responsive, animated, tooltip-enabled

---

## Phase 3 — Slack Integration (Interactive)

### 3.1 Current State
- Outbound DM reminders to pending members ✅
- No interactive time entry via Slack

### 3.2 Slack Bot Enhancements

**Slash Command: `/timekeeper`**
```
/timekeeper log           → Opens time entry modal
/timekeeper status        → Shows your week summary
/timekeeper team          → Shows team submission status (admin)
/timekeeper remind        → Triggers manual reminder (admin)
```

**Interactive Modal (`/timekeeper log`):**
- Slack Block Kit modal with:
  - Week selector (default: current week)
  - Account dropdowns with hour inputs (dynamic from Convex accounts)
  - Notes field
  - Submit button → writes to Convex `time_entries`

**Conversational Entry:**
- DM the bot: "8 hours on Gloo, 4 on Church.tech"
- AI parses natural language → maps to accounts → confirms → saves
- Uses Claude Haiku for parsing (consistent with Flow's approach)

**Weekly Summary DM:**
- After submission, bot sends confirmation with breakdown
- If hours < 40, gentle nudge: "Looks like you have unallocated hours"

### 3.3 Slack App Setup
- OAuth flow: workspace install → store bot token in `slack_config`
- Event subscriptions: `app_mention`, `message.im` (for conversational entry)
- Slash commands registered: `/timekeeper`
- Interactive components endpoint for modals
- Convex HTTP endpoint: `POST /slack/events`, `POST /slack/interactions`, `POST /slack/commands`

### 3.4 Slack Config UI (`/settings`)
- Connect Slack button (OAuth flow)
- Configure reminder schedule (day, time, channel)
- Test reminder button
- Connected workspace display with disconnect option

---

## Phase 4 — Google Calendar Integration

### 4.1 Purpose
Automatically suggest time entries based on calendar events. Meetings with identifiable accounts/projects pre-fill time entries.

### 4.2 Flow
1. **Connect Google Account** — OAuth flow (same pattern as Flow app, using `gog` or direct Google OAuth)
2. **Sync Calendar Events** — Cron job pulls events for the current week
3. **Match Events to Accounts** — Rule-based + AI matching:
   - Calendar name → account mapping (e.g., "Gloo" calendar → Gloo account)
   - Event title keyword matching (configurable rules)
   - Attendee domain matching (e.g., `@gloo.us` attendees → Gloo account)
   - AI fallback: Claude classifies ambiguous events
4. **Suggest Time Entries** — Show suggested entries in Log Time view
   - "Suggested from Calendar" section with accept/edit/dismiss
   - Green badge: high-confidence match, Yellow: needs review
5. **Ongoing Sync** — Weekly cron refreshes suggestions

### 4.3 Schema Additions
```typescript
calendar_connections: defineTable({
  memberId: v.id("members"),
  googleEmail: v.string(),
  accessToken: v.string(),
  refreshToken: v.string(),
  calendarIds: v.array(v.string()), // which calendars to sync
  isActive: v.boolean(),
  lastSyncAt: v.optional(v.number()),
}),

calendar_suggestions: defineTable({
  memberId: v.id("members"),
  weekStart: v.string(),
  date: v.string(),
  accountId: v.optional(v.id("accounts")), // null if unmatched
  eventTitle: v.string(),
  eventId: v.string(),
  durationHours: v.number(),
  confidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("dismissed")),
}).index("by_member_week", ["memberId", "weekStart"])

account_matching_rules: defineTable({
  accountId: v.id("accounts"),
  ruleType: v.union(
    v.literal("calendar_name"),
    v.literal("keyword"),
    v.literal("attendee_domain"),
    v.literal("linear_team")
  ),
  pattern: v.string(), // regex or exact match
  isActive: v.boolean(),
}),
```

### 4.4 Settings UI
- Connect Google Calendar button per member
- Calendar picker (which calendars to watch)
- Account matching rules editor (admin):
  - "When event contains `[keyword]`, suggest `[account]`"
  - "When attendees from `@domain.com`, suggest `[account]`"

---

## Phase 5 — Linear Integration

### 5.1 Purpose
Track time spent on Linear issues/projects and automatically attribute it to the right account.

### 5.2 Flow
1. **Connect Linear** — OAuth flow → store access token
2. **Map Linear Teams/Projects → Accounts** — Admin configures mapping
3. **Track Time on Issues:**
   - **Option A: Linear Time Tracking** — If Linear has native time tracking, pull data via API
   - **Option B: Timekeeper Timer** — Start a timer in Timekeeper linked to a Linear issue
   - **Option C: Status-based inference** — Track time between "In Progress" → "Done" status changes
4. **Weekly Summary** — Show Linear-sourced hours alongside manual entries
5. **Issue Picker** — In Log Time, search Linear issues to attach time to

### 5.3 Schema Additions
```typescript
linear_connections: defineTable({
  memberId: v.id("members"),
  linearUserId: v.string(),
  accessToken: v.string(),
  isActive: v.boolean(),
}),

linear_team_mappings: defineTable({
  linearTeamId: v.string(),
  linearTeamName: v.string(),
  accountId: v.id("accounts"),
}),

// Extend daily_entries with:
// linearIssueId: v.optional(v.string()),
// linearIssueTitle: v.optional(v.string()),
```

### 5.4 Webhook Integration
- Linear webhook → Convex HTTP endpoint
- Events: `Issue.update` (status changes), `Issue.create`
- Track state transitions for time inference
- Configurable: auto-log time or just suggest

---

## Phase 6 — Admin & Team Management

### 6.1 Team Page (`/team`)
- Add/edit/deactivate members
- Set member roles (admin/member)
- Link Slack IDs, Google accounts, Linear accounts
- View individual member's time history

### 6.2 Accounts Page (`/accounts`)
- Add/edit/deactivate accounts
- Set color, code, matching rules
- View account utilization trends
- Archive old accounts (hide from entry but keep data)

### 6.3 Approval Workflow
- Admin reviews submitted weeks
- Approve individual or bulk approve
- Reject with comment → sends Slack notification
- Lock approved weeks (no further edits)

---

## Technical Architecture

### API Routes (Convex)
```
convex/
  schema.ts              — All tables
  members.ts             — Member CRUD
  accounts.ts            — Account CRUD
  timeEntries.ts         — Manual time entry CRUD + queries
  dailyEntries.ts        — Daily granularity entries
  submissions.ts         — Weekly submission workflow
  dashboard.ts           — Analytics queries (aggregations, trends)
  slack.ts               — Slack bot logic, reminders, parsing
  slackHttp.ts           — HTTP endpoints for Slack events/interactions
  calendar.ts            — Google Calendar sync + suggestions
  linear.ts              — Linear integration + time inference
  matching.ts            — Account matching rules engine
  crons.ts               — Scheduled jobs (calendar sync, reminders)
```

### Frontend Routes (Next.js App Router)
```
app/
  (app)/
    layout.tsx           — App shell with sidebar nav
    page.tsx             — Dashboard (/)
    log/page.tsx         — Log Time
    history/page.tsx     — Past weeks
    team/page.tsx        — Team management (admin)
    accounts/page.tsx    — Account management (admin)
    settings/page.tsx    — Integrations + preferences
  api/
    slack/route.ts       — Slack webhook proxy (if needed)
    auth/[...]/route.ts  — Auth endpoints
```

### Key Dependencies (add to existing)
- `recharts` — Charts and analytics
- `date-fns` — Date manipulation (week calculations)
- `@slack/web-api` — Slack API client (optional, can use fetch)

### Environment Variables
```
NEXT_PUBLIC_CONVEX_URL    — Convex deployment URL ✅ (set)
SLACK_CLIENT_ID           — Slack app client ID
SLACK_CLIENT_SECRET       — Slack app client secret
SLACK_SIGNING_SECRET      — Slack request verification
GOOGLE_CLIENT_ID          — Google OAuth client ID
GOOGLE_CLIENT_SECRET      — Google OAuth client secret
LINEAR_CLIENT_ID          — Linear OAuth client ID
LINEAR_CLIENT_SECRET      — Linear OAuth client secret
ANTHROPIC_API_KEY         — For AI-powered matching/parsing
```

---

## Phasing & Priority

| Phase | Scope | Priority | Est. Effort |
|-------|-------|----------|-------------|
| 1 | Navigation, auth, manual entry improvements | 🔴 High | 1–2 days |
| 2 | Dashboard & analytics | 🔴 High | 1–2 days |
| 3 | Slack interactive entry | 🟡 Medium | 2–3 days |
| 4 | Google Calendar integration | 🟡 Medium | 2–3 days |
| 5 | Linear integration | 🟢 Low | 2–3 days |
| 6 | Admin & approval workflow | 🟡 Medium | 1–2 days |

**Recommended build order:** Phase 1 → Phase 2 → Phase 3 → Phase 6 → Phase 4 → Phase 5

---

## Design Principles

- **Mobile-first** — Most time entry happens on phones (especially via Slack)
- **Friction-free** — Slack conversational entry > opening a web app
- **Smart defaults** — Calendar + Linear data pre-fills entries; users just confirm
- **Visual** — Color-coded accounts, charts everywhere, at-a-glance dashboards
- **Weekly cadence** — The week is the primary unit; daily is optional detail
- **Consistent stack** — Convex for everything (no separate API server), Next.js App Router, Tailwind
