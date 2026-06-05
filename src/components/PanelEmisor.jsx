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
      setStatus("⏳ Transmitiendo transacción al Nodo Local...");
      const hashFixed = formData.hash.startsWith("0x") ? formData.hash : "0x" + formData.hash;
      const tx = await contract.emitirCertificado(hashFixed, formData.nombre, formData.carrera, formData.estudiante);
      setStatus("⏳ Esperando confirmación de minado...");
      await tx.wait();
      setStatus("🚀 ¡Certificado inyectado con éxito en el Ledger Inmutable!");
      setFormData({ hash: "", nombre: "", carrera: "", estudiante: "" });
    } catch (err) {
      console.error(err);
      setStatus("❌ Error en transacción. ¿Eres un Emisor Autorizado?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent font-mono text-black">
      {/* Encabezado Neo-Brutalista */}
      <div className="mb-8 bg-[#00E5FF] border-4 border-black p-4 shadow-[8px_8px_0px_0px_#FF0055] flex flex-col md:flex-row justify-between items-center transform -rotate-1">
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter bg-white px-2 border-2 border-black inline-block">Consola de Emisión</h2>
          <p className="font-black text-[10px] mt-2 uppercase bg-black text-[#00E5FF] p-1 border-2 border-white inline-block">Fase 1: Registro Criptográfico de Egresados</p>
        </div>
        <div className="mt-4 md:mt-0 bg-[#FF0055] text-white px-4 py-2 font-black text-xs border-4 border-black shadow-[4px_4px_0_0_#000] rotate-2">
          ID ROL: RECTOR / DIRECTOR
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Formulario Principal (Ocupa 3 columnas) */}
        <div className="lg:col-span-3 bg-white border-4 border-black shadow-[12px_12px_0px_0px_#BF5AF2] p-6 md:p-8">
          
          {/* Fake Drop Zone para PDF */}
          <div className="mb-8 border-4 border-dashed border-black bg-[#FFE600] hover:bg-black hover:text-[#FFE600] transition-colors p-8 flex flex-col items-center justify-center cursor-pointer active:translate-y-1 shadow-[4px_4px_0_0_#000]">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span className="font-black uppercase text-base bg-white text-black px-2 border-2 border-black">Arrastra el Acta de Grado (PDF) aquí</span>
            <span className="text-[10px] font-black mt-2 bg-black text-white px-2 py-1">Se calculará el Hash SHA-256 localmente</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 relative">
                <label className="absolute -top-3 left-4 bg-[#BF5AF2] text-white border-2 border-black px-2 text-[10px] font-black uppercase z-10">Hash Criptográfico (ID Único)</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={formData.hash}
                  onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
                  className="w-full border-4 border-black p-4 pt-5 font-mono text-sm focus:outline-none focus:bg-[#00E5FF] transition-colors bg-neutral-50 shadow-[4px_4px_0_0_#000]"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-3 left-4 bg-[#FF0055] text-white border-2 border-black px-2 text-[10px] font-black uppercase z-10">Nombre del Egresado</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border-4 border-black p-4 pt-5 font-mono text-sm focus:outline-none focus:bg-[#00E5FF] transition-colors bg-neutral-50 shadow-[4px_4px_0_0_#000]"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-3 left-4 bg-[#00FF66] text-black border-2 border-black px-2 text-[10px] font-black uppercase z-10">Programa Académico</label>
                <input
                  type="text"
                  required
                  value={formData.carrera}
                  onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
                  className="w-full border-4 border-black p-4 pt-5 font-mono text-sm focus:outline-none focus:bg-[#00E5FF] transition-colors bg-neutral-50 shadow-[4px_4px_0_0_#000]"
                />
              </div>

              <div className="md:col-span-2 relative">
                <label className="absolute -top-3 left-4 bg-black text-[#FFE600] border-2 border-black px-2 text-[10px] font-black uppercase z-10">Wallet Destino (Estudiante)</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={formData.estudiante}
                  onChange={(e) => setFormData({ ...formData, estudiante: e.target.value })}
                  className="w-full border-4 border-black p-4 pt-5 font-mono text-sm focus:outline-none focus:bg-[#00E5FF] transition-colors bg-neutral-50 shadow-[4px_4px_0_0_#000]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FF66] hover:bg-black hover:text-[#00FF66] text-black font-black uppercase text-xl p-5 border-4 border-black shadow-[8px_8px_0px_0px_#000] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? "Procesando en Red..." : "🚀 Emitir Certificado Blockchain"}
            </button>
          </form>

          {status && (
            <div className="mt-8 p-4 border-4 border-black bg-black text-[#00E5FF] font-black text-sm uppercase shadow-[6px_6px_0_0_#FF0055] rotate-1">
              &gt; {status}
            </div>
          )}
        </div>

        {/* Barra Lateral / Tracker (Ocupa 1 columna) */}
        <div className="bg-[#BF5AF2] border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 h-fit text-white transform rotate-1">
          <h3 className="text-lg font-black uppercase border-b-4 border-black pb-3 mb-6 bg-black p-2 -rotate-2">Estado del Nodo</h3>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between border-4 border-black p-3 bg-white text-black shadow-[4px_4px_0_0_#000]">
              <span className="text-xs font-black uppercase">Conexión</span>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#00FF66] rounded-none animate-pulse border-2 border-black"></span>
                <span className="text-xs font-black bg-black text-[#00FF66] px-1">ONLINE</span>
              </div>
            </div>

            <div className="border-4 border-black p-3 bg-white text-black shadow-[4px_4px_0_0_#000]">
              <span className="block text-[10px] font-black uppercase bg-black text-white px-1 inline-block mb-2">Cuenta Activa</span>
              <span className="text-xs font-bold break-all block">{account || "No conectada"}</span>
            </div>

            <div className="border-4 border-black p-3 bg-[#FFE600] text-black shadow-[4px_4px_0_0_#000] transform -rotate-2">
              <span className="block text-[10px] font-black uppercase bg-black text-[#FFE600] px-1 inline-block mb-2">Gas Estimado</span>
              <span className="text-2xl font-black text-[#FF0055]">12 Gwei</span>
            </div>

            <div className="border-4 border-black p-3 bg-[#00E5FF] text-black shadow-[4px_4px_0_0_#000]">
              <span className="block text-[10px] font-black uppercase bg-black text-[#00E5FF] px-1 inline-block mb-2">Último Bloque</span>
              <span className="text-xl font-black">#5.432.190</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
