"use client";

import { useMemo, useState } from "react";

type DesignPoint = { m_dot: string; pi_c: string; N: string; eta_is: string; W_shaft: string };

interface SpeedLinePoint { mdot: number; pi: number; eta?: number }
interface SpeedLine { N: number; points: SpeedLinePoint[] }
interface CompMapData { id: string; speedLines: SpeedLine[]; surgeLine: SpeedLinePoint[]; mdotRange: [number, number]; piRange: [number, number] }

interface CompressorMapPanelProps {
  mapId: string;
  designPoint: DesignPoint;
}

// 简易Mock地图：仅为可视化演示（非真实工程数据）
const MAPS: Record<string, CompMapData> = {
  "MAP-COMP-01": {
    id: "MAP-COMP-01",
    mdotRange: [0.6, 1.1],
    piRange: [10, 24],
    speedLines: [
      { N: 80, points: [
        { mdot: 0.65, pi: 12.0, eta: 0.78 },
        { mdot: 0.75, pi: 13.5, eta: 0.81 },
        { mdot: 0.85, pi: 14.2, eta: 0.82 },
        { mdot: 0.95, pi: 14.4, eta: 0.81 }
      ]},
      { N: 90, points: [
        { mdot: 0.65, pi: 14.8, eta: 0.82 },
        { mdot: 0.75, pi: 16.2, eta: 0.84 },
        { mdot: 0.85, pi: 17.1, eta: 0.85 },
        { mdot: 0.95, pi: 17.3, eta: 0.84 },
        { mdot: 1.05, pi: 17.0, eta: 0.82 }
      ]},
      { N: 100, points: [
        { mdot: 0.7, pi: 17.5, eta: 0.84 },
        { mdot: 0.8, pi: 19.0, eta: 0.86 },
        { mdot: 0.9, pi: 20.0, eta: 0.87 },
        { mdot: 1.0, pi: 20.3, eta: 0.86 }
      ]},
      { N: 110, points: [
        { mdot: 0.75, pi: 19.8, eta: 0.85 },
        { mdot: 0.85, pi: 21.5, eta: 0.87 },
        { mdot: 0.95, pi: 22.2, eta: 0.87 },
        { mdot: 1.05, pi: 22.0, eta: 0.86 }
      ]},
    ],
    surgeLine: [
      { mdot: 0.62, pi: 12.5 },
      { mdot: 0.68, pi: 15.3 },
      { mdot: 0.74, pi: 17.9 },
      { mdot: 0.80, pi: 19.8 },
      { mdot: 0.86, pi: 21.0 }
    ]
  }
};

const colors = ["#2563EB", "#16A34A", "#EA580C", "#9333EA", "#0EA5E9", "#DC2626"]; // 蓝 绿 橙 紫 青 红

const parseNum = (s: string): number => {
  const m = s.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!m || m.length === 0) return NaN;
  return parseFloat(m[0]);
};

