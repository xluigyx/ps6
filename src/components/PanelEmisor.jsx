import React, { useState } from "react";

export default function PanelEmisor({ contract, account }) {
  const [formData, setFormData] = useState({ hash: "", nombre: "", carrera: "", estudiante: "" });
  const [status, setStatus] = useState("");
  const [txLoading, setTxLoading] = useState(false);

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
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white tracking-wide uppercase">Registro de Actas Académicas</h3>
          <p className="text-xs text-slate-400 mt-1">Fase 1: Asentar hash raíz y asignar wallet del graduado</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Hash Criptográfico SHA-256 del PDF:</label>
            <input
              type="text"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-cyan-400 focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner"
              placeholder="0x4fa2c3..."
              required
              onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Nombre del Estudiante:</label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all"
                required
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Carrera / Programa:</label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all"
                required
                onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Dirección Destinataria (Wallet Alumno):</label>
            <input
              type="text"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner"
              placeholder="0x0000..."
              required
              onChange={(e) => setFormData({ ...formData, estudiante: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={txLoading}
            className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold uppercase text-xs tracking-wider p-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(6,182,212,0.15)] disabled:opacity-50"
          >
            {txLoading ? "Firmando Transacción..." : "Emitir y Registrar en Ledger"}
          </button>
        </form>

        {status && (
          <div className="mt-5 p-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-xs font-mono text-slate-300">
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
            <span className="text-slate-400">Estado de Sincronía</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-slate-200">Online</span>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-white/5 rounded-xl">
            <span className="text-slate-400">Gas Base Estimado</span>
            <span className="text-slate-300">21 Gwei</span>
          </div>
        </div>

        <div className="p-4 border border-dashed border-white/10 rounded-xl text-center bg-slate-950/20">
          <div className="text-2xl mb-1">📄</div>
          <p className="text-[10px] text-slate-400 uppercase font-mono">Visor criptográfico del cliente activo</p>
        </div>
      </div>

    </div>
  );
}
