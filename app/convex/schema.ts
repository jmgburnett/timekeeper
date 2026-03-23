import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	time_entries: defineTable({
		weekStart: v.string(), // ISO date of Monday, e.g. "2026-03-17"
		userId: v.string(), // Slack user ID
		customer: v.string(),
		capability: v.string(),
		hours: v.number(),
		capitalizable: v.boolean(),
		comments: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_week", ["userId", "weekStart"])
		.index("by_week", ["weekStart"]),

	customers: defineTable({
		name: v.string(),
		isActive: v.boolean(),
	}).index("by_name", ["name"]),

	capabilities: defineTable({
		name: v.string(),
		isActive: v.boolean(),
	}).index("by_name", ["name"]),

	participants: defineTable({
		slackUserId: v.string(),
		name: v.string(),
		email: v.optional(v.string()),
		isAdmin: v.boolean(),
		isActive: v.boolean(),
	}).index("by_slack_id", ["slackUserId"]),

	weekly_submissions: defineTable({
		userId: v.string(), // Slack user ID
		weekStart: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("submitted"),
			v.literal("locked"),
		),
		submittedAt: v.optional(v.number()),
		totalHours: v.number(),
	})
		.index("by_user_week", ["userId", "weekStart"])
		.index("by_week", ["weekStart"]),

	slack_config: defineTable({
		botToken: v.string(),
		teamId: v.string(),
		reminderDay: v.number(), // 1=Mon ... 5=Fri
		reminderHour: v.number(), // UTC hour
		cutoffDay: v.number(), // day of week for lockout
		cutoffHour: v.number(), // UTC hour for lockout
		isActive: v.boolean(),
	}),
});
