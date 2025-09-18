
'use client';

import { useState } from 'react';
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

export default function Home() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState('航空发动机项目');

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
          {renderContent()}
        </main>
      </div>
    </div>
  );
}