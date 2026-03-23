"use client";

export default function SettingsPage() {
	return (
		<div className="max-w-2xl space-y-6">
			<h2 className="text-2xl font-bold">Settings</h2>

			<div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
				{/* Slack Configuration */}
				<section>
					<h3 className="text-lg font-semibold mb-4">Slack Integration</h3>
					<div className="space-y-3">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Bot Token
							</label>
							<input
								type="password"
								placeholder="xoxb-..."
								className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Team ID
							</label>
							<input
								type="text"
								placeholder="T01ABC123"
								className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled
							/>
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
								defaultValue={5}
								disabled
							>
								<option value={1}>Monday</option>
								<option value={2}>Tuesday</option>
								<option value={3}>Wednesday</option>
								<option value={4}>Thursday</option>
								<option value={5}>Friday</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Prompt Hour (UTC)
							</label>
							<input
								type="number"
								defaultValue={20}
								min={0}
								max={23}
								className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
								disabled
							/>
						</div>
					</div>
				</section>

				{/* Cutoff */}
				<section>
					<h3 className="text-lg font-semibold mb-4">Weekly Cutoff</h3>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Cutoff Day
							</label>
							<select
								className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
								defaultValue={1}
								disabled
							>
								<option value={1}>Monday</option>
								<option value={2}>Tuesday</option>
								<option value={3}>Wednesday</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Cutoff Hour (UTC)
							</label>
							<input
								type="number"
								defaultValue={15}
								min={0}
								max={23}
								className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
								disabled
							/>
						</div>
					</div>
				</section>

				<div className="pt-2">
					<p className="text-sm text-gray-500 italic">
						⚙️ Settings will be editable once Slack integration is connected.
					</p>
				</div>
			</div>
		</div>
	);
}
