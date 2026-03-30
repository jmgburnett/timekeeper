"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export default function SettingsPage() {
  const config = useQuery(api.admin.getSlackConfig);
  const upsertConfig = useMutation(api.admin.upsertSlackConfig);

  const [teamId, setTeamId] = useState("");
  const [reminderDay, setReminderDay] = useState(5);
  const [reminderHour, setReminderHour] = useState(15);
  const [cutoffDay, setCutoffDay] = useState(1);
  const [cutoffHour, setCutoffHour] = useState(15);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setTeamId(config.teamId || "");
      setReminderDay(config.reminderDay);
      setReminderHour(config.reminderHour);
      setCutoffDay(config.cutoffDay);
      setCutoffHour(config.cutoffHour);
      setIsActive(config.isActive);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertConfig({
        teamId,
        reminderDay,
        reminderHour,
        cutoffDay,
        cutoffHour,
        isActive,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://marvelous-cuttlefish-492.convex.site";

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Slack Connection Info */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Slack Setup</h3>
        <p className="text-xs text-blue-700 mb-2">
          Set these Convex environment variables in your dashboard:
        </p>
        <div className="space-y-1 text-xs font-mono text-blue-600">
          <p>SLACK_BOT_TOKEN=xoxb-...</p>
          <p>SLACK_SIGNING_SECRET=...</p>
        </div>
        <div className="mt-3 space-y-1 text-xs text-blue-700">
          <p><strong>Events URL:</strong> {siteUrl}/slack/events</p>
          <p><strong>Interactions URL:</strong> {siteUrl}/slack/interactions</p>
          <p><strong>Commands URL:</strong> {siteUrl}/slack/commands</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Slack Configuration */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Slack Integration</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team ID
              </label>
              <input
                type="text"
                placeholder="T01ABC123"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Bot active (send prompts & reminders)
              </label>
            </div>
          </div>
        </section>

        {/* Reminder Schedule */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Reminder Schedule</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Day
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={reminderDay}
                onChange={(e) => setReminderDay(parseInt(e.target.value))}
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Hour (UTC)
              </label>
              <input
                type="number"
                value={reminderHour}
                onChange={(e) => setReminderHour(parseInt(e.target.value))}
                min={0}
                max={23}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {reminderHour}:00 UTC = {((reminderHour - 5 + 24) % 24)}:00 CT
              </p>
            </div>
          </div>
        </section>

        {/* Cutoff */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Weekly Cutoff</h3>
          <p className="text-sm text-gray-500 mb-3">
            After cutoff, entries for the previous week are locked.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cutoff Day
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={cutoffDay}
                onChange={(e) => setCutoffDay(parseInt(e.target.value))}
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cutoff Hour (UTC)
              </label>
              <input
                type="number"
                value={cutoffHour}
                onChange={(e) => setCutoffHour(parseInt(e.target.value))}
                min={0}
                max={23}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {cutoffHour}:00 UTC = {((cutoffHour - 5 + 24) % 24)}:00 CT
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">✅ Saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}
