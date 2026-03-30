// Slack Block Kit builders for Timekeeper

interface SelectOption {
  text: string;
  value: string;
}

interface TimeEntry {
  _id: string;
  customer: string;
  capability: string;
  hours: number;
  capitalizable: boolean;
  comments?: string;
}

export function weeklyPromptBlocks(weekLabel: string) {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "⏰ Weekly Time Entry", emoji: true },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Please submit your hours for the week of *${weekLabel}*.\nYou can add multiple entries for different customers/capabilities.`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "➕ Add Entry", emoji: true },
          style: "primary",
          action_id: "add_entry",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "📋 View Entries", emoji: true },
          action_id: "view_entries",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "✅ Submit Week", emoji: true },
          style: "danger",
          action_id: "submit_week",
        },
      ],
    },
  ];
}

export function addEntryModal(
  customers: SelectOption[],
  capabilities: SelectOption[],
  weekStart: string,
) {
  return {
    type: "modal" as const,
    callback_id: "add_entry_modal",
    private_metadata: JSON.stringify({ weekStart }),
    title: { type: "plain_text" as const, text: "Add Time Entry" },
    submit: { type: "plain_text" as const, text: "Save Entry" },
    close: { type: "plain_text" as const, text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "customer_block",
        label: { type: "plain_text", text: "Customer" },
        element: {
          type: "static_select",
          action_id: "customer",
          placeholder: { type: "plain_text", text: "Select a customer" },
          options: customers.map((c) => ({
            text: { type: "plain_text", text: c.text },
            value: c.value,
          })),
        },
      },
      {
        type: "input",
        block_id: "capability_block",
        label: { type: "plain_text", text: "Capability" },
        element: {
          type: "static_select",
          action_id: "capability",
          placeholder: { type: "plain_text", text: "Select a capability" },
          options: capabilities.map((c) => ({
            text: { type: "plain_text", text: c.text },
            value: c.value,
          })),
        },
      },
      {
        type: "input",
        block_id: "hours_block",
        label: { type: "plain_text", text: "Hours" },
        element: {
          type: "number_input",
          action_id: "hours",
          is_decimal_allowed: true,
          min_value: "0.5",
          max_value: "80",
          placeholder: { type: "plain_text", text: "e.g. 8" },
        },
      },
      {
        type: "input",
        block_id: "capitalizable_block",
        label: { type: "plain_text", text: "Capitalizable?" },
        element: {
          type: "radio_buttons",
          action_id: "capitalizable",
          initial_option: {
            text: { type: "plain_text", text: "No" },
            value: "false",
          },
          options: [
            { text: { type: "plain_text", text: "Yes" }, value: "true" },
            { text: { type: "plain_text", text: "No" }, value: "false" },
          ],
        },
      },
      {
        type: "input",
        block_id: "comments_block",
        optional: true,
        label: { type: "plain_text", text: "Comments" },
        element: {
          type: "plain_text_input",
          action_id: "comments",
          multiline: false,
          placeholder: { type: "plain_text", text: "Brief description of work" },
        },
      },
    ],
  };
}

export function viewEntriesBlocks(entries: TimeEntry[], weekLabel: string, isLocked: boolean) {
  if (entries.length === 0) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📋 *Entries for ${weekLabel}*\n\n_No entries yet. Use "Add Entry" to get started._`,
        },
      },
    ];
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `📋 Entries for ${weekLabel}`, emoji: true },
    },
  ];

  for (const entry of entries) {
    const entryBlock: Record<string, unknown> = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${entry.customer}* → ${entry.capability}\n${entry.hours}h | ${entry.capitalizable ? "✅ Cap." : "—"}${entry.comments ? ` | ${entry.comments}` : ""}`,
      },
    };

    if (!isLocked) {
      entryBlock.accessory = {
        type: "overflow",
        action_id: `entry_overflow_${entry._id}`,
        options: [
          {
            text: { type: "plain_text", text: "🗑️ Delete" },
            value: `delete_${entry._id}`,
          },
        ],
      };
    }

    blocks.push(entryBlock);
    blocks.push({ type: "divider" });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `*Total: ${totalHours}h* ${isLocked ? "🔒 Locked" : ""}`,
      },
    ],
  });

  if (!isLocked) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "➕ Add Another", emoji: true },
          action_id: "add_entry",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "✅ Submit Week", emoji: true },
          style: "primary",
          action_id: "submit_week",
        },
      ],
    });
  }

  return blocks;
}

export function reminderBlocks(weekLabel: string, entryCount: number) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: entryCount > 0
          ? `⏰ *Reminder:* You have ${entryCount} entries for ${weekLabel} but haven't submitted yet. Don't forget!`
          : `⏰ *Reminder:* You haven't entered any hours for ${weekLabel} yet. Please submit your time.`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "➕ Add Entry", emoji: true },
          style: "primary",
          action_id: "add_entry",
        },
        ...(entryCount > 0
          ? [
              {
                type: "button",
                text: { type: "plain_text", text: "✅ Submit Week", emoji: true },
                action_id: "submit_week",
              },
            ]
          : []),
      ],
    },
  ];
}

export function submissionConfirmBlocks(totalHours: number, entryCount: number, weekLabel: string) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `✅ *Week Submitted!*\n\n*${weekLabel}*: ${entryCount} entries, ${totalHours} total hours.\n\nYou can still edit until the weekly cutoff.`,
      },
    },
  ];
}
