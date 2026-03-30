"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import {
  WeekSelector,
  getCurrentWeekStart,
} from "../components/week-selector";
import { useAuth } from "../components/auth-context";

export default function EntryPage() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState("");
  const [mounted, setMounted] = useState(false);

  // Form state — admins can pick any user, employees are auto-scoped
  const [selectedUser, setSelectedUser] = useState("");
  const [customer, setCustomer] = useState("");
  const [capability, setCapability] = useState("");
  const [hours, setHours] = useState("");
  const [capitalizable, setCapitalizable] = useState(false);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Auto-set employee to themselves if not admin
  useEffect(() => {
    setWeekStart(getCurrentWeekStart());
    setMounted(true);
    if (user && !user.isAdmin) {
      setSelectedUser(user.slackUserId);
    }
  }, [user]);

  const isAdmin = user?.isAdmin ?? false;
  const participants = useQuery(api.participants.listActive);
  const customers = useQuery(api.customers.listActive);
  const capabilities = useQuery(api.capabilities.listActive);

  const queryArgs =
    weekStart && selectedUser
      ? { weekStart, userId: selectedUser }
      : "skip";
  const entries = useQuery(api.timeEntries.listByUserWeek, queryArgs);
  const submissionStatus = useQuery(
    api.weeklySubmissions.getStatus,
    weekStart && selectedUser
      ? { weekStart, userId: selectedUser }
      : "skip",
  );

  const createEntry = useMutation(api.timeEntries.create);
  const updateEntry = useMutation(api.timeEntries.update);
  const removeEntry = useMutation(api.timeEntries.remove);
  const submitWeek = useMutation(api.weeklySubmissions.submitWeek);

  const isLocked = submissionStatus?.status === "locked";
  const totalHours = entries?.reduce((sum, e) => sum + e.hours, 0) ?? 0;

  const resetForm = () => {
    setCustomer("");
    setCapability("");
    setHours("");
    setCapitalizable(false);
    setComments("");
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!selectedUser || !customer || !capability || !hours) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateEntry({
          id: editingId as any,
          customer,
          capability,
          hours: parseFloat(hours),
          capitalizable,
          comments: comments || undefined,
        });
      } else {
        await createEntry({
          weekStart,
          userId: selectedUser,
          customer,
          capability,
          hours: parseFloat(hours),
          capitalizable,
          comments: comments || undefined,
        });
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: any) => {
    setCustomer(entry.customer);
    setCapability(entry.capability);
    setHours(String(entry.hours));
    setCapitalizable(entry.capitalizable);
    setComments(entry.comments || "");
    setEditingId(entry._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await removeEntry({ id: id as any });
      if (editingId === id) resetForm();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleSubmitWeek = async () => {
    if (!selectedUser || !entries?.length) return;
    if (!confirm(`Submit ${totalHours}h across ${entries.length} entries?`)) return;
    try {
      await submitWeek({ userId: selectedUser, weekStart });
    } catch (err: any) {
      alert(err.message || "Failed to submit");
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Time Entry</h2>
        <WeekSelector weekStart={weekStart} onChange={setWeekStart} />
      </div>

      {/* Employee Selector — only for admins */}
      {isAdmin ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee
          </label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              resetForm();
            }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an employee...</option>
            {participants?.map((p) => (
              <option key={p._id} value={p.slackUserId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-sm text-blue-700">
          Entering time as <strong>{user?.name}</strong>
        </div>
      )}

      {selectedUser && (
        <>
          {/* Status Banner */}
          {isLocked && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              🔒 This week is locked. Entries cannot be modified.
            </div>
          )}
          {submissionStatus?.status === "submitted" && !isLocked && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✅ Week submitted ({totalHours}h). You can still edit until lockout.
            </div>
          )}

          {/* Entry Form */}
          {!isLocked && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <h3 className="text-lg font-semibold">
                {editingId ? "Edit Entry" : "Add Entry"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {customers?.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capability *
                  </label>
                  <select
                    value={capability}
                    onChange={(e) => setCapability(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {capabilities?.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="80"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={capitalizable}
                      onChange={(e) => setCapitalizable(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Capitalizable</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <input
                    type="text"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Brief description of work"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !customer || !capability || !hours}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Entry"
                      : "Add Entry"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Entries Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Entries ({entries?.length ?? 0}) · {totalHours}h total
              </h3>
              {!isLocked && entries && entries.length > 0 && (
                <button
                  onClick={handleSubmitWeek}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  ✅ Submit Week
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-2 font-medium text-gray-600">Capability</th>
                    <th className="text-right py-2 font-medium text-gray-600">Hours</th>
                    <th className="text-center py-2 font-medium text-gray-600">Cap.</th>
                    <th className="text-left py-2 font-medium text-gray-600">Comments</th>
                    {!isLocked && (
                      <th className="text-right py-2 font-medium text-gray-600">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {entries?.map((e) => (
                    <tr key={e._id} className="border-b border-gray-100">
                      <td className="py-2">{e.customer}</td>
                      <td className="py-2">{e.capability}</td>
                      <td className="text-right py-2">{e.hours}</td>
                      <td className="text-center py-2">
                        {e.capitalizable ? "✅" : "—"}
                      </td>
                      <td className="py-2 text-gray-600">{e.comments || "—"}</td>
                      {!isLocked && (
                        <td className="text-right py-2">
                          <button
                            onClick={() => handleEdit(e)}
                            className="text-blue-600 hover:text-blue-800 text-xs mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(e._id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {entries?.length === 0 && (
                    <tr>
                      <td
                        colSpan={isLocked ? 5 : 6}
                        className="py-4 text-center text-gray-400"
                      >
                        No entries yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
