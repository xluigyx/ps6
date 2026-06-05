import React, { useState } from "react";

export default function PanelEmisor({ contract, account }) {
  const [formData, setFormData] = useState({ hash: "", nombre: "", carrera: "", estudiante: "" });
  const [status, setStatus] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    try {
      setStatus("Calculando Hash SHA-256 localmente...");
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setFormData(prev => ({ ...prev, hash: hashHex }));
      setStatus("Hash extraído del documento PDF correctamente.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error al procesar el documento.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setTxLoading(true);
      setStatus("⏳ Difundiendo transacción a los validadores de la red...");
      const tx = await contract.emitirCertificado(
        formData.hash.startsWith("0x") ? formData.hash : "0x" + formData.hash,
        formData.nombre,
        formData.carrera,
        formData.estudiante
      );
      await tx.wait();
      setStatus("✅ Bloque confirmado. Hash de certificado asentado de forma inmutable.");
      setFormData({ hash: "", nombre: "", carrera: "", estudiante: "" });
    } catch (err) {
      console.error(err);
      setStatus("❌ Excepción en la red: Verifique que sea una dirección autorizada.");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start font-sans">
      
      {/* FORMULARIO DE EMISIÓN (2 TERCIOS) */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
        
        {/* VISOR ESTÉTICO DE PDF SIMULADO (DROPZONE) */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative mb-8 border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 bg-slate-950/30 hover:border-cyan-500/30'}`}
        >
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="h-16 w-16 mx-auto bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Cargar PDF Académico</h3>
          <p className="text-[11px] text-slate-400 font-mono">Arrastre el documento aquí para extraer su firma hash criptográfica</p>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold text-white tracking-wide uppercase">Registro de Actas Académicas</h3>
          <p className="text-xs text-slate-400 mt-1">Fase 1: Asentar hash raíz y asignar wallet del graduado</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Hash Criptográfico SHA-256 del PDF:</label>
            <input
              type="text"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-cyan-400 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
              placeholder="0x4fa2c3..."
              required
              value={formData.hash}
              onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Nombre del Estudiante:</label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Carrera / Programa:</label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
                required
                value={formData.carrera}
                onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Dirección Destinataria (Wallet Alumno):</label>
            <input
              type="text"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
              placeholder="0x0000..."
              required
              value={formData.estudiante}
              onChange={(e) => setFormData({ ...formData, estudiante: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={txLoading || !formData.hash || !formData.nombre || !formData.carrera || !formData.estudiante}
            className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold uppercase text-xs tracking-wider p-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(6,182,212,0.15)] disabled:opacity-50 disabled:grayscale"
          >
            {txLoading ? "Firmando Transacción en Red..." : "Emitir y Registrar en Ledger"}
          </button>
        </form>

        {status && (
          <div className="mt-5 p-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-xs font-mono text-cyan-300">
            {status}
          </div>
        )}
      </div>

      {/* METRICAS DEL NODO LATERAL (1 TERCIO) */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
        <div>
          <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider">Estado de la Infraestructura</h4>
          <div className="h-px bg-white/10 mt-2" />
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-white/5 rounded-xl">
            <span className="text-slate-400">Tipo de Consenso</span>
            <span className="text-cyan-400 font-bold">Proof-of-Stake (PoS)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-white/5 rounded-xl">
            <span className="text-slate-400">Sincronía del Nodo</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-emerald-400">Sincronizado</span>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-white/5 rounded-xl">
            <span className="text-slate-400">Gas Base Estimado</span>
            <span className="text-slate-300">21 Gwei</span>
          </div>
        </div>

        <div className="p-4 border border-dashed border-white/10 rounded-xl text-center bg-slate-950/20">
           <div className="text-emerald-400 text-lg mb-1 flex justify-center"><svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
           <p className="text-[10px] text-slate-400 uppercase font-mono">Blockchain Escuchando</p>
        </div>
      </div>

    </div>
  );
}
