import React from "react";

export default function ExplorerHistorial({ contract }) {
  return (
    <div className="max-w-4xl mx-auto pb-12 transition-colors duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0B1B3D] dark:text-white tracking-tight mb-2">Public Registry Ledger</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time view of all cryptographic emissions on the smart contract.</p>
      </div>

      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-sm p-12 text-center transition-colors duration-300">
        <div className="w-16 h-16 bg-slate-100 dark:bg-[#151B2B] rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-[#00FF66]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ledger Sync in Progress</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          The global public ledger explorer is currently undergoing maintenance. Block indexing will be restored shortly.
        </p>
        <button onClick={() => alert("Still syncing...")} className="bg-white dark:bg-[#151B2B] border border-slate-300 dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#00FF66] font-medium px-6 py-2.5 rounded-md transition-colors text-sm">
          Refresh Connection
        </button>
      </div>
    </div>
  );
}
