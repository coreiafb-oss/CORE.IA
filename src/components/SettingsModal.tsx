import React, { useState } from 'react';
import { X, Box, Eye, Edit3, Disc, CheckCircle2, Sparkles, LayoutList, Circle } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const [savedSettings, setSavedSettings] = useLocalStorage('line_os_gestor_settings', {
    defaultType: true,
    defaultViews: true,
    customFields: true,
    statuses: true,
  });

  const [settings, setSettings] = useState(savedSettings);

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = () => {
    setSavedSettings(settings);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-xl w-[600px] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 pb-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Configurações da lista</h2>
            <p className="text-sm text-gray-400 mt-1">Escolha entre nossas configurações sugeridas ou comece com uma lista em branco.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#2b2b2b] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 pt-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
            Configurações de IA sugeridas para <span className="text-white flex items-center gap-1"><LayoutList className="w-4 h-4" /> Clientes</span>
          </div>

          {/* Option 1 */}
          <SettingCard
            icon={<Box className="w-5 h-5 text-primary" />}
            title="Tipo de tarefa padrão"
            description="Client"
            enabled={settings.defaultType}
            onToggle={() => toggle('defaultType')}
          />

          {/* Option 2 */}
          <SettingCard
            icon={<Eye className="w-5 h-5 text-primary" />}
            title="Visualizações padrão"
            description="List (Client List), Board (Client Pipeline), Table (Client Database)"
            enabled={settings.defaultViews}
            onToggle={() => toggle('defaultViews')}
          />

          {/* Option 3 */}
          <SettingCard
            icon={<Edit3 className="w-5 h-5 text-primary" />}
            title="Campos personalizados"
            description="Faturamento Anual Contratado, Última Reunião De Sucesso, Índice De Saúde Do Cliente, Repositório De Documentação, Segmento De Atuação"
            enabled={settings.customFields}
            onToggle={() => toggle('customFields')}
          />

          {/* Option 4 */}
          <SettingCard
            icon={<Disc className="w-5 h-5 text-primary" />}
            title="Status"
            description=""
            enabled={settings.statuses}
            onToggle={() => toggle('statuses')}
          >
            <p className="text-sm text-gray-400 flex items-center gap-1 flex-wrap">
              <span className="text-red-500">New Client</span> → <span className="text-blue-500">Contacted</span> → <span className="text-yellow-500">Negotiating</span> → <span className="text-green-500">Onboarding</span> → <span className="text-primary">Active Client</span> → <span className="text-gray-500">Churned/Lost</span>
            </p>
          </SettingCard>
        </div>

        <div className="p-6 pt-2 flex items-center justify-end gap-3">
          <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Não, obrigado
          </button>
          <button onClick={handleApply} className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary text-white rounded-md transition-colors flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingCard = ({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) => (
  <div
    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
      enabled
        ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
        : 'border-[#333] bg-transparent hover:bg-white/5 opacity-60'
    }`}
    onClick={onToggle}
  >
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {children}
    </div>
    <div className={`w-5 h-5 rounded flex items-center justify-center text-white transition-colors ${
      enabled ? 'bg-primary' : 'bg-[#333]'
    }`}>
      {enabled ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 text-gray-600" />}
    </div>
  </div>
);

export default SettingsModal;
