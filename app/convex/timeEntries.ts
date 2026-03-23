import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
