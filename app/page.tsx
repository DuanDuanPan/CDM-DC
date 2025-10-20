
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/dashboard/Dashboard';
import DataExplorer from '../components/explorer/DataExplorer';
import ProductStructure from '../components/structure/ProductStructure';
import CompareCenter from '../components/compare/CompareCenter';
import UploadManager from '../components/upload/UploadManager';
import CompletionPanel from '../components/completion/CompletionPanel';
import RelationGraph from '../components/graph/RelationGraph';
import Settings from '../components/settings/Settings';
import NodeTestBadge from '../components/tbom/structure/NodeTestBadge';

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">正在加载深链入口…</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromEbom = searchParams.get('from') === 'ebom';
  const deepLinkNode = searchParams.get('node');
  const deepLinkPath = searchParams.get('path');
  const [activeModule, setActiveModule] = useState(
    fromEbom ? 'structure' : 'dashboard',
  );
  const [selectedProject, setSelectedProject] = useState('航空发动机项目');
  const badgeCount = deepLinkNode ? 3 : 0;

  const tbomHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('from', 'ebom');
    if (deepLinkNode) params.set('node', deepLinkNode);
    if (deepLinkPath) params.set('path', deepLinkPath);
    return `/tbom${params.toString() ? `?${params.toString()}` : ''}`;
  }, [deepLinkNode, deepLinkPath]);

  useEffect(() => {
    if (fromEbom) {
      setActiveModule('structure');
    }
  }, [fromEbom]);

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'explorer':
        return <DataExplorer />;
      case 'structure':
        return <ProductStructure />;
      case 'compare':
        return <CompareCenter />;
      case 'upload':
        return <UploadManager />;
      case 'completion':
        return <CompletionPanel />;
      case 'graph':
        return <RelationGraph />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Header 
        selectedProject={selectedProject} 
        onProjectChange={setSelectedProject}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar 
          activeModule={activeModule} 
          onModuleChange={setActiveModule} 
        />

        <main className="flex-1 overflow-auto">
          {fromEbom && (
            <section
              aria-label="结构节点过滤入口"
              className="border-b border-blue-100 px-6 py-4 bg-blue-50 text-blue-900"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">按结构节点过滤</p>
                  <p className="text-xs text-blue-700">
                    当前节点：{deepLinkNode ?? '未指定'}
                  </p>
                  <p className="mt-2 text-xs text-blue-700">
                    已推出新的试验 BOM 页面，可直接在专用视图中完成筛选与深链。
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <NodeTestBadge count={badgeCount} />
                  <button
                    type="button"
                    onClick={() => router.push(tbomHref)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <i className="ri-external-link-line" />
                    打开 TBOM 结构导航
                  </button>
                </div>
              </div>
            </section>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
