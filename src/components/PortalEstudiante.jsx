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
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-cyan-400 focus:outline-none"
              placeholder="Pegue el hash de su PDF"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
            />
          </div>

          <button
            onClick={buscarCertificadoPendiente}
            disabled={loading}
            className="w-full bg-slate-900 border border-white/10 text-slate-200 font-semibold p-3 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-all"
          >
            {loading ? "Inspeccionando..." : "Consultar Ledger"}
          </button>

          {mensaje && (
            <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs font-mono text-slate-300">
              {mensaje}
            </div>
          )}
        </div>
      </div>

      {/* BANDEJA DE VISUALIZACIÓN DINÁMICA (2 TERCIOS) */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-4">Estado del Título Digital</h3>

        {infoCertificado ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950/30 border border-white/5 rounded-xl">
                <span className="text-slate-400 block mb-1">Graduado</span>
                <span className="text-slate-200 text-sm font-sans font-medium">{infoCertificado.nombreEstudiante}</span>
              </div>
              <div className="p-3 bg-slate-950/30 border border-white/5 rounded-xl">
                <span className="text-slate-400 block mb-1">Programa Académico</span>
                <span className="text-slate-200 text-sm font-sans font-medium">{infoCertificado.carrera}</span>
              </div>
            </div>

            {/* CONTROL DE ESTADOS DE DOBLE FIRMA */}
            <div className="p-5 rounded-xl border border-white/5 bg-slate-950/50 flex flex-col items-center text-center">
              {Number(infoCertificado.estado) === 0 ? (
                <div className="w-full">
                  <p className="text-amber-400 font-bold uppercase tracking-wider mb-3">⚠️ Estado: Firma del Alumno Pendiente</p>
                  <p className="text-slate-400 mb-4 font-sans text-xs normal-case">Su documento fue registrado por la institución, pero requiere su firma digital privada de aceptación para ser considerado plenamente válido en el ecosistema.</p>
                  <button
                    onClick={procesarFirmaRecepcion}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold p-3 rounded-xl uppercase tracking-wider text-xs"
                  >
                    Asentar Firma de Recepción Oficial
                  </button>
                </div>
              ) : Number(infoCertificado.estado) === 1 ? (
                <div className="w-full py-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl mb-2">
                    ✓
                  </div>
                  <p className="text-emerald-400 font-bold uppercase tracking-wider mb-1">Acreditación Verificada de Doble Capa</p>
                  <p className="text-slate-400 text-[11px] font-sans">El flujo se completó correctamente. Título certificado e inmutable.</p>
                </div>
              ) : (
                <div className="text-red-400 font-bold uppercase tracking-wider">
                  ❌ Registro Revocado por Auditoría Universitaria
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-16 border border-dashed border-white/10 rounded-xl bg-slate-950/10 font-mono text-xs">
            Ningún bloque de datos seleccionado.
          </div>
        )}
      </div>

    </div>
  );
}
