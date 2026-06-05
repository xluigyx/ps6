import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './hooks/useWeb3';
import Navbar from './components/Navbar';
import PanelEmisor from './components/PanelEmisor';
import PortalEstudiante from './components/PortalEstudiante';
import Verificador from './components/Verificador';
import ExplorerHistorial from './components/ExplorerHistorial';

export default function App() {
  const [activeView, setActiveView] = useState('emisor');

  const VIEW_LABEL = {
    emisor:     { icon:'◈', title:'Panel del Emisor',       sub:'Rector · Director de Carrera · Fase 1' },
    estudiante: { icon:'⬡', title:'Portal del Estudiante',  sub:'Firma de Recepción · Fase 2' },
    verificar:  { icon:'⬢', title:'Verificador Público',    sub:'Consulta abierta · Sin MetaMask requerido' },
    historial:  { icon:'⛓', title:'Explorer On-Chain',      sub:'Timeline de eventos · Historial inmutable' },
  };
  const vl = VIEW_LABEL[activeView];

  return (
    <Web3Provider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
          style: {
            background: '#111827',
            color: '#F1F5F9',
            border: '2px solid #1E293B',
            borderRadius: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            boxShadow: '3px 3px 0 #1E293B',
          },
          success: { iconTheme: { primary: '#39FF14', secondary: '#111827' } },
          error:   { iconTheme: { primary: '#FF2D55', secondary: '#111827' } },
        }}
      />

      <div className="min-h-screen bg-grid-cyber relative">
        {/* Gradientes de fondo ambientales */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyber-cyan/3 blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-cyber-purple/3 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-cyber-yellow/2 blur-3xl"></div>
        </div>

        <Navbar activeView={activeView} onViewChange={setActiveView} />

        {/* Breadcrumb de vista actual */}
        <div className="border-b-2 border-cyber-border bg-cyber-surface/80 backdrop-blur-sm px-5 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="text-cyber-cyan font-mono text-lg">{vl.icon}</span>
            <div>
              <span className="font-display font-black text-cyber-text text-sm">{vl.title}</span>
              <span className="font-mono text-[10px] text-cyber-muted ml-3">{vl.sub}</span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeView === 'emisor'     && <PanelEmisor />}
          {activeView === 'estudiante' && <PortalEstudiante />}
          {activeView === 'verificar'  && <Verificador />}
          {activeView === 'historial'  && <ExplorerHistorial />}
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t-2 border-cyber-border mt-12 py-5 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-cyber-cyan flex items-center justify-center text-cyber-cyan text-xs font-bold">◈</div>
              <span className="font-display font-black text-cyber-text text-sm">CertChain UNIVALLE</span>
              <span className="font-mono text-[10px] text-cyber-muted">· Práctica 6 · Sistemas Distribuidos</span>
            </div>
            <div className="flex gap-4 font-mono text-[10px] text-cyber-muted">
              <span>Solidity ^0.8.20</span>
              <span>·</span><span>ethers.js v6</span>
              <span>·</span><span>React 18 · Vite · Tailwind CSS</span>
              <span>·</span><span>Doble Firma Criptográfica</span>
            </div>
          </div>
        </footer>
      </div>
    </Web3Provider>
  );
}
