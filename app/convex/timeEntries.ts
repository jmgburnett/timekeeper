import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all entries for a member for a given week
export const getWeek = query({
	args: {
		memberId: v.id("members"),
		weekStart: v.string(),
	},
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_member_week", (q) =>
				q.eq("memberId", args.memberId).eq("weekStart", args.weekStart),
			)
			.collect();

		return entries;
	},
});

// Get all entries for a week (admin view)
export const getWeekAll = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		// Enrich with member and account names
		const enriched = await Promise.all(
			entries.map(async (entry) => {
				const member = await ctx.db.get(entry.memberId);
				const account = await ctx.db.get(entry.accountId);
				return {
					...entry,
					memberName: member?.name ?? "Unknown",
					accountName: account?.name ?? "Unknown",
					accountCode: account?.code,
					accountColor: account?.color,
				};
			}),
		);

		return enriched;
	},
});

// Get summary by account for a week
export const getWeekSummary = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		// Group by account
		const byAccount = new Map<string, { accountId: string; hours: number; members: Set<string> }>();

		for (const entry of entries) {
			const key = entry.accountId;
			const existing = byAccount.get(key);
			if (existing) {
				existing.hours += entry.hours;
				existing.members.add(entry.memberId);
			} else {
				byAccount.set(key, {
					accountId: entry.accountId,
					hours: entry.hours,
					members: new Set([entry.memberId]),
				});
			}
		}

		// Enrich with account names
		const summary = await Promise.all(
			Array.from(byAccount.values()).map(async (item) => {
				const account = await ctx.db.get(item.accountId as any);
				return {
					accountId: item.accountId,
					accountName: account?.name ?? "Unknown",
					accountCode: (account as any)?.code,
					accountColor: (account as any)?.color,
					totalHours: item.hours,
					memberCount: item.members.size,
				};
			}),
		);

		return summary.sort((a, b) => b.totalHours - a.totalHours);
	},
});

// Upsert a time entry (create or update)
export const upsert = mutation({
	args: {
		memberId: v.id("members"),
		accountId: v.id("accounts"),
		weekStart: v.string(),
		hours: v.number(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Check if entry already exists
		const existing = await ctx.db
			.query("time_entries")
			.withIndex("by_member_week", (q) =>
				q.eq("memberId", args.memberId).eq("weekStart", args.weekStart),
			)
			.collect();

		const match = existing.find((e) => e.accountId === args.accountId);

		if (match) {
			await ctx.db.patch(match._id, {
				hours: args.hours,
				notes: args.notes,
				updatedAt: Date.now(),
			});
			return match._id;
		}

		return await ctx.db.insert("time_entries", {
			memberId: args.memberId,
			accountId: args.accountId,
			weekStart: args.weekStart,
			hours: args.hours,
			notes: args.notes,
			updatedAt: Date.now(),
		});
	},
});

// Delete a time entry
export const remove = mutation({
	args: { id: v.id("time_entries") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

// Submit a week
export const submitWeek = mutation({
	args: {
		memberId: v.id("members"),
		weekStart: v.string(),
	},
	handler: async (ctx, args) => {
		// Calculate total hours
		const entries = await ctx.db
			.query("time_entries")
			.withIndex("by_member_week", (q) =>
				q.eq("memberId", args.memberId).eq("weekStart", args.weekStart),
			)
			.collect();

		const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

		// Check for existing submission
		const existing = await ctx.db
			.query("weekly_submissions")
			.withIndex("by_member_week", (q) =>
				q.eq("memberId", args.memberId).eq("weekStart", args.weekStart),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				status: "submitted",
				totalHours,
				submittedAt: Date.now(),
			});
			return existing._id;
		}

		return await ctx.db.insert("weekly_submissions", {
			memberId: args.memberId,
			weekStart: args.weekStart,
			status: "submitted",
			totalHours,
			submittedAt: Date.now(),
		});
	},
});

// Get submission status for a week
export const getSubmissionStatus = query({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const submissions = await ctx.db
			.query("weekly_submissions")
			.withIndex("by_week_status", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		const members = await ctx.db.query("members").collect();
		const activeMembers = members.filter((m) => m.isActive);

		return {
			submissions: await Promise.all(
				submissions.map(async (s) => {
					const member = await ctx.db.get(s.memberId);
					return { ...s, memberName: member?.name ?? "Unknown" };
				}),
			),
			totalMembers: activeMembers.length,
			submittedCount: submissions.filter((s) => s.status !== "pending").length,
		};
	},
});
