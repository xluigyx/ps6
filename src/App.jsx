import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './hooks/useWeb3';
import Navbar from './components/Navbar';
import PanelEmisor from './components/PanelEmisor';
import Verificador from './components/Verificador';
import ExplorerHistorial from './components/ExplorerHistorial';

export default function App() {
  const [activeView, setActiveView] = useState('emisor');

  return (
    <Web3Provider>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111827',
            color: '#E2E8F0',
            border: '1px solid #1e2d45',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#39FF14', secondary: '#111827' } },
          error:   { iconTheme: { primary: '#FF2D55', secondary: '#111827' } },
        }}
      />

      {/* Fondo animado con grid */}
      <div className="min-h-screen bg-cyber-bg bg-grid relative">
        {/* Gradientes decorativos de fondo */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyber-cyan/5 blur-3xl"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-cyber-purple/5 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-t from-cyber-cyan/3 to-transparent blur-2xl"></div>
        </div>

        {/* Navbar */}
        <Navbar activeView={activeView} onViewChange={setActiveView} />

        {/* Contenido principal */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Indicador de vista activa */}
          <div className="mb-6 flex items-center gap-3">
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-cyber-cyan to-transparent"></div>
            <div>
              <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest">Vista actual</p>
              <h2 className="font-display font-bold text-cyber-text text-xl leading-tight">
                {activeView === 'emisor'    && '◈ Panel del Emisor'}
                {activeView === 'verificar' && '⬡ Verificador Público'}
                {activeView === 'historial' && '⬢ Explorer de Historial'}
              </h2>
            </div>
          </div>

          {/* Renderizado condicional de vistas */}
          {activeView === 'emisor'    && <PanelEmisor />}
          {activeView === 'verificar' && <Verificador />}
          {activeView === 'historial' && <ExplorerHistorial />}
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-cyber-border mt-16 py-6 px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-cyber-cyan text-lg">◈</span>
              <span className="font-display font-semibold text-cyber-text text-sm">CertChain UNIVALLE</span>
              <span className="font-mono text-xs text-cyber-muted">·</span>
              <span className="font-mono text-xs text-cyber-muted">Práctica 6 · Sistemas Distribuidos</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-cyber-muted">Solidity ^0.8.20</span>
              <span className="font-mono text-[10px] text-cyber-muted">·</span>
              <span className="font-mono text-[10px] text-cyber-muted">ethers.js v6</span>
              <span className="font-mono text-[10px] text-cyber-muted">·</span>
              <span className="font-mono text-[10px] text-cyber-muted">React 18 · Vite · Tailwind CSS</span>
            </div>
          </div>
        </footer>
      </div>
    </Web3Provider>
  );
}
