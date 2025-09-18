"use client";

import { useMemo } from "react";

interface ActuatorSpec {
  stroke?: string;
  resolution?: string;
  resp_time_ms?: string;
  fail_state?: string;
}

interface ActuatorsConfig {
  igv?: ActuatorSpec;
  vgv?: ActuatorSpec;
  vbv?: ActuatorSpec;
}

interface AntiSurgeSchedulerProps {
  actuators: ActuatorsConfig;
  minSurgeMargin: string; // e.g. '15%'
}

type CheckResult = { label: string; status: 'ok' | 'warn' | 'risk'; note?: string };

const pill = (status: CheckResult['status']) =>
  status === 'ok'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : status === 'warn'
    ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-red-50 text-red-600 border border-red-200';

const AntiSurgeScheduler = ({ actuators, minSurgeMargin }: AntiSurgeSchedulerProps) => {
  // 简易调度表（演示）：按相对转速给出 IGV/VGV/VBV 推荐/当前值
  const schedule = useMemo(() => ([
    { Npct: 60, igv: -10, vgv: -4, vbv: 45 },
    { Npct: 70, igv: -6, vgv: -2, vbv: 30 },
    { Npct: 80, igv: -2, vgv: 0, vbv: 18 },
    { Npct: 90, igv: 0, vgv: 1, vbv: 8 },
    { Npct: 100, igv: 2, vgv: 2, vbv: 2 }
  ]), []);

  const checks: CheckResult[] = useMemo(() => {
    const results: CheckResult[] = [];
    // 1) IGV/VGV 单调性（随转速上升，角度不应突变剧烈）
    const monoIGV = schedule.every((row, idx, arr) => idx === 0 || row.igv >= arr[idx - 1].igv);
    const monoVGV = schedule.every((row, idx, arr) => idx === 0 || row.vgv >= arr[idx - 1].vgv);
    results.push({ label: 'IGV/VGV 调度单调性', status: monoIGV && monoVGV ? 'ok' : 'warn', note: monoIGV && monoVGV ? undefined : '发现角度回退/突变' });

    // 2) VBV 随转速关闭（低速大开，高速小开）
    const monoVBV = schedule.every((row, idx, arr) => idx === 0 || row.vbv <= arr[idx - 1].vbv);
    results.push({ label: 'VBV 随速关闭规律', status: monoVBV ? 'ok' : 'warn' });

    // 3) 最小防喘裕度规则（演示：以 VBV≥30、IGV≤-6 在低速段形成足够裕度）
    const minSM = parseFloat((minSurgeMargin.match(/[0-9.]+/) || ['15'])[0]);
    const lowSpeedOK = schedule.filter(r => r.Npct <= 70).every(r => r.vbv >= 30 && r.igv <= -6);
    results.push({ label: `低速段防喘（目标 ≥ ${minSM}%）`, status: lowSpeedOK ? 'ok' : (minSM <= 12 ? 'warn' : 'risk'), note: lowSpeedOK ? undefined : '建议提高低速 VBV 或减小 IGV' });

    // 4) 执行机构能力与响应时间（演示规则）
    const respIgv = parseFloat(actuators.igv?.resp_time_ms || '100');
    const respVgv = parseFloat(actuators.vgv?.resp_time_ms || '100');
    const respOk = respIgv <= 120 && respVgv <= 120; // 简化阈值
    results.push({ label: '执行机构响应能力', status: respOk ? 'ok' : 'warn', note: respOk ? undefined : '响应时间>120ms，检查低温性能' });

    return results;
  }, [schedule, minSurgeMargin, actuators]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">防喘调度与联锁</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              <i className="ri-shield-keyhole-line"></i>
              最小防喘裕度 {minSurgeMargin}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">检查 IGV/VGV/VBV 调度规律与执行能力，辅助联锁一致性校核（演示规则）。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 transition-colors duration-150 hover:border-blue-200 hover:text-blue-600"
          >
            <i className="ri-download-2-line"></i>
            导出调度表
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 transition-colors duration-150 hover:border-blue-200 hover:text-blue-600"
          >
            <i className="ri-git-merge-line"></i>
            联锁规则
          </button>
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400"></span>通过</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400"></span>提示</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400"></span>风险</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7 overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">N %</th>
                <th className="px-3 py-2 text-left">IGV °</th>
                <th className="px-3 py-2 text-left">VGV °</th>
                <th className="px-3 py-2 text-left">VBV %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {schedule.map(row => (
                <tr key={row.Npct} className="transition-colors duration-150 hover:bg-blue-50/60">
                  <td className="px-3 py-2 text-gray-900 font-medium">{row.Npct}</td>
                  <td className="px-3 py-2">{row.igv}</td>
                  <td className="px-3 py-2">{row.vgv}</td>
                  <td className="px-3 py-2">{row.vbv}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-[11px] text-gray-500">注：表格值为演示数据，可替换为实时/地图联动计算结果。</div>
        </div>

        <div className="space-y-3 xl:col-span-5">
          <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-4">
            <div className="text-sm font-medium text-gray-900">校核结果</div>
            <div className="mt-2 space-y-2">
              {checks.map((c, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white p-2">
                  <div className="text-xs text-gray-700">{c.label}{c.note ? <span className="ml-1 text-amber-600">（{c.note}）</span> : null}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pill(c.status)}`}>
                    {c.status === 'ok' ? '通过' : c.status === 'warn' ? '提示' : '风险'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-900">执行机构能力</div>
            <div className="mt-2 grid gap-2 text-xs text-gray-600" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
              <span>IGV 响应：{actuators.igv?.resp_time_ms || '—'} ms</span>
              <span>VGV 响应：{actuators.vgv?.resp_time_ms || '—'} ms</span>
              <span>IGV 失效位：{actuators.igv?.fail_state || '—'}</span>
              <span>VGV 失效位：{actuators.vgv?.fail_state || '—'}</span>
              <span>VBV 失效位：{actuators.vbv?.fail_state || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AntiSurgeScheduler;
