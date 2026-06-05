import React, { useState } from "react";

export default function PanelEmisor({ contract, account }) {
  const [formData, setFormData] = useState({ hash: "", nombre: "", carrera: "", estudiante: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setLoading(true);
      setStatus("⏳ Transmitting transaction to Blockchain Node...");
      const hashFixed = formData.hash.startsWith("0x") ? formData.hash : "0x" + formData.hash;
      const tx = await contract.emitirCertificado(hashFixed, formData.nombre, formData.carrera, formData.estudiante);
      setStatus("⏳ Waiting for block confirmation...");
      await tx.wait();
      setStatus("🚀 Certificate successfully secured on the Ledger!");
      setFormData({ hash: "", nombre: "", carrera: "", estudiante: "" });
    } catch (err) {
      console.error(err);
      setStatus("❌ Transaction failed. Are you an Authorized Issuer?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0B1B3D] dark:text-white tracking-tight mb-2">Issue Digital Certificate</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cryptographically secure academic credentialing on Ethereum Testnet.</p>
      </div>

      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-sm overflow-hidden transition-colors duration-300">
        
        {/* Wizard Steps (Visual Only) */}
        <div className="border-b border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#0B1120] px-8 py-5 flex items-center justify-between text-sm transition-colors duration-300">
          <div className="flex items-center gap-3 text-[#0B1B3D] dark:text-[#00FF66] font-semibold">
            <span className="w-6 h-6 rounded-full border-2 border-[#0B1B3D] dark:border-[#00FF66] flex items-center justify-center text-xs">1</span>
            Document Upload
          </div>
          <div className="h-px bg-slate-300 dark:bg-slate-700 w-16"></div>
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-medium">
            <span className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs">2</span>
            Student Metadata
          </div>
          <div className="h-px bg-slate-300 dark:bg-slate-700 w-16"></div>
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-medium">
            <span className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs">3</span>
            Review & Emit
          </div>
        </div>

        <div className="p-8">
          {/* Drag & Drop Zone */}
          <div 
            onClick={() => alert("File selection dialog would open here.")}
            className="dashed-border-animated bg-slate-50 dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-[#151B2B] transition-colors cursor-pointer p-12 flex flex-col items-center justify-center text-center mb-8 group"
          >
            <div className="w-12 h-12 bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#00FF66] rounded-lg text-white dark:text-[#00FF66] flex items-center justify-center mb-4 group-hover:scale-105 dark:group-hover:shadow-[0_0_15px_rgba(0,255,102,0.5)] transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <h3 className="text-lg font-bold text-[#0B1B3D] dark:text-white mb-1">Drag & Drop PDF Certificate</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Files are locally hashed. Your original document remains private.</p>
            <button className="bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#00FF66] dark:text-[#00FF66] text-white text-sm font-medium px-6 py-2.5 rounded-md hover:bg-slate-800 dark:hover:bg-[#00FF66] dark:hover:text-black transition-all">
              Select Document
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-2">Cryptographic Hash (SHA-256)</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={formData.hash}
                  onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
                  className="w-full border border-slate-300 dark:border-[#1E293B] rounded-md p-3 text-sm focus:outline-none focus:border-[#0B1B3D] dark:focus:border-[#00FF66] focus:ring-1 focus:ring-[#0B1B3D] dark:focus:ring-[#00FF66] font-mono bg-slate-50 dark:bg-[#151B2B] dark:text-[#00FF66] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-2">Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mateo Villegas Ruiz"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border border-slate-300 dark:border-[#1E293B] rounded-md p-3 text-sm focus:outline-none focus:border-[#0B1B3D] dark:focus:border-[#00FF66] focus:ring-1 focus:ring-[#0B1B3D] dark:focus:ring-[#00FF66] bg-slate-50 dark:bg-[#151B2B] dark:text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-2">Academic Program</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Sc. Computer Science"
                  value={formData.carrera}
                  onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
                  className="w-full border border-slate-300 dark:border-[#1E293B] rounded-md p-3 text-sm focus:outline-none focus:border-[#0B1B3D] dark:focus:border-[#00FF66] focus:ring-1 focus:ring-[#0B1B3D] dark:focus:ring-[#00FF66] bg-slate-50 dark:bg-[#151B2B] dark:text-white transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-2">Destination Wallet (Student)</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={formData.estudiante}
                  onChange={(e) => setFormData({ ...formData, estudiante: e.target.value })}
                  className="w-full border border-slate-300 dark:border-[#1E293B] rounded-md p-3 text-sm focus:outline-none focus:border-[#0B1B3D] dark:focus:border-[#00FF66] focus:ring-1 focus:ring-[#0B1B3D] dark:focus:ring-[#00FF66] font-mono bg-slate-50 dark:bg-[#151B2B] dark:text-[#00FF66] transition-colors"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-[#1E293B] flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => { setFormData({ hash: "", nombre: "", carrera: "", estudiante: "" }); setStatus(""); }}
                className="text-slate-600 dark:text-slate-400 text-sm font-medium px-6 py-2.5 hover:text-[#0B1B3D] dark:hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0B1B3D] dark:bg-transparent dark:border dark:border-[#00FF66] dark:text-[#00FF66] hover:bg-slate-800 dark:hover:bg-[#00FF66] dark:hover:text-black text-white text-sm font-semibold px-6 py-2.5 rounded-md transition-all shadow-sm dark:shadow-[0_0_10px_rgba(0,255,102,0.2)] flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Next"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </form>

          {status && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-[#00FF66]/10 border border-blue-200 dark:border-[#00FF66]/50 rounded-md text-blue-800 dark:text-[#00FF66] text-sm font-medium">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
