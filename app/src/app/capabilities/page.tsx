"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function CapabilitiesPage() {
	const capabilities = useQuery(api.capabilities.list);
	const createCapability = useMutation(api.capabilities.create);
	const updateCapability = useMutation(api.capabilities.update);
	const [newName, setNewName] = useState("");

	const handleAdd = async () => {
		if (!newName.trim()) return;
		await createCapability({ name: newName.trim() });
		setNewName("");
	};

	return (
		<div className="max-w-2xl space-y-6">
			<h2 className="text-2xl font-bold">Capabilities</h2>

			<div className="flex gap-2">
				<input
					type="text"
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleAdd()}
					placeholder="New capability name..."
					className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onClick={handleAdd}
					className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
				>
					Add
				</button>
			</div>

			<div className="bg-white rounded-lg border border-gray-200">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-200">
							<th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
							<th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
							<th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
						</tr>
					</thead>
					<tbody>
						{capabilities?.map((c) => (
							<tr key={c._id} className="border-b border-gray-100">
								<td className="py-3 px-4">{c.name}</td>
								<td className="py-3 px-4 text-center">
									<span
										className={`px-2 py-0.5 rounded-full text-xs ${
											c.isActive
												? "bg-green-100 text-green-700"
												: "bg-gray-100 text-gray-500"
										}`}
									>
										{c.isActive ? "Active" : "Inactive"}
									</span>
								</td>
								<td className="py-3 px-4 text-right">
									<button
										onClick={() =>
											updateCapability({ id: c._id, isActive: !c.isActive })
										}
										className="text-xs text-blue-600 hover:underline"
									>
										{c.isActive ? "Deactivate" : "Activate"}
									</button>
								</td>
							</tr>
						))}
						{capabilities?.length === 0 && (
							<tr>
								<td colSpan={3} className="py-6 text-center text-gray-400">
									No capabilities yet
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
