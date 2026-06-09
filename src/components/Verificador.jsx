import React, { useState } from "react";

export default function Verificador({ contract }) {
  const [hashInput, setHashInput] = useState("");
  const [cert, setCert] = useState(null);
  const [nft, setNft] = useState(null);
  const [status, setStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    
    try {
      setStatus("Calculando Hash SHA-256 localmente...");
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHashInput(hashHex);
      await verificarHash(hashHex);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error al procesar el documento PDF.");
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

  const verificarHash = async (hashToVerify) => {
    if (!contract || !hashToVerify) return;
    try {
      setLoading(true);
      setStatus("Consultando validadores de la red...");
      const hashFixed = hashToVerify.startsWith("0x") ? hashToVerify : "0x" + hashToVerify;
      const data = await contract.verificarCertificado(hashFixed);
      setCert(data);
      setStatus("");

      // §11: leer la representación NFT (tokenId, owner, metadatos on-chain decodificados)
      try {
        const tokenId = await contract.tokenPorHash(hashFixed);
        if (tokenId && tokenId > 0n) {
          const [owner, uri] = await Promise.all([
            contract.ownerOf(tokenId),
            contract.tokenURI(tokenId),
          ]);
          let metadata = null;
          const marca = "base64,";
          if (uri.includes(marca)) {
            try { metadata = JSON.parse(atob(uri.split(marca)[1])); } catch { metadata = null; }
          }
          setNft({ tokenId: tokenId.toString(), owner, metadata });
        } else {
          setNft(null);
        }
      } catch (e) {
        console.error("No se pudo leer el NFT:", e);
        setNft(null);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Alerta: El hash ingresado no coincide con ningún bloque minado en la red.");
      setCert(null);
      setNft(null);
    } finally {
      setLoading(false);
    }
  };

  const formatearFechaExacta = (timestamp) => {
    if (!timestamp || Number(timestamp) === 0) return "N/A";
    const date = new Date(Number(timestamp) * 1000);
    return date.toISOString().replace('T', ' ').split('.')[0] + ' UTC';
  };

  return (
    <div className="max-w-3xl mx-auto font-sans bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="text-center mb-8">
        <h3 className="text-base font-semibold text-white uppercase tracking-wider">Módulo de Auditoría Externa</h3>
        <p className="text-xs text-slate-400 mt-1">Verificación automatizada descentralizada sin intermediarios centralizados</p>
      </div>

      {/* DROPZONE DE ARRASTRE SIMULADO */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-all ${isDragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/20 bg-slate-950/20 hover:border-cyan-500/30'}`}
      >
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileUpload} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <span className="text-3xl block mb-2">📁</span>
        <p className="text-xs text-slate-300 font-medium">Arrastre el PDF del Certificado aquí para procesar su Hash</p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">O ingrese el hash manualmente abajo</p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 font-mono text-xs text-cyan-400 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
          placeholder="Ingrese el Hash del certificado a auditar (0x...)"
          value={hashInput}
          onChange={(e) => setHashInput(e.target.value)}
        />
        <button
          onClick={() => verificarHash(hashInput)}
          disabled={loading || !hashInput}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold p-3 rounded-xl uppercase tracking-wider text-xs shadow-[0_4px_20px_rgba(6,182,212,0.25)] transition-all disabled:opacity-50 disabled:grayscale"
        >
          {loading ? "Validando en Red..." : "Validar Autenticidad en Blockchain"}
        </button>
      </div>

      {status && (
        <div className={`mt-6 p-4 border rounded-xl text-xs font-mono text-center ${status.includes("❌") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"}`}>
          {status}
        </div>
      )}

      {/* TARJETA RESULTANTE DE ALTA FIDELIDAD */}
      {cert && (
        <div className="mt-8">
          {Number(cert.estado) === 1 ? (
             <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border border-amber-500/30 font-mono text-xs shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                  <div className="bg-amber-500/20 border border-amber-500/40 text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Validado On-Chain
                  </div>
               </div>
               
               <h4 className="text-amber-400 font-sans font-bold uppercase tracking-wider text-sm mb-4 border-b border-amber-500/20 pb-2 inline-block">Trazabilidad Criptográfica Aprobada</h4>

               {cert.codigo && (
                 <div className="mb-6">
                   <span className="text-slate-400 text-[10px] uppercase block mb-1">Código / Folio del Certificado</span>
                   <span className="font-mono text-sm text-amber-400 font-bold">{cert.codigo}</span>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <span className="text-slate-400 text-[10px] uppercase block mb-1">Titular Académico</span>
                    <span className="font-sans text-sm text-slate-200 font-medium">{cert.nombreEstudiante}</span>
                 </div>
                 <div>
                    <span className="text-slate-400 text-[10px] uppercase block mb-1">Programa Certificado</span>
                    <span className="font-sans text-sm text-slate-200 font-medium">{cert.carrera}</span>
                 </div>
               </div>

               <div className="mt-6 space-y-4 border-t border-white/5 pt-4">
                 <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5">
                    <span className="text-slate-500 text-[9px] uppercase block mb-1">Emisor (Firma Universidad)</span>
                    <span className="text-slate-400 text-[10px] block break-all mb-1">{cert.emisor}</span>
                    <span className="text-amber-400 font-bold">{formatearFechaExacta(cert.fechaEmision)}</span>
                 </div>
                 <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5">
                    <span className="text-slate-500 text-[9px] uppercase block mb-1">Receptor (Firma Estudiante)</span>
                    <span className="text-slate-400 text-[10px] block break-all mb-1">{cert.estudiante}</span>
                    <span className="text-amber-400 font-bold">{formatearFechaExacta(cert.fechaRecepcion)}</span>
                 </div>
               </div>
             </div>
          ) : Number(cert.estado) === 0 ? (
             <div className="p-5 rounded-xl bg-slate-950/40 border border-white/10 font-mono text-xs space-y-3 shadow-inner">
               <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                 <span className="text-xs font-sans font-bold text-white uppercase">Resultado de la Consulta</span>
                 <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                   Falta Firma Alumno
                 </span>
               </div>
               <p><span className="text-slate-400">Titular:</span> <span className="font-sans text-sm text-slate-200 font-medium">{cert.nombreEstudiante}</span></p>
               <p className="text-slate-500 italic mt-2">Este documento existe en el ledger pero no tiene validez legal plena porque el estudiante aún no ha firmado la transacción de conformidad en la Blockchain.</p>
             </div>
          ) : (
             <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-center shadow-[0_0_20px_rgba(239,68,68,0.15)] relative overflow-hidden">
                <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xl mb-3 border border-red-500/30 mx-auto shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                   ✕
                </div>
                <h4 className="text-red-400 font-sans font-bold uppercase tracking-wider mb-2">Alerta: Brecha de Seguridad</h4>
                <p className="text-slate-300 font-mono text-xs mb-4">Este documento criptográfico ha sido REVOCADO oficialmente por la Universidad.</p>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-red-500/20 font-mono text-xs text-left">
                  <span className="text-red-500 block mb-1">Motivo de la revocación on-chain:</span>
                  <span className="text-slate-400">{cert.motivoRevocacion}</span>
                </div>
             </div>
          )}

          {/* §11 — Representación NFT ERC-721 soulbound del certificado */}
          {nft && (
            <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-600/5 border border-violet-500/30 font-mono text-xs shadow-[0_0_25px_rgba(139,92,246,0.12)]">
              <div className="flex items-center justify-between mb-4 border-b border-violet-500/20 pb-2">
                <h4 className="text-violet-300 font-sans font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>🎖️</span> Certificado tokenizado (NFT)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  Soulbound · Intransferible
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block mb-1">Token ID</span>
                  <span className="text-violet-300 font-bold">#{nft.tokenId}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block mb-1">Propietario (ownerOf)</span>
                  <span className="text-slate-300 break-all">{nft.owner}</span>
                </div>
                {nft.metadata && (
                  <>
                    <div>
                      <span className="text-slate-500 text-[9px] uppercase block mb-1">Estado en metadatos on-chain</span>
                      <span className="text-slate-200">{nft.metadata.attributes?.find(a => a.trait_type === "Estado")?.value || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] uppercase block mb-1">Universidad</span>
                      <span className="text-slate-200">{nft.metadata.attributes?.find(a => a.trait_type === "Universidad")?.value || "—"}</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-3">Metadatos generados 100% on-chain (data:application/json;base64), sin IPFS ni servidores externos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
