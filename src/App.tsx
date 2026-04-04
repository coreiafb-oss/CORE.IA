import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ClickUpInterface from './components/ClickUpInterface';
import LineOsSidebar, { LineOsTab } from './components/LineOsSidebar';
import LineOsTopBar from './components/LineOsTopBar';
import AprovacaoConteudo from './components/AprovacaoConteudo';
import CrmVendas from './components/CrmVendas';
import FinanceiroDre from './components/FinanceiroDre';
import Academy from './components/Academy';
import Agendamento from './components/Agendamento';
import CommandPalette from './components/CommandPalette';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import { useAuth } from './context/AuthContext';

function App() {
  const { session, isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<LineOsTab>('dashboard');
  const [showPalette, setShowPalette] = useState(false);

  // Global Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNavigate = useCallback((tab: LineOsTab) => {
    setActiveTab(tab);
    setShowPalette(false);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'gestor':
        return <ClickUpInterface />;
      case 'aprovacao':
        return <AprovacaoConteudo />;
      case 'crm':
        return <CrmVendas />;
      case 'financeiro':
        return <FinanceiroDre />;
      case 'academy':
        return <Academy />;
      case 'agendamento':
        return <Agendamento />;
      default:
        return <div className="p-8 text-white">Em desenvolvimento...</div>;
    }
  };

  // Auth loading state
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--surface-0)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-primary)] animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-white/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <div className="text-center">
            <p className="text-white/80 text-[13px] font-medium tracking-wide">LINE OS</p>
            <p className="text-white/30 text-xs mt-1">Verificando sessão...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not authenticated → show login
  if (!session) {
    return <LoginPage />;
  }

  // Authenticated → show app
  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: 'var(--surface-0)', color: 'var(--text-secondary)' }}>
      <LineOsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <LineOsTopBar
          activeTab={activeTab}
          onOpenPalette={() => setShowPalette(true)}
        />
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        onNavigate={handleNavigate}
        activeTab={activeTab}
      />
    </div>
  );
}

export default App;
