
'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import NodeTestBadge from '../components/tbom/structure/NodeTestBadge';
import { useDeepLinkState } from './hooks/useDeepLinkState';

const Dashboard = dynamic(() => import('../components/dashboard/Dashboard'));
const DataExplorer = dynamic(() => import('../components/explorer/DataExplorer'));
const ProductStructure = dynamic(() => import('../components/structure/ProductStructure'));
const CompareCenter = dynamic(() => import('../components/compare/CompareCenter'));
const UploadManager = dynamic(() => import('../components/upload/UploadManager'));
const CompletionPanel = dynamic(() => import('../components/completion/CompletionPanel'));
const RelationGraph = dynamic(() => import('../components/graph/RelationGraph'));
const Settings = dynamic(() => import('../components/settings/Settings'));

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">正在加载深链入口…</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const {
    activeModule,
    handleModuleChange,
    tbomDeepLink,
    deepLinkNode,
    isFromEbom,
    badgeCount,
    openTbom,
  } = useDeepLinkState();
  const [selectedProject, setSelectedProject] = useState('航空发动机项目');

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard tbomLink={tbomDeepLink} />;
      case 'explorer':
        return <DataExplorer />;
      case 'structure':
        return <ProductStructure tbomLink={tbomDeepLink} />;
      case 'compare':
        return <CompareCenter tbomLink={tbomDeepLink} />;
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
          onModuleChange={handleModuleChange} 
        />

        <main className="flex-1 overflow-auto">
          {isFromEbom && (
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
                    onClick={openTbom}
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
