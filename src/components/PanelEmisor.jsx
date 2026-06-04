import { useRef, useState, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import toast from 'react-hot-toast';

// ─── Estados del proceso de emisión ──────────────────────
const ESTADOS = { IDLE: 'idle', DRAG: 'drag', HASHING: 'hashing', LISTO: 'listo', SIGNING: 'signing', CONFIRMED: 'confirmed', ERROR: 'error' };

export default function PanelEmisor() {
  const { isConnected, connect, calcularHashPDF, emitirCertificado, account, rolInfo, gasPrice, network, chainId } = useWeb3();
  const dropRef   = useRef(null);
  const inputRef  = useRef(null);

  const [estado,    setEstado]    = useState(ESTADOS.IDLE);
  const [archivo,   setArchivo]   = useState(null);
  const [hashParcial, setHashParcial] = useState('');
  const [hashFinal, setHashFinal] = useState('');
  const [hashProgress, setHashProgress] = useState(0);
  const [form,      setForm]      = useState({ nombre: '', carrera: '', universidad: 'Universidad del Valle' });
  const [txHash,    setTxHash]    = useState('');
  const [errorMsg,  setErrorMsg]  = useState('');

  // ── Animación de construcción del hash ─────────────────
  const animarHash = useCallback(async (hashReal) => {
    const chars = '0123456789abcdef';
    for (let i = 0; i < hashReal.length; i++) {
      await new Promise(r => setTimeout(r, 18));
      setHashParcial(hashReal.slice(0, i + 1) + chars[Math.floor(Math.random() * 16)].repeat(hashReal.length - i - 1));
      setHashProgress(Math.round(((i + 1) / hashReal.length) * 100));
    }
    setHashParcial(hashReal);
  }, []);

  // ── Procesar archivo ───────────────────────────────────
  const procesarArchivo = useCallback(async (file) => {
    if (file.type !== 'application/pdf') {
      toast.error('Solo se aceptan archivos PDF');
      return;
    }
    setArchivo(file);
    setEstado(ESTADOS.HASHING);
    setHashProgress(0);
    try {
      const hash = await calcularHashPDF(file);
      await animarHash(hash);
      setHashFinal(hash);
      setEstado(ESTADOS.LISTO);
      toast.success('Hash SHA-256 calculado correctamente');
    } catch (err) {
      setEstado(ESTADOS.ERROR);
      setErrorMsg('Error calculando hash: ' + err.message);
    }
  }, [calcularHashPDF, animarHash]);

  // ── Drag & Drop handlers ───────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setEstado(s => s === ESTADOS.IDLE ? ESTADOS.DRAG : s); };
  const onDragLeave = ()  => { setEstado(s => s === ESTADOS.DRAG ? ESTADOS.IDLE : s); };
  const onDrop      = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) procesarArchivo(f); };
  const onFileInput = (e) => { const f = e.target.files[0]; if (f) procesarArchivo(f); };

  // ── Emitir en blockchain ───────────────────────────────
  const handleEmitir = async () => {
    if (!form.nombre || !form.carrera || !form.universidad) {
      toast.error('Completa todos los campos del estudiante');
      return;
    }
    setEstado(ESTADOS.SIGNING);
    try {
      const receipt = await emitirCertificado({
        hashId:     hashFinal,
        nombre:     form.nombre,
        carrera:    form.carrera,
        universidad: form.universidad,
      });
      setTxHash(receipt.hash);
      setEstado(ESTADOS.CONFIRMED);
      toast.success('¡Certificado emitido en la blockchain!');
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err.message || 'Error desconocido';
      setEstado(ESTADOS.ERROR);
      setErrorMsg(msg);
      toast.error('Error al emitir: ' + msg);
    }
  };

  // ── Reset ──────────────────────────────────────────────
  const reset = () => {
    setEstado(ESTADOS.IDLE); setArchivo(null);
    setHashParcial(''); setHashFinal(''); setHashProgress(0);
    setTxHash(''); setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const dropZoneClass = {
    [ESTADOS.IDLE]:      'drop-zone-idle',
    [ESTADOS.DRAG]:      'drop-zone-hover',
    [ESTADOS.HASHING]:   'drop-zone-processing',
    [ESTADOS.LISTO]:     'drop-zone-done',
    [ESTADOS.SIGNING]:   'drop-zone-processing',
    [ESTADOS.CONFIRMED]: 'drop-zone-done',
    [ESTADOS.ERROR]:     'border-2 border-cyber-red shadow-neon-red',
  }[estado] || 'drop-zone-idle';

  const shortAddr = account ? `${account.slice(0,6)}...${account.slice(-4)}` : '—';
  const explorerUrl = network?.explorer || 'https://sepolia.etherscan.io';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">

      {/* ── Columna izquierda: Info emisor ─────────────────── */}
      <div className="space-y-4">

        {/* Info del emisor */}
        <div className="cyber-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-cyber-cyan text-lg">◈</span>
            <h2 className="font-display font-semibold text-cyber-text">Emisor Activo</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-cyber-muted font-mono">DIRECCIÓN</span>
              <span className="font-mono text-xs text-cyber-cyan">{shortAddr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-cyber-muted font-mono">ROL</span>
              <span className={`font-mono text-xs font-semibold ${rolInfo?.activo ? 'text-cyber-lime' : 'text-cyber-red'}`}>
                {rolInfo?.activo ? (rolInfo.rol === 1 ? 'Rector' : 'Dir. Carrera') : 'Sin permisos'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-cyber-muted font-mono">NOMBRE</span>
              <span className="font-mono text-xs text-cyber-text">{rolInfo?.nombre || '—'}</span>
            </div>
            <div className="cyber-divider"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-cyber-muted font-mono">ESTADO</span>
              {rolInfo?.activo ? (
                <span className="badge-valid"><span className="status-dot online"></span>Autorizado</span>
              ) : (
                <span className="badge-revoked"><span className="status-dot offline"></span>Sin acceso</span>
              )}
            </div>
          </div>
        </div>

        {/* Gas Tracker */}
        <div className="cyber-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-cyber-yellow text-lg">⛽</span>
            <h2 className="font-display font-semibold text-cyber-text">Gas Tracker</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-xs text-cyber-muted">Precio base</span>
                <span className="font-mono text-sm font-bold text-cyber-yellow">{gasPrice || '—'} Gwei</span>
              </div>
              <div className="w-full h-1.5 bg-cyber-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyber-lime to-cyber-yellow transition-all duration-500"
                  style={{ width: `${Math.min((parseFloat(gasPrice || 0) / 50) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-xs text-cyber-muted">Est. costo tx</span>
              <span className="font-mono text-xs text-cyber-text">~0.001 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-xs text-cyber-muted">Red</span>
              <span className="font-mono text-xs text-cyber-cyan">{network?.name || 'No conectado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-xs text-cyber-muted">Chain ID</span>
              <span className="font-mono text-xs text-cyber-purple">{chainId || '—'}</span>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="cyber-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-cyber-purple text-lg">⬢</span>
            <h2 className="font-display font-semibold text-cyber-text">Sesión Actual</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'TX FIRMADAS', value: '0', color: 'text-cyber-cyan' },
              { label: 'GAS USADO',   value: '0',  color: 'text-cyber-yellow' },
            ].map((s) => (
              <div key={s.label} className="bg-cyber-bg rounded-lg p-3 border border-cyber-border text-center">
                <div className={`neon-number text-xl ${s.color}`}>{s.value}</div>
                <div className="font-mono text-[9px] text-cyber-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Columna central: Zona de emisión ───────────────── */}
      <div className="xl:col-span-2 space-y-4">
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-cyber-cyan text-xl">⬡</span>
              <h2 className="font-display font-bold text-cyber-text text-lg">Zona de Emisión</h2>
            </div>
            {(estado !== ESTADOS.IDLE) && (
              <button onClick={reset} className="btn-secondary !text-xs !py-1 !px-3">↺ Reiniciar</button>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 animate-bounce-soft">🦊</div>
              <p className="font-display text-cyber-muted mb-4">Conecta MetaMask para emitir certificados</p>
              <button onClick={connect} className="btn-cyber">Conectar Wallet</button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Drop Zone */}
              <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => estado === ESTADOS.IDLE && inputRef.current?.click()}
                className={`relative rounded-xl cursor-pointer transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center p-8 ${dropZoneClass}`}
              >
                <input ref={inputRef} type="file" accept=".pdf" onChange={onFileInput} className="hidden" />

                {/* IDLE */}
                {estado === ESTADOS.IDLE && (
                  <div className="text-center">
                    <div className="text-5xl mb-3 animate-bounce-soft">📄</div>
                    <p className="font-display font-semibold text-cyber-text text-lg mb-1">Arrastra el PDF aquí</p>
                    <p className="font-mono text-xs text-cyber-muted">o haz clic para seleccionar</p>
                    <div className="mt-4 flex gap-2 justify-center">
                      {['PDF', 'SHA-256', 'On-Chain'].map((t) => (
                        <span key={t} className="font-mono text-[10px] text-cyber-cyan/60 border border-cyber-cyan/20 rounded px-2 py-0.5">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* DRAG */}
                {estado === ESTADOS.DRAG && (
                  <div className="text-center animate-pulse">
                    <div className="text-5xl mb-3">⬇</div>
                    <p className="font-display font-bold text-cyber-cyan text-xl">SUELTA PARA PROCESAR</p>
                    <p className="font-mono text-xs text-cyber-cyan/60 mt-2">Calculando SHA-256 en cliente...</p>
                  </div>
                )}

                {/* HASHING */}
                {estado === ESTADOS.HASHING && (
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-5 h-5 border-2 border-cyber-yellow/30 border-t-cyber-yellow rounded-full animate-spin"></div>
                      <span className="font-display font-semibold text-cyber-yellow">Calculando SHA-256...</span>
                      <span className="font-mono text-xs text-cyber-yellow ml-auto">{hashProgress}%</span>
                    </div>
                    <div className="w-full bg-cyber-border rounded-full h-1.5 mb-4">
                      <div
                        className="h-1.5 bg-gradient-to-r from-cyber-yellow to-cyber-orange rounded-full transition-all duration-100"
                        style={{ width: `${hashProgress}%` }}
                      ></div>
                    </div>
                    <div className="font-mono text-xs text-cyber-yellow/80 break-all bg-cyber-bg rounded-lg p-3 border border-cyber-yellow/20 typing-cursor">
                      {hashParcial || '0x...'}
                    </div>
                    <p className="font-mono text-[10px] text-cyber-muted mt-2 text-center">
                      📄 {archivo?.name} · {(archivo?.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                {/* LISTO */}
                {estado === ESTADOS.LISTO && (
                  <div className="w-full animate-slide-up">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-cyber-lime text-xl">✓</span>
                      <span className="font-display font-semibold text-cyber-lime">Hash SHA-256 Calculado</span>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border border-cyber-lime/30 bg-cyber-bg p-3">
                      {/* Efecto scan */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-cyber-lime/5 to-transparent animate-scan"></div>
                      </div>
                      <p className="font-mono text-xs text-cyber-lime break-all relative z-10">{hashFinal}</p>
                    </div>
                    <p className="font-mono text-[10px] text-cyber-muted mt-2">
                      📄 {archivo?.name} · {(archivo?.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                {/* SIGNING */}
                {estado === ESTADOS.SIGNING && (
                  <div className="text-center">
                    <div className="relative inline-flex mb-4">
                      <div className="w-16 h-16 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">🦊</div>
                    </div>
                    <p className="font-display font-bold text-cyber-cyan text-lg">Firmando con MetaMask</p>
                    <p className="font-mono text-xs text-cyber-muted mt-2">Confirma la transacción en tu wallet...</p>
                  </div>
                )}

                {/* CONFIRMED */}
                {estado === ESTADOS.CONFIRMED && (
                  <div className="text-center animate-slide-up">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="font-display font-bold text-cyber-lime text-xl mb-2">¡Certificado Emitido!</p>
                    <p className="font-mono text-xs text-cyber-muted mb-3">Transaction hash:</p>
                    <a
                      href={`${explorerUrl}/tx/${txHash}`}
                      target="_blank" rel="noreferrer"
                      className="hash-display text-cyber-cyan hover:text-cyber-lime transition-colors"
                    >
                      {txHash}
                    </a>
                  </div>
                )}

                {/* ERROR */}
                {estado === ESTADOS.ERROR && (
                  <div className="text-center">
                    <div className="text-5xl mb-3">⚠</div>
                    <p className="font-display font-bold text-cyber-red text-lg mb-2">Error en la Transacción</p>
                    <p className="font-mono text-xs text-cyber-red/70 bg-cyber-red/5 rounded-lg p-3 border border-cyber-red/20">{errorMsg}</p>
                  </div>
                )}
              </div>

              {/* Formulario de datos */}
              {(estado === ESTADOS.LISTO || estado === ESTADOS.SIGNING) && (
                <div className="space-y-4 animate-slide-up">
                  <div className="cyber-divider"></div>
                  <h3 className="font-display font-semibold text-cyber-text flex items-center gap-2">
                    <span className="text-cyber-cyan">📋</span> Datos del Certificado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs text-cyber-muted mb-1.5">NOMBRE DEL ESTUDIANTE *</label>
                      <input
                        className="cyber-input"
                        placeholder="Ej: Juan Camilo Pérez García"
                        value={form.nombre}
                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-cyber-muted mb-1.5">PROGRAMA ACADÉMICO *</label>
                      <input
                        className="cyber-input"
                        placeholder="Ej: Ingeniería de Sistemas"
                        value={form.carrera}
                        onChange={e => setForm(f => ({ ...f, carrera: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-mono text-xs text-cyber-muted mb-1.5">INSTITUCIÓN EMISORA</label>
                      <input
                        className="cyber-input"
                        value={form.universidad}
                        onChange={e => setForm(f => ({ ...f, universidad: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* ID del certificado */}
                  <div>
                    <label className="block font-mono text-xs text-cyber-muted mb-1.5">ID DEL CERTIFICADO (SHA-256)</label>
                    <div className="hash-display">{hashFinal}</div>
                  </div>

                  <button
                    onClick={handleEmitir}
                    disabled={estado === ESTADOS.SIGNING || !rolInfo?.activo}
                    className="btn-cyber w-full justify-center text-base py-3"
                  >
                    {estado === ESTADOS.SIGNING ? (
                      <><span className="inline-block w-4 h-4 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin"></span> Procesando...</>
                    ) : (
                      <><span>◈</span> Firmar y Emitir en Blockchain</>
                    )}
                  </button>

                  {!rolInfo?.activo && (
                    <p className="font-mono text-xs text-cyber-red text-center">
                      ⚠ Tu dirección no tiene permisos de emisión
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
