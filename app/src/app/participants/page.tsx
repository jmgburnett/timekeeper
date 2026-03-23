"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function ParticipantsPage() {
	const participants = useQuery(api.participants.list);
	const createParticipant = useMutation(api.participants.create);
	const updateParticipant = useMutation(api.participants.update);

	const [name, setName] = useState("");
	const [slackId, setSlackId] = useState("");
	const [email, setEmail] = useState("");
	const [isAdmin, setIsAdmin] = useState(false);

	const handleAdd = async () => {
		if (!name.trim() || !slackId.trim()) return;
		await createParticipant({
			name: name.trim(),
			slackUserId: slackId.trim(),
			email: email.trim() || undefined,
			isAdmin,
		});
		setName("");
		setSlackId("");
		setEmail("");
		setIsAdmin(false);
	};

	return (
		<div className="max-w-3xl space-y-6">
			<h2 className="text-2xl font-bold">Participants</h2>

			{/* Add form */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
				<h3 className="text-sm font-medium text-gray-700">Add Participant</h3>
				<div className="grid grid-cols-2 gap-3">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Name"
						className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<input
						type="text"
						value={slackId}
						onChange={(e) => setSlackId(e.target.value)}
						placeholder="Slack User ID (e.g. U01ABC123)"
						className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Email (optional)"
						className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={isAdmin}
								onChange={(e) => setIsAdmin(e.target.checked)}
								className="rounded"
							/>
							Admin
						</label>
						<button
							onClick={handleAdd}
							className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
						>
							Add
						</button>
					</div>
				</div>
			</div>

			{/* List */}
			<div className="bg-white rounded-lg border border-gray-200">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-200">
							<th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
							<th className="text-left py-3 px-4 font-medium text-gray-600">Slack ID</th>
							<th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
							<th className="text-center py-3 px-4 font-medium text-gray-600">Role</th>
							<th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
							<th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
						</tr>
					</thead>
					<tbody>
						{participants?.map((p) => (
							<tr key={p._id} className="border-b border-gray-100">
								<td className="py-3 px-4">{p.name}</td>
								<td className="py-3 px-4 font-mono text-xs text-gray-500">
									{p.slackUserId}
								</td>
								<td className="py-3 px-4 text-gray-600">{p.email || "—"}</td>
								<td className="py-3 px-4 text-center">
									<span
										className={`px-2 py-0.5 rounded-full text-xs ${
											p.isAdmin
												? "bg-purple-100 text-purple-700"
												: "bg-gray-100 text-gray-600"
										}`}
									>
										{p.isAdmin ? "Admin" : "Member"}
									</span>
								</td>
								<td className="py-3 px-4 text-center">
									<span
										className={`px-2 py-0.5 rounded-full text-xs ${
											p.isActive
												? "bg-green-100 text-green-700"
												: "bg-gray-100 text-gray-500"
										}`}
									>
										{p.isActive ? "Active" : "Inactive"}
									</span>
								</td>
								<td className="py-3 px-4 text-right space-x-2">
									<button
										onClick={() =>
											updateParticipant({
												id: p._id,
												isAdmin: !p.isAdmin,
											})
										}
										className="text-xs text-purple-600 hover:underline"
									>
										{p.isAdmin ? "Remove Admin" : "Make Admin"}
									</button>
									<button
										onClick={() =>
											updateParticipant({
												id: p._id,
												isActive: !p.isActive,
											})
										}
										className="text-xs text-blue-600 hover:underline"
									>
										{p.isActive ? "Deactivate" : "Activate"}
									</button>
								</td>
							</tr>
						))}
						{participants?.length === 0 && (
							<tr>
								<td colSpan={6} className="py-6 text-center text-gray-400">
									No participants yet
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
