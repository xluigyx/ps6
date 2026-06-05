import React, { useState } from "react";
import { useWeb3 } from "./hooks/useWeb3";
import PanelEmisor from "./components/PanelEmisor";
import PortalEstudiante from "./components/PortalEstudiante";
import Verificador from "./components/Verificador";
import ExplorerHistorial from "./components/ExplorerHistorial";

// Icono decorativo simple en SVG para el Header
const ShieldIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function App() {
  const { account, contract, error, loading, connect, disconnect } = useWeb3();
  const [activeTab, setActiveTab] = useState("emisor");

  return (
    <div className="min-h-screen text-black font-mono selection:bg-[#FF0055] selection:text-white pb-12 bg-transparent">
      {/* HEADER PRINCIPAL */}
      <header className="bg-[#FFE600] border-b-4 border-black p-4 sticky top-0 z-50 shadow-[0_8px_0_0_#000]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 transform hover:scale-105 transition-transform">
            <div className="bg-[#FF0055] border-4 border-black p-2 shadow-[4px_4px_0_0_#000] rotate-3">
              <ShieldIcon />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter bg-white px-2 border-2 border-black inline-block transform -rotate-1">
                UNIVALLE // Certificación
              </h1>
              <p className="text-[10px] font-black text-black bg-[#00E5FF] px-1 border-2 border-black inline-block uppercase mt-1">
                Sistemas Distribuidos Blockchain
              </p>
            </div>
          </div>

          {/* BOTÓN CONECTAR WALLET METAMASK */}
          <div>
            {account ? (
              <div className="flex items-center gap-2">
                <div className="bg-[#00FF66] border-4 border-black px-4 py-2 font-black text-xs shadow-[4px_4px_0_0_#000]">
                  🔗 {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </div>
                <button
                  onClick={disconnect}
                  className="bg-[#FF0055] text-white border-4 border-black px-3 py-2 text-xs font-black uppercase hover:bg-black hover:text-[#FF0055] shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={loading}
                className="bg-[#00E5FF] hover:bg-white text-black font-black border-4 border-black px-6 py-2 uppercase shadow-[6px_6px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-sm"
              >
                {loading ? "Conectando..." : "⚡ Conectar MetaMask"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENEDOR CENTRAL */}
      <main className="max-w-7xl mx-auto px-4 mt-12">
        
        {/* MENSAJES DE ERROR DE CONEXIÓN */}
        {error && (
          <div className="bg-[#FF0055] text-white border-4 border-black p-4 font-black uppercase text-sm mb-6 shadow-[6px_6px_0_0_#000] animate-shake">
            ⚠️ Error Crítico: {error}
          </div>
        )}

        {/* MENÚ DE PESTAÑAS (NAVEGACIÓN) */}
        <div className="flex flex-wrap gap-3 mb-8 pb-2">
          {[
            { id: "emisor", label: "🏢 Panel Emisor (U)" },
            { id: "estudiante", label: "🎓 Portal Estudiante" },
            { id: "verificador", label: "🔍 Verificador Público" },
            { id: "historial", label: "📊 Ledger Historial" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-xs md:text-sm font-black uppercase border-4 border-black transition-all shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transform hover:-translate-y-1 ${
                activeTab === tab.id
                  ? "bg-[#00FF66] translate-x-1 translate-y-1 shadow-none"
                  : "bg-white hover:bg-[#00E5FF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* VISTAS REACTIVAS ASOCIADAS A LAS PESTAÑAS */}
        <div className="transition-all duration-300 relative z-10">
          {!account && activeTab !== "verificador" ? (
            <div className="bg-[#00E5FF] border-4 border-black p-12 text-center shadow-[12px_12px_0_0_#FF0055] transform rotate-1 max-w-2xl mx-auto mt-16">
              <div className="text-7xl mb-6 bg-white inline-block p-4 border-4 border-black shadow-[4px_4px_0_0_#000] -rotate-6">🔑</div>
              <h3 className="text-2xl font-black uppercase mb-4 bg-black text-[#00E5FF] inline-block px-4 py-2 border-4 border-black">Llave criptográfica requerida</h3>
              <p className="text-sm text-black font-bold p-4 bg-white border-4 border-black shadow-[4px_4px_0_0_#000]">
                Para interactuar con los módulos transaccionales de este sistema distribuido, debes enlazar tu wallet de MetaMask primero.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {activeTab === "emisor" && <PanelEmisor contract={contract} account={account} />}
              {activeTab === "estudiante" && <PortalEstudiante contract={contract} account={account} />}
              {activeTab === "verificador" && <Verificador contract={contract} />}
              {activeTab === "historial" && <ExplorerHistorial contract={contract} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
