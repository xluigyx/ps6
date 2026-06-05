import React, { useState } from "react";

export default function PortalEstudiante({ contract, account }) {
  const [hashInput, setHashInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoCertificado, setInfoCertificado] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const buscarCertificado = async () => {
    if (!contract || !hashInput) return;
    try {
      setLoading(true);
      setMensaje("");
      const hashFixed = hashInput.startsWith("0x") ? hashInput : "0x" + hashInput;
      const cert = await contract.verificarCertificado(hashFixed);
      
      if (cert.estudiante.toLowerCase() !== account?.toLowerCase()) {
        setMensaje("⚠ ALERT: This wallet does not match the certificate destination.");
        setInfoCertificado(null);
        return;
      }
      setInfoCertificado(cert);
    } catch (error) {
      console.error(error);
      setMensaje("❌ HASH NOT FOUND ON BLOCKCHAIN.");
      setInfoCertificado(null);
    } finally {
      setLoading(false);
    }
  };

  const firmarRecepcion = async () => {
    if (!contract || !infoCertificado) return;
    try {
      setLoading(true);
      setMensaje("⏳ Signing transaction with MetaMask...");
      const tx = await contract.firmarRecepcion(infoCertificado.id);
      setMensaje("⏳ Waiting for block confirmation...");
      await tx.wait();
      setMensaje("🚀 SIGNATURE SECURED! Certificate is now valid and immutable.");
      buscarCertificado(); // Refresh state
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error during signing. Check gas or permissions.");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp || Number(timestamp) === 0) return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0B1B3D] dark:text-white tracking-tight mb-2">Student History</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage and audit all academic credentials issued. All records are cryptographically secured.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert("Filter functionality coming soon")} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0D111A] border border-slate-300 dark:border-[#1E293B] rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#151B2B] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filter
          </button>
          <button onClick={() => alert("Export functionality coming soon")} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0D111A] border border-slate-300 dark:border-[#1E293B] rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#151B2B] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Export All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-colors duration-300">
          <div className="w-24 h-24 bg-slate-200 dark:bg-[#1E293B] rounded-full mb-4 overflow-hidden flex items-center justify-center text-slate-400 dark:text-slate-500">
             <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-[#0B1B3D] dark:text-[#00FF66]">Connected Student</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 w-full truncate px-4">{account || "No Wallet Connected"}</p>
          
          <div className="w-full flex justify-between items-center border-t border-slate-100 dark:border-[#1E293B] pt-4 px-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Certificates</span>
            <span className="text-lg font-bold text-[#0B1B3D] dark:text-white">{infoCertificado ? "1" : "0"}</span>
          </div>
        </div>

        {/* Latest Record Card or Search Card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Blockchain Record</span>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Enter the unique Hash ID provided by the university to retrieve your credential from the distributed ledger.
            </p>
            
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="0x..."
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                className="flex-1 border border-slate-300 dark:border-[#1E293B] rounded-md p-3 text-sm focus:outline-none focus:border-[#0B1B3D] dark:focus:border-[#00FF66] focus:ring-1 focus:ring-[#0B1B3D] dark:focus:ring-[#00FF66] bg-slate-50 dark:bg-[#151B2B] dark:text-[#00FF66] font-mono transition-colors"
              />
              <button
                onClick={buscarCertificado}
                disabled={loading || !hashInput}
                className="bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#00FF66] dark:text-[#00FF66] hover:bg-slate-800 dark:hover:bg-[#00FF66] dark:hover:text-black text-white text-sm font-semibold px-6 py-3 rounded-md transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? "Searching..." : "Search Ledger"}
              </button>
            </div>
            {mensaje && (
              <p className="text-xs font-medium text-amber-600 dark:text-[#00FF66] bg-amber-50 dark:bg-[#00FF66]/10 p-2 rounded border border-amber-200 dark:border-[#00FF66]/50">{mensaje}</p>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Registry Table */}
      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-sm overflow-hidden transition-colors duration-300">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-[#0B1120]">
          <h3 className="font-bold text-[#0B1B3D] dark:text-white text-lg">Certificate Registry</h3>
          <div className="relative w-64">
            <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search hash or document..." className="w-full bg-white dark:bg-[#151B2B] border border-slate-300 dark:border-[#1E293B] rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[#0B1B3D] dark:focus:border-[#00FF66] dark:text-white transition-colors" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1E293B] text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Document Type</th>
                <th className="py-4 px-6 font-semibold">Blockchain Hash</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] text-sm">
              {!infoCertificado ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p>No records found. Search for a hash above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr className="hover:bg-slate-50 dark:hover:bg-[#151B2B] transition-colors">
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatearFecha(infoCertificado.fechaEmision)}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                      Degree: {infoCertificado.carrera}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#00FF66] px-2 py-1 rounded">
                      {infoCertificado.id.substring(0,6)}...{infoCertificado.id.substring(infoCertificado.id.length-4)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {Number(infoCertificado.estado) === 1 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-[#00FF66] border border-green-200 dark:border-[#00FF66]/30">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Valid
                      </span>
                    )}
                    {Number(infoCertificado.estado) === 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-400/30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Pending Signature
                      </span>
                    )}
                    {Number(infoCertificado.estado) === 2 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-[#FF0055] border border-red-200 dark:border-[#FF0055]/30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        Revoked
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {Number(infoCertificado.estado) === 0 ? (
                      <button 
                        onClick={firmarRecepcion}
                        disabled={loading}
                        className="text-xs bg-[#0B1B3D] dark:bg-[#00FF66] text-white dark:text-black px-3 py-1.5 rounded hover:bg-slate-800 dark:hover:bg-white transition-colors"
                      >
                        Sign to Accept
                      </button>
                    ) : (
                      <div className="flex justify-end gap-2 text-slate-400 dark:text-slate-500">
                        <button onClick={() => alert("View full certificate")} className="hover:text-slate-700 dark:hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                        <button onClick={() => alert("Open external explorer")} className="hover:text-slate-700 dark:hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
