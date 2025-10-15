type NodeTestBadgeProps = {
  count: number;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

const formatLabel = (count: number) => `查看挂接试验，计数 ${count}`;

const formatLiveMessage = (count: number) =>
  count > 0 ? `共有 ${count} 个试验` : '暂无挂接试验';

export default function NodeTestBadge({
  count,
  onClick,
  className = '',
  ariaLabel,
}: NodeTestBadgeProps) {
  const containerClassName = `flex flex-col items-start gap-1 ${className}`.trim();

  return (
    <div className={containerClassName}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label={ariaLabel ?? formatLabel(count)}
      >
        <span
          aria-hidden="true"
          className="inline-flex h-2 w-2 rounded-full bg-blue-500"
        />
        <span className="font-semibold">{count}</span>
        <span className="text-xs text-blue-600">试验</span>
      </button>
      <span
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="node-test-badge-live"
      >
        {formatLiveMessage(count)}
      </span>
    </div>
  );
}
