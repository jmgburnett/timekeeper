import { v } from "convex/values";
import { query } from "./_generated/server";

export const hoursByCustomer = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		const map: Record<string, { total: number; capitalizable: number }> = {};
		for (const e of entries) {
			if (!map[e.customer]) map[e.customer] = { total: 0, capitalizable: 0 };
			map[e.customer].total += e.hours;
			if (e.capitalizable) map[e.customer].capitalizable += e.hours;
		}
		return Object.entries(map)
			.map(([customer, data]) => ({ customer, ...data }))
			.sort((a, b) => b.total - a.total);
	},
});

export const hoursByCapability = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		const map: Record<string, { total: number; capitalizable: number }> = {};
		for (const e of entries) {
			if (!map[e.capability])
				map[e.capability] = { total: 0, capitalizable: 0 };
			map[e.capability].total += e.hours;
			if (e.capitalizable) map[e.capability].capitalizable += e.hours;
		}
		return Object.entries(map)
			.map(([capability, data]) => ({ capability, ...data }))
			.sort((a, b) => b.total - a.total);
	},
});

export const hoursByEmployee = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		// Get participant names
		const participants = await ctx.db.query("participants").collect();
		const nameMap: Record<string, string> = {};
		for (const p of participants) {
			nameMap[p.slackUserId] = p.name;
		}

		const map: Record<string, number> = {};
		for (const e of entries) {
			const name = nameMap[e.userId] || e.userId;
			map[name] = (map[name] || 0) + e.hours;
		}
		return Object.entries(map)
			.map(([employee, totalHours]) => ({ employee, totalHours }))
			.sort((a, b) => b.totalHours - a.totalHours);
	},
});

export const capitalizableSummary = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		let capitalizable = 0;
		let nonCapitalizable = 0;
		for (const e of entries) {
			if (e.capitalizable) capitalizable += e.hours;
			else nonCapitalizable += e.hours;
		}
		return { capitalizable, nonCapitalizable, total: capitalizable + nonCapitalizable };
	},
});

export const detailReport = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		const participants = await ctx.db.query("participants").collect();
		const nameMap: Record<string, string> = {};
		for (const p of participants) {
			nameMap[p.slackUserId] = p.name;
		}

		return entries.map((e) => ({
			...e,
			employeeName: nameMap[e.userId] || e.userId,
		}));
	},
});
