import React, { useState } from "react";

export default function PortalEstudiante({ contract, account }) {
  const [hashInput, setHashInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoCertificado, setInfoCertificado] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const buscarCertificadoPendiente = async () => {
    if (!contract || !hashInput) return;
    try {
      setLoading(true);
      setMensaje("");
      const hashFixed = hashInput.startsWith("0x") ? hashInput : "0x" + hashInput;
      const cert = await contract.verificarCertificado(hashFixed);
      
      if (cert.estudiante.toLowerCase() !== account.toLowerCase()) {
        setMensaje("❌ Error: Este hash está enlazado a otra dirección criptográfica.");
        setInfoCertificado(null);
        return;
      }
      setInfoCertificado(cert);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Certificado inexistente en los bloques actuales.");
      setInfoCertificado(null);
    } finally {
      setLoading(false);
    }
  };

  const procesarFirmaRecepcion = async () => {
    if (!contract || !infoCertificado) return;
    try {
      setLoading(true);
      setMensaje("");
      const tx = await contract.firmarRecepcion(infoCertificado.id);
      setMensaje("⏳ Confirmando firma de recepción en los nodos distribuidos...");
      await tx.wait();
      setMensaje("🚀 Conformidad asentada. Trazabilidad de doble firma completada.");
      buscarCertificadoPendiente();
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error en la firma de recepción.");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp || Number(timestamp) === 0) return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start font-sans">
      
      {/* PANEL DE BUSQUEDA CRIPTOGRÁFICA (1 TERCIO) */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white uppercase tracking-wide">Buzón Descentralizado</h3>
          <p className="text-xs text-slate-400 mt-1">Fase 2: Firmar recepción de conformidad</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Hash SHA-256 Asignado:</label>
            <input
              type="text"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-cyan-400 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
              placeholder="Pegue el hash de su PDF"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
            />
          </div>

          <button
            onClick={buscarCertificadoPendiente}
            disabled={loading || !hashInput}
            className="w-full bg-slate-900 border border-white/10 text-slate-200 font-semibold p-3 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] disabled:opacity-50"
          >
            {loading ? "Inspeccionando Ledger..." : "Consultar Ledger"}
          </button>

          {mensaje && (
            <div className={`p-3 border rounded-xl text-xs font-mono break-words ${
              mensaje.includes("❌") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
            }`}>
              {mensaje}
            </div>
          )}
        </div>
      </div>

      {/* BANDEJA DE VISUALIZACIÓN DINÁMICA (2 TERCIOS) */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Estado del Título Digital
        </h3>

        {infoCertificado ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/30 border border-white/5 rounded-xl shadow-inner">
                <span className="text-slate-400 text-[10px] uppercase tracking-widest block mb-1">Graduado (Owner)</span>
                <span className="text-slate-200 text-sm font-sans font-medium">{infoCertificado.nombreEstudiante}</span>
              </div>
              <div className="p-4 bg-slate-950/30 border border-white/5 rounded-xl shadow-inner">
                <span className="text-slate-400 text-[10px] uppercase tracking-widest block mb-1">Programa Académico</span>
                <span className="text-slate-200 text-sm font-sans font-medium">{infoCertificado.carrera}</span>
              </div>
            </div>

            {/* CONTROL DE ESTADOS DE DOBLE FIRMA */}
            <div className="mt-6">
              {Number(infoCertificado.estado) === 0 ? (
                <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col items-center text-center shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-2xl mb-3 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    ✍️
                  </div>
                  <p className="text-amber-400 font-bold uppercase tracking-wider mb-3 text-sm">Firma del Alumno Pendiente</p>
                  <p className="text-amber-400/80 mb-6 font-sans text-xs normal-case max-w-md">Su documento ha sido emitido y encriptado por la Universidad. Requiere su firma digital privada de recepción para poseer validez legal inmutable.</p>
                  <button
                    onClick={procesarFirmaRecepcion}
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-8 py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {loading ? "Procesando Firma..." : "Asentar Firma de Recepción en Blockchain"}
                  </button>
                </div>
              ) : Number(infoCertificado.estado) === 1 ? (
                <div className="p-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-slate-900/50 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10 w-full">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl mb-4 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-emerald-400 font-bold uppercase tracking-widest text-lg mb-2">Acreditación Verificada</p>
                    <p className="text-slate-300 text-xs font-sans mb-6">Sello de Doble Capa Completado. Título inmutable.</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-left border-t border-white/10 pt-6">
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Fecha Emisión Universitaria</span>
                        <span className="text-slate-200">{formatearFecha(infoCertificado.fechaEmision)}</span>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Fecha Firma Estudiante</span>
                        <span className="text-emerald-400">{formatearFecha(infoCertificado.fechaRecepcion)}</span>
                      </div>
                      <div className="col-span-2 bg-slate-950/40 p-3 rounded-lg border border-white/5">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Hash Criptográfico de Identidad</span>
                        <span className="text-slate-400 text-[10px] break-all">{infoCertificado.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 flex flex-col items-center text-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                   <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xl mb-3 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                     ✕
                   </div>
                   <p className="text-red-400 font-bold uppercase tracking-wider text-sm mb-2">Registro Revocado por Auditoría Universitaria</p>
                   <p className="text-slate-400 font-sans text-xs">Este documento ya no posee validez.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-slate-950/10">
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest text-center">
              Ningún bloque de datos seleccionado.
              <br/>Consulte un Hash para ver su diploma.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
