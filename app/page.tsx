
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const fromEbom = searchParams.get('from') === 'ebom';
  const deepLinkNode = searchParams.get('node');
  const [activeModule, setActiveModule] = useState(
    fromEbom ? 'structure' : 'dashboard',
  );
  const [selectedProject, setSelectedProject] = useState('航空发动机项目');
  const badgeCount = deepLinkNode ? 3 : 0;

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
                </div>
                <NodeTestBadge count={badgeCount} />
              </div>
            </section>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
