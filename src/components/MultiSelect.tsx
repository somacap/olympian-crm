"use client";

import { useState, useRef, useEffect } from "react";

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export default function MultiSelect({ label, options, selected, onChange, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  const display = selected.length === 0 ? label : `${label} (${selected.length})`;

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`border rounded px-2 py-1.5 text-sm text-left min-w-[140px] flex items-center justify-between gap-1 ${
          selected.length > 0 ? "bg-blue-50 border-blue-300 text-blue-700" : ""
        }`}
      >
        <span className="truncate">{display}</span>
        <span className="text-xs opacity-50">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-[180px]">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border-b"
            >
              Clear all
            </button>
          )}
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="rounded"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
