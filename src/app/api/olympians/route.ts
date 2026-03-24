import { NextResponse } from "next/server";
import { fetchAllOlympians, updateOlympian } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const country = searchParams.get("country") || "";
  const source = searchParams.get("source") || "";
  const hasEmail = searchParams.get("hasEmail");
  const campaign = searchParams.get("campaign") || "";
  const status = searchParams.get("status") || "";
  const yearMin = searchParams.get("yearMin");
  const yearMax = searchParams.get("yearMax");
  const multiYear = searchParams.get("multiYear");
  const hasCustomCopy = searchParams.get("hasCustomCopy");

  const allOlympians = await fetchAllOlympians();

  const nameCounts: Record<string, number> = {};
  for (const o of allOlympians) {
    const key = o.name.toLowerCase().trim();
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  }

  const enriched = allOlympians.map((o) => ({
    ...o,
    appearances: nameCounts[o.name.toLowerCase().trim()] || 1,
  }));

  let filtered = enriched;

  if (q) filtered = filtered.filter((o) => o.name.toLowerCase().includes(q) || o.university?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q));
  if (country) filtered = filtered.filter((o) => o.country === country);
  if (source) filtered = filtered.filter((o) => o.source === source);
  if (hasEmail === "true") filtered = filtered.filter((o) => !!o.email);
  if (hasEmail === "false") filtered = filtered.filter((o) => !o.email);
  if (campaign === "w26") filtered = filtered.filter((o) => !!o.w26Outreach);
  if (campaign === "spring26") filtered = filtered.filter((o) => !!o.spring26Outreach);
  if (campaign === "none") filtered = filtered.filter((o) => !o.w26Outreach && !o.spring26Outreach);
  if (status) filtered = filtered.filter((o) => o.spring26Status === status);
  if (yearMin) filtered = filtered.filter((o) => o.year >= parseInt(yearMin));
  if (yearMax) filtered = filtered.filter((o) => o.year <= parseInt(yearMax));
  if (multiYear === "true") filtered = filtered.filter((o) => o.appearances > 1);
  if (hasCustomCopy === "true") filtered = filtered.filter((o) => !!o.spring26Outreach);
  if (hasCustomCopy === "false") filtered = filtered.filter((o) => !o.spring26Outreach);

  const countries = [...new Set(filtered.map((o) => o.country).filter(Boolean))].sort();
  const sources = [...new Set(filtered.map((o) => o.source).filter(Boolean))].sort();
  const years = [...new Set(allOlympians.map((o) => o.year).filter(Boolean))].sort();

  return NextResponse.json({
    total: filtered.length,
    hasEmail: filtered.filter((o) => !!o.email).length,
    countries,
    sources,
    years,
    olympians: filtered,
  });
}

export async function PATCH(req: Request) {
  const { id, spring26Outreach } = await req.json();
  if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });

  await updateOlympian(id, { "Spring26 Outreach": spring26Outreach || "" });
  return NextResponse.json({ ok: true });
}
