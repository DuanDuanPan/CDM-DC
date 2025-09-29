"use client";

import { useState, useEffect } from 'react';

export default function JumpButton({
  label,
  url,
  context,
}: {
  label: string;
  url?: string;
  context?: Record<string, string>;
}) {
  const [noted, setNoted] = useState(false);
  useEffect(() => {
    if (!noted) return;
    const t = setTimeout(() => setNoted(false), 1800);
    return () => clearTimeout(t);
  }, [noted]);
  const handleClick = () => {
    const entry = {
      from: 'EBOM',
      at: new Date().toISOString(),
      url: url ?? '#',
      context: context ?? {},
    };
    try {
      const raw = window.localStorage.getItem('jump_log');
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(entry);
      window.localStorage.setItem('jump_log', JSON.stringify(arr));
    } catch {}
    console.info('[Jump]', entry);
    setNoted(true);
    if (url) window.open(url, '_blank');
  };
  return (
    <div className="inline-flex items-center gap-2">
      <button onClick={handleClick} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-blue-600 hover:border-blue-300">
        <i className="ri-external-link-line mr-1" />{label}
      </button>
      {noted && (
        <span className="text-xs text-emerald-600 inline-flex items-center gap-1"><i className="ri-check-line"/>已记录</span>
      )}
    </div>
  );
}
