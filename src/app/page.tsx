"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import EmailPreviewModal from "@/components/EmailPreviewModal";

interface Olympian {
  id: string;
  name: string;
  firstName: string;
  email: string;
  linkedin: string;
  country: string;
  university: string;
  year: number;
  source: string;
  readyToSend: boolean;
  w26Outreach: string;
  w26Status: string;
  spring26Outreach: string;
  spring26Status: string;
  spring26Body: string;
  spring26BodyHtml: string;
  appearances: number;
  exception: boolean;
}

interface ApiResponse {
  total: number;
  hasEmail: number;
  countries: string[];
  sources: string[];
  years: number[];
  olympians: Olympian[];
}

type SortKey = "name" | "year" | "country" | "source" | "email";
type SortDir = "asc" | "desc";
type GroupKey = "" | "year" | "source" | "country";

export default function PeoplePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [source, setSource] = useState("");
  const [hasEmail, setHasEmail] = useState("");
  const [campaign, setCampaign] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [multiYear, setMultiYear] = useState(false);
  const [exception, setException] = useState("false");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewOlympian, setPreviewOlympian] = useState<Olympian | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [groupBy, setGroupBy] = useState<GroupKey>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (source) params.set("source", source);
    if (hasEmail) params.set("hasEmail", hasEmail);
    if (campaign) params.set("campaign", campaign);
    if (yearMin) params.set("yearMin", yearMin);
    if (yearMax) params.set("yearMax", yearMax);
    if (multiYear) params.set("multiYear", "true");
    if (exception) params.set("exception", exception);
    const res = await fetch(`/api/olympians?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [q, country, source, hasEmail, campaign, yearMin, yearMax, multiYear, exception]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const sorted = useMemo(() => {
    if (!data) return [];
    const list = [...data.olympians];
    list.sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [data, sortKey, sortDir]);

  const grouped = useMemo(() => {
    if (!groupBy) return null;
    const groups: Record<string, Olympian[]> = {};
    for (const o of sorted) {
      const key = String(o[groupBy as keyof Olympian] || "Unknown");
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    }
    const entries = Object.entries(groups);
    if (groupBy === "year") entries.sort((a, b) => Number(b[0]) - Number(a[0]));
    else entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [sorted, groupBy]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.olympians.length) setSelected(new Set());
    else setSelected(new Set(data.olympians.map((o) => o.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const markForCampaign = async () => {
    if (selected.size === 0) return;
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "queue", ids: Array.from(selected), campaign: "Spring26 Fellows" }),
    });
    const result = await res.json();
    if (result.skippedExceptions > 0) {
      alert(`Queued ${result.queued} people. Skipped ${result.skippedExceptions} exceptions.`);
    }
    setSelected(new Set());
    fetchData();
  };

  const triggerEnrichment = () => {
    if (selected.size === 0) return;
    window.location.href = `/enrich?ids=${Array.from(selected).join(",")}`;
  };

  const toggleException = async (id: string, current: boolean) => {
    await fetch("/api/olympians", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, exception: !current }),
    });
    fetchData();
  };

  const handleSaveCopy = async (id: string, customCopy: string) => {
    await fetch("/api/olympians", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, spring26Outreach: customCopy }),
    });
    fetchData();
    setPreviewOlympian(null);
  };

  const renderRow = (o: Olympian) => (
    <tr key={o.id} className="border-b hover:bg-gray-50">
      <td className="px-3 py-2"><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} /></td>
      <td className="px-3 py-2 font-medium">
        <span className="flex items-center gap-1.5">
          {o.linkedin ? <a href={o.linkedin} target="_blank" className="text-blue-600 hover:underline">{o.name}</a> : o.name}
          {o.appearances > 1 && <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-normal">{o.appearances}x</span>}
        </span>
      </td>
      <td className="px-3 py-2 text-gray-600">{o.email || <span className="text-gray-300">--</span>}</td>
      <td className="px-3 py-2">{o.country}</td>
      <td className="px-3 py-2">{o.source}</td>
      <td className="px-3 py-2">{o.year || ""}</td>
      <td className="px-3 py-2 text-gray-600">{o.university}</td>
      <td className="px-3 py-2">
        <button onClick={() => setPreviewOlympian(o)} className="text-xs text-blue-600 hover:underline">
          {o.spring26Outreach ? "✏️ Custom" : "📄 Default"}
        </button>
      </td>
      <td className="px-3 py-2">{o.w26Outreach ? "✅" : ""}</td>
      <td className="px-3 py-2">{o.spring26Status || (o.spring26Outreach ? "Queued" : "")}</td>
      <td className="px-3 py-2">
        <button onClick={(e) => { e.stopPropagation(); toggleException(o.id, o.exception); }} className={`text-xs px-1.5 py-0.5 rounded ${o.exception ? "bg-red-100 text-red-700" : "text-gray-300 hover:text-gray-500"}`}>
          {o.exception ? "🚫" : "—"}
        </button>
      </td>
    </tr>
  );

  const renderHeader = () => (
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="px-3 py-2 text-left"><input type="checkbox" onChange={toggleAll} checked={data ? selected.size === data.olympians.length && data.olympians.length > 0 : false} /></th>
        <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => handleSort("name")}>Name {sortIcon("name")}</th>
        <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => handleSort("email")}>Email {sortIcon("email")}</th>
        <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => handleSort("country")}>Country {sortIcon("country")}</th>
        <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => handleSort("source")}>Source {sortIcon("source")}</th>
        <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => handleSort("year")}>Year {sortIcon("year")}</th>
        <th className="px-3 py-2 text-left">University</th>
        <th className="px-3 py-2 text-left">Copy</th>
        <th className="px-3 py-2 text-left">W26</th>
        <th className="px-3 py-2 text-left">Spring26</th>
        <th className="px-3 py-2 text-left">Exc.</th>
      </tr>
    </thead>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">People</h2>
        {data && <div className="text-sm text-gray-500">{data.total} people &middot; {data.hasEmail} with email</div>}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Search name, school, email..." value={q} onChange={(e) => setQ(e.target.value)} className="border rounded px-3 py-1.5 text-sm w-64" />
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="">All countries</option>
          {data?.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={hasEmail} onChange={(e) => setHasEmail(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="">All emails</option>
          <option value="true">Has email</option>
          <option value="false">No email</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="">All sources</option>
          {data?.sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="">All campaigns</option>
          <option value="w26">W26 sent</option>
          <option value="spring26">Spring26 queued</option>
          <option value="none">Never contacted</option>
        </select>
        <select value={exception} onChange={(e) => setException(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="false">No exceptions</option>
          <option value="">All people</option>
          <option value="true">Exceptions only</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Year:</span>
          <select value={yearMin} onChange={(e) => setYearMin(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">From</option>
            {data?.years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-xs text-gray-400">to</span>
          <select value={yearMax} onChange={(e) => setYearMax(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">To</option>
            {data?.years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={multiYear} onChange={(e) => setMultiYear(e.target.checked)} />
          Multi-year only
        </label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Group by:</span>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupKey)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">None</option>
            <option value="year">Year</option>
            <option value="source">Source</option>
            <option value="country">Country</option>
          </select>
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <button onClick={markForCampaign} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">Queue {selected.size} for Spring26</button>
            <button onClick={triggerEnrichment} className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700">Enrich {selected.size} emails</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400 py-8 text-center">Loading...</div>
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map(([group, items]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm text-gray-700">{group}</h3>
                <span className="text-xs text-gray-400">{items.length} people</span>
              </div>
              <div className="overflow-x-auto border rounded-lg bg-white">
                <table className="w-full text-sm">
                  {renderHeader()}
                  <tbody>{items.map(renderRow)}</tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            {renderHeader()}
            <tbody>{sorted.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      {previewOlympian && (
        <EmailPreviewModal olympian={previewOlympian} onClose={() => setPreviewOlympian(null)} onSave={handleSaveCopy} />
      )}
    </div>
  );
}
