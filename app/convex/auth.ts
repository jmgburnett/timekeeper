import { convexAuth } from "@convex-dev/auth/server";
import Slack from "@auth/core/providers/slack";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Slack({
      clientId: process.env.AUTH_SLACK_ID,
      clientSecret: process.env.AUTH_SLACK_SECRET,
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId, profile }) {
      if (existingUserId) return; // Only auto-create on first sign-up

      const email = profile.email;
      if (!email) return;

      // Check if participant already exists by email
      const participants = await ctx.db.query("participants").collect();
      const existing = participants.find(
        (p) => p.email?.toLowerCase() === email.toLowerCase()
      );
      if (existing) return;

      // Get Slack user ID from the auth account
      const accounts = await ctx.db
        .query("authAccounts")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("provider"), "slack")
          )
        )
        .collect();
      const slackUserId = (accounts[0] as any)?.providerAccountId ?? "UNKNOWN";

      // Get name from the user record
      const user = await ctx.db.get(userId);
      const name = user?.name ?? (email as string);

      // Auto-create participant
      await ctx.db.insert("participants", {
        slackUserId,
        name,
        email,
        isAdmin: false,
        isActive: true,
      });
    },
  },
});
