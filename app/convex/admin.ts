import { v } from "convex/values";
import { action, mutation, query, internalAction, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { openDM, postMessage } from "./slack/api";
import { weeklyPromptBlocks, reminderBlocks } from "./slack/blocks";

// Helper: get the Monday of the current week
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().split("T")[0];
}

function getWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00Z");
  const end = new Date(d);
  end.setUTCDate(d.getUTCDate() + 6);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(d)} – ${fmt(end)}`;
}

// === Send weekly prompt to all active participants ===
export const sendWeeklyPrompt = internalAction({
  args: {},
  handler: async (ctx) => {
    const weekStart = getCurrentWeekStart();
    const weekLabel = getWeekLabel(weekStart);
    const participants = await ctx.runQuery(api.participants.listActive);

    for (const p of participants) {
      try {
        const channel = await openDM(p.slackUserId);
        await postMessage(
          channel,
          `Weekly Time Entry for ${weekLabel}`,
          weeklyPromptBlocks(weekLabel),
        );
      } catch (err) {
        console.error(`Failed to send prompt to ${p.name} (${p.slackUserId}):`, err);
      }
    }
  },
});

// === Send reminders to non-submitters ===
export const sendReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const weekStart = getCurrentWeekStart();
    const weekLabel = getWeekLabel(weekStart);
    const nonSubmitted = await ctx.runQuery(api.participants.listNonSubmitted, { weekStart });

    for (const p of nonSubmitted) {
      try {
        // Check if they have any entries
        const entries = await ctx.runQuery(api.timeEntries.listByUserWeek, {
          userId: p.slackUserId,
          weekStart,
        });
        const channel = await openDM(p.slackUserId);
        await postMessage(
          channel,
          `Reminder: Submit your time for ${weekLabel}`,
          reminderBlocks(weekLabel, entries.length),
        );
      } catch (err) {
        console.error(`Failed to send reminder to ${p.name} (${p.slackUserId}):`, err);
      }
    }
  },
});

// === Auto-lock the previous week ===
export const autoLockWeek = internalAction({
  args: {},
  handler: async (ctx) => {
    // Lock LAST week (not current)
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() + diff);
    const lastMonday = new Date(thisMonday);
    lastMonday.setUTCDate(thisMonday.getUTCDate() - 7);
    const weekStart = lastMonday.toISOString().split("T")[0];

    await ctx.runMutation(api.weeklySubmissions.lockWeek, { weekStart });
    console.log(`Locked week: ${weekStart}`);
  },
});

// === Manual reminder (admin action) ===
export const sendManualReminder = action({
  args: { weekStart: v.string() },
  returns: v.object({ sent: v.number(), total: v.number() }),
  handler: async (ctx, args): Promise<{ sent: number; total: number }> => {
    const weekLabel = getWeekLabel(args.weekStart);
    const nonSubmitted: Array<{ slackUserId: string; name: string }> =
      await ctx.runQuery(api.participants.listNonSubmitted, {
        weekStart: args.weekStart,
      });

    let sent = 0;
    for (const p of nonSubmitted) {
      try {
        const entries: Array<{ hours: number }> = await ctx.runQuery(
          api.timeEntries.listByUserWeek,
          {
            userId: p.slackUserId,
            weekStart: args.weekStart,
          },
        );
        const channel = await openDM(p.slackUserId);
        await postMessage(
          channel,
          `📢 Admin Reminder: Submit your time for ${weekLabel}`,
          reminderBlocks(weekLabel, entries.length),
        );
        sent++;
      } catch (err) {
        console.error(`Failed to send manual reminder to ${p.name}:`, err);
      }
    }
    return { sent, total: nonSubmitted.length };
  },
});

// === Slack config management ===
export const getSlackConfig = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("slack_config").collect();
    return configs[0] || null;
  },
});

export const upsertSlackConfig = mutation({
  args: {
    botToken: v.optional(v.string()),
    teamId: v.optional(v.string()),
    reminderDay: v.optional(v.number()),
    reminderHour: v.optional(v.number()),
    cutoffDay: v.optional(v.number()),
    cutoffHour: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("slack_config").first();

    if (existing) {
      const updates: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(args)) {
        if (val !== undefined) updates[k] = val;
      }
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("slack_config", {
      botToken: args.botToken || "",
      teamId: args.teamId || "",
      reminderDay: args.reminderDay ?? 5, // Friday
      reminderHour: args.reminderHour ?? 15, // 3pm UTC
      cutoffDay: args.cutoffDay ?? 1, // Monday
      cutoffHour: args.cutoffHour ?? 15, // 3pm UTC (10am CT)
      isActive: args.isActive ?? true,
    });
  },
});
