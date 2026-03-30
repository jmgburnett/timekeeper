// Lightweight Slack API wrapper using fetch (no heavy SDKs in Convex)

const SLACK_API = "https://slack.com/api";

async function slackFetch(method: string, body: Record<string, unknown>) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN not configured");

  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error(`Slack API error (${method}):`, data.error, data.response_metadata);
    throw new Error(`Slack API ${method} failed: ${data.error}`);
  }
  return data;
}

export async function postMessage(channel: string, text: string, blocks?: unknown[]) {
  return slackFetch("chat.postMessage", {
    channel,
    text,
    ...(blocks ? { blocks } : {}),
  });
}

export async function postEphemeral(channel: string, user: string, text: string, blocks?: unknown[]) {
  return slackFetch("chat.postEphemeral", {
    channel,
    user,
    text,
    ...(blocks ? { blocks } : {}),
  });
}

export async function openView(triggerId: string, view: unknown) {
  return slackFetch("views.open", {
    trigger_id: triggerId,
    view,
  });
}

export async function updateView(viewId: string, view: unknown) {
  return slackFetch("views.update", {
    view_id: viewId,
    view,
  });
}

export async function pushView(triggerId: string, view: unknown) {
  return slackFetch("views.push", {
    trigger_id: triggerId,
    view,
  });
}

export async function openDM(userId: string): Promise<string> {
  const data = await slackFetch("conversations.open", { users: userId });
  return data.channel.id;
}

export async function getUserInfo(userId: string) {
  return slackFetch("users.info", { user: userId });
}
