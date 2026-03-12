import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	handler: async (ctx) => {
		return await ctx.db
			.query("accounts")
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		code: v.optional(v.string()),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("accounts", {
			...args,
			isActive: true,
			createdAt: Date.now(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("accounts"),
		name: v.optional(v.string()),
		code: v.optional(v.string()),
		color: v.optional(v.string()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined),
		);
		await ctx.db.patch(id, filtered);
	},
});
