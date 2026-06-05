import React, { useState } from "react";

export default function Verificador({ contract }) {
  const [hashInput, setHashInput] = useState("");
  const [cert, setCert] = useState(null);
  const [status, setStatus] = useState("");

  const verificar = async () => {
    if (!contract || !hashInput) return;
    try {
      setStatus("");
      const hashFixed = hashInput.startsWith("0x") ? hashInput : "0x" + hashInput;
      const data = await contract.verificarCertificado(hashFixed);
      setCert(data);
    } catch (err) {
      console.error(err);
      setStatus("❌ Alerta: El hash ingresado no coincide con ningún bloque minado en la red.");
      setCert(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto font-sans bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="text-center mb-8">
        <h3 className="text-base font-semibold text-white uppercase tracking-wider">Módulo de Auditoría Externa</h3>
        <p className="text-xs text-slate-400 mt-1">Verificación automatizada descentralizada sin intermediarios centralizados</p>
      </div>

      {/* DROPZONE DE ARRASTRE SIMULADO */}
      <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center bg-slate-950/20 mb-6 hover:border-cyan-500/30 transition-all">
        <span className="text-3xl block mb-2">📁</span>
        <p className="text-xs text-slate-300 font-medium">Arrastre el PDF del Certificado aquí para procesar su Hash</p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">O ingrese el hash manualmente abajo</p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 font-mono text-xs text-cyan-400 focus:outline-none"
          placeholder="Ingrese el Hash del certificado a auditar (0x...)"
          onChange={(e) => setHashInput(e.target.value)}
        />
        <button
          onClick={verificar}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold p-3 rounded-xl uppercase tracking-wider text-xs"
        >
          Validar Autenticidad en Blockchain
        </button>
      </div>

      {status && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-mono text-center">
          {status}
        </div>
      )}

      {/* TARJETA RESULTANTE DE ALTA FIDELIDAD */}
      {cert && (
        <div className="mt-8 p-5 rounded-xl bg-slate-950/40 border border-white/10 font-mono text-xs space-y-3 shadow-inner">
          <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
            <span className="text-xs font-sans font-bold text-white uppercase">Resultado de la Consulta</span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
              Number(cert.estado) === 1 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 text-amber-400"
            }`}>
              {Number(cert.estado) === 0 ? "Falta Firma Alumno" : Number(cert.estado) === 1 ? "Válido y Auténtico" : "Revocado"}
            </span>
          </div>
          <p><span className="text-slate-400">Titular:</span> <span className="font-sans text-sm text-slate-200 font-medium">{cert.nombreEstudiante}</span></p>
          <p><span className="text-slate-400">Carrera:</span> <span className="font-sans text-xs text-slate-300">{cert.carrera}</span></p>
          <p><span className="text-slate-400">Emisor Certificado:</span> <span className="text-slate-400 text-[10px]">{cert.emisor}</span></p>
        </div>
      )}
    </div>
  );
}
