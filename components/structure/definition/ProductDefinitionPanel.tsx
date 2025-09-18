"use client";

import { useEffect, useMemo, useState } from "react";
import { getDefinitionByNode } from "../../structure/data/productDefinition";
import type { ProductDefinitionPayload } from "./types";
import CompressorMapPanel from "./compressor/CompressorMapPanel";
import AntiSurgeScheduler from "./compressor/AntiSurgeScheduler";

interface NodeLike {
  id: string;
  name?: string;
  unitType?: string;
  subsystemType?: string;
}

interface ProductDefinitionPanelProps {
  node: NodeLike | null;
  versionId: string;
  onNavigateToNode?: (nodeId: string) => void;
  defaultRole?: 'system' | 'assembly' | 'component';
}

const VIEW_PREF_PREFIX = "product-definition-view-pref";

type DefinitionView = "system" | "specialized";

const statusTone: Record<'ok' | 'warn' | 'risk', string> = {
  ok: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border border-amber-200',
  risk: 'bg-red-50 text-red-600 border border-red-200'
};

const SectionCard: React.FC<{ icon: string; title: string; children: any }> = ({ icon, title, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm h-full flex flex-col">
    <div className="flex items-center gap-2 mb-3">
      <i className={`${icon} text-blue-600`}></i>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="text-sm text-gray-700">
      {children}
    </div>
  </section>
);

const KeyValueList: React.FC<{ items: Array<{ label: string; value: string }>; cols?: 2 | 3 }>
  = ({ items, cols = 2 }) => (
  <div className={`grid gap-3 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
    {items.map((it, idx) => (
      <div key={`${it.label}-${idx}`} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2 bg-slate-50/60">
        <span className="text-gray-500">{it.label}</span>
        <span className="font-medium text-gray-900">{it.value}</span>
      </div>
    ))}
  </div>
);

const Badge: React.FC<{ text: string; tone?: "blue" | "green" | "purple" | "orange" | "gray" }>
  = ({ text, tone = 'gray' }) => {
  const map: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-700'
  };
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${map[tone]}`}>{text}</span>;
};

const ProductDefinitionPanel: React.FC<ProductDefinitionPanelProps> = ({ node, versionId, onNavigateToNode, defaultRole }) => {
  const [payload, setPayload] = useState<ProductDefinitionPayload | null>(null);
  const [view, setView] = useState<DefinitionView>("system");
  const [validationResult, setValidationResult] = useState<Array<{ title: string; status: 'ok' | 'warn' | 'risk'; note?: string }>>([]);
  // 读写视图偏好
  useEffect(() => {
    if (!node) return;
    const key = `${VIEW_PREF_PREFIX}-${node.id}`;
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(key) as DefinitionView | null : null;
    if (stored) {
      setView(stored);
    } else {
      // 默认：按节点与角色：compressor + 组件/仿真工程师 => specialized；总体/管理 => system
      if (node.subsystemType === 'compressor') {
        if (defaultRole === 'component') setView('specialized');
        else setView('system');
      } else {
        setView('system');
      }
    }
  }, [node, defaultRole]);

  useEffect(() => {
    if (!node) {
      setPayload(null);
      return;
    }
    const data = getDefinitionByNode(node, versionId);
    setPayload(data);
  }, [node, versionId]);

  useEffect(() => {
    if (!node || typeof window === 'undefined') return;
    const key = `${VIEW_PREF_PREFIX}-${node.id}`;
    window.localStorage.setItem(key, view);
  }, [view, node]);

  useEffect(() => {
    setValidationResult([]);
  }, [node?.id]);

  const isCompressor = node?.subsystemType === 'compressor' || Boolean(payload?.compressor);

  const SummaryCard = useMemo(() => {
    if (!payload) return null;
    const effectivityText = payload.meta.effectivity?.lot
      ? `批次 ${payload.meta.effectivity.lot}`
      : payload.meta.effectivity?.dateRange
      ? `${payload.meta.effectivity.dateRange[0]} → ${payload.meta.effectivity.dateRange[1]}`
      : '—';
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">产品定义摘要</h2>
              <Badge text={`版本 ${payload.meta.version}`} tone="blue" />
              <Badge text={`基线 ${payload.meta.baseline}`} tone="purple" />
              <Badge text={`状态 ${payload.meta.status}`} tone="green" />
            </div>
            <div className="text-sm text-gray-600">
              Owner：{payload.meta.owner} · TRL/DML：{payload.meta.maturity.trl}{payload.meta.maturity.dml ? ` / ${payload.meta.maturity.dml}` : ''}
            </div>
            <div className="text-xs text-gray-500">
              BOM路径：{payload.meta.bomPath.join(' / ')} · CI：{payload.meta.ci}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {isCompressor && (
              <div className="flex rounded-full border border-blue-200 bg-blue-50/60 p-1 text-xs shadow-inner">
                {[
                  { id: 'system', name: '系统视图' },
                  { id: 'specialized', name: '专业视图' }
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setView(btn.id as DefinitionView)}
                    className={`px-3 py-1 rounded-full transition-colors duration-150 ${view === btn.id ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-700 hover:bg-white/80'}`}
                    aria-pressed={view === btn.id}
                  >
                    {btn.name}
                  </button>
                ))}
              </div>
            )}
            <button
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => {
                if (!payload) return;
                const checks: Array<{ title: string; status: 'ok' | 'warn' | 'risk'; note?: string }> = [];
                // 必填校核（示例）
                if (payload.meta.owner) {
                  checks.push({ title: '责任人填写', status: 'ok' });
                } else {
                  checks.push({ title: '责任人填写', status: 'risk', note: '缺少Owner' });
                }
                if (payload.interfaces.upstream && payload.interfaces.downstream) {
                  checks.push({ title: '上下游接口引用', status: 'ok' });
                } else {
                  checks.push({ title: '上下游接口引用', status: 'warn', note: '请补全接口引用' });
                }
                if (isCompressor && payload.compressor?.surge_margin_min) {
                  checks.push({ title: '防喘最小稳定裕度', status: 'ok' });
                }
                // 合格准则/证据（示例）
                if (payload.testvv.acceptance.length > 0 && payload.testvv.evidence.length > 0) {
                  checks.push({ title: '合格准则与证据挂接', status: 'ok' });
                } else {
                  checks.push({ title: '合格准则与证据挂接', status: 'warn', note: '请补充验证闭环证据' });
                }
                setValidationResult(checks);
              }}
            >
              校核并生成签审记录
            </button>
          </div>
        </div>
            {isCompressor && payload.compressor && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
                  <div className="text-xs text-gray-500">设计点 ṁ</div>
                  <div className="text-sm font-semibold text-gray-900">{payload.compressor.design_point.m_dot}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
                  <div className="text-xs text-gray-500">πc / N</div>
                  <div className="text-sm font-semibold text-gray-900">{payload.compressor.design_point.pi_c} / {payload.compressor.design_point.N}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
                  <div className="text-xs text-gray-500">η_is / W_shaft</div>
                  <div className="text-sm font-semibold text-gray-900">{payload.compressor.design_point.eta_is} / {payload.compressor.design_point.W_shaft}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
                  <div className="text-xs text-gray-500">最小防喘裕度</div>
                  <div className="text-sm font-semibold text-gray-900">{payload.compressor.surge_margin_min}</div>
                </div>
              </div>
            )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">效期</div>
            <div className="text-sm font-semibold text-gray-900">{effectivityText}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">责任人</div>
            <div className="text-sm font-semibold text-gray-900">{payload.meta.owner}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">成熟度里程碑</div>
            <div className="text-sm font-semibold text-gray-900">{payload.meta.maturity.milestones.join(' / ')}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">证据数量</div>
            <div className="text-sm font-semibold text-gray-900">{payload.meta.maturity.evidenceLinks.length}</div>
          </div>
        </div>
      </div>
    );
  }, [payload, isCompressor, view]);

  if (!node) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50/60 p-10 text-center text-gray-500">
        <i className="ri-book-2-line text-4xl"></i>
        <p className="mt-3 text-sm">请选择BOM节点以查看产品定义</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
        加载产品定义数据中...
      </div>
    );
  }

  const SystemSection = (
    <SectionCard icon="ri-compass-3-line" title="总体/系统">
      <div className="space-y-3">
        <KeyValueList
          items={payload.system.functionalBoundary.objectivesConstraints.map(x => ({ label: x.name, value: x.unit ? `${x.value} ${x.unit}` : x.value }))}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">工况包</div>
            <div className="text-sm text-gray-900">{payload.system.functionalBoundary.conditions.join(' / ')}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">性能包线</div>
            <div className="text-sm text-gray-900">{payload.system.performanceEnvelope.map(i => i.name).join('，')}</div>
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const CombustionSection = (
    <SectionCard icon="ri-fire-line" title="燃烧/热工接口">
      <div className="space-y-3">
        <KeyValueList items={payload.combustion.injectorSide.map(x => ({ label: x.name, value: x.unit ? `${x.value} ${x.unit}` : x.value }))} />
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">瞬态约束</div>
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {payload.combustion.transients.map((t, i) => (
              <li key={i}>{t.name}：{t.limit}{t.remark ? `（${t.remark}）` : ''}</li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );

  const FeedSection = (
    <SectionCard icon="ri-funds-line" title="输送/涡轮泵">
      <div className="space-y-3">
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">回路定义</div>
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {payload.feed.loops.map((l, i) => (
              <li key={i}>{l.medium} · {l.flow} · 入口 {l.inlet} → 出口 {l.outlet}{l.cleanliness ? ` · 清洁度 ${l.cleanliness}` : ''}</li>
            ))}
          </ul>
        </div>
        <KeyValueList items={payload.feed.cavitationStability.map(x => ({ label: x.name, value: x.unit ? `${x.value} ${x.unit}` : x.value }))} />
      </div>
    </SectionCard>
  );

  const StructuresSection = (
    <SectionCard icon="ri-building-2-line" title="结构与材料">
      <div className="space-y-3">
        <KeyValueList items={[{ label: '承压等级', value: payload.structures.pressureClass }, ...payload.structures.safetyFactors.map(x => ({ label: x.name, value: x.value }))]} />
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">材料与接头</div>
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {payload.structures.materialsJoints.map((m, i) => (
              <li key={i}>{m.name} · {m.spec}{m.reference ? ` · ${m.reference}` : ''}</li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );

  const ControlsSection = (
    <SectionCard icon="ri-cpu-line" title="控制与测量">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {payload.controls.controlledVars.map((c, i) => (
            <div className="rounded-lg bg-slate-50 p-3 border border-gray-100" key={i}>
              <div className="text-xs text-gray-500">{c.name}</div>
              <div className="text-sm text-gray-900">目标：{c.target}</div>
              {c.limits && <div className="text-xs text-gray-600">限幅：{c.limits}</div>}
              {c.rateLimit && <div className="text-xs text-gray-600">速率限制：{c.rateLimit}</div>}
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">状态机与联锁</div>
          <div className="text-sm text-gray-900">{payload.controls.stateMachine}</div>
        </div>
      </div>
    </SectionCard>
  );

  const ManufacturingSection = (
    <SectionCard icon="ri-tools-line" title="工艺与制造">
      <div className="space-y-3">
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">关键工艺窗口</div>
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {payload.manufacturing.keyWindows.map((k, i) => (
              <li key={i}>{k.name} · {k.window}{k.procedureRef ? ` · ${k.procedureRef}` : ''}</li>
            ))}
          </ul>
        </div>
        <KeyValueList items={payload.manufacturing.qcPoints.map(x => ({ label: x.name, value: x.spec }))} />
      </div>
    </SectionCard>
  );

  const TestVVSection = (
    <SectionCard icon="ri-test-tube-line" title="试验与 V&V">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">计划</div>
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {payload.testvv.plans.map((p, i) => (<li key={i}>{p.name} · {p.scope}</li>))}
          </ul>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">仪表与精度</div>
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {payload.testvv.instrumentation.map((p, i) => (<li key={i}>{p.name} · {p.spec}</li>))}
          </ul>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">合格准则</div>
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {payload.testvv.acceptance.map((p, i) => (<li key={i}>{p.name} · {p.criteria}</li>))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );

  const InterfaceOverview = (
    <SectionCard icon="ri-exchange-box-line" title="接口一览">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">上游</div>
            <div className="text-sm flex items-center gap-2">
              <span className="text-gray-900">{payload.interfaces.upstream?.label || '—'}</span>
              {payload.interfaces.upstream?.id && onNavigateToNode && (
                <button
                  className="inline-flex items-center h-7 gap-1 rounded-full border border-blue-200 bg-white px-2.5 text-xs font-medium text-blue-700 hover:border-blue-300 hover:text-blue-800 whitespace-nowrap leading-none"
                  onClick={() => onNavigateToNode(payload.interfaces.upstream!.id)}
                >
                  <i className="ri-external-link-line text-sm"></i>
                  跳转
                </button>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">下游</div>
            <div className="text-sm flex items-center gap-2">
              <span className="text-gray-900">{payload.interfaces.downstream?.label || '—'}</span>
              {payload.interfaces.downstream?.id && onNavigateToNode && (
                <button
                  className="inline-flex items-center h-7 gap-1 rounded-full border border-blue-200 bg-white px-2.5 text-xs font-medium text-blue-700 hover:border-blue-300 hover:text-blue-800 whitespace-nowrap leading-none"
                  onClick={() => onNavigateToNode(payload.interfaces.downstream!.id)}
                >
                  <i className="ri-external-link-line text-sm"></i>
                  跳转
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
          <div className="text-xs text-gray-500">关联项</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {payload.interfaces.related.map((r, i) => (
              <button
                key={`${r.type}-${i}`}
                type="button"
                className="inline-flex items-center h-7 gap-1 rounded-full border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 whitespace-nowrap leading-none"
                title={`${r.type}`}
              >
                <i className={
                  r.type === 'drawing' ? 'ri-draft-line text-blue-500' :
                  r.type === 'model' ? 'ri-cube-line text-purple-500' :
                  r.type === 'procedure' ? 'ri-file-list-3-line text-amber-500' :
                  r.type === 'test' ? 'ri-test-tube-line text-rose-500' : 'ri-links-line text-gray-500'
                }></i>
                <span>{r.name}</span>
                <i className="ri-arrow-right-up-line text-sm"></i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const EvidencePanel = (
    <SectionCard icon="ri-book-mark-line" title="证据区">
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs text-gray-500 mb-1">模型</div>
          <div className="flex flex-wrap gap-2">
            {[payload.links?.cad_id, payload.links?.cfd_model_id, payload.links?.fea_model_id]
              .filter(Boolean)
              .map((id, idx) => (
                <button key={`mdl-${idx}`} className="inline-flex items-center h-7 gap-1 rounded-full border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 whitespace-nowrap leading-none">
                  <i className="ri-cube-line text-purple-500 text-sm"></i>
                  <span>{id}</span>
                  <i className="ri-external-link-line text-sm"></i>
                </button>
              ))}
            {![payload.links?.cad_id, payload.links?.cfd_model_id, payload.links?.fea_model_id].some(Boolean) && (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">报告</div>
          <div className="flex flex-wrap gap-2">
            {(payload.links?.reports || []).length > 0 ? (
              payload.links!.reports!.map((name, idx) => (
                <button key={`rep-${idx}`} className="inline-flex items-center h-7 gap-1 rounded-full border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 whitespace-nowrap leading-none">
                  <i className="ri-file-text-line text-green-600 text-sm"></i>
                  <span>{name}</span>
                  <i className="ri-external-link-line text-sm"></i>
                </button>
              ))
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">规程</div>
          <div className="flex flex-wrap gap-2">
            {(payload.links?.procedures || []).length > 0 ? (
              payload.links!.procedures!.map((name, idx) => (
                <button key={`proc-${idx}`} className="inline-flex items-center h-7 gap-1 rounded-full border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 whitespace-nowrap leading-none">
                  <i className="ri-clipboard-fill text-amber-600 text-sm"></i>
                  <span>{name}</span>
                  <i className="ri-external-link-line text-sm"></i>
                </button>
              ))
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const CompressorSpecialized = isCompressor && view === 'specialized' && payload.compressor ? (
    <div className="space-y-6">
      <SectionCard icon="ri-tornado-line" title="压气机（专业视图）">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">地图ID</div>
            <div className="text-sm text-gray-900">{payload.compressor.map_id}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">叶顶间隙</div>
            <div className="text-sm text-gray-900">{payload.compressor.geometry.tip_clearance}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-500">临界转速</div>
            <div className="text-sm text-gray-900">{payload.compressor.rotordynamics.critical_speeds.join(' / ')}</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600">IGV/VGV/VBV：已配置执行机构与故障位，用于防喘与包线调度校核。</div>
      </SectionCard>

      <CompressorMapPanel mapId={payload.compressor.map_id} designPoint={payload.compressor.design_point} />
      <AntiSurgeScheduler actuators={payload.compressor.actuators} minSurgeMargin={payload.compressor.surge_margin_min} />
    </div>
  ) : null;

  const ValidationCard = validationResult.length > 0 ? (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-3">
        <i className="ri-verified-badge-line text-green-600"></i>
        <h3 className="text-base font-semibold text-gray-900">签审校核结果</h3>
      </div>
      <ul className="space-y-2 text-sm">
        {validationResult.map((r, i) => (
          <li key={i} className="flex items-start justify-between border border-gray-100 rounded-lg p-2">
            <span className="text-gray-800">{r.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusTone[r.status]}`}>
              {r.status === 'ok' ? '通过' : r.status === 'warn' ? '提示' : '风险'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  return (
    <div className="space-y-6">
      {SummaryCard}

      {isCompressor && view === 'specialized' ? (
        <div className="space-y-6">
          {SystemSection}
          {InterfaceOverview}
          {CombustionSection}
          {EvidencePanel}
          {FeedSection}
          {ValidationCard}
          {CompressorSpecialized}
          {StructuresSection}
          {ControlsSection}
          {ManufacturingSection}
          {TestVVSection}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-12 auto-rows-fr">
          <div className="xl:col-span-8">{SystemSection}</div>
          <div className="xl:col-span-4">{InterfaceOverview}</div>

          <div className="xl:col-span-8">{CombustionSection}</div>
          <div className="xl:col-span-4">{EvidencePanel}</div>

          <div className={ValidationCard ? 'xl:col-span-8' : 'xl:col-span-12'}>{FeedSection}</div>
          {ValidationCard && <div className="xl:col-span-4">{ValidationCard}</div>}

          <div className="xl:col-span-12">{StructuresSection}</div>
          <div className="xl:col-span-12">{ControlsSection}</div>
          <div className="xl:col-span-12">{ManufacturingSection}</div>
          <div className="xl:col-span-12">{TestVVSection}</div>
          <div className="xl:col-span-12">{CompressorSpecialized}</div>
        </div>
      )}
    </div>
  );
};

export default ProductDefinitionPanel;
