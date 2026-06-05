import React, { useState, useEffect } from "react";
import { useWeb3 } from "./hooks/useWeb3";
import PanelEmisor from "./components/PanelEmisor";
import PortalEstudiante from "./components/PortalEstudiante";
import Verificador from "./components/Verificador";
import ExplorerHistorial from "./components/ExplorerHistorial";

// Icons
const BellIcon = () => (
  <svg className="w-5 h-5 text-slate-600 dark:text-[#00FF66]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
);
const SunIcon = () => (
  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);
const MoonIcon = () => (
  <svg className="w-5 h-5 text-[#00FF66]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);

export default function App() {
  const { account, contract, error, loading, connect, disconnect } = useWeb3();
  const [activeTab, setActiveTab] = useState("verificador");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isPublicView = activeTab === "verificador";

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 font-sans bg-slate-50 dark:bg-[#07090F] text-slate-900 dark:text-[#00FF66]">
      
      {/* TOP NAVBAR */}
      <header className="bg-white dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#1E293B] px-6 py-4 flex items-center justify-between z-10 sticky top-0 transition-colors duration-300">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-[#0B1B3D] dark:text-[#00FF66] tracking-tight">
            UNIVALLE BLOCKCHAIN
          </h1>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setActiveTab("verificador")}
              className={`text-sm font-semibold transition-colors ${activeTab === "verificador" ? "text-[#0B1B3D] dark:text-white border-b-2 border-[#0B1B3D] dark:border-[#00FF66] pb-1" : "text-slate-600 dark:text-slate-400 hover:text-[#0B1B3D] dark:hover:text-[#00FF66]"}`}
            >
              Verification
            </button>
            <button 
              onClick={() => setActiveTab("historial")}
              className={`text-sm font-semibold transition-colors ${activeTab === "historial" ? "text-[#0B1B3D] dark:text-white border-b-2 border-[#0B1B3D] dark:border-[#00FF66] pb-1" : "text-slate-600 dark:text-slate-400 hover:text-[#0B1B3D] dark:hover:text-[#00FF66]"}`}
            >
              Public Registry
            </button>
            <button onClick={() => alert("Help Center coming soon.")} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0B1B3D] dark:hover:text-[#00FF66]">
              Help
            </button>
          </nav>
        </div>

        {/* Center: Search */}
        <div className="hidden lg:block relative w-80">
          <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-[#00FF66]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search certificates..." 
            className="w-full bg-slate-100 dark:bg-[#1E293B] border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-[#00FF66] outline-none dark:text-white placeholder-slate-400 transition-colors"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-full transition-colors" title="Toggle Neon Mode">
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={() => alert("No new notifications.")} className="p-2 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-full transition-colors hidden md:block">
            <BellIcon />
          </button>
          
          {account ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700 dark:text-[#00FF66] bg-slate-100 dark:bg-[#07090F] px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#00FF66]">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
              <button 
                onClick={disconnect}
                className="bg-slate-200 dark:bg-transparent dark:border dark:border-[#FF0055] dark:text-[#FF0055] hover:bg-slate-300 dark:hover:bg-[#FF0055] dark:hover:text-white text-slate-800 text-sm font-semibold px-4 py-2 rounded-md transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={connect}
              disabled={loading}
              className="bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#00FF66] dark:text-[#00FF66] hover:bg-slate-800 dark:hover:bg-[#00FF66] dark:hover:text-black text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)]"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-red-50 dark:bg-[#FF0055]/10 border-l-4 border-red-500 dark:border-[#FF0055] p-4 mx-6 mt-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-[#FF0055]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-[#FF0055] font-medium">Critical Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR */}
        {!isPublicView && (
          <aside className="w-64 bg-slate-50 dark:bg-[#0B1120] border-r border-slate-200 dark:border-[#1E293B] flex-shrink-0 flex flex-col justify-between hidden md:flex transition-colors duration-300">
            <div>
              {/* Profile Card */}
              <div className="p-6 border-b border-slate-200 dark:border-[#1E293B] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#00FF66] rounded-full flex items-center justify-center text-white dark:text-[#00FF66]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-[#00FF66]">Admin Portal</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Universidad del Valle</p>
                </div>
              </div>

              {/* Menu Links */}
              <nav className="p-4 space-y-1">
                <button 
                  onClick={() => setActiveTab("emisor")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === "emisor" ? "bg-[#FACC15] dark:bg-[#00FF66]/20 text-[#0B1B3D] dark:text-[#00FF66] dark:border dark:border-[#00FF66]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]"}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Emission
                </button>
                <button 
                  onClick={() => setActiveTab("estudiante")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === "estudiante" ? "bg-[#FACC15] dark:bg-[#00FF66]/20 text-[#0B1B3D] dark:text-[#00FF66] dark:border dark:border-[#00FF66]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]"}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Student History
                </button>
                <button 
                  onClick={() => setActiveTab("historial")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === "historial" ? "bg-[#FACC15] dark:bg-[#00FF66]/20 text-[#0B1B3D] dark:text-[#00FF66] dark:border dark:border-[#00FF66]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]"}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  History
                </button>
              </nav>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-[#1E293B]">
              <button onClick={() => alert("Settings coming soon")} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#00FF66] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Security Settings
              </button>
            </div>
          </aside>
        )}

        {/* CONTENT AREA */}
        <main className={`flex-1 overflow-y-auto ${isPublicView ? "" : "p-8"}`}>
          {!account && !isPublicView ? (
            <div className="max-w-md mx-auto mt-20 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-400 dark:text-[#00FF66]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Wallet Connection Required</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                To access the administrative portal and interact with the distributed ledger, please connect your Web3 wallet.
              </p>
              <button 
                onClick={connect}
                disabled={loading}
                className="bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#00FF66] dark:text-[#00FF66] hover:bg-slate-800 dark:hover:bg-[#00FF66] dark:hover:text-black text-white text-sm font-semibold px-6 py-3 rounded-md transition-all w-full shadow-sm"
              >
                {loading ? "Connecting..." : "Connect MetaMask"}
              </button>
            </div>
          ) : (
            <div className="w-full h-full animate-fade-in">
              {activeTab === "emisor" && <PanelEmisor contract={contract} account={account} />}
              {activeTab === "estudiante" && <PortalEstudiante contract={contract} account={account} />}
              {activeTab === "verificador" && <Verificador contract={contract} />}
              {activeTab === "historial" && <ExplorerHistorial contract={contract} />}
            </div>
          )}
        </main>
      </div>
      
      {/* FOOTER */}
      <footer className="bg-[#0B1B3D] dark:bg-[#030408] text-slate-400 dark:text-slate-500 py-6 px-8 text-xs flex flex-col md:flex-row justify-between items-center z-10 border-t border-slate-800">
        <div>
          <span className="font-bold text-white dark:text-[#00FF66] mr-2">UNIVALLE BLOCKCHAIN</span>
          © 2026 National University System. Secured by Ethereum Testnet.
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <button onClick={() => alert("Privacy Policy")} className="hover:text-white dark:hover:text-[#00FF66] transition-colors">Privacy Policy</button>
          <button onClick={() => alert("Terms of Service")} className="hover:text-white dark:hover:text-[#00FF66] transition-colors">Terms of Service</button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 dark:bg-[#00FF66] dark:shadow-[0_0_8px_#00FF66] rounded-full"></div>
            <span className="text-green-400 dark:text-[#00FF66]">Network Status: Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
