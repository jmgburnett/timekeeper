import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { eventsHandler, interactionsHandler, commandsHandler } from "./slack/handlers";

const http = httpRouter();

// === Slack Bot Endpoints ===
http.route({
  path: "/slack/events",
  method: "POST",
  handler: eventsHandler,
});

http.route({
  path: "/slack/interactions",
  method: "POST",
  handler: interactionsHandler,
});

http.route({
  path: "/slack/commands",
  method: "POST",
  handler: commandsHandler,
});

// === CSV Export ===
http.route({
  path: "/csv/report",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const weekStart = url.searchParams.get("weekStart");

    if (!weekStart) {
      return new Response("Missing weekStart parameter", { status: 400 });
    }

    const entries = await ctx.runQuery(api.reports.detailReport, { weekStart });

    const header =
      "Week Ending,Employee,Customer,Capability,Hours,Capitalizable,Comments,Submitted";
    const rows = entries.map((e: any) => {
      const weekEnd = getWeekEnd(e.weekStart);
      return [
        weekEnd,
        csvEscape(e.employeeName),
        csvEscape(e.customer),
        csvEscape(e.capability),
        e.hours,
        e.capitalizable ? "Yes" : "No",
        csvEscape(e.comments || ""),
        new Date(e.createdAt).toISOString(),
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="timekeeper-${weekStart}.csv"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().split("T")[0];
}

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default http;
