"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function getWeekStart(date: Date = new Date()): string {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	return d.toISOString().split("T")[0];
}

function formatWeek(weekStart: string): string {
	const start = new Date(weekStart + "T00:00:00");
	const end = new Date(start);
	end.setDate(end.getDate() + 4);
	return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function TimeEntryRow({
	accountId,
	accountName,
	accountCode,
	accountColor,
	hours,
	memberId,
	weekStart,
}: {
	accountId: Id<"accounts">;
	accountName: string;
	accountCode?: string;
	accountColor?: string;
	hours: number;
	memberId: Id<"members">;
	weekStart: string;
}) {
	const [value, setValue] = useState(String(hours));
	const upsert = useMutation(api.timeEntries.upsert);

	const handleBlur = () => {
		const num = parseFloat(value) || 0;
		if (num !== hours) {
			upsert({ memberId, accountId, weekStart, hours: num });
		}
	};

	return (
		<div className="flex items-center gap-3 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
			<div
				className="w-2 h-8 rounded-full shrink-0"
				style={{ backgroundColor: accountColor || "#6366f1" }}
			/>
			<div className="flex-1 min-w-0">
				<span className="font-medium text-gray-900">{accountName}</span>
				{accountCode && (
					<span className="ml-2 text-xs text-gray-400 font-mono">{accountCode}</span>
				)}
			</div>
			<div className="flex items-center gap-1">
				<input
					type="number"
					min="0"
					max="80"
					step="0.5"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onBlur={handleBlur}
					className="w-16 text-right px-2 py-1.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono"
				/>
				<span className="text-xs text-gray-400 w-4">hrs</span>
			</div>
		</div>
	);
}

function WeeklyView({ memberId, weekStart }: { memberId: Id<"members">; weekStart: string }) {
	const entries = useQuery(api.timeEntries.getWeek, { memberId, weekStart });
	const accounts = useQuery(api.accounts.list);
	const submitWeek = useMutation(api.timeEntries.submitWeek);

	if (!accounts || !entries) {
		return <div className="text-center py-12 text-gray-400">Loading...</div>;
	}

	const entryMap = new Map(entries.map((e) => [e.accountId, e.hours]));
	const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

	return (
		<div>
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
					<h3 className="font-semibold text-gray-900">Time Allocation</h3>
					<div className="flex items-center gap-3">
						<span className="text-sm text-gray-500">
							Total: <span className="font-mono font-bold text-gray-900">{totalHours}h</span>
						</span>
						{totalHours >= 40 && (
							<span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
								✓ Full week
							</span>
						)}
					</div>
				</div>

				{accounts.map((account) => (
					<TimeEntryRow
						key={account._id}
						accountId={account._id}
						accountName={account.name}
						accountCode={account.code}
						accountColor={account.color}
						hours={entryMap.get(account._id) ?? 0}
						memberId={memberId}
						weekStart={weekStart}
					/>
				))}

				{accounts.length === 0 && (
					<div className="py-8 text-center text-gray-400 text-sm">
						No accounts yet. Add accounts in Settings.
					</div>
				)}
			</div>

			<div className="mt-4 flex justify-end">
				<button
					type="button"
					onClick={() => submitWeek({ memberId, weekStart })}
					disabled={totalHours === 0}
					className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					Submit Week
				</button>
			</div>
		</div>
	);
}

function Dashboard({ weekStart }: { weekStart: string }) {
	const summary = useQuery(api.timeEntries.getWeekSummary, { weekStart });
	const status = useQuery(api.timeEntries.getSubmissionStatus, { weekStart });

	return (
		<div className="space-y-6">
			{/* Submission progress */}
			{status && (
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
					<h3 className="font-semibold text-gray-900 mb-3">Submission Progress</h3>
					<div className="flex items-center gap-3 mb-2">
						<div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
							<div
								className="h-full bg-indigo-500 rounded-full transition-all"
								style={{
									width: `${status.totalMembers > 0 ? (status.submittedCount / status.totalMembers) * 100 : 0}%`,
								}}
							/>
						</div>
						<span className="text-sm font-mono text-gray-600">
							{status.submittedCount}/{status.totalMembers}
						</span>
					</div>
					{status.submissions.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-3">
							{status.submissions.map((s: any) => (
								<span
									key={s._id}
									className={`text-xs px-2 py-1 rounded-full font-medium ${
										s.status === "submitted"
											? "bg-green-100 text-green-700"
											: s.status === "approved"
												? "bg-blue-100 text-blue-700"
												: "bg-gray-100 text-gray-500"
									}`}
								>
									{s.memberName}: {s.totalHours}h
								</span>
							))}
						</div>
					)}
				</div>
			)}

			{/* Account breakdown */}
			{summary && summary.length > 0 && (
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
					<h3 className="font-semibold text-gray-900 mb-3">Hours by Account</h3>
					<div className="space-y-2">
						{summary.map((s: any) => (
							<div key={s.accountId} className="flex items-center gap-3">
								<div
									className="w-2 h-6 rounded-full shrink-0"
									style={{ backgroundColor: s.accountColor || "#6366f1" }}
								/>
								<span className="flex-1 text-sm font-medium text-gray-900">
									{s.accountName}
									{s.accountCode && (
										<span className="ml-1.5 text-gray-400 font-mono text-xs">{s.accountCode}</span>
									)}
								</span>
								<span className="text-sm font-mono text-gray-600">
									{s.totalHours}h
								</span>
								<span className="text-xs text-gray-400">
									{s.memberCount} {s.memberCount === 1 ? "person" : "people"}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default function Home() {
	const [weekStart, setWeekStart] = useState(getWeekStart());
	const [view, setView] = useState<"log" | "dashboard">("log");
	const [selectedMemberId, setSelectedMemberId] = useState<Id<"members"> | null>(null);

	const members = useQuery(api.members.list);

	// Auto-select first member (for demo; real app would use auth)
	const memberId = selectedMemberId ?? members?.[0]?._id;

	const prevWeek = () => {
		const d = new Date(weekStart + "T00:00:00");
		d.setDate(d.getDate() - 7);
		setWeekStart(d.toISOString().split("T")[0]);
	};

	const nextWeek = () => {
		const d = new Date(weekStart + "T00:00:00");
		d.setDate(d.getDate() + 7);
		setWeekStart(d.toISOString().split("T")[0]);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200">
				<div className="max-w-3xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-xl font-bold text-gray-900">⏱ Timekeeper</h1>
						{members && members.length > 1 && (
							<select
								value={memberId ?? ""}
								onChange={(e) => setSelectedMemberId(e.target.value as Id<"members">)}
								className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
							>
								{members.map((m) => (
									<option key={m._id} value={m._id}>
										{m.name}
									</option>
								))}
							</select>
						)}
					</div>

					{/* Week navigator */}
					<div className="flex items-center justify-between">
						<button type="button" onClick={prevWeek} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
							←
						</button>
						<span className="text-sm font-medium text-gray-700">{formatWeek(weekStart)}</span>
						<button type="button" onClick={nextWeek} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
							→
						</button>
					</div>

					{/* View tabs */}
					<div className="flex gap-1 mt-3">
						{(["log", "dashboard"] as const).map((v) => (
							<button
								key={v}
								type="button"
								onClick={() => setView(v)}
								className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
									view === v
										? "bg-indigo-100 text-indigo-700"
										: "text-gray-500 hover:bg-gray-100"
								}`}
							>
								{v === "log" ? "Log Time" : "Dashboard"}
							</button>
						))}
					</div>
				</div>
			</header>

			{/* Content */}
			<main className="max-w-3xl mx-auto px-4 py-6">
				{view === "log" && memberId ? (
					<WeeklyView memberId={memberId} weekStart={weekStart} />
				) : view === "dashboard" ? (
					<Dashboard weekStart={weekStart} />
				) : (
					<div className="text-center py-12 text-gray-400">
						No team members yet. Add members to get started.
					</div>
				)}
			</main>
		</div>
	);
}
