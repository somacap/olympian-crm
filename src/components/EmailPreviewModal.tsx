"use client";

import { useState } from "react";

interface Props {
  olympian: {
    id: string;
    name: string;
    email: string;
    source: string;
    spring26Outreach: string;
    spring26Body: string;
    spring26BodyHtml: string;
  };
  onClose: () => void;
  onSave: (id: string, customCopy: string) => void;
}

export default function EmailPreviewModal({ olympian, onClose, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [customCopy, setCustomCopy] = useState(olympian.spring26Outreach);
  const [saving, setSaving] = useState(false);

  const isCustom = !!olympian.spring26Outreach;
  const displayBody = editing ? customCopy : olympian.spring26Body;

  const handleSave = async () => {
    setSaving(true);
    await onSave(olympian.id, customCopy);
    setSaving(false);
    setEditing(false);
  };

  const handleResetToDefault = async () => {
    setSaving(true);
    setCustomCopy("");
    await onSave(olympian.id, "");
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{olympian.name}</h3>
            <p className="text-sm text-gray-500">
              {olympian.email || "No email"} &middot; {olympian.source}
              {isCustom && !editing && <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded">Custom copy</span>}
              {!isCustom && !editing && <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">Default template</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          <div className="text-xs font-medium text-gray-500 mb-2">EMAIL BODY</div>
          {editing ? (
            <textarea
              value={customCopy}
              onChange={(e) => setCustomCopy(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm min-h-[250px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Write custom outreach copy for this person..."
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-sm" dangerouslySetInnerHTML={{ __html: isCustom ? displayBody.replace(/\n/g, "<br>") : olympian.spring26BodyHtml }} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex items-center justify-between">
          <div>
            {!editing && (
              <button onClick={() => { setEditing(true); setCustomCopy(olympian.spring26Outreach || olympian.spring26Body); }} className="text-sm text-blue-600 hover:underline">
                {isCustom ? "Edit custom copy" : "Write custom copy"}
              </button>
            )}
            {editing && isCustom && (
              <button onClick={handleResetToDefault} className="text-sm text-red-600 hover:underline" disabled={saving}>
                Reset to default template
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {editing && (
              <>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save to Airtable"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
