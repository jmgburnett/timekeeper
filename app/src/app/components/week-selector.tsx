"use client";

export function WeekSelector({
	weekStart,
	onChange,
}: {
	weekStart: string;
	onChange: (week: string) => void;
}) {
	const d = new Date(weekStart + "T00:00:00Z");
	const weekEnd = new Date(d);
	weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

	const prev = new Date(d);
	prev.setUTCDate(prev.getUTCDate() - 7);
	const next = new Date(d);
	next.setUTCDate(next.getUTCDate() + 7);

	const fmt = (dt: Date) => dt.toISOString().split("T")[0];
	const fmtDisplay = (dt: Date) =>
		dt.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			timeZone: "UTC",
		});

	return (
		<div className="flex items-center gap-3">
			<button
				onClick={() => onChange(fmt(prev))}
				className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm"
			>
				← Prev
			</button>
			<span className="text-sm font-medium text-gray-700 min-w-[180px] text-center">
				Week of {fmtDisplay(d)} – {fmtDisplay(weekEnd)}
			</span>
			<button
				onClick={() => onChange(fmt(next))}
				className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm"
			>
				Next →
			</button>
		</div>
	);
}

export function getCurrentWeekStart(): string {
	const now = new Date();
	const day = now.getUTCDay();
	const diff = day === 0 ? 6 : day - 1; // Monday = 0
	const monday = new Date(now);
	monday.setUTCDate(monday.getUTCDate() - diff);
	return monday.toISOString().split("T")[0];
}
