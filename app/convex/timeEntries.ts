import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper: check if a week is locked for a user
async function isWeekLocked(
  ctx: { db: any },
  userId: string,
  weekStart: string,
): Promise<boolean> {
  const submission = await ctx.db
    .query("weekly_submissions")
    .withIndex("by_user_week", (q: any) =>
      q.eq("userId", userId).eq("weekStart", weekStart),
    )
    .first();
  return submission?.status === "locked";
}

export const create = mutation({
  args: {
    weekStart: v.string(),
    userId: v.string(),
    customer: v.string(),
    capability: v.string(),
    hours: v.number(),
    capitalizable: v.boolean(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (await isWeekLocked(ctx, args.userId, args.weekStart)) {
      throw new Error("This week is locked. No changes allowed.");
    }
    const now = Date.now();
    return await ctx.db.insert("time_entries", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("time_entries"),
    customer: v.optional(v.string()),
    capability: v.optional(v.string()),
    hours: v.optional(v.number()),
    capitalizable: v.optional(v.boolean()),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Entry not found");
    if (await isWeekLocked(ctx, entry.userId, entry.weekStart)) {
      throw new Error("This week is locked. No changes allowed.");
    }
    const { id, ...updates } = args;
    const filtered: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[k] = val;
    }
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("time_entries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Entry not found");
    if (await isWeekLocked(ctx, entry.userId, entry.weekStart)) {
      throw new Error("This week is locked. No changes allowed.");
    }
    await ctx.db.delete(args.id);
  },
});

export const listByUserWeek = query({
  args: { userId: v.string(), weekStart: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("time_entries")
      .withIndex("by_user_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", args.weekStart),
      )
      .collect();
  },
});

export const listByWeek = query({
  args: { weekStart: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("time_entries")
      .withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
      .collect();
  },
});
