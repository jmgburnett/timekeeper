import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query("capabilities").collect();
	},
});

export const listActive = query({
	handler: async (ctx) => {
		const all = await ctx.db.query("capabilities").collect();
		return all.filter((c) => c.isActive);
	},
});

export const create = mutation({
	args: { name: v.string(), isActive: v.optional(v.boolean()) },
	handler: async (ctx, args) => {
		return await ctx.db.insert("capabilities", {
			name: args.name,
			isActive: args.isActive ?? true,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("capabilities"),
		name: v.optional(v.string()),
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
