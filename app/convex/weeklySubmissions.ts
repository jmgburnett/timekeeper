import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getStatus = query({
	args: { userId: v.string(), weekStart: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("weekly_submissions")
			.withIndex("by_user_week", (q) =>
				q.eq("userId", args.userId).eq("weekStart", args.weekStart),
			)
			.first();
	},
});

export const listByWeek = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("weekly_submissions")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();
	},
});

export const submitWeek = mutation({
	args: { userId: v.string(), weekStart: v.string() },
	handler: async (ctx, args) => {
		// Calculate total hours
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_user_week", (q) =>
				q.eq("userId", args.userId).eq("weekStart", args.weekStart),
			)
			.collect();
		const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

		// Check if submission already exists
		const existing = await ctx.db
			.query("weekly_submissions")
			.withIndex("by_user_week", (q) =>
				q.eq("userId", args.userId).eq("weekStart", args.weekStart),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				status: "submitted",
				submittedAt: Date.now(),
				totalHours,
			});
			return existing._id;
		}

		return await ctx.db.insert("weekly_submissions", {
			userId: args.userId,
			weekStart: args.weekStart,
			status: "submitted",
			submittedAt: Date.now(),
			totalHours,
		});
	},
});

export const lockWeek = mutation({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const submissions = await ctx.db
			.query("weekly_submissions")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		for (const sub of submissions) {
			await ctx.db.patch(sub._id, { status: "locked" });
		}
	},
});
