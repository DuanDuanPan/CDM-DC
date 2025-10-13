"use client";

import { useEffect, useState } from 'react';
import type { JumpLogEntry } from './cockpitTypes';

interface JumpButtonProps {
  label: string;
  url?: string;
  system?: string;
  nodeId?: string;
  baseline?: string;
  context?: Record<string, unknown>;
  requireConfirm?: boolean;
  onLogged?: (entry: JumpLogEntry) => void;
}

export default function JumpButton({
  label,
  url,
  system = 'UNKNOWN',
  nodeId,
  baseline,
  context,
  requireConfirm = true,
  onLogged,
}: JumpButtonProps) {
  const [noted, setNoted] = useState<'success' | 'cancelled' | null>(null);

  useEffect(() => {
    if (!noted) return;
    const timer = setTimeout(() => setNoted(null), 1800);
    return () => clearTimeout(timer);
  }, [noted]);

  const persistEntry = (entry: JumpLogEntry) => {
    try {
      const raw = window.localStorage.getItem('jump_log');
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(entry);
      window.localStorage.setItem('jump_log', JSON.stringify(arr.slice(0, 200)));
    } catch (error) {
      console.warn('无法记录跳转日志', error);
    }
  };

  const handleClick = () => {
    let confirmed = true;
    if (requireConfirm) {
      confirmed = window.confirm(`即将跳转至 ${system}，是否继续？`);
    }

    const entry: JumpLogEntry = {
      id: `jump-${Date.now()}`,
      ts: new Date().toISOString(),
      system,
      target: url ?? '#',
      actor: { type: 'user', id: 'ebom-user' },
      context: {
        ...context,
        nodeId,
        baseline,
      },
      status: confirmed ? 'success' : 'cancelled',
    };

    persistEntry(entry);
    onLogged?.(entry);

    if (confirmed && url) {
      window.open(url, '_blank');
    }

    setNoted(entry.status === 'success' ? 'success' : 'cancelled');
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-blue-600 hover:border-blue-300"
      >
        <i className={`${url ? 'ri-external-link-line' : 'ri-compass-3-line'} mr-1`} />
        {label}
      </button>
      {noted === 'success' && (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <i className="ri-check-line" /> 已记录
        </span>
      )}
      {noted === 'cancelled' && (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
          <i className="ri-alert-line" /> 已取消
        </span>
      )}
    </div>
  );
}
