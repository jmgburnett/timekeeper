"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import {
	WeekSelector,
	getCurrentWeekStart,
} from "./components/week-selector";

export default function Dashboard() {
	const [weekStart, setWeekStart] = useState(getCurrentWeekStart);

	const byCustomer = useQuery(api.reports.hoursByCustomer, { weekStart });
	const byCapability = useQuery(api.reports.hoursByCapability, { weekStart });
	const byEmployee = useQuery(api.reports.hoursByEmployee, { weekStart });
	const capSummary = useQuery(api.reports.capitalizableSummary, { weekStart });
	const detail = useQuery(api.reports.detailReport, { weekStart });
	const submissions = useQuery(api.weeklySubmissions.listByWeek, { weekStart });
	const participants = useQuery(api.participants.listActive);
	const nonSubmitted = useQuery(api.participants.listNonSubmitted, {
		weekStart,
	});

	const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
	const csvUrl = siteUrl
		? `${siteUrl}/csv/report?weekStart=${weekStart}`
		: "#";

	return (
		<div className="space-y-6 max-w-6xl">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Dashboard</h2>
				<WeekSelector weekStart={weekStart} onChange={setWeekStart} />
			</div>

			{/* Submission Status */}
			<section className="bg-white rounded-lg border border-gray-200 p-4">
				<h3 className="text-lg font-semibold mb-3">Submission Status</h3>
				<div className="flex gap-6 text-sm mb-3">
					<span className="text-green-600 font-medium">
						✅ Submitted: {submissions?.filter((s) => s.status !== "pending").length ?? 0}
					</span>
					<span className="text-amber-600 font-medium">
						⏳ Pending: {nonSubmitted?.length ?? 0}
					</span>
					<span className="text-gray-500">
						Total: {participants?.length ?? 0} participants
					</span>
				</div>
				{nonSubmitted && nonSubmitted.length > 0 && (
					<div className="text-sm text-gray-600">
						<span className="font-medium">Not submitted: </span>
						{nonSubmitted.map((p) => p.name).join(", ")}
					</div>
				)}
			</section>

			{/* Rollup Tables */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Hours by Customer */}
				<section className="bg-white rounded-lg border border-gray-200 p-4">
					<h3 className="text-lg font-semibold mb-3">Hours by Customer</h3>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="text-left py-2 font-medium text-gray-600">Customer</th>
								<th className="text-right py-2 font-medium text-gray-600">Total</th>
								<th className="text-right py-2 font-medium text-gray-600">Cap.</th>
							</tr>
						</thead>
						<tbody>
							{byCustomer?.map((r) => (
								<tr key={r.customer} className="border-b border-gray-100">
									<td className="py-2">{r.customer}</td>
									<td className="text-right py-2">{r.total}</td>
									<td className="text-right py-2">{r.capitalizable}</td>
								</tr>
							))}
							{byCustomer?.length === 0 && (
								<tr>
									<td colSpan={3} className="py-4 text-center text-gray-400">
										No entries this week
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>

				{/* Hours by Capability */}
				<section className="bg-white rounded-lg border border-gray-200 p-4">
					<h3 className="text-lg font-semibold mb-3">Hours by Capability</h3>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="text-left py-2 font-medium text-gray-600">Capability</th>
								<th className="text-right py-2 font-medium text-gray-600">Total</th>
								<th className="text-right py-2 font-medium text-gray-600">Cap.</th>
							</tr>
						</thead>
						<tbody>
							{byCapability?.map((r) => (
								<tr key={r.capability} className="border-b border-gray-100">
									<td className="py-2">{r.capability}</td>
									<td className="text-right py-2">{r.total}</td>
									<td className="text-right py-2">{r.capitalizable}</td>
								</tr>
							))}
							{byCapability?.length === 0 && (
								<tr>
									<td colSpan={3} className="py-4 text-center text-gray-400">
										No entries this week
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>

				{/* Hours by Employee */}
				<section className="bg-white rounded-lg border border-gray-200 p-4">
					<h3 className="text-lg font-semibold mb-3">Hours by Employee</h3>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="text-left py-2 font-medium text-gray-600">Employee</th>
								<th className="text-right py-2 font-medium text-gray-600">Hours</th>
							</tr>
						</thead>
						<tbody>
							{byEmployee?.map((r) => (
								<tr key={r.employee} className="border-b border-gray-100">
									<td className="py-2">{r.employee}</td>
									<td className="text-right py-2">{r.totalHours}</td>
								</tr>
							))}
							{byEmployee?.length === 0 && (
								<tr>
									<td colSpan={2} className="py-4 text-center text-gray-400">
										No entries this week
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>

				{/* Capitalizable Summary */}
				<section className="bg-white rounded-lg border border-gray-200 p-4">
					<h3 className="text-lg font-semibold mb-3">Capitalizable Summary</h3>
					{capSummary && (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="text-left py-2 font-medium text-gray-600">Type</th>
									<th className="text-right py-2 font-medium text-gray-600">Hours</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b border-gray-100">
									<td className="py-2">Capitalizable</td>
									<td className="text-right py-2">{capSummary.capitalizable}</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="py-2">Non-Capitalizable</td>
									<td className="text-right py-2">{capSummary.nonCapitalizable}</td>
								</tr>
								<tr className="font-medium">
									<td className="py-2">Total</td>
									<td className="text-right py-2">{capSummary.total}</td>
								</tr>
							</tbody>
						</table>
					)}
				</section>
			</div>

			{/* Detail Report */}
			<section className="bg-white rounded-lg border border-gray-200 p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-semibold">Detail Report</h3>
					<a
						href={csvUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
					>
						📥 Export CSV
					</a>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="text-left py-2 font-medium text-gray-600">Employee</th>
								<th className="text-left py-2 font-medium text-gray-600">Customer</th>
								<th className="text-left py-2 font-medium text-gray-600">Capability</th>
								<th className="text-right py-2 font-medium text-gray-600">Hours</th>
								<th className="text-center py-2 font-medium text-gray-600">Cap.</th>
								<th className="text-left py-2 font-medium text-gray-600">Comments</th>
							</tr>
						</thead>
						<tbody>
							{detail?.map((e) => (
								<tr key={e._id} className="border-b border-gray-100">
									<td className="py-2">{e.employeeName}</td>
									<td className="py-2">{e.customer}</td>
									<td className="py-2">{e.capability}</td>
									<td className="text-right py-2">{e.hours}</td>
									<td className="text-center py-2">
										{e.capitalizable ? "✅" : "—"}
									</td>
									<td className="py-2 text-gray-600">{e.comments || "—"}</td>
								</tr>
							))}
							{detail?.length === 0 && (
								<tr>
									<td colSpan={6} className="py-4 text-center text-gray-400">
										No entries this week
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
