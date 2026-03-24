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

function EnrichContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [pushToAirtable, setPushToAirtable] = useState(true);
  const [summary, setSummary] = useState<LogEntry | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  const startEnrichment = async () => {
    setRunning(true);
    setLogs([]);
    setSummary(null);

    const res = await fetch("/api/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, pushToAirtable }),
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
          } catch { /* skip */ }
        }
      }
    }
    setRunning(false);
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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Email Enrichment</h2>
      <p className="text-sm text-gray-500 mb-6">
        Waterfall: Apollo (LinkedIn match + name) then Exa (neural search). {ids.length} people selected.
      </p>

      {!running && !summary && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={pushToAirtable} onChange={(e) => setPushToAirtable(e.target.checked)} />
              Push found emails to Airtable
            </label>
          </div>
          <button onClick={startEnrichment} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 text-sm font-medium">
            Start Enrichment ({ids.length} people)
          </button>
        </div>
      )}

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

      {summary && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex gap-8">
            <div><span className="text-2xl font-bold text-purple-700">{summary.found}</span><span className="text-sm text-purple-600 ml-1">found</span></div>
            <div><span className="text-2xl font-bold text-red-600">{summary.notFound}</span><span className="text-sm text-red-500 ml-1">not found</span></div>
            <div><span className="text-2xl font-bold text-gray-600">{summary.total}</span><span className="text-sm text-gray-500 ml-1">total</span></div>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div ref={logRef} className="border rounded-lg bg-white overflow-y-auto max-h-[500px]">
          {logs.map((entry, i) => (
            <div key={i} className={`px-4 py-2 border-b text-sm flex items-start gap-2 ${getStatusColor(entry)}`}>
              <span className="flex-shrink-0">{getStatusIcon(entry)}</span>
              <div>
                {entry.name && <span className="font-medium">{entry.name}</span>}
                {entry.step && <span className="text-xs ml-1 opacity-60">[{entry.step}]</span>}
                {entry.email && <span className="ml-2 font-mono text-xs bg-green-100 px-1.5 py-0.5 rounded">{entry.email}</span>}
                {entry.reasoning && <div className="text-xs opacity-75 mt-0.5">{entry.reasoning}</div>}
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
