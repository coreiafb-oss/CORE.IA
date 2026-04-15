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
import LineLogo from './components/LineLogo';
import { useAuth } from './context/AuthContext';
import ApprovalClientView from './components/ApprovalClientView';

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

  // Check public routes before Auth
  if (window.location.pathname.startsWith('/cliente/aprovacao')) {
    return <ApprovalClientView />;
  }

  // Auth loading state
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050507]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 blur-2xl bg-[#E31837]/20 rounded-full"
            />
            <div className="relative bg-[#0f0f12] p-6 rounded-2xl border border-white/5 shadow-2xl">
              <LineLogo className="w-12 h-12 text-[#E31837]" />
            </div>
            {/* Subtle spinner ring */}
            <div className="absolute -inset-2 border border-[#E31837]/20 rounded-3xl animate-pulse" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-[#fafafa] font-bold tracking-[0.2em] text-sm font-sans">LINE OS</h2>
            <div className="flex items-center justify-center gap-1">
              <span className="w-1 h-1 bg-[#E31837] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-[#E31837] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-[#E31837] rounded-full animate-bounce" />
            </div>
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
