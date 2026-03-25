"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface LogEntry {
  type: string;
  index?: number;
  recordId?: string;
  name?: string;
  step?: string;
  status?: string;
  email?: string;
  reasoning?: string;
  total?: number;
  found?: number;
  notFound?: number;
  message?: string;
}

interface FoundResult {
  recordId: string;
  name: string;
  email: string;
  source: string;
  pushed: boolean;
  pushing: boolean;
}

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s"]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function EnrichContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<LogEntry | null>(null);
  const [foundResults, setFoundResults] = useState<FoundResult[]>([]);
  const [people, setPeople] = useState<{ id: string; name: string; email: string; linkedin: string; country: string; source: string; year: number }[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  // Fetch people details for pre-enrichment display
  useEffect(() => {
    if (ids.length === 0) return;
    fetch(`/api/olympians?`)
      .then((r) => r.json())
      .then((data) => {
        const idSet = new Set(ids);
        const matched = data.olympians
          .filter((o: { id: string }) => idSet.has(o.id))
          .map((o: { id: string; name: string; email: string; linkedin: string; country: string; source: string; year: number }) => ({
            id: o.id, name: o.name, email: o.email, linkedin: o.linkedin, country: o.country, source: o.source, year: o.year,
          }));
        setPeople(matched);
        setLoadingPeople(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = useCallback(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [logs, scrollToBottom]);

  const startEnrichment = async () => {
    setRunning(true);
    setLogs([]);
    setSummary(null);
    setFoundResults([]);

    const res = await fetch("/api/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, pushToAirtable: false }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            setLogs((prev) => [...prev, data]);
            if (data.type === "complete") setSummary(data);
            if (data.type === "found" && data.email) {
              setFoundResults((prev) => [...prev, {
                recordId: data.recordId,
                name: data.name,
                email: data.email,
                source: data.step,
                pushed: false,
                pushing: false,
              }]);
            }
          } catch { /* skip */ }
        }
      }
    }
    setRunning(false);
  };

  const pushToAirtable = async (recordId: string) => {
    const result = foundResults.find((r) => r.recordId === recordId);
    if (!result) return;

    setFoundResults((prev) => prev.map((r) => r.recordId === recordId ? { ...r, pushing: true } : r));

    await fetch("/api/olympians", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recordId, personalEmail: result.email }),
    });

    setFoundResults((prev) => prev.map((r) => r.recordId === recordId ? { ...r, pushed: true, pushing: false } : r));
  };

  const pushAllToAirtable = async () => {
    const unpushed = foundResults.filter((r) => !r.pushed);
    for (const r of unpushed) {
      await pushToAirtable(r.recordId);
    }
  };

  const getStatusIcon = (entry: LogEntry) => {
    switch (entry.type) {
      case "start": return "🚀";
      case "skip": return "⏭️";
      case "found": return "✅";
      case "not_found": return "❌";
      case "airtable_sync": return "📤";
      case "complete": return "🏁";
      case "progress": return entry.status === "searching" ? "🔍" : "⚠️";
      default: return "•";
    }
  };

  const getStatusColor = (entry: LogEntry) => {
    switch (entry.type) {
      case "found": return "text-green-700 bg-green-50";
      case "not_found": return "text-red-700 bg-red-50";
      case "skip": return "text-gray-500 bg-gray-50";
      case "airtable_sync": return "text-blue-700 bg-blue-50";
      case "complete": return "text-purple-700 bg-purple-50 font-medium";
      default: return "text-gray-700";
    }
  };

  const currentIndex = logs.filter((l) => l.index !== undefined).reduce((max, l) => Math.max(max, (l.index || 0) + 1), 0);
  const hasUnpushed = foundResults.some((r) => !r.pushed);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Email Enrichment</h2>
      <p className="text-sm text-gray-500 mb-6">
        Waterfall: Apollo (LinkedIn match + name) then Exa (neural search). {ids.length} people selected.
      </p>

      {/* Pre-enrichment: show all names */}
      {!running && !summary && (
        <>
          <div className="bg-white border rounded-lg mb-4 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b text-sm font-medium text-gray-700">
              Selected for enrichment ({people.length})
            </div>
            {loadingPeople ? (
              <div className="px-4 py-3 text-sm text-gray-400">Loading...</div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Current Email</th>
                      <th className="px-4 py-2 text-left">LinkedIn</th>
                      <th className="px-4 py-2 text-left">Country</th>
                      <th className="px-4 py-2 text-left">Source</th>
                      <th className="px-4 py-2 text-left">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{p.name}</td>
                        <td className="px-4 py-2 text-gray-600">{p.email || <span className="text-gray-300">--</span>}</td>
                        <td className="px-4 py-2">
                          {p.linkedin ? <a href={p.linkedin} target="_blank" className="text-blue-600 hover:underline text-xs">Profile</a> : <span className="text-gray-300">--</span>}
                        </td>
                        <td className="px-4 py-2">{p.country}</td>
                        <td className="px-4 py-2">{p.source}</td>
                        <td className="px-4 py-2">{p.year || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <button onClick={startEnrichment} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 text-sm font-medium">
            Start Enrichment ({ids.length} people)
          </button>
        </>
      )}

      {/* Progress bar */}
      {(running || summary) && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
            <span>{running ? "Enriching..." : "Complete"}</span>
            <span>{currentIndex} / {ids.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${ids.length > 0 ? (currentIndex / ids.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Summary + push controls */}
      {summary && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <div><span className="text-2xl font-bold text-purple-700">{summary.found}</span><span className="text-sm text-purple-600 ml-1">found</span></div>
              <div><span className="text-2xl font-bold text-red-600">{summary.notFound}</span><span className="text-sm text-red-500 ml-1">not found</span></div>
              <div><span className="text-2xl font-bold text-gray-600">{summary.total}</span><span className="text-sm text-gray-500 ml-1">total</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Found results with per-row push buttons */}
      {foundResults.length > 0 && (
        <div className="bg-white border rounded-lg mb-4 overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">Found Emails ({foundResults.length})</span>
            {hasUnpushed && (
              <button onClick={pushAllToAirtable} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                Push all to Airtable
              </button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email Found</th>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Airtable</th>
              </tr>
            </thead>
            <tbody>
              {foundResults.map((r) => (
                <tr key={r.recordId} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.email}</td>
                  <td className="px-4 py-2 text-gray-500">{r.source}</td>
                  <td className="px-4 py-2">
                    {r.pushed ? (
                      <span className="text-green-600 text-xs">✅ Pushed</span>
                    ) : (
                      <button
                        onClick={() => pushToAirtable(r.recordId)}
                        disabled={r.pushing}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        {r.pushing ? "Pushing..." : "Push to Airtable"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Live log */}
      {logs.length > 0 && (
        <div ref={logRef} className="border rounded-lg bg-white overflow-y-auto max-h-[400px]">
          {logs.map((entry, i) => (
            <div key={i} className={`px-4 py-2 border-b text-sm flex items-start gap-2 ${getStatusColor(entry)}`}>
              <span className="flex-shrink-0">{getStatusIcon(entry)}</span>
              <div>
                {entry.name && <span className="font-medium">{entry.name}</span>}
                {entry.step && <span className="text-xs ml-1 opacity-60">[{entry.step}]</span>}
                {entry.email && <span className="ml-2 font-mono text-xs bg-green-100 px-1.5 py-0.5 rounded">{entry.email}</span>}
                {entry.reasoning && <div className="text-xs opacity-75 mt-0.5">{linkify(entry.reasoning)}</div>}
                {entry.message && !entry.name && <span>{entry.message}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!running && logs.length > 0 && (
        <div className="mt-4"><a href="/" className="text-sm text-blue-600 hover:underline">Back to People</a></div>
      )}
    </div>
  );
}

export default function EnrichPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-gray-400">Loading...</div>}>
      <EnrichContent />
    </Suspense>
  );
}
