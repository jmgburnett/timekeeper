import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// Team members
	members: defineTable({
		name: v.string(),
		email: v.string(),
		slackUserId: v.optional(v.string()),
		role: v.union(v.literal("admin"), v.literal("member")),
		isActive: v.boolean(),
		createdAt: v.number(),
	}).index("by_email", ["email"])
		.index("by_slack_user", ["slackUserId"]),

	// Accounts / clients that time is tracked against
	accounts: defineTable({
		name: v.string(),
		code: v.optional(v.string()), // short code like "GLO" or "CT"
		color: v.optional(v.string()), // hex color for UI
		isActive: v.boolean(),
		createdAt: v.number(),
	}).index("by_name", ["name"]),

	// Weekly time entries
	time_entries: defineTable({
		memberId: v.id("members"),
		accountId: v.id("accounts"),
		weekStart: v.string(), // ISO date of Monday, e.g. "2026-03-09"
		hours: v.number(),
		notes: v.optional(v.string()),
		submittedAt: v.optional(v.number()),
		updatedAt: v.number(),
	}).index("by_member_week", ["memberId", "weekStart"])
		.index("by_account_week", ["accountId", "weekStart"])
		.index("by_week", ["weekStart"]),

	// Weekly submission status
	weekly_submissions: defineTable({
		memberId: v.id("members"),
		weekStart: v.string(),
		status: v.union(
			v.literal("pending"),    // not yet submitted
			v.literal("submitted"),  // submitted by member
			v.literal("approved"),   // approved by admin
		),
		totalHours: v.number(),
		submittedAt: v.optional(v.number()),
		approvedAt: v.optional(v.number()),
		approvedBy: v.optional(v.id("members")),
	}).index("by_member_week", ["memberId", "weekStart"])
		.index("by_week_status", ["weekStart", "status"]),

	// Slack connection config
	slack_config: defineTable({
		teamId: v.string(),
		teamName: v.string(),
		botToken: v.string(),
		reminderChannel: v.optional(v.string()), // channel to post reminders
		reminderDay: v.number(), // day of week (1=Mon, 5=Fri)
		reminderHour: v.number(), // hour in UTC
		isActive: v.boolean(),
	}).index("by_team", ["teamId"]),
});