const CompressorMapPanel = ({ mapId, designPoint }: CompressorMapPanelProps) => {
  const [showEta, setShowEta] = useState(true);
  const [visibleLines, setVisibleLines] = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState(false);

  const map = MAPS[mapId] || MAPS["MAP-COMP-01"];

  const size = { w: 520, h: 320, pad: { l: 50, r: 16, t: 16, b: 40 } };
  const mdotMin = map.mdotRange[0];
  const mdotMax = map.mdotRange[1];
  const piMin = map.piRange[0];
  const piMax = map.piRange[1];

  const xScale = (mdot: number) => size.pad.l + (mdot - mdotMin) / (mdotMax - mdotMin) * (size.w - size.pad.l - size.pad.r);
  const yScale = (pi: number) => size.h - size.pad.b - (pi - piMin) / (piMax - piMin) * (size.h - size.pad.t - size.pad.b);

  const dp = useMemo(() => ({
    mdot: parseNum(designPoint.m_dot),
    pi: parseNum(designPoint.pi_c)
  }), [designPoint]);

  const nearest = useMemo(() => {
    // 粗略寻找最近速度线
    let best: { N: number; dist: number } | null = null;
    for (const sl of map.speedLines) {
      for (const p of sl.points) {
        const d = Math.hypot((p.mdot - dp.mdot), (p.pi - dp.pi));
        if (!best || d < best.dist) best = { N: sl.N, dist: d };
      }
    }
    return best?.N ?? map.speedLines[0].N;
  }, [map, dp]);

  const surgeMarginEstimate = useMemo(() => {
    // 估算设计点到喘振线的水平距离（简化指标）
    // 距离/范围 近似为裕度（0~30%区间演示）
    let minDist = Infinity;
    for (const sp of map.surgeLine) {
      const d = Math.hypot((dp.mdot - sp.mdot), (dp.pi - sp.pi));
      if (d < minDist) minDist = d;
    }
    const norm = Math.min(Math.max(minDist / 0.25, 0), 1); // 简化归一
    return Math.round(norm * 30); // 0-30%
  }, [map, dp]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">压气机气动地图</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              <i className="ri-database-2-line"></i>
              {map.id}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">展示 ṁ–πc–N（附等熵效率η）与喘振线，叠加设计点与裕度。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <button
            type="button"
            onClick={() => setShowEta(prev => !prev)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 transition-colors duration-150 ${showEta ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600'}`}
            aria-pressed={showEta}
          >
            <i className="ri-equalizer-line"></i>
            等熵效率
          </button>
          <button
            type="button"
            onClick={() => setExpanded(prev => !prev)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 transition-colors duration-150 ${expanded ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600'}`}
            aria-pressed={expanded}
          >
            <i className={expanded ? 'ri-contract-left-right-line' : 'ri-expand-left-right-line'}></i>
            {expanded ? '收起' : '展开'}
          </button>
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-[#DC2626]"></span>
            <span>喘振线</span>
          </div>
        </div>
      </div>

      <div className={`mt-4 grid gap-4 xl:grid-cols-12 ${expanded ? 'xl:gap-y-6' : ''}`}>
        <div className={`${expanded ? 'xl:col-span-12' : 'xl:col-span-8'} overflow-x-auto transition-all duration-200`}
        >
          <svg width={size.w} height={size.h} className="bg-slate-50 rounded-lg border border-gray-100">
            {/* 轴线 */}
            <line x1={size.pad.l} y1={size.h - size.pad.b} x2={size.w - size.pad.r} y2={size.h - size.pad.b} stroke="#CBD5E1" />
            <line x1={size.pad.l} y1={size.pad.t} x2={size.pad.l} y2={size.h - size.pad.b} stroke="#CBD5E1" />
            {/* 刻度 */}
            {Array.from({ length: 6 }).map((_, i) => {
              const v = mdotMin + (i * (mdotMax - mdotMin)) / 5;
              const x = xScale(v);
              return (
                <g key={i}>
                  <line x1={x} y1={size.h - size.pad.b} x2={x} y2={size.h - size.pad.b + 4} stroke="#CBD5E1" />
                  <text x={x} y={size.h - size.pad.b + 16} fontSize="10" textAnchor="middle" fill="#64748B">{v.toFixed(2)}</text>
                </g>
              );
            })}
            {Array.from({ length: 8 }).map((_, i) => {
              const v = piMin + (i * (piMax - piMin)) / 7;
              const y = yScale(v);
              return (
                <g key={i}>
                  <line x1={size.pad.l - 4} y1={y} x2={size.pad.l} y2={y} stroke="#CBD5E1" />
                  <text x={size.pad.l - 8} y={y + 3} fontSize="10" textAnchor="end" fill="#64748B">{v.toFixed(0)}</text>
                </g>
              );
            })}
            <text x={(size.w) / 2} y={size.h - 6} fontSize="11" textAnchor="middle" fill="#475569">ṁ (kg/s)</text>
            <text x={12} y={(size.h) / 2} fontSize="11" textAnchor="middle" fill="#475569" transform={`rotate(-90 12 ${(size.h)/2})`}>πc</text>

            {/* 喘振线 */}
            <path
              d={`M ${map.surgeLine.map((p) => `${xScale(p.mdot)},${yScale(p.pi)}`).join(' L ')}`}
              stroke="#DC2626"
              strokeDasharray="4,4"
              fill="none"
            />

            {/* 速度线 */}
            {map.speedLines.map((sl, idx) => {
              const color = colors[idx % colors.length];
              const visible = visibleLines[sl.N] ?? true;
              if (!visible) return null;
              return (
                <g key={sl.N}>
                  <path d={`M ${sl.points.map(p => `${xScale(p.mdot)},${yScale(p.pi)}`).join(' L ')}`} stroke={color} strokeWidth={1.5} fill="none" />
                  {sl.points.map((p, i2) => (
                    <g key={i2}>
                      <circle cx={xScale(p.mdot)} cy={yScale(p.pi)} r={2.6} fill={color} className="transition-transform duration-150" />
                      {showEta && p.eta && (
                        <text x={xScale(p.mdot) + 6} y={yScale(p.pi) - 6} fontSize="9" fill="#334155" className="bg-white/80 backdrop-blur" >η {Math.round(p.eta * 100)}%</text>
                      )}
                    </g>
                  ))}
                </g>
              );
            })}

            {/* 设计点 */}
            {!Number.isNaN(dp.mdot) && !Number.isNaN(dp.pi) && (
              <g>
                <line x1={xScale(dp.mdot) - 6} y1={yScale(dp.pi)} x2={xScale(dp.mdot) + 6} y2={yScale(dp.pi)} stroke="#0EA5E9" />
                <line x1={xScale(dp.mdot)} y1={yScale(dp.pi) - 6} x2={xScale(dp.mdot)} y2={yScale(dp.pi) + 6} stroke="#0EA5E9" />
                <circle cx={xScale(dp.mdot)} cy={yScale(dp.pi)} r={3} fill="#0EA5E9" />
              </g>
            )}
          </svg>
        </div>
        <div className={expanded ? 'xl:col-span-12 grid gap-4 sm:grid-cols-1 xl:grid-cols-2' : 'flex flex-col gap-4 xl:col-span-4'}>
          <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">速度线与显示</div>
              <span className="text-xs text-gray-500">{Object.keys(visibleLines).length ? Object.values(visibleLines).filter(Boolean).length : map.speedLines.length} 条</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {map.speedLines.map((sl, idx) => {
                const color = colors[idx % colors.length];
                const visible = visibleLines[sl.N] ?? true;
                return (
                  <button key={sl.N} onClick={() => setVisibleLines(prev => ({ ...prev, [sl.N]: !(prev[sl.N] ?? true) }))} className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${visible ? 'border-blue-200 text-blue-700 bg-blue-50/70' : 'border-gray-200 text-gray-600 bg-white'}`}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    N={sl.N}%
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-900">设计点与裕度</div>
            <div className="mt-2 grid gap-2 text-xs text-gray-600" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
              <span>设计点：ṁ {designPoint.m_dot} · πc {designPoint.pi_c} · N {designPoint.N}</span>
              <span>最近速度线：N≈{nearest}%</span>
              <span>等熵效率：η_is {designPoint.eta_is}</span>
              <span>轴功：{designPoint.W_shaft}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${surgeMarginEstimate >= 15 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : surgeMarginEstimate >= 10 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                估算防喘裕度：{surgeMarginEstimate}%
              </span>
              {showEta && <span className="text-xs text-gray-500">显示 η 标注</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
              {map.speedLines.map((sl, idx) => {
                const color = colors[idx % colors.length];
                const visible = visibleLines[sl.N] ?? true;
                if (!visible) return null;
                return (
                  <span key={sl.N} className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }}></span>
                    N{sl.N}%
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompressorMapPanel;
