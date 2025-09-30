"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  dense?: boolean;
}

export default function EmptyState({
  icon = "ri-inbox-line",
  title = "暂无数据",
  description,
  children,
  dense = false,
}: EmptyStateProps) {
  const wrapperClass = dense
    ? "rounded-xl border border-dashed border-gray-200 p-4"
    : "rounded-2xl border border-dashed border-gray-200 bg-white p-6";
  const iconClass = dense ? "text-xl" : "text-2xl";

  return (
    <div className={`text-center text-gray-500 ${wrapperClass}`}>
      <i className={`${icon} ${iconClass}`}></i>
      <div className="mt-2 text-sm font-medium text-gray-600">{title}</div>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      {children && <div className="mt-3 flex justify-center">{children}</div>}
    </div>
  );
}
