import React, { useState } from "react";
import { useWeb3 } from "./hooks/useWeb3";
import PanelEmisor from "./components/PanelEmisor";
import PortalEstudiante from "./components/PortalEstudiante";
import Verificador from "./components/Verificador";
import ExplorerHistorial from "./components/ExplorerHistorial";

export default function App() {
  const { account, contract, error, loading, connect, disconnect } = useWeb3();
  const [activeTab, setActiveTab] = useState("emisor");

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-900 pb-16">
      
      {/* GLASSMORPHISM HEADER */}
      <header className="sticky top-0 z-50 bg-[#0B0F17]/70 backdrop-blur-xl border-b border-white/10 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.57V10c0-2.433-1.011-4.63-2.648-6.195M12 11a13.917 13.917 0 012.753 9.571m3.44-2.04l-.054-.09A13.916 13.916 0 0115 11.57V10c0-2.433 1.011-4.63 2.648-6.195M12 10V3m0 0l-1.42 1.42M12 3l1.42 1.42" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">UNIVALLE // Ledger</h1>
              <p className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">Sistemas Distribuidos Blockchain</p>
            </div>
          </div>

          {/* METAMASK CONNECTION */}
          <div>
            {account ? (
              <div className="flex items-center gap-3">
                <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl px-4 py-2 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-400">
                    {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl px-3 py-2 text-xs font-medium transition-all"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(6,182,212,0.25)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.4)] active:scale-[0.98] transition-all"
              >
                {loading ? "Conectando..." : "Conectar Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-mono mb-6 shadow-inner">
            ⚠️ ERROR CONTROLADO: {error}
          </div>
        )}

        {/* NAVEGACIÓN ENTRE PESTAÑAS */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/40 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          {[
            { id: "emisor", label: "🏢 Panel Universidad" },
            { id: "estudiante", label: "🎓 Portal Alumno" },
            { id: "verificador", label: "🔍 Validación Pública" },
            { id: "historial", label: "📊 Historial Completo" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-xs font-medium rounded-lg uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* INYECCIÓN DE VISTAS */}
        <div className="duration-300 transition-all">
          {!account && activeTab !== "verificador" ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center shadow-2xl max-w-xl mx-auto mt-12">
              <div className="h-16 w-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400 text-2xl">
                🔐
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2">Autenticación Requerida</h3>
              <p className="text-sm text-slate-400 font-normal leading-relaxed">
                Este es un nodo transaccional del sistema distribuido. Por favor enlace su firma digital a través de MetaMask para operar en esta sección.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "emisor" && <PanelEmisor contract={contract} account={account} />}
              {activeTab === "estudiante" && <PortalEstudiante contract={contract} account={account} />}
              {activeTab === "verificador" && <Verificador contract={contract} />}
              {activeTab === "historial" && <ExplorerHistorial contract={contract} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
