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
      // Cálculo de Hash Local en el Frontend (SHA-256) usando crypto.subtle (Nativo de JS)
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
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  return (
    <div className="bg-[#F4F4F7] min-h-[80vh] p-4 md:p-8 font-mono text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabecera Pública */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase mb-4 tracking-tighter">Auditoría Abierta</h2>
          <p className="font-bold text-sm bg-black text-white inline-block px-4 py-1 border-2 border-black">
            Verificador de Integridad Documental (Criptografía SHA-256)
          </p>
        </div>

        {/* Zona de Drop o Input */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Input Manual */}
            <div>
              <label className="block text-xs font-black uppercase mb-2">Comprobación por Hash:</label>
              <input
                type="text"
                placeholder="0x..."
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                className="w-full border-4 border-black p-3 font-mono text-sm focus:outline-none focus:bg-[#FFF9C4] mb-4"
              />
              <button
                onClick={() => procesarVerificacion(hashInput)}
                disabled={loading || !hashInput}
                className="w-full bg-[#00E5FF] hover:bg-[#00CBE5] text-black font-black uppercase text-sm p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
              >
                {loading ? "Analizando Nodo..." : "Auditar Documento"}
              </button>
            </div>

            {/* Separador */}
            <div className="hidden md:flex flex-col items-center justify-center">
              <div className="w-1 h-12 bg-black mb-2"></div>
              <span className="font-black uppercase text-xs">O</span>
              <div className="w-1 h-12 bg-black mt-2"></div>
            </div>

            {/* Carga PDF Local */}
            <div className="relative border-4 border-dashed border-black bg-neutral-50 hover:bg-[#FFF9C4] transition-colors p-8 text-center cursor-pointer active:translate-y-1 group">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📄</div>
              <h3 className="font-black uppercase text-sm">Arrastrar el PDF Académico aquí</h3>
              <p className="text-[10px] font-bold text-neutral-500 mt-2">Validación Privada (El archivo no se sube a internet)</p>
            </div>

          </div>
        </div>

        {/* Zona de Resultados Dinámicos */}
        {estadoConsulta === "ERROR" && (
          <div className="bg-[#FF0055] border-4 border-black p-6 text-white shadow-[8px_8px_0px_0px_#000] flex flex-col md:flex-row items-center gap-6 animate-pulse">
            <div className="text-6xl">⛔</div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-1">Alerta de Seguridad</h3>
              <p className="font-bold text-sm">El documento evaluado NO existe en el ledger o ha sido alterado. El Hash no coincide con ningún registro oficial de la Universidad.</p>
            </div>
          </div>
        )}

        {estadoConsulta === "OK" && infoCertificado && (
          <div className="space-y-6">
            {Number(infoCertificado.estado) === 1 ? (
              // Tarjeta Dorada (Flujo Completo)
              <div className="bg-[#FFE600] border-4 border-black p-8 shadow-[12px_12px_0px_0px_#000] transform -rotate-1">
                <div className="flex justify-between items-start mb-6 border-b-4 border-black pb-4">
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tight">Acreditación Auténtica Inmutable</h3>
                    <p className="font-bold text-sm mt-1">El documento es oficial y ha sido firmado por ambas partes.</p>
                  </div>
                  <div className="bg-black text-[#00FF66] p-3 border-4 border-white shadow-[4px_4px_0px_0px_#000] transform rotate-12">
                    <span className="font-black text-2xl">✓</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border-4 border-black p-6 font-bold text-sm shadow-[4px_4px_0px_0px_#000]">
                  <div>
                    <span className="block text-[10px] text-neutral-500 uppercase mb-1">Nombre del Egresado</span>
                    <span className="text-lg font-black">{infoCertificado.nombreEstudiante}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-500 uppercase mb-1">Carrera</span>
                    <span className="text-lg">{infoCertificado.carrera}</span>
                  </div>
                  <div className="p-3 bg-neutral-100 border-2 border-black">
                    <span className="block text-[10px] text-neutral-500 uppercase mb-1">Fecha Emisión (Universidad)</span>
                    <span>{formatearFecha(infoCertificado.fechaEmision)}</span>
                  </div>
                  <div className="p-3 bg-[#00FF66] border-2 border-black">
                    <span className="block text-[10px] text-black uppercase mb-1">Firma Conformidad (Alumno)</span>
                    <span>{formatearFecha(infoCertificado.fechaRecepcion)}</span>
                  </div>
                  <div className="md:col-span-2 break-all text-xs bg-black text-white p-3 border-2 border-black mt-2">
                    <span className="block text-[10px] text-neutral-400 uppercase mb-1">Trazabilidad Emisor (Address)</span>
                    {infoCertificado.emisor}
                  </div>
                </div>
              </div>
            ) : Number(infoCertificado.estado) === 0 ? (
              // Tarjeta Roja Naranja (Falta firma)
              <div className="bg-[#FF6B00] border-4 border-black p-8 shadow-[12px_12px_0px_0px_#000]">
                <h3 className="text-2xl font-black uppercase mb-2">Documento en Tránsito (Pendiente)</h3>
                <p className="font-bold text-sm bg-black text-white p-4 border-2 border-black">
                  Este certificado fue emitido por la universidad el {formatearFecha(infoCertificado.fechaEmision)}, pero el titular aún no ha firmado su conformidad en la blockchain. 
                  <span className="block mt-2 text-[#FF6B00] font-black uppercase">Validez legal incompleta.</span>
                </p>
              </div>
            ) : (
              // Tarjeta Roja Oscura (Revocado)
              <div className="bg-[#FF0055] border-4 border-black p-8 shadow-[12px_12px_0px_0px_#000] text-white">
                <h3 className="text-2xl font-black uppercase mb-2">DOCUMENTO REVOCADO E INVÁLIDO</h3>
                <p className="font-bold text-sm bg-black p-4 border-2 border-white">
                  Este certificado fue cancelado administrativamente. No posee ninguna validez académica ni legal.
                  <span className="block mt-4 text-xs uppercase text-neutral-400">Motivo de revocación:</span>
                  <span className="text-white text-lg font-mono">{infoCertificado.motivoRevocacion}</span>
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
