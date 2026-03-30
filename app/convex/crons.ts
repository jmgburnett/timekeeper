import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Weekly prompt: Friday at 3pm UTC (10am CT)
crons.weekly(
  "send weekly prompt",
  { dayOfWeek: "friday", hourUTC: 15, minuteUTC: 0 },
  internal.admin.sendWeeklyPrompt,
);

// Reminder 1: Friday at 9pm UTC (4pm CT)
crons.weekly(
  "reminder friday evening",
  { dayOfWeek: "friday", hourUTC: 21, minuteUTC: 0 },
  internal.admin.sendReminders,
);

// Reminder 2: Sunday at 9pm UTC (4pm CT)
crons.weekly(
  "reminder sunday evening",
  { dayOfWeek: "sunday", hourUTC: 21, minuteUTC: 0 },
  internal.admin.sendReminders,
);

// Reminder 3: Monday at 2pm UTC (9am CT)
crons.weekly(
  "reminder monday morning",
  { dayOfWeek: "monday", hourUTC: 14, minuteUTC: 0 },
  internal.admin.sendReminders,
);

// Auto-lock: Monday at 3pm UTC (10am CT)
crons.weekly(
  "auto lock week",
  { dayOfWeek: "monday", hourUTC: 15, minuteUTC: 0 },
  internal.admin.autoLockWeek,
);

export default crons;
