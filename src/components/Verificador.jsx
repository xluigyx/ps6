import { useState, useRef, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { ESTADO_LABELS } from '../config/contract';

const ESTADOS = { IDLE: 'idle', HASHING: 'hashing', SEARCHING: 'searching', VALID: 'valid', INVALID: 'invalid', REVOKED: 'revoked', ERROR: 'error' };

export default function Verificador() {
  const { verificarCertificado, calcularHashPDF, network } = useWeb3();
  const inputRef      = useRef(null);
  const [estado,       setEstado]      = useState(ESTADOS.IDLE);
  const [hashInput,    setHashInput]   = useState('');
  const [resultado,    setResultado]   = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMsg,     setErrorMsg]    = useState('');
  const [progress,     setProgress]    = useState(0);

  const explorerUrl = network?.explorer || 'https://sepolia.etherscan.io';

  // ── Verificar por hash ────────────────────────────────
  const verificar = useCallback(async (hashId) => {
    if (!hashId || hashId.length < 10) { toast.error('Hash inválido'); return; }
    setEstado(ESTADOS.SEARCHING);
    setResultado(null);
    try {
      const { cert, existe } = await verificarCertificado(hashId);
      if (!existe) {
        setEstado(ESTADOS.INVALID);
        setErrorMsg('Hash no registrado en la blockchain');
        return;
      }
      const estadoNum = Number(cert.estado);
      setResultado({
        nombre:    cert.nombreEstudiante,
        carrera:   cert.carrera,
        universidad: cert.universidad,
        emisor:    cert.emisor,
        tsEmision: Number(cert.timestampEmision),
        tsRevocacion: Number(cert.timestampRevocacion),
        motivo:    cert.motivoRevocacion,
        estado:    estadoNum,
        id:        hashId,
      });
      if (estadoNum === 0) {
        setEstado(ESTADOS.VALID);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success('¡Certificado VÁLIDO!');
      } else {
        setEstado(ESTADOS.REVOKED);
        toast.error('Certificado REVOCADO');
      }
    } catch (err) {
      setEstado(ESTADOS.ERROR);
      setErrorMsg(err?.reason || err.message || 'Error de red');
    }
  }, [verificarCertificado]);

  // ── Verificar subiendo PDF ────────────────────────────
  const onFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Solo PDF'); return; }
    setEstado(ESTADOS.HASHING);
    setProgress(0);
    // Animar progreso
    const interval = setInterval(() => setProgress(p => Math.min(p + 8, 90)), 80);
    try {
      const hash = await calcularHashPDF(file);
      clearInterval(interval);
      setProgress(100);
      setHashInput(hash);
      await verificar(hash);
    } catch (err) {
      clearInterval(interval);
      setEstado(ESTADOS.ERROR);
      setErrorMsg('Error procesando PDF');
    }
  }, [calcularHashPDF, verificar]);

  const reset = () => {
    setEstado(ESTADOS.IDLE); setHashInput(''); setResultado(null);
    setShowConfetti(false); setErrorMsg(''); setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatDate = (ts) => ts
    ? new Date(ts * 1000).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const shortAddr = (addr) => addr ? `${addr.slice(0,8)}...${addr.slice(-6)}` : '—';

  // ── Descargar badge ───────────────────────────────────
  const descargarBadge = () => {
    if (!resultado) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Fondo
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, 800, 480);

    // Borde neón
    ctx.strokeStyle = '#00F5FF';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 780, 460);

    // Título
    ctx.fillStyle = '#00F5FF';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('◈ CERTIFICADO VERIFICADO', 40, 70);

    ctx.fillStyle = '#39FF14';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('✓ VÁLIDO · BLOCKCHAIN VERIFIED', 40, 115);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Estudiante: ${resultado.nombre}`, 40, 165);
    ctx.fillText(`Programa:   ${resultado.carrera}`, 40, 200);
    ctx.fillText(`Universidad: ${resultado.universidad}`, 40, 235);
    ctx.fillText(`Fecha: ${formatDate(resultado.tsEmision)}`, 40, 270);

    ctx.fillStyle = '#64748B';
    ctx.font = '11px monospace';
    ctx.fillText(`ID: ${resultado.id}`, 40, 320);
    ctx.fillText(`Emisor: ${resultado.emisor}`, 40, 345);
    ctx.fillText(`Red: Ethereum · CertChain UNIVALLE`, 40, 370);

    ctx.strokeStyle = '#1e2d45';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 395, 740, 50);
    ctx.fillStyle = '#00F5FF';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('Verificado criptográficamente en Ethereum Blockchain — CertChain UNIVALLE', 40, 425);

    const link = document.createElement('a');
    link.download = `badge_${resultado.nombre.replace(/\s+/g,'_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Badge descargado');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {showConfetti && (
        <Confetti
          numberOfPieces={300}
          recycle={false}
          colors={['#00F5FF', '#39FF14', '#FFE600', '#BF5AF2', '#FF9F0A']}
        />
      )}

      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="font-display font-bold text-3xl text-cyber-text mb-2">
          Verificación <span className="text-cyber-cyan">Pública</span>
        </h1>
        <p className="font-mono text-sm text-cyber-muted">
          Comprueba la autenticidad de cualquier certificado académico en la blockchain
        </p>
      </div>

      {/* Métodos de verificación */}
      {(estado === ESTADOS.IDLE || estado === ESTADOS.HASHING) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">

          {/* Método 1: PDF */}
          <div
            onClick={() => inputRef.current?.click()}
            className="cyber-card cursor-pointer group hover:border-cyber-cyan/60 hover:shadow-neon-cyan"
          >
            <input ref={inputRef} type="file" accept=".pdf" onChange={onFileUpload} className="hidden" />
            <div className="text-center py-6">
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📄</div>
              <h3 className="font-display font-semibold text-cyber-text text-lg mb-2">Sube el PDF</h3>
              <p className="font-mono text-xs text-cyber-muted mb-3">El hash SHA-256 se calcula localmente en tu navegador</p>
              {estado === ESTADOS.HASHING ? (
                <div>
                  <div className="w-full bg-cyber-border rounded-full h-1.5 mb-2">
                    <div className="h-1.5 bg-cyber-cyan rounded-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="font-mono text-xs text-cyber-cyan">Calculando... {progress}%</span>
                </div>
              ) : (
                <span className="btn-secondary !text-xs !py-1.5">Seleccionar PDF →</span>
              )}
            </div>
          </div>

          {/* Método 2: Hash */}
          <div className="cyber-card">
            <div className="text-center py-2 mb-4">
              <div className="text-5xl mb-2">🔍</div>
              <h3 className="font-display font-semibold text-cyber-text text-lg">Ingresa el Hash</h3>
              <p className="font-mono text-xs text-cyber-muted">SHA-256 en hexadecimal (0x...)</p>
            </div>
            <input
              className="cyber-input mb-3"
              placeholder="0x9f86d081884c7d659a2feaa0c55ad..."
              value={hashInput}
              onChange={e => setHashInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verificar(hashInput)}
            />
            <button
              onClick={() => verificar(hashInput)}
              disabled={!hashInput}
              className="btn-cyber w-full justify-center"
            >
              ⬡ Verificar en Blockchain
            </button>
          </div>
        </div>
      )}

      {/* Buscando... */}
      {estado === ESTADOS.SEARCHING && (
        <div className="cyber-card text-center py-12 animate-fade-in">
          <div className="relative inline-flex mb-4">
            <div className="w-16 h-16 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">⛓</div>
          </div>
          <p className="font-display font-bold text-cyber-cyan text-xl mb-2">Consultando Blockchain</p>
          <p className="font-mono text-xs text-cyber-muted">eth_call · Búsqueda O(1) por hash SHA-256...</p>
          <div className="terminal-text mt-4 bg-cyber-bg rounded-lg p-3 border border-cyber-border text-left mx-auto max-w-sm">
            <p>&gt; HASH_LOOKUP: {hashInput?.slice(0,20)}...</p>
            <p>&gt; STATUS: SEARCHING...</p>
            <p>&gt; NETWORK: {network?.name || 'Ethereum'}</p>
          </div>
        </div>
      )}

      {/* RESULTADO VÁLIDO */}
      {estado === ESTADOS.VALID && resultado && (
        <div className="animate-slide-up space-y-4">
          <div className="holographic cyber-card border-cyber-lime/40 shadow-neon-lime scanline relative overflow-hidden">
            {/* Scan line effect */}
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-cyber-lime/5 to-transparent animate-scan"></div>
            </div>

            <div className="flex items-start justify-between mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyber-lime/10 border border-cyber-lime/40 flex items-center justify-center text-2xl shadow-neon-lime">
                  ✓
                </div>
                <div>
                  <h2 className="font-display font-bold text-cyber-lime text-2xl">CERTIFICADO VÁLIDO</h2>
                  <p className="font-mono text-xs text-cyber-lime/60">Verificado en Ethereum Blockchain</p>
                </div>
              </div>
              <span className="badge-valid text-sm px-3 py-1.5">
                <span className="status-dot online"></span>
                VÁLIDO
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-3">
                <div>
                  <p className="font-mono text-[10px] text-cyber-muted mb-0.5">ESTUDIANTE</p>
                  <p className="font-display font-bold text-cyber-text text-xl">{resultado.nombre}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-cyber-muted mb-0.5">PROGRAMA ACADÉMICO</p>
                  <p className="font-display font-semibold text-cyber-cyan text-lg">{resultado.carrera}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-cyber-muted mb-0.5">INSTITUCIÓN</p>
                  <p className="font-display font-medium text-cyber-text">{resultado.universidad}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-mono text-[10px] text-cyber-muted mb-0.5">FECHA DE EMISIÓN</p>
                  <p className="font-mono text-sm text-cyber-yellow">{formatDate(resultado.tsEmision)}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-cyber-muted mb-0.5">EMISOR (ADDRESS)</p>
                  <a href={`${explorerUrl}/address/${resultado.emisor}`} target="_blank" rel="noreferrer"
                    className="font-mono text-xs text-cyber-purple hover:text-cyber-cyan transition-colors">
                    {shortAddr(resultado.emisor)}
                  </a>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-cyber-muted mb-0.5">ID / HASH SHA-256</p>
                  <p className="font-mono text-[10px] text-cyber-cyan/70 break-all">{resultado.id}</p>
                </div>
              </div>
            </div>

            <div className="cyber-divider relative z-10"></div>
            <div className="flex gap-3 relative z-10">
              <button onClick={descargarBadge} className="btn-cyber flex-1 justify-center">
                ⬇ Descargar Badge Digital
              </button>
              <button onClick={reset} className="btn-secondary !px-4">↺ Nueva Verificación</button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTADO REVOCADO */}
      {estado === ESTADOS.REVOKED && resultado && (
        <div className="animate-slide-up">
          <div className="cyber-card border-cyber-red/40 shadow-neon-red">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-red/10 border border-cyber-red/40 flex items-center justify-center text-2xl animate-pulse">
                ⚠
              </div>
              <div>
                <h2 className="font-display font-bold text-cyber-red text-2xl animate-glitch glitch-text" data-text="CERTIFICADO REVOCADO">
                  CERTIFICADO REVOCADO
                </h2>
                <p className="font-mono text-xs text-cyber-red/60">Este certificado fue revocado y ya no es válido</p>
              </div>
            </div>

            <div className="bg-cyber-bg rounded-lg p-4 border border-cyber-red/20 mb-4">
              <div className="terminal-text space-y-1">
                <p>&gt; HASH_LOOKUP: {resultado.id?.slice(0,30)}...</p>
                <p>&gt; STATUS: <span className="text-cyber-red font-bold">REVOKED</span></p>
                <p>&gt; STUDENT: {resultado.nombre}</p>
                <p>&gt; CARRERA: {resultado.carrera}</p>
                <p>&gt; REVOCATION_DATE: {formatDate(resultado.tsRevocacion)}</p>
                <p>&gt; MOTIVO: <span className="text-cyber-red">{resultado.motivo || 'No especificado'}</span></p>
                <p>&gt; RISK_LEVEL: <span className="text-cyber-red font-bold animate-pulse">HIGH ⚠</span></p>
              </div>
            </div>

            <button onClick={reset} className="btn-secondary w-full justify-center">↺ Nueva Verificación</button>
          </div>
        </div>
      )}

      {/* INVÁLIDO */}
      {estado === ESTADOS.INVALID && (
        <div className="animate-slide-up">
          <div className="cyber-card border-cyber-red/30">
            <div className="text-center py-6">
              <div className="text-5xl mb-3 animate-bounce-soft">🚫</div>
              <h2 className="font-display font-bold text-cyber-red text-2xl mb-2">Hash No Encontrado</h2>
              <div className="bg-cyber-bg rounded-lg p-4 border border-cyber-red/20 text-left mb-4 max-w-sm mx-auto">
                <div className="terminal-text space-y-1">
                  <p>&gt; HASH_LOOKUP: {hashInput?.slice(0,20)}...</p>
                  <p>&gt; STATUS: <span className="text-cyber-red">NOT_FOUND</span></p>
                  <p>&gt; NETWORK: {network?.name || 'Ethereum'}</p>
                  <p>&gt; RISK_LEVEL: <span className="text-cyber-red font-bold">HIGH ⚠</span></p>
                </div>
              </div>
              <p className="font-mono text-xs text-cyber-muted mb-4">{errorMsg}</p>
              <button onClick={reset} className="btn-secondary">↺ Intentar de nuevo</button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR */}
      {estado === ESTADOS.ERROR && (
        <div className="cyber-card border-cyber-red/30 animate-fade-in text-center py-8">
          <div className="text-5xl mb-3">💥</div>
          <p className="font-display font-bold text-cyber-red text-xl mb-2">Error de Conexión</p>
          <p className="font-mono text-xs text-cyber-muted mb-4">{errorMsg}</p>
          <button onClick={reset} className="btn-secondary">↺ Reintentar</button>
        </div>
      )}
    </div>
  );
}
