import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query("participants").collect();
	},
});

export const listActive = query({
	handler: async (ctx) => {
		const all = await ctx.db.query("participants").collect();
		return all.filter((p) => p.isActive);
	},
});

export const create = mutation({
	args: {
		slackUserId: v.string(),
		name: v.string(),
		email: v.optional(v.string()),
		isAdmin: v.optional(v.boolean()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("participants", {
			slackUserId: args.slackUserId,
			name: args.name,
			email: args.email,
			isAdmin: args.isAdmin ?? false,
			isActive: args.isActive ?? true,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("participants"),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		slackUserId: v.optional(v.string()),
		isAdmin: v.optional(v.boolean()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const filtered: Record<string, unknown> = {};
		for (const [k, val] of Object.entries(updates)) {
			if (val !== undefined) filtered[k] = val;
		}
		await ctx.db.patch(id, filtered);
	},
});

export const listNonSubmitted = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const activeParticipants = (
			await ctx.db.query("participants").collect()
		).filter((p) => p.isActive);

		const submissions = await ctx.db
			.query("weekly_submissions")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		const submittedUserIds = new Set(
			submissions
				.filter((s) => s.status === "submitted" || s.status === "locked")
				.map((s) => s.userId),
		);

		return activeParticipants.filter(
			(p) => !submittedUserIds.has(p.slackUserId),
		);
	},
});
