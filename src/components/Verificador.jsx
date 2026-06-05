import React, { useState } from "react";

export default function Verificador({ contract }) {
  const [hashInput, setHashInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoCertificado, setInfoCertificado] = useState(null);
  const [estadoConsulta, setEstadoConsulta] = useState("IDLE"); // IDLE, OK, ERROR

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setEstadoConsulta("IDLE");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHashInput(hashHex);
      await procesarVerificacion(hashHex);
    } catch (err) {
      console.error(err);
      setEstadoConsulta("ERROR");
    } finally {
      setLoading(false);
    }
  };

  const procesarVerificacion = async (hashToVerify) => {
    if (!contract || !hashToVerify) return;
    try {
      setLoading(true);
      const hashFixed = hashToVerify.startsWith("0x") ? hashToVerify : "0x" + hashToVerify;
      const cert = await contract.verificarCertificado(hashFixed);
      setInfoCertificado(cert);
      setEstadoConsulta("OK");
    } catch (err) {
      console.error(err);
      setInfoCertificado(null);
      setEstadoConsulta("ERROR");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp || Number(timestamp) === 0) return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full relative transition-colors duration-300">
      {/* Background Dot Pattern for Public View */}
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      <div className="max-w-4xl mx-auto px-4 py-20 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B1B3D] dark:text-white tracking-tight mb-4">
            Verify Academic Integrity on the<br />Blockchain
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Instant, cryptographically secure validation of official academic certificates
            issued by the National University System of Bolivia.
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-transparent rounded-2xl shadow-sm dark:shadow-[0_0_20px_rgba(0,255,102,0.1)] p-12 text-center mb-12 dashed-border-animated relative group transition-colors duration-300">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-16 h-16 bg-blue-100 dark:bg-transparent dark:border dark:border-[#00FF66] rounded-2xl text-blue-600 dark:text-[#00FF66] flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform dark:group-hover:shadow-[0_0_15px_rgba(0,255,102,0.4)]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-[#0B1B3D] dark:text-white mb-2">Drag and drop your PDF certificate</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Supports official University seals and digital credentials</p>
          <button className="bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#00FF66] dark:text-[#00FF66] text-white font-medium px-8 py-3 rounded-md transition-all relative z-0 pointer-events-none group-hover:bg-slate-800 dark:group-hover:bg-[#00FF66] dark:group-hover:text-black">
            Browse Files
          </button>
        </div>

        {/* Manual Hash Input */}
        <div className="max-w-xl mx-auto mb-16">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Or enter SHA-256 Hash manually (0x...)"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              className="flex-1 border border-slate-300 dark:border-[#1E293B] rounded-md p-3 text-sm focus:outline-none focus:border-[#0B1B3D] dark:focus:border-[#00FF66] focus:ring-1 focus:ring-[#0B1B3D] dark:focus:ring-[#00FF66] bg-white dark:bg-[#151B2B] dark:text-[#00FF66] shadow-sm font-mono transition-colors"
            />
            <button
              onClick={() => procesarVerificacion(hashInput)}
              disabled={loading || !hashInput}
              className="bg-white dark:bg-[#00FF66] border border-slate-300 dark:border-transparent hover:bg-slate-50 dark:hover:bg-[#00E555] text-[#0B1B3D] dark:text-black font-semibold px-6 py-3 rounded-md transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
            >
              {loading ? "Verifying..." : "Verify Hash"}
            </button>
          </div>
        </div>

        {/* Results Area */}
        {estadoConsulta === "ERROR" && (
          <div className="bg-red-50 dark:bg-[#FF0055]/10 border border-red-200 dark:border-[#FF0055]/50 rounded-xl p-8 flex flex-col md:flex-row items-center gap-6 mb-16 shadow-sm">
            <div className="w-16 h-16 bg-red-100 dark:bg-transparent dark:border dark:border-[#FF0055] rounded-full flex items-center justify-center text-red-600 dark:text-[#FF0055] flex-shrink-0 dark:shadow-[0_0_15px_rgba(255,0,85,0.4)]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-900 dark:text-white mb-2">Verification Failed</h3>
              <p className="text-red-700 dark:text-[#FF0055]">The document evaluated does NOT exist on the ledger or has been tampered with. The Hash does not match any official University record.</p>
            </div>
          </div>
        )}

        {estadoConsulta === "OK" && infoCertificado && (
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-md dark:shadow-[0_0_20px_rgba(0,255,102,0.1)] mb-16 transition-colors duration-300">
            {Number(infoCertificado.estado) === 1 ? (
              <div className="p-8">
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-[#1E293B] pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-[#00FF66] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border dark:border-[#00FF66]/30">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Officially Verified
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#0B1B3D] dark:text-white">Authentic Immutable Credential</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">This document is official and has been mutually signed.</p>
                  </div>
                  <div className="w-16 h-16 bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#FACC15] text-[#FACC15] rounded-xl flex items-center justify-center dark:shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Graduate Name</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{infoCertificado.nombreEstudiante}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Academic Program</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{infoCertificado.carrera}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">University Issuance Date</p>
                    <p className="text-slate-900 dark:text-white">{formatearFecha(infoCertificado.fechaEmision)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 dark:text-[#00FF66] uppercase tracking-wider mb-1">Student Acceptance Signature</p>
                    <p className="text-slate-900 dark:text-white">{formatearFecha(infoCertificado.fechaRecepcion)}</p>
                  </div>
                  <div className="md:col-span-2 pt-4 mt-2 border-t border-slate-100 dark:border-[#1E293B]">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Issuer Traceability (Address)</p>
                    <p className="text-sm font-mono text-slate-600 dark:text-[#00FF66] break-all bg-slate-50 dark:bg-[#151B2B] p-3 rounded border border-slate-200 dark:border-[#1E293B]">{infoCertificado.emisor}</p>
                  </div>
                </div>
              </div>
            ) : Number(infoCertificado.estado) === 0 ? (
              <div className="bg-amber-50 dark:bg-[#FACC15]/10 p-8 border-l-4 border-amber-500 dark:border-[#FACC15]">
                <h3 className="text-xl font-bold text-amber-900 dark:text-white mb-2">Document in Transit (Pending)</h3>
                <p className="text-amber-800 dark:text-slate-300">
                  This certificate was issued by the university on {formatearFecha(infoCertificado.fechaEmision)}, but the holder has not yet signed their conformity on the blockchain. 
                  <span className="block mt-2 font-bold uppercase dark:text-[#FACC15]">Legal validity incomplete.</span>
                </p>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-[#FF0055]/10 p-8 border-l-4 border-red-500 dark:border-[#FF0055]">
                <h3 className="text-xl font-bold text-red-900 dark:text-white mb-2">DOCUMENT REVOKED</h3>
                <p className="text-red-800 dark:text-slate-300">
                  This certificate was administratively cancelled. It holds no academic or legal validity.
                  <span className="block mt-4 text-xs font-semibold uppercase text-red-600 dark:text-[#FF0055]">Reason for revocation:</span>
                  <span className="block text-lg font-mono mt-1 text-red-900 dark:text-[#FF0055] bg-white dark:bg-[#151B2B] p-3 border border-red-200 dark:border-[#FF0055]/30 rounded">{infoCertificado.motivoRevocacion}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-100 dark:bg-[#0D111A] rounded-xl p-6 border border-slate-200 dark:border-[#1E293B] transition-colors duration-300">
            <svg className="w-6 h-6 text-[#0B1B3D] dark:text-[#00FF66] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Tamper Proof</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Encryption ensures no degree can be forged or altered after issuance.</p>
          </div>
          <div className="bg-slate-100 dark:bg-[#0D111A] rounded-xl p-6 border border-slate-200 dark:border-[#1E293B] transition-colors duration-300">
            <svg className="w-6 h-6 text-[#0B1B3D] dark:text-[#00FF66] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Global Access</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Employers anywhere in the world can instantly verify Bolivian credentials.</p>
          </div>
          <div className="bg-slate-100 dark:bg-[#0D111A] rounded-xl p-6 border border-slate-200 dark:border-[#1E293B] transition-colors duration-300">
            <svg className="w-6 h-6 text-[#0B1B3D] dark:text-[#00FF66] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Eternal Record</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Maintained on the Ethereum blockchain for permanent accessibility.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
