import { NextResponse } from "next/server";
import { fetchAllOlympians } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const country = searchParams.get("country") || "";
  const source = searchParams.get("source") || "";
  const hasEmail = searchParams.get("hasEmail");
  const campaign = searchParams.get("campaign") || "";
  const status = searchParams.get("status") || "";

  let olympians = await fetchAllOlympians();

  if (q) {
    olympians = olympians.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.university?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q)
    );
  }
  if (country) olympians = olympians.filter((o) => o.country === country);
  if (source) olympians = olympians.filter((o) => o.source === source);
  if (hasEmail === "true") olympians = olympians.filter((o) => !!o.email);
  if (hasEmail === "false") olympians = olympians.filter((o) => !o.email);
  if (campaign === "w26") olympians = olympians.filter((o) => !!o.w26Outreach);
  if (campaign === "spring26") olympians = olympians.filter((o) => !!o.spring26Outreach);
  if (campaign === "none") olympians = olympians.filter((o) => !o.w26Outreach && !o.spring26Outreach);
  if (status) olympians = olympians.filter((o) => o.spring26Status === status);

  const countries = [...new Set(olympians.map((o) => o.country).filter(Boolean))].sort();
  const sources = [...new Set(olympians.map((o) => o.source).filter(Boolean))].sort();

  return NextResponse.json({
    total: olympians.length,
    hasEmail: olympians.filter((o) => !!o.email).length,
    countries,
    sources,
    olympians,
  });
}
