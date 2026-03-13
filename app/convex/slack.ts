import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Get Slack config
export const getConfig = query({
	handler: async (ctx) => {
		const configs = await ctx.db.query("slack_config").collect();
		return configs[0] ?? null;
	},
});

// Save Slack config
export const saveConfig = mutation({
	args: {
		teamId: v.string(),
		teamName: v.string(),
		botToken: v.string(),
		reminderChannel: v.optional(v.string()),
		reminderDay: v.number(),
		reminderHour: v.number(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("slack_config")
			.withIndex("by_team", (q) => q.eq("teamId", args.teamId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { ...args, isActive: true });
			return existing._id;
		}

		return await ctx.db.insert("slack_config", {
			...args,
			isActive: true,
		});
	},
});

// Internal: get all active members with Slack IDs
export const getMembersWithSlack = internalQuery({
	handler: async (ctx) => {
		const members = await ctx.db.query("members").collect();
		return members.filter((m) => m.isActive && m.slackUserId);
	},
});

// Internal: get pending submissions for a week
export const getPendingForWeek = internalQuery({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const members = await ctx.db.query("members").collect();
		const activeMembers = members.filter((m) => m.isActive);

		const submissions = await ctx.db
			.query("weekly_submissions")
			.withIndex("by_week_status", (q) => q.eq("weekStart", args.weekStart))
			.collect();

		const submittedMemberIds = new Set(
			submissions
				.filter((s) => s.status !== "pending")
				.map((s) => s.memberId),
		);

		return activeMembers.filter((m) => !submittedMemberIds.has(m._id));
	},
});

// Send weekly reminders via Slack DM
export const sendReminders = action({
	args: { weekStart: v.string() },
	handler: async (ctx, args) => {
		const config = await ctx.runQuery(internal.slack.getSlackConfig);
		if (!config || !config.isActive) {
			return { sent: 0, error: "Slack not configured" };
		}

		const pendingMembers: Array<{ _id: any; name: string; email: string; slackUserId?: string; role: string; isActive: boolean; createdAt: number }> = await ctx.runQuery(internal.slack.getPendingForWeek, {
			weekStart: args.weekStart,
		});

		const slackMembers = pendingMembers.filter((m: any) => m.slackUserId);

		let sent = 0;
		for (const member of slackMembers) {
			try {
				// Open DM channel
				const openRes = await fetch("https://slack.com/api/conversations.open", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${config.botToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ users: member.slackUserId }),
				});

				const openData = await openRes.json();
				if (!openData.ok) continue;

				const channelId = openData.channel.id;

				// Send reminder message
				await fetch("https://slack.com/api/chat.postMessage", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${config.botToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						channel: channelId,
						text: `Hey ${member.name}! 👋 Time to log your hours for the week of ${args.weekStart}. Head over to Timekeeper to allocate your time across accounts.`,
						blocks: [
							{
								type: "section",
								text: {
									type: "mrkdwn",
									text: `Hey ${member.name}! 👋\n\nTime to log your hours for the week of *${args.weekStart}*.\n\nPlease allocate your time across the accounts you worked on this week.`,
								},
							},
							{
								type: "actions",
								elements: [
									{
										type: "button",
										text: { type: "plain_text", text: "Log My Hours" },
										style: "primary",
										url: `${process.env.APP_URL ?? "https://timekeeper.vercel.app"}/log?week=${args.weekStart}`,
									},
								],
							},
						],
					}),
				});

				sent++;
			} catch (err) {
				console.error(`Failed to send reminder to ${member.name}:`, err);
			}
		}

		// Also post to reminder channel if configured
		if (config.reminderChannel && pendingMembers.length > 0) {
			const names = pendingMembers.map((m: any) => m.name).join(", ");
			await fetch("https://slack.com/api/chat.postMessage", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${config.botToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					channel: config.reminderChannel,
					text: `⏰ Weekly time tracking reminder! Still waiting on: ${names}`,
				}),
			});
		}

		return { sent, total: slackMembers.length };
	},
});

// Internal query for config (used by actions)
export const getSlackConfig = internalQuery({
	handler: async (ctx) => {
		const configs = await ctx.db.query("slack_config").collect();
		return configs[0] ?? null;
	},
});
