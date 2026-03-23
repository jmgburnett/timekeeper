# Timekeeper — Lightweight Timekeeping System (Professional Services)

**Version:** 2.0
**Author:** Josh Burnett
**Date:** March 23, 2026
**Stack:** Next.js 15 + Convex + Tailwind CSS + Vercel + Slack Bot

---

## Objective

Provide a simple weekly time allocation system that allows team members to report hours worked by Customer and Capability through a Slack prompt, capturing minimal metadata and producing a weekly rollup report for leadership and finance.

The system must prioritize speed, simplicity, and minimal overhead.
**Target completion time per employee: under 2 minutes per week.**

---

## Core Data Captured (Per Entry)

Each submission line must contain:

| Field | Required | Description |
|-------|----------|-------------|
| Customer | Yes | The organization or internal initiative benefiting from the work |
| Capability | Yes | The internal capability or function delivered |
| Hours | Yes | Number of hours spent on this work |
| Capitalizable | Yes | Yes / No indicator for capitalization accounting |
| Comments | Optional | Brief context about the work performed |

A user may submit multiple entries per week.

### Example:

| Customer | Capability | Hours | Capitalizable | Comments |
|----------|-----------|-------|---------------|----------|
| Church of the Highlands | Data Integration | 12 | Yes | Salesforce pipeline integration |
| Compassion Intl | Platform Architecture | 8 | No | Advisory session |
| Internal | Platform Roadmap | 10 | No | Strategy planning |

---

## Workflow

### 1. Weekly Slack Prompt

Every Friday afternoon (configurable), each participating employee receives a Slack DM prompt.

Example prompt:
```
Weekly Time Entry
Please submit your hours for this week. You may add multiple entries.

Buttons:
[Add Entry] [Submit Week] [View/Edit Entries]
```

### 2. Slack Entry Form

Fields:
- **Customer** — dropdown or typeahead
- **Capability** — dropdown or typeahead
- **Hours** — numeric
- **Capitalizable** — Yes / No toggle
- **Comments** — optional text

Buttons:
- Save Entry
- Add Another
- Submit Week

### 3. Editing

Users can:
- Add multiple entries
- Edit entries
- Delete entries

...until weekly cutoff (e.g., Monday 10am).
After cutoff the week locks.

---

## Reporting Requirements

Every week the system generates a summary report.

### Detail Report

Columns:
- Week Ending
- Employee
- Customer
- Capability
- Hours
- Capitalizable
- Comments
- Submitted Timestamp

### Rollup Metrics

**Hours by Customer:**

| Customer | Total Hours | Capitalizable Hours |
|----------|-------------|-------------------|

**Hours by Capability:**

| Capability | Total Hours | Capitalizable Hours |
|------------|-------------|-------------------|

**Hours by Employee:**

| Employee | Total Hours |
|----------|-------------|

**Capitalizable Summary:**

| Type | Hours |
|------|-------|
| Capitalizable | X |
| Non-Capitalizable | X |

---

## Administration

Admins must be able to manage:

- **Participants** — Slack users required to submit
- **Prompt Schedule** — Day/time of prompt, reminder schedule
- **Controlled Lists** (optional but recommended):
  - Customer list
  - Capability list
  - These lists can be:
    - Option A — Controlled dropdown
    - Option B — Free text with suggestions

---

## Reminder Logic

If a user has not submitted by deadline:

Automatic reminders sent:
1. Friday evening
2. Sunday evening
3. Monday morning

Admin can also trigger manual reminder to non-responders.

---

## Data Storage Model (Minimal)

### Table: time_entries

| Column | Description |
|--------|-------------|
| id | unique id |
| week_start | week identifier |
| user_id | Slack user id |
| customer | text |
| capability | text |
| hours | decimal |
| capitalizable | boolean |
| comments | text |
| created_at | timestamp |
| updated_at | timestamp |

---

## Security / Permissions

- **Employees:** submit and edit their own entries
- **Admins:** view all entries, export reports, manage lists, resend prompts

---

## Exports

Admins must be able to export:
- CSV
- Google Sheet (optional)
- API endpoint (optional future)

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Time to submit | < 2 minutes |
| Slack interaction latency | < 2 seconds |
| Report generation | < 30 seconds |
| Weekly uptime | 99% |

---

## MVP Scope

**Included:**
- Slack prompt
- Multiple entries
- Hours capture (Customer + Capability + Capitalizable)
- Weekly rollup
- CSV export
- Reminders

**Not included (future):**
- Approvals
- Billing
- PTO tracking
- Utilization analytics
- Project/task tracking
- CRM integration

---

## Example Slack Interaction

DM:
```
Submit your weekly time
Add entries for each customer or initiative you worked on.

Buttons:
[Add Entry] [View Entries] [Submit Week]
```

---

## Why This Structure Works

This approach keeps the system:
- Extremely lightweight
- Slack-native
- Minimal fields
- Flexible for finance
- Fast for employees

Yet still allows leadership to answer:
- Where are hours going?
- Which customers consume effort?
- What work is capitalizable?

---

## Architecture

**Slack bot → Convex database → Next.js admin/reporting UI**

- Slack Bot: handles prompts, modals, reminders
- Convex: stores entries, manages lists, runs cron jobs for reminders
- Next.js: admin dashboard for reports, exports, list management
- Vercel: hosting

**Live:** https://app-seven-sigma-13.vercel.app
**Convex:** marvelous-cuttlefish-492
**GitHub:** github.com/jmgburnett/timekeeper
