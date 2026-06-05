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
        setMensaje("⚠ ALERTA: Esta cartera no coincide con el destinatario del documento.");
        setInfoCertificado(null);
        return;
      }
      setInfoCertificado(cert);
    } catch (error) {
      console.error(error);
      setMensaje("❌ HASH NO ENCONTRADO EN LA BLOCKCHAIN.");
      setInfoCertificado(null);
    } finally {
      setLoading(false);
    }
  };

  const firmarRecepcion = async () => {
    if (!contract || !infoCertificado) return;
    try {
      setLoading(true);
      setMensaje("⏳ Firmando transacción con MetaMask...");
      const tx = await contract.firmarRecepcion(infoCertificado.id);
      setMensaje("⏳ Minando bloque de confirmación...");
      await tx.wait();
      setMensaje("🚀 ¡FIRMA ASENTADA! El certificado ahora es 100% válido e inmutable.");
      buscarCertificado(); // Refrescar estado
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al firmar. Revisa tus fondos de gas o permisos.");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp || Number(timestamp) === 0) return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  return (
    <div className="bg-[#F4F4F7] min-h-[80vh] p-4 md:p-8 font-mono text-black">
      <div className="mb-8 bg-[#FFE600] border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Portal del Estudiante</h2>
          <p className="font-bold text-xs mt-1 uppercase">Fase 2: Doble Firma y No Repudio</p>
        </div>
        <div className="bg-black text-[#FFE600] px-4 py-2 font-black text-xs border-2 border-black break-all">
          WALLET: {account ? `${account.substring(0,6)}...${account.substring(account.length-4)}` : "DESCONECTADO"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Buscador (1/3) */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 h-fit">
          <h3 className="text-lg font-black uppercase mb-4 border-b-4 border-black pb-2">Consulta Local</h3>
          <p className="text-xs font-bold text-neutral-600 mb-4">
            Ingresa el identificador único (Hash) que te proporcionó la universidad para validar tu titulación.
          </p>
          <label className="block text-xs font-black uppercase mb-2">Hash SHA-256:</label>
          <input
            type="text"
            className="w-full border-4 border-black p-3 font-mono text-sm focus:outline-none focus:bg-[#FFF9C4] mb-4"
            placeholder="0x..."
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
          />
          <button
            onClick={buscarCertificado}
            disabled={loading || !hashInput}
            className="w-full bg-[#00E5FF] hover:bg-[#00CBE5] text-black font-black uppercase text-sm p-3 border-4 border-black shadow-[6px_6px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? "Buscando..." : "🔎 Buscar en Ledger"}
          </button>

          {mensaje && (
            <div className="mt-6 p-3 border-4 border-black bg-black text-white font-bold text-[10px] uppercase">
              {mensaje}
            </div>
          )}
        </div>

        {/* Bandeja de Acreditación (2/3) */}
        <div className="md:col-span-2 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 md:p-8">
          <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">Bandeja de Acreditación</h3>

          {!infoCertificado ? (
            <div className="border-4 border-dashed border-neutral-300 p-12 flex flex-col items-center justify-center text-neutral-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
              <p className="font-black uppercase text-sm">Bandeja Vacía</p>
              <p className="text-xs font-bold mt-1">Busca un certificado para interactuar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lógica de Estados */}
              {Number(infoCertificado.estado) === 0 && (
                <div className="bg-[#FF6B00] border-4 border-black p-6 text-black shadow-[6px_6px_0px_0px_#000] animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">⚠</span>
                    <div>
                      <h4 className="font-black uppercase text-lg">Acción Requerida: Firma Pendiente</h4>
                      <p className="text-xs font-bold">La universidad ha emitido este documento, pero requiere tu firma criptográfica para tener validez oficial.</p>
                    </div>
                  </div>
                  <button
                    onClick={firmarRecepcion}
                    disabled={loading}
                    className="w-full bg-black text-[#FF6B00] hover:text-white font-black uppercase p-3 border-2 border-black transition-colors"
                  >
                    {loading ? "Procesando..." : "✍️ Asentar Firma de Conformidad"}
                  </button>
                </div>
              )}

              {Number(infoCertificado.estado) === 1 && (
                <div className="bg-[#F4F4F7] border-8 border-double border-black p-6 relative mt-6">
                  {/* Sello verde */}
                  <div className="absolute -top-6 -right-2 md:-right-6 bg-[#00FF66] border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] transform rotate-12">
                    <span className="font-black uppercase text-xs md:text-sm">✓ VERIFICADO</span>
                  </div>
                  <h4 className="font-black uppercase text-xl border-b-2 border-black pb-2 mb-4">Certificado Digital Oficial</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                    <div className="col-span-2 border-b-2 border-dotted border-neutral-400 pb-2">
                      <span className="block text-[10px] text-neutral-500 uppercase">Títular:</span>
                      <span className="text-lg font-black">{infoCertificado.nombreEstudiante}</span>
                    </div>
                    <div className="col-span-2 border-b-2 border-dotted border-neutral-400 pb-2">
                      <span className="block text-[10px] text-neutral-500 uppercase">Programa:</span>
                      <span className="text-base">{infoCertificado.carrera}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-neutral-500 uppercase">Emisión (U):</span>
                      <span className="text-xs">{formatearFecha(infoCertificado.fechaEmision)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-neutral-500 uppercase">Firma Alumno:</span>
                      <span className="text-xs text-[#00AA44] font-black">{formatearFecha(infoCertificado.fechaRecepcion)}</span>
                    </div>
                  </div>
                </div>
              )}

              {Number(infoCertificado.estado) === 2 && (
                <div className="bg-[#FF0055] border-4 border-black p-6 text-white shadow-[6px_6px_0px_0px_#000]">
                  <h4 className="font-black uppercase text-xl mb-2">🚫 CERTIFICADO REVOCADO</h4>
                  <p className="text-xs font-bold uppercase mb-4">Motivo administrativo:</p>
                  <p className="bg-black p-3 font-mono text-sm border-2 border-black">{infoCertificado.motivoRevocacion}</p>
                </div>
              )}

              <div className="bg-neutral-200 border-4 border-black p-4 text-xs font-bold break-all">
                <span className="text-[10px] uppercase text-neutral-600 block mb-1">Hash SHA-256 (ID)</span>
                {infoCertificado.id}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
