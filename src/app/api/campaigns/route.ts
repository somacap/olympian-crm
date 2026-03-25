import { NextResponse } from "next/server";
import { fetchAllOlympians, batchUpdateOlympians } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const { action, ids, campaign } = body;

  if (action === "queue" && ids?.length) {
    // Filter out exceptions at API level
    const allOlympians = await fetchAllOlympians();
    const exceptionIds = new Set(allOlympians.filter((o) => o.exception).map((o) => o.id));
    const validIds = ids.filter((id: string) => !exceptionIds.has(id));
    const skippedCount = ids.length - validIds.length;

    const updates = validIds.map((id: string) => ({
      id,
      fields: {
        "Spring26 Outreach": campaign || "Spring26 Fellows",
        "Spring26 Status": "Queued",
      },
    }));
    await batchUpdateOlympians(updates);
    return NextResponse.json({ ok: true, queued: validIds.length, skippedExceptions: skippedCount });
  }

  if (action === "mark-sent" && ids?.length) {
    const updates = ids.map((id: string) => ({
      id,
      fields: { "Spring26 Status": "Sent" },
    }));
    await batchUpdateOlympians(updates);
    return NextResponse.json({ ok: true, sent: ids.length });
  }

  if (action === "stats") {
    const all = await fetchAllOlympians();
    const spring26 = all.filter((o) => !!o.spring26Outreach);
    const stats = {
      total: all.length,
      hasEmail: all.filter((o) => !!o.email).length,
      spring26: {
        queued: spring26.filter((o) => o.spring26Status === "Queued").length,
        sent: spring26.filter((o) => o.spring26Status === "Sent").length,
        replied: spring26.filter((o) => o.spring26Status === "Replied").length,
        total: spring26.length,
      },
      w26: {
        total: all.filter((o) => !!o.w26Outreach).length,
      },
      neverContacted: all.filter((o) => !o.w26Outreach && !o.spring26Outreach).length,
    };
    return NextResponse.json(stats);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
