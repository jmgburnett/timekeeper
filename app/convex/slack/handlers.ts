// Slack event/interaction/command handlers for Timekeeper
import { httpAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import {
  postMessage,
  openView,
  openDM,
} from "./api";
import {
  weeklyPromptBlocks,
  addEntryModal,
  viewEntriesBlocks,
  submissionConfirmBlocks,
} from "./blocks";

// Helper: get the Monday of the current week (ISO date string)
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().split("T")[0];
}

function getWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00Z");
  const end = new Date(d);
  end.setUTCDate(d.getUTCDate() + 6);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(d)} – ${fmt(end)}`;
}

// Verify Slack request signature
async function verifySlackSignature(
  request: Request,
  body: string,
): Promise<boolean> {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) {
    console.warn("SLACK_SIGNING_SECRET not set — skipping verification");
    return true; // Allow in dev
  }

  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");
  if (!timestamp || !signature) return false;

  // Reject if timestamp is older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(sigBasestring));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const computed = `v0=${hex}`;

  return computed === signature;
}

// === EVENT HANDLER ===
export const eventsHandler = httpAction(async (ctx, request) => {
  const body = await request.text();
  const valid = await verifySlackSignature(request, body);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  // URL verification challenge
  if (payload.type === "url_verification") {
    return new Response(JSON.stringify({ challenge: payload.challenge }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle events asynchronously — return 200 immediately
  if (payload.type === "event_callback") {
    const event = payload.event;

    // Handle DMs (app_mention or message in IM)
    if (event.type === "message" && event.channel_type === "im" && !event.bot_id) {
      const weekStart = getCurrentWeekStart();
      const weekLabel = getWeekLabel(weekStart);
      const channel = event.channel;

      // Send the weekly prompt as a response
      await postMessage(channel, `Weekly Time Entry for ${weekLabel}`, weeklyPromptBlocks(weekLabel));
    }
  }

  return new Response("ok", { status: 200 });
});

// === INTERACTION HANDLER ===
export const interactionsHandler = httpAction(async (ctx, request) => {
  const body = await request.text();
  const valid = await verifySlackSignature(request, body);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const params = new URLSearchParams(body);
  const payload = JSON.parse(params.get("payload") || "{}");
  const type = payload.type;

  if (type === "block_actions") {
    await handleBlockAction(ctx, payload);
  } else if (type === "view_submission") {
    return await handleViewSubmission(ctx, payload);
  }

  return new Response("", { status: 200 });
});

async function handleBlockAction(
  ctx: { runQuery: any; runMutation: any },
  payload: {
    trigger_id: string;
    user: { id: string };
    actions: Array<{ action_id: string; selected_option?: { value: string } }>;
  },
) {
  const action = payload.actions[0];
  const userId = payload.user.id;
  const weekStart = getCurrentWeekStart();
  const weekLabel = getWeekLabel(weekStart);

  if (action.action_id === "add_entry") {
    // Check if week is locked
    const submission = await ctx.runQuery(api.weeklySubmissions.getStatus, { userId, weekStart });
    if (submission?.status === "locked") {
      const dmChannel = await openDM(userId);
      await postMessage(dmChannel, "🔒 This week is locked. You can no longer add entries.");
      return;
    }

    // Fetch dropdown options
    const customers = await ctx.runQuery(api.customers.listActive);
    const capabilities = await ctx.runQuery(api.capabilities.listActive);

    const customerOpts = customers.map((c: { name: string; _id: string }) => ({
      text: c.name,
      value: c.name,
    }));
    const capOpts = capabilities.map((c: { name: string; _id: string }) => ({
      text: c.name,
      value: c.name,
    }));

    if (customerOpts.length === 0 || capOpts.length === 0) {
      const dmChannel = await openDM(userId);
      await postMessage(
        dmChannel,
        "⚠️ No customers or capabilities configured yet. Ask your admin to set them up first.",
      );
      return;
    }

    const modal = addEntryModal(customerOpts, capOpts, weekStart);
    await openView(payload.trigger_id, modal);
  } else if (action.action_id === "view_entries") {
    const entries = await ctx.runQuery(api.timeEntries.listByUserWeek, { userId, weekStart });
    const submission = await ctx.runQuery(api.weeklySubmissions.getStatus, { userId, weekStart });
    const isLocked = submission?.status === "locked";
    const blocks = viewEntriesBlocks(
      entries.map((e: { _id: { toString: () => string }; customer: string; capability: string; hours: number; capitalizable: boolean; comments?: string }) => ({
        ...e,
        _id: e._id.toString(),
      })),
      weekLabel,
      isLocked,
    );
    const dmChannel = await openDM(userId);
    await postMessage(dmChannel, `Entries for ${weekLabel}`, blocks);
  } else if (action.action_id === "submit_week") {
    const entries = await ctx.runQuery(api.timeEntries.listByUserWeek, { userId, weekStart });
    if (entries.length === 0) {
      const dmChannel = await openDM(userId);
      await postMessage(dmChannel, "⚠️ You have no entries to submit. Add some first!");
      return;
    }
    await ctx.runMutation(api.weeklySubmissions.submitWeek, { userId, weekStart });
    const totalHours = entries.reduce((sum: number, e: { hours: number }) => sum + e.hours, 0);
    const dmChannel = await openDM(userId);
    await postMessage(
      dmChannel,
      `Week submitted! ${totalHours}h across ${entries.length} entries.`,
      submissionConfirmBlocks(totalHours, entries.length, weekLabel),
    );
  } else if (action.action_id.startsWith("entry_overflow_")) {
    // Handle overflow menu (delete)
    const selectedValue = action.selected_option?.value;
    if (selectedValue?.startsWith("delete_")) {
      const entryId = selectedValue.replace("delete_", "");
      await ctx.runMutation(api.timeEntries.remove, { id: entryId as any });
      const dmChannel = await openDM(userId);
      await postMessage(dmChannel, "🗑️ Entry deleted.");
    }
  }
}

async function handleViewSubmission(
  ctx: { runMutation: any },
  payload: {
    view: {
      callback_id: string;
      private_metadata: string;
      state: {
        values: Record<string, Record<string, { value?: string; selected_option?: { value: string } }>>;
      };
    };
    user: { id: string };
  },
) {
  if (payload.view.callback_id === "add_entry_modal") {
    const values = payload.view.state.values;
    const metadata = JSON.parse(payload.view.private_metadata);
    const userId = payload.user.id;

    const customer = values.customer_block.customer.selected_option?.value || "";
    const capability = values.capability_block.capability.selected_option?.value || "";
    const hours = parseFloat(values.hours_block.hours.value || "0");
    const capitalizable = values.capitalizable_block.capitalizable.selected_option?.value === "true";
    const comments = values.comments_block.comments.value || undefined;

    await ctx.runMutation(api.timeEntries.create, {
      weekStart: metadata.weekStart,
      userId,
      customer,
      capability,
      hours,
      capitalizable,
      comments,
    });

    // Send confirmation DM
    const dmChannel = await openDM(userId);
    await postMessage(
      dmChannel,
      `✅ Entry saved: *${customer}* → ${capability} (${hours}h${capitalizable ? ", capitalizable" : ""})`,
    );

    // Return empty response to close the modal
    return new Response("", { status: 200 });
  }

  return new Response("", { status: 200 });
}

// === COMMAND HANDLER ===
export const commandsHandler = httpAction(async (ctx, request) => {
  const body = await request.text();
  const valid = await verifySlackSignature(request, body);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const params = new URLSearchParams(body);
  const userId = params.get("user_id") || "";
  const weekStart = getCurrentWeekStart();
  const weekLabel = getWeekLabel(weekStart);

  // /timekeeper command — show the weekly prompt
  const blocks = weeklyPromptBlocks(weekLabel);

  return new Response(
    JSON.stringify({
      response_type: "ephemeral",
      text: `Weekly Time Entry for ${weekLabel}`,
      blocks,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
