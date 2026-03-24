"use client";

import { useEffect, useState, useCallback } from "react";

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
  appearances: number;
}

interface ApiResponse {
  total: number;
  hasEmail: number;
  countries: string[];
  sources: string[];
  years: number[];
  olympians: Olympian[];
}

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
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
    const res = await fetch(`/api/olympians?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [q, country, source, hasEmail, campaign, yearMin, yearMax, multiYear]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.olympians.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.olympians.map((o) => o.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const markForCampaign = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "queue", ids, campaign: "Spring26 Fellows" }),
    });
    setSelected(new Set());
    fetchData();
  };

  const triggerEnrichment = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    window.location.href = `/enrich?ids=${ids.join(",")}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">People</h2>
        {data && (
          <div className="text-sm text-gray-500">
            {data.total} people &middot; {data.hasEmail} with email
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, school, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-64"
        />
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
      </div>

      {/* Year + Multi-year filters */}
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
        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={markForCampaign}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
            >
              Queue {selected.size} for Spring26
            </button>
            <button
              onClick={triggerEnrichment}
              className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700"
            >
              Enrich {selected.size} emails
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-400 py-8 text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input type="checkbox" onChange={toggleAll} checked={data ? selected.size === data.olympians.length && data.olympians.length > 0 : false} />
                </th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Source</th>
                <th className="px-3 py-2 text-left">Year</th>
                <th className="px-3 py-2 text-left">University</th>
                <th className="px-3 py-2 text-left">W26</th>
                <th className="px-3 py-2 text-left">Spring26</th>
              </tr>
            </thead>
            <tbody>
              {data?.olympians.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} />
                  </td>
                  <td className="px-3 py-2 font-medium">
                    <span className="flex items-center gap-1.5">
                      {o.linkedin ? <a href={o.linkedin} target="_blank" className="text-blue-600 hover:underline">{o.name}</a> : o.name}
                      {o.appearances > 1 && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-normal">{o.appearances}x</span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{o.email || <span className="text-gray-300">--</span>}</td>
                  <td className="px-3 py-2">{o.country}</td>
                  <td className="px-3 py-2">{o.source}</td>
                  <td className="px-3 py-2">{o.year || ""}</td>
                  <td className="px-3 py-2 text-gray-600">{o.university}</td>
                  <td className="px-3 py-2">{o.w26Outreach ? "✅" : ""}</td>
                  <td className="px-3 py-2">{o.spring26Status || (o.spring26Outreach ? "Queued" : "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
