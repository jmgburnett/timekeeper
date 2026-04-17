import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get the current authenticated user's participant record
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const email = identity.email;
    if (!email) return null;

    // Find participant by email
    const participants = await ctx.db
      .query("participants")
      .collect();
    
    const participant = participants.find(
      (p) => p.email?.toLowerCase() === email.toLowerCase()
    );

    if (!participant) {
      return { notLinked: true, email } as const;
    }

    return {
      notLinked: false,
      participantId: participant._id,
      slackUserId: participant.slackUserId,
      name: participant.name,
      email: participant.email,
      isAdmin: participant.isAdmin,
      isActive: participant.isActive,
    } as const;
  },
});
