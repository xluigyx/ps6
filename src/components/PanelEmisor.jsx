import React, { useState, useEffect } from "react";
import { formatUnits } from "ethers";

export default function PanelEmisor({ contract, account }) {
  const [formData, setFormData] = useState({ hash: "", codigo: "", nombre: "", carrera: "", estudiante: "" });
  const [status, setStatus] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Telemetría real del nodo (RF: sin métricas simuladas)
  const [netInfo, setNetInfo] = useState({ chainId: null, blockNumber: null, gasGwei: null });

  // Roles on-chain para condicionar la UI (RF3 / RF5)
  const [isOwner, setIsOwner] = useState(false);
  const [isEmisor, setIsEmisor] = useState(false);

  // Revocación (RF3)
  const [revocarData, setRevocarData] = useState({ hash: "", motivo: "" });
  const [revocarStatus, setRevocarStatus] = useState("");
  const [revocarLoading, setRevocarLoading] = useState(false);

  // Gestión de emisores (RF5)
  const [emisorData, setEmisorData] = useState({ address: "", autorizar: true });
  const [emisorStatus, setEmisorStatus] = useState("");
  const [emisorLoading, setEmisorLoading] = useState(false);

  // Detectar privilegios del wallet conectado leyendo el contrato
  useEffect(() => {
    let cancelado = false;
    const cargarRoles = async () => {
      if (!contract || !account) {
        setIsOwner(false);
        setIsEmisor(false);
        return;
      }
      try {
        const [ownerAddr, emisor] = await Promise.all([
          contract.owner(),
          contract.emisoresAutorizados(account),
        ]);
        if (cancelado) return;
        setIsOwner(ownerAddr.toLowerCase() === account.toLowerCase());
        setIsEmisor(Boolean(emisor));
      } catch (err) {
        console.error("No se pudieron leer los roles on-chain:", err);
        if (!cancelado) {
          setIsOwner(false);
          setIsEmisor(false);
        }
      }
    };
    cargarRoles();
    return () => { cancelado = true; };
  }, [contract, account]);

  // Lee telemetría real del nodo (chainId, último bloque, gas) en lugar de valores fijos
  useEffect(() => {
    let cancelado = false;
    const provider = contract?.runner?.provider;
    if (!provider) {
      setNetInfo({ chainId: null, blockNumber: null, gasGwei: null });
      return;
    }
    const cargarRed = async () => {
      try {
        const [net, blockNumber, feeData] = await Promise.all([
          provider.getNetwork(),
          provider.getBlockNumber(),
          provider.getFeeData(),
        ]);
        if (cancelado) return;
        const gasWei = feeData.gasPrice ?? feeData.maxFeePerGas;
        setNetInfo({
          chainId: net.chainId.toString(),
          blockNumber,
          gasGwei: gasWei ? Number(formatUnits(gasWei, "gwei")).toFixed(2) : null,
        });
      } catch (err) {
        console.error("No se pudo leer la telemetría del nodo:", err);
      }
    };
    cargarRed();
    return () => { cancelado = true; };
  }, [contract, account]);

  const handleRevocar = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setRevocarLoading(true);
      setRevocarStatus("⏳ Difundiendo orden de revocación a la red...");
      const hashFixed = revocarData.hash.startsWith("0x") ? revocarData.hash : "0x" + revocarData.hash;
      const tx = await contract.revocarCertificado(hashFixed, revocarData.motivo);
      await tx.wait();
      setRevocarStatus("✅ Certificado revocado on-chain. El motivo quedó asentado de forma inmutable.");
      setRevocarData({ hash: "", motivo: "" });
    } catch (err) {
      console.error(err);
      const motivo = err?.reason || err?.shortMessage || "transacción revertida por la red";
      setRevocarStatus(`❌ No se pudo revocar: ${motivo}. (Requiere ser emisor autorizado y que el certificado exista y no esté ya revocado).`);
    } finally {
      setRevocarLoading(false);
    }
  };

  const handleGestionEmisor = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setEmisorLoading(true);
      setEmisorStatus("⏳ Actualizando la lista blanca de emisores...");
      const tx = await contract.ordenarEmisor(emisorData.address, emisorData.autorizar);
      await tx.wait();
      setEmisorStatus(
        emisorData.autorizar
          ? "✅ Emisor autorizado. Ahora puede emitir y revocar certificados."
          : "✅ Autorización revocada. El emisor ya no puede operar."
      );
      setEmisorData({ address: "", autorizar: true });
    } catch (err) {
      console.error(err);
      const motivo = err?.reason || err?.shortMessage || "transacción revertida por la red";
      setEmisorStatus(`❌ No se pudo actualizar el emisor: ${motivo}. (Solo el propietario de la DApp puede gestionar emisores).`);
    } finally {
      setEmisorLoading(false);
    }
  };

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
        formData.codigo,
        formData.nombre,
        formData.carrera,
        formData.estudiante
      );
      await tx.wait();
      setStatus("✅ Bloque confirmado. Hash de certificado asentado de forma inmutable.");
      setFormData({ hash: "", codigo: "", nombre: "", carrera: "", estudiante: "" });
    } catch (err) {
      console.error(err);
      setStatus("❌ Excepción en la red: Verifique que sea una dirección autorizada.");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

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

          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Código del Certificado (Folio):</label>
            <input
              type="text"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
              placeholder="Ej: UV-ING-2026-0042"
              required
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
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
            disabled={txLoading || !formData.hash || !formData.codigo || !formData.nombre || !formData.carrera || !formData.estudiante}
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
            <span className="text-slate-400">Chain ID</span>
            <span className="text-cyan-400 font-bold">{netInfo.chainId ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-white/5 rounded-xl">
            <span className="text-slate-400">Último Bloque</span>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${netInfo.blockNumber !== null ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500"}`} />
              <span className={netInfo.blockNumber !== null ? "text-emerald-400" : "text-slate-500"}>
                {netInfo.blockNumber !== null ? `#${netInfo.blockNumber}` : "Sin conexión"}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-white/5 rounded-xl">
            <span className="text-slate-400">Gas Actual</span>
            <span className="text-slate-300">{netInfo.gasGwei !== null ? `${netInfo.gasGwei} Gwei` : "—"}</span>
          </div>
        </div>

        <div className="p-4 border border-dashed border-white/10 rounded-xl text-center bg-slate-950/20">
           <div className="text-emerald-400 text-lg mb-1 flex justify-center"><svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
           <p className="text-[10px] text-slate-400 uppercase font-mono">Blockchain Escuchando</p>
        </div>

        {/* Indicador de rol on-chain del wallet conectado */}
        <div className="text-center">
          {isOwner ? (
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Propietario de la DApp</span>
          ) : isEmisor ? (
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Emisor Autorizado</span>
          ) : (
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-white/10">Sin Privilegios de Emisión</span>
          )}
        </div>
      </div>

    </div>

      {/* ───────────── ADMINISTRACIÓN ON-CHAIN (RF3 / RF5) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* REVOCACIÓN (RF3) — solo emisor autorizado */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white tracking-wide uppercase">Revocar Certificado</h3>
              <p className="text-xs text-slate-400 mt-1">RF3 · Anular un acta por error administrativo</p>
            </div>
            <span className="text-2xl">⚠️</span>
          </div>

          {!isEmisor && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] font-mono text-amber-400">
              Tu wallet no es un emisor autorizado. La red rechazará la transacción.
            </div>
          )}

          <form onSubmit={handleRevocar} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Hash del Certificado (ID):</label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-cyan-400 focus:outline-none focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all"
                placeholder="0x4fa2c3..."
                required
                value={revocarData.hash}
                onChange={(e) => setRevocarData({ ...revocarData, hash: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Motivo de la Revocación:</label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all"
                placeholder="Ej: Error en los datos del titular"
                required
                value={revocarData.motivo}
                onChange={(e) => setRevocarData({ ...revocarData, motivo: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={revocarLoading || !revocarData.hash || !revocarData.motivo}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold uppercase text-xs tracking-wider p-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(239,68,68,0.15)] disabled:opacity-50 disabled:grayscale"
            >
              {revocarLoading ? "Procesando en Red..." : "Revocar en Ledger"}
            </button>
          </form>

          {revocarStatus && (
            <div className="mt-5 p-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-xs font-mono text-slate-300 break-words">
              {revocarStatus}
            </div>
          )}
        </div>

        {/* GESTIÓN DE EMISORES (RF5) — solo owner */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white tracking-wide uppercase">Gestión de Emisores</h3>
              <p className="text-xs text-slate-400 mt-1">RF5 · Autorizar o revocar Rectores / Directores</p>
            </div>
            <span className="text-2xl">🔑</span>
          </div>

          {!isOwner && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] font-mono text-amber-400">
              Solo el propietario de la DApp puede gestionar emisores. La red rechazará la transacción.
            </div>
          )}

          <form onSubmit={handleGestionEmisor} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Dirección del Emisor (Wallet):</label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
                placeholder="0x0000..."
                required
                value={emisorData.address}
                onChange={(e) => setEmisorData({ ...emisorData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">Acción:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmisorData({ ...emisorData, autorizar: true })}
                  className={`flex-1 p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${emisorData.autorizar ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" : "bg-slate-950/40 text-slate-400 border-white/10"}`}
                >
                  Autorizar
                </button>
                <button
                  type="button"
                  onClick={() => setEmisorData({ ...emisorData, autorizar: false })}
                  className={`flex-1 p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${!emisorData.autorizar ? "bg-red-500/15 text-red-400 border-red-500/40" : "bg-slate-950/40 text-slate-400 border-white/10"}`}
                >
                  Revocar Permiso
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={emisorLoading || !emisorData.address}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold uppercase text-xs tracking-wider p-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(6,182,212,0.15)] disabled:opacity-50 disabled:grayscale"
            >
              {emisorLoading ? "Procesando en Red..." : "Aplicar Cambio de Permisos"}
            </button>
          </form>

          {emisorStatus && (
            <div className="mt-5 p-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-xs font-mono text-slate-300 break-words">
              {emisorStatus}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
