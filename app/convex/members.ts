import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	handler: async (ctx) => {
		return await ctx.db
			.query("members")
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();
	},
});

export const getByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("members")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		slackUserId: v.optional(v.string()),
		role: v.union(v.literal("admin"), v.literal("member")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("members", {
			...args,
			isActive: true,
			createdAt: Date.now(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("members"),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		slackUserId: v.optional(v.string()),
		role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
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
