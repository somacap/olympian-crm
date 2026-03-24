"use client";

import { useEffect, useState } from "react";

interface Stats {
  total: number;
  hasEmail: number;
  spring26: { queued: number; sent: number; replied: number; total: number };
  w26: { total: number };
  neverContacted: number;
}

export default function CampaignsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stats" }),
    })
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return <div className="py-8 text-center text-gray-400">Loading...</div>;
  if (!stats) return null;

  const TEMPLATE = `Congrats on a super impressive background. [Competition type] is exactly the kind of talent we love meeting. Love to hang and get to know you and see what you're thinking about these days, connect you w/ other world class founders and send some fun invites!

We own an NBA team the Sacramento Kings and host many fun events at sports games and dinners. We also thought you could be a candidate for Soma Fellows (https://programs.somacap.com/fellows) which gives up to 2m uncapped if you build something, or we can help shortcut your path to joining a generational tech co we invested in like OpenAI, Anthropic, Ramp, Cognition etc.

The next Fellows deadline is April 1 so wanted to make sure this was on your radar.

Thanks for taking a quick look. Hope for the great pleasure to meet you and hang soon! 650-714-6220 and of course feel free to share this w/ any friends you'd recommend`;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Campaigns</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Olympians</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.hasEmail}</div>
          <div className="text-sm text-gray-500">Have Email</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.neverContacted}</div>
          <div className="text-sm text-gray-500">Never Contacted</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.w26.total}</div>
          <div className="text-sm text-gray-500">W26 Sent</div>
        </div>
      </div>

      {/* Spring 26 Campaign */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-lg mb-2">Spring 2026 Fellows</h3>
        <p className="text-sm text-gray-500 mb-4">$2M uncapped, deadline April 1</p>

        <div className="flex gap-6 mb-6">
          <div>
            <span className="text-xl font-bold text-blue-600">{stats.spring26.queued}</span>
            <span className="text-sm text-gray-500 ml-1">Queued</span>
          </div>
          <div>
            <span className="text-xl font-bold text-green-600">{stats.spring26.sent}</span>
            <span className="text-sm text-gray-500 ml-1">Sent</span>
          </div>
          <div>
            <span className="text-xl font-bold text-purple-600">{stats.spring26.replied}</span>
            <span className="text-sm text-gray-500 ml-1">Replied</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-4">
          <div className="text-xs font-medium text-gray-500 mb-2">EMAIL TEMPLATE</div>
          <pre className="text-sm whitespace-pre-wrap">{TEMPLATE}</pre>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <a href="/?hasEmail=true&campaign=none" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          View Never-Contacted with Email ({Math.min(stats.neverContacted, stats.hasEmail)})
        </a>
        <a href="/?campaign=spring26" className="border px-4 py-2 rounded text-sm hover:bg-gray-50">
          View Spring26 Queue
        </a>
      </div>
    </div>
  );
}
