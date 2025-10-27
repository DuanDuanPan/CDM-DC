'use client';

import { useCallback, useMemo, useState } from 'react';
import type { SimulationCorrelationPlan, SimulationComparePayload } from './types';

const statusStyle: Record<SimulationCorrelationPlan['status'], string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  risk: 'bg-red-50 text-red-600 border-red-200',
  done: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusLabel: Record<SimulationCorrelationPlan['status'], string> = {
  scheduled: '排期中',
  risk: '存在风险',
  done: '已完成',
};

type FeedbackState = {
  type: 'success' | 'warning' | 'error';
  message: string;
};

interface SimulationCorrelationPlanProps {
  plans?: SimulationCorrelationPlan[];
  onRefresh?: () => void;
}

const TBOM_COMPARE_STORAGE_KEY = 'tbomComparePayload';
const TBOM_COMPARE_EVENT = 'tbom-compare:payload-updated';

const SimulationCorrelationPlanSection = ({ plans = [], onRefresh }: SimulationCorrelationPlanProps) => {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const activePlans = useMemo(() => plans.filter((plan) => plan.status !== 'done'), [plans]);
  const donePlans = useMemo(() => plans.filter((plan) => plan.status === 'done'), [plans]);

  const setFeedbackWithTimeout = useCallback((nextFeedback: FeedbackState) => {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 3200);
  }, []);

  const broadcastPayload = useCallback((payload: SimulationComparePayload) => {
    try {
      window.localStorage.setItem(
        TBOM_COMPARE_STORAGE_KEY,
        JSON.stringify({ ...payload, generatedAt: new Date().toISOString() })
      );
    } catch (error) {
      console.warn('[SimulationCorrelationPlan] 写入 Compare payload 失败', error);
      throw error;
    }
    try {
      window.dispatchEvent(new CustomEvent(TBOM_COMPARE_EVENT, { detail: payload }));
    } catch (error) {
      console.warn('[SimulationCorrelationPlan] 广播 Compare payload 失败', error);
    }
  }, []);

  const handleSendToCompare = useCallback(
    (plan: SimulationCorrelationPlan) => {
      if (!plan.comparePayload) {
        setFeedbackWithTimeout({
          type: 'warning',
          message: plan.guidance ?? '仿真结果尚未上传，暂无法送入 Compare。',
        });
        return;
      }
      try {
        broadcastPayload(plan.comparePayload);
        setFeedbackWithTimeout({
          type: 'success',
          message: `已将「${plan.name}」的试验/仿真上下文送入 Compare。`,
        });
      } catch {
        setFeedbackWithTimeout({
          type: 'error',
          message: '写入 Compare payload 失败，请稍后重试。若持续失败，请检查浏览器存储策略。',
        });
      }
    },
    [broadcastPayload, setFeedbackWithTimeout]
  );

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
      return;
    }
    try {
      const raw = window.localStorage.getItem(TBOM_COMPARE_STORAGE_KEY);
      const payload = raw ? (JSON.parse(raw) as SimulationComparePayload) : undefined;
      window.dispatchEvent(new CustomEvent(TBOM_COMPARE_EVENT, { detail: payload }));
      setFeedbackWithTimeout({
        type: 'success',
        message: '已刷新 Compare payload，请在 Compare 页面查看最新上下文。',
      });
    } catch (error) {
      console.warn('[SimulationCorrelationPlan] 刷新 Compare payload 失败', error);
      setFeedbackWithTimeout({
        type: 'error',
        message: '刷新 Compare payload 失败，请稍后重试。',
      });
    }
  }, [onRefresh, setFeedbackWithTimeout]);

  const totalPlans = plans.length;
  const warningCount = plans.filter((plan) => plan.status === 'risk').length;
  const readyCount = plans.filter((plan) => Boolean(plan.comparePayload)).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <i className="ri-slideshow-3-line text-lg text-blue-500"></i>
            仿真对标计划
          </p>
          <h3 className="text-lg font-semibold text-slate-900">试验 / 仿真联动与 Compare 对接</h3>
          <p className="text-xs text-slate-500">
            跟踪试验计划关联的仿真模型与指标，确认 Compare 载荷准备情况，对缺失项给出补充指引。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-600 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <i className="ri-refresh-line"></i>
            刷新 Compare payload
          </button>
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
            <i className="ri-bar-chart-2-line"></i>
            计划 {totalPlans} · 可送 Compare {readyCount} · 风险 {warningCount}
          </span>
        </div>
      </div>

      {feedback ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : feedback.type === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <i
              className={
                feedback.type === 'success'
                  ? 'ri-check-line'
                  : feedback.type === 'warning'
                  ? 'ri-alert-line'
                  : 'ri-error-warning-line'
              }
            ></i>
            <span>{feedback.message}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">在研试验计划</h4>
            <span className="text-xs text-slate-400">{activePlans.length} 项</span>
          </div>
          <div className="space-y-3">
            {activePlans.length ? (
              activePlans.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm shadow-sm transition hover:border-blue-200 hover:bg-white"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-slate-900">{plan.name}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${statusStyle[plan.status]}`}>
                          <i className="ri-timer-2-line"></i>
                          {statusLabel[plan.status]}
                        </span>
                        {plan.lastSyncedAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                            <i className="ri-time-line"></i>
                            同步 {plan.lastSyncedAt}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        模型：{plan.model} · 指标：{plan.metric} · 目标偏差 {plan.targetDelta}
                      </p>
                      <p className="text-xs text-slate-500">试验窗口：{plan.window}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <button
                        type="button"
                        onClick={() => handleSendToCompare(plan)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
                          plan.comparePayload
                            ? 'border-blue-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50'
                            : 'cursor-not-allowed border-dashed border-slate-300 bg-slate-100 text-slate-400'
                        }`}
                        aria-disabled={!plan.comparePayload}
                      >
                        <i className="ri-slideshow-3-line"></i>
                        送入 Compare
                      </button>
                      {plan.comparePayload ? (
                        <span className="text-[11px] text-blue-500">
                          试验 {plan.comparePayload.testId} · 运行 {plan.comparePayload.runId}
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 flex items-center gap-1">
                          <i className="ri-information-line"></i>
                          {plan.guidance ?? '等待仿真结果上传或映射。'}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
                <i className="ri-calendar-check-line text-2xl text-slate-400"></i>
                <p className="mt-2">暂无待对标的试验计划，所有计划均已完成或移交。</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">已完成 & 补充指引</h4>
            <span className="text-xs text-slate-400">{donePlans.length} 项</span>
          </div>
          <div className="space-y-3">
            {donePlans.length ? (
              donePlans.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-emerald-900">{plan.name}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${statusStyle[plan.status]}`}>
                      <i className="ri-checkbox-circle-line"></i>
                      {statusLabel[plan.status]}
                    </span>
                    {plan.lastSyncedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
                        <i className="ri-time-line"></i>
                        同步 {plan.lastSyncedAt}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    模型：{plan.model} · 指标：{plan.metric} · 目标偏差 {plan.targetDelta}
                  </p>
                  <p className="text-xs text-emerald-700">窗口：{plan.window}</p>
                  {plan.guidance ? (
                    <p className="mt-2 text-xs text-emerald-700 leading-relaxed">{plan.guidance}</p>
                  ) : null}
                  {plan.comparePayload ? (
                    <p className="mt-2 text-[11px] text-emerald-700">
                      已同步 Compare payload（运行 {plan.comparePayload.runId}）。
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-8 text-center text-sm text-emerald-700">
                <i className="ri-compass-line text-2xl"></i>
                <p className="mt-2">暂无已完成记录，可在试验完成后归档并补充留档指引。</p>
              </div>
            )}
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-xs text-blue-800">
              <div className="flex items-center gap-2 font-semibold">
                <i className="ri-lightbulb-flash-line text-base"></i>
                Compare 使用建议
              </div>
              <ul className="mt-2 space-y-1 leading-relaxed">
                <li>• 送入 Compare 后，可在 Compare 右上角看到“来自试验驾驶舱”的上下文提示。</li>
                <li>• 若 Compare 未自动加载，请点击此处的“刷新 Compare payload”按钮重新广播。</li>
                <li>• 缺失的仿真结果可在仿真视图中补充，或联系仿真团队更新模型输出。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimulationCorrelationPlanSection;
