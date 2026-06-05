import { useState, useRef, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ESTADO_META } from '../config/contract';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

const S = { IDLE:'idle', HASHING:'hashing', SEARCHING:'searching', VALID:'valid', PENDING:'pending', REVOKED:'revoked', NOT_FOUND:'not_found', ERROR:'error' };

export default function Verificador() {
  const { verificarCertificado, calcularHashPDF, network } = useWeb3();
  const inputRef = useRef(null);
  const [estado,       setEstado]       = useState(S.IDLE);
  const [hashInput,    setHashInput]    = useState('');
  const [resultado,    setResultado]    = useState(null);
  const [confetti,     setConfetti]     = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [scanLines,    setScanLines]    = useState([]);
  const explorerUrl = network?.explorer || 'https://sepolia.etherscan.io';

  const fmtDate = ts => ts ? new Date(ts*1000).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
  const shortAddr = a => a ? `${a.slice(0,10)}…${a.slice(-6)}` : '—';

  const verificar = useCallback(async (hashId) => {
    if (!hashId || hashId.length < 10) { toast.error('Hash inválido'); return; }
    setEstado(S.SEARCHING);
    setResultado(null);
    setScanLines([]);

    const addLine = (l) => setScanLines(prev => [...prev, l]);
    addLine(`> HASH_LOOKUP: ${hashId.slice(0,24)}…`);
    await new Promise(r => setTimeout(r, 350));
    addLine(`> NETWORK: ${network?.name || 'Ethereum'}`);
    await new Promise(r => setTimeout(r, 250));
    addLine('> CALLING: verificarCertificado()');

    try {
      const { cert, existe } = await verificarCertificado(hashId);
      const estadoNum = existe ? Number(cert.estado) : -1;
      addLine(`> STATUS: ${existe ? ['PENDIENTE_RECEPCION','RECIBIDO','REVOCADO'][estadoNum] : 'NOT_FOUND'}`);

      if (!existe) { setEstado(S.NOT_FOUND); return; }

      const obj = {
        nombre:      cert.nombreEstudiante,
        carrera:     cert.carrera,
        universidad: cert.universidad,
        emisor:      cert.emisor,
        estudiante:  cert.estudiante,
        estado:      estadoNum,
        tsEmision:   Number(cert.timestampEmision),
        tsRecepcion: Number(cert.timestampRecepcion),
        tsRevocacion:Number(cert.timestampRevocacion),
        motivo:      cert.motivoRevocacion,
        id:          hashId,
      };
      setResultado(obj);

      if (estadoNum === 1) {        // RECIBIDO → válido pleno
        setEstado(S.VALID);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 6000);
        toast.success('¡Certificado VÁLIDO y RECIBIDO!');
      } else if (estadoNum === 0) { // PENDIENTE
        setEstado(S.PENDING);
        toast('Certificado pendiente de firma del estudiante', { icon: '⏳' });
      } else {                      // REVOCADO
        setEstado(S.REVOKED);
        toast.error('Certificado REVOCADO');
      }
    } catch (e) {
      setEstado(S.ERROR);
      setErrorMsg(e?.reason || e.message);
      addLine(`> ERROR: ${e.message}`);
    }
  }, [verificarCertificado, network]);

  const onFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Solo PDF'); return; }
    setEstado(S.HASHING);
    setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(p+7, 92)), 70);
    try {
      const hash = await calcularHashPDF(file);
      clearInterval(iv); setProgress(100);
      setHashInput(hash);
      await verificar(hash);
    } catch {
      clearInterval(iv);
      setEstado(S.ERROR);
      setErrorMsg('Error procesando PDF');
    }
  }, [calcularHashPDF, verificar]);

  const reset = () => {
    setEstado(S.IDLE); setHashInput(''); setResultado(null);
    setConfetti(false); setErrorMsg(''); setProgress(0); setScanLines([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {confetti && <Confetti numberOfPieces={250} recycle={false} colors={['#00F5FF','#39FF14','#FFE600','#BF5AF2']} />}

      {/* Header */}
      <div className="nb-card-cyan">
        <div className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-1">SISTEMA DE VERIFICACIÓN</div>
        <h1 className="font-display font-black text-cyber-cyan text-3xl">Verificador Público</h1>
        <p className="font-mono text-xs text-cyber-muted mt-1">Consulta el estado on-chain de cualquier certificado académico</p>
      </div>

      {/* Métodos de verificación */}
      {(estado === S.IDLE || estado === S.HASHING) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">

          {/* PDF */}
          <div onClick={() => inputRef.current?.click()}
               className="nb-card cursor-pointer group hover:border-cyber-cyan transition-all duration-150"
               style={{ ':hover': { boxShadow:'4px 4px 0 #00F5FF' } }}>
            <input ref={inputRef} type="file" accept=".pdf" onChange={onFileUpload} className="hidden" />
            <div className="text-center py-6">
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📄</div>
              <h3 className="font-display font-black text-cyber-text text-lg mb-1">Subir PDF</h3>
              <p className="font-mono text-xs text-cyber-muted mb-3">Hash calculado localmente, nunca abandona tu dispositivo</p>
              {estado === S.HASHING ? (
                <div>
                  <div className="w-full bg-cyber-dim h-1.5 mb-1.5">
                    <div className="h-full bg-cyber-cyan transition-all" style={{ width:`${progress}%` }}></div>
                  </div>
                  <span className="font-mono text-xs text-cyber-cyan">SHA-256… {progress}%</span>
                </div>
              ) : (
                <span className="nb-btn-ghost !text-xs !py-1.5">Seleccionar PDF →</span>
              )}
            </div>
          </div>

          {/* Hash manual */}
          <div className="nb-card">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">🔍</div>
              <h3 className="font-display font-black text-cyber-text text-lg">Ingresar Hash</h3>
              <p className="font-mono text-xs text-cyber-muted">SHA-256 hexadecimal (0x…)</p>
            </div>
            <input className="nb-input mb-3" placeholder="0x9f86d08188..."
              value={hashInput} onChange={e => setHashInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verificar(hashInput)} />
            <button onClick={() => verificar(hashInput)} disabled={!hashInput} className="nb-btn-cyan w-full justify-center">
              ⬢ Verificar en Blockchain
            </button>
          </div>
        </div>
      )}

      {/* Terminal de búsqueda */}
      {(estado === S.SEARCHING || scanLines.length > 0) && estado !== S.IDLE && (
        <div className="nb-card bg-cyber-bg border-cyber-dim">
          <div className="font-mono text-[10px] text-cyber-muted uppercase mb-2">BLOCKCHAIN QUERY · LOG</div>
          <div className="terminal min-h-[80px] space-y-0.5">
            {scanLines.map((l, i) => <p key={i}>{l}</p>)}
            {estado === S.SEARCHING && <p className="cursor-blink text-cyber-cyan">&gt; QUERYING</p>}
          </div>
        </div>
      )}

      {/* ── RESULTADO: RECIBIDO (válido pleno) ─────────────── */}
      {estado === S.VALID && resultado && (
        <div className="holo-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-cyber-lime">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-2 border-cyber-lime bg-cyber-lime/10 flex items-center justify-center text-2xl">✓</div>
              <div>
                <div className="font-mono text-[10px] text-cyber-lime">CERTIFICADO VERIFICADO</div>
                <div className="font-display font-black text-cyber-lime text-2xl">VÁLIDO · RECIBIDO</div>
              </div>
            </div>
            <span className="state-received animate-pulse">✓ RECIBIDO</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <div><p className="font-mono text-[10px] text-cyber-muted">ESTUDIANTE</p><p className="font-display font-black text-cyber-text text-xl">{resultado.nombre}</p></div>
              <div><p className="font-mono text-[10px] text-cyber-muted">PROGRAMA</p><p className="font-display font-bold text-cyber-lime text-lg">{resultado.carrera}</p></div>
              <div><p className="font-mono text-[10px] text-cyber-muted">INSTITUCIÓN</p><p className="font-mono text-sm text-cyber-text">{resultado.universidad}</p></div>
            </div>
            <div className="space-y-3">
              <div><p className="font-mono text-[10px] text-cyber-muted">EMISIÓN (Fase 1)</p><p className="font-mono text-xs text-cyber-yellow">{fmtDate(resultado.tsEmision)}</p></div>
              <div><p className="font-mono text-[10px] text-cyber-muted">FIRMA ESTUDIANTE (Fase 2)</p><p className="font-mono text-xs text-cyber-lime">{fmtDate(resultado.tsRecepcion)}</p></div>
              <div><p className="font-mono text-[10px] text-cyber-muted">EMISOR</p><p className="font-mono text-xs text-cyber-purple">{shortAddr(resultado.emisor)}</p></div>
            </div>
          </div>

          {/* Trazabilidad completa */}
          <div className="border-2 border-cyber-lime/30 bg-cyber-lime/5 p-3 mb-4">
            <div className="font-mono text-[10px] text-cyber-muted mb-2 uppercase">TRAZABILIDAD DEL CICLO DE VIDA</div>
            <div className="flex items-center gap-2">
              <div className="step-done"><div className="w-8 h-8 border-2 border-cyber-lime bg-cyber-lime/10 flex items-center justify-center text-xs text-cyber-lime font-bold">✓</div></div>
              <div className="flex-1 h-0.5 bg-cyber-lime"></div>
              <div className="step-done"><div className="w-8 h-8 border-2 border-cyber-lime bg-cyber-lime/10 flex items-center justify-center text-xs text-cyber-lime font-bold">✓</div></div>
              <div className="flex-1 h-0.5 bg-cyber-dim"></div>
              <div className="step-inactive"><div className="w-8 h-8 border-2 border-cyber-dim flex items-center justify-center text-xs text-cyber-muted font-bold">—</div></div>
            </div>
            <div className="flex justify-between font-mono text-[9px] text-cyber-muted mt-1">
              <span>Emitido</span><span>Recibido</span><span>No revocado</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="font-mono text-[10px] text-cyber-muted mb-1">HASH SHA-256 (ID del Certificado)</p>
            <div className="hash-mono border-cyber-lime text-cyber-lime">{resultado.id}</div>
          </div>

          <div className="flex gap-3">
            <a href={`${explorerUrl}/address/${resultado.emisor}`} target="_blank" rel="noreferrer"
               className="nb-btn-ghost !text-xs flex-1 justify-center">↗ Ver Emisor</a>
            <button onClick={reset} className="nb-btn-ghost !text-xs !px-4">↺ Nueva</button>
          </div>
        </div>
      )}

      {/* ── RESULTADO: PENDIENTE ───────────────────────────── */}
      {estado === S.PENDING && resultado && (
        <div className="nb-card-yellow animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-cyber-yellow bg-cyber-yellow/10 flex items-center justify-center text-xl animate-bounce-soft">⏳</div>
            <div>
              <div className="font-mono text-[10px] text-cyber-yellow">CERTIFICADO LOCALIZADO</div>
              <div className="font-display font-black text-cyber-yellow text-xl">PENDIENTE DE RECEPCIÓN</div>
            </div>
            <span className="state-pending ml-auto">FASE 1/2</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><p className="font-mono text-[10px] text-cyber-muted">ESTUDIANTE</p><p className="font-display font-bold text-cyber-text">{resultado.nombre}</p></div>
            <div><p className="font-mono text-[10px] text-cyber-muted">PROGRAMA</p><p className="font-mono text-sm text-cyber-yellow">{resultado.carrera}</p></div>
            <div><p className="font-mono text-[10px] text-cyber-muted">EMISIÓN</p><p className="font-mono text-xs text-cyber-yellow">{fmtDate(resultado.tsEmision)}</p></div>
            <div><p className="font-mono text-[10px] text-cyber-muted">ESTUDIANTE ASIGNADO</p><p className="font-mono text-xs text-cyber-cyan">{shortAddr(resultado.estudiante)}</p></div>
          </div>
          <div className="bg-cyber-yellow/5 border border-cyber-yellow/30 p-3 mb-3">
            <p className="font-mono text-xs text-cyber-yellow/80">
              ⚠ El certificado fue emitido por la institución pero el estudiante aún no ha firmado la recepción (Fase 2).
              El certificado aún <strong>NO está completamente verificado</strong>.
            </p>
          </div>
          <div className="hash-mono border-cyber-yellow text-cyber-yellow">{resultado.id}</div>
          <button onClick={reset} className="nb-btn-ghost !text-xs mt-3">↺ Nueva verificación</button>
        </div>
      )}

      {/* ── RESULTADO: REVOCADO ────────────────────────────── */}
      {estado === S.REVOKED && resultado && (
        <div className="nb-card-red animate-slide-up animate-shake">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-cyber-red bg-cyber-red/10 flex items-center justify-center text-2xl animate-pulse">⊘</div>
            <div>
              <div className="font-mono text-[10px] text-cyber-red">ALERTA DE SEGURIDAD CRÍTICA</div>
              <div className="font-display font-black text-cyber-red text-2xl animate-glitch glitch-text" data-text="CERTIFICADO REVOCADO">
                CERTIFICADO REVOCADO
              </div>
            </div>
            <span className="state-revoked ml-auto animate-pulse">⊘ INVÁLIDO</span>
          </div>
          <div className="terminal bg-cyber-bg border border-cyber-red/30 p-3 mb-3 space-y-0.5">
            <p>&gt; STATUS: <span className="t-red font-bold">REVOCADO</span></p>
            <p>&gt; STUDENT: <span className="t-white">{resultado.nombre}</span></p>
            <p>&gt; REVOC_DATE: <span className="t-red">{fmtDate(resultado.tsRevocacion)}</span></p>
            <p>&gt; MOTIVO: <span className="t-red">{resultado.motivo || 'No especificado'}</span></p>
            <p>&gt; RISK_LEVEL: <span className="t-red font-bold animate-pulse">CRITICAL ⊘</span></p>
          </div>
          <button onClick={reset} className="nb-btn-ghost !text-xs">↺ Nueva verificación</button>
        </div>
      )}

      {/* ── NO ENCONTRADO ──────────────────────────────────── */}
      {estado === S.NOT_FOUND && (
        <div className="nb-card-red animate-slide-up text-center py-8">
          <div className="text-5xl mb-3">🚫</div>
          <div className="font-display font-black text-cyber-red text-2xl mb-2">HASH NO REGISTRADO</div>
          <div className="terminal bg-cyber-bg border border-cyber-red/30 p-3 mb-4 text-left max-w-xs mx-auto space-y-0.5">
            <p>&gt; HASH: {hashInput?.slice(0,20)}…</p>
            <p>&gt; STATUS: <span className="t-red">NOT_FOUND</span></p>
            <p>&gt; RISK_LEVEL: <span className="t-red font-bold">HIGH ⚠</span></p>
          </div>
          <button onClick={reset} className="nb-btn-ghost !text-xs">↺ Intentar de nuevo</button>
        </div>
      )}

      {/* ── ERROR ─────────────────────────────────────────── */}
      {estado === S.ERROR && (
        <div className="nb-card-red animate-fade-in text-center py-8">
          <div className="text-5xl mb-3">💥</div>
          <p className="font-display font-black text-cyber-red text-xl mb-2">Error de Conexión</p>
          <p className="font-mono text-xs text-cyber-muted mb-4">{errorMsg}</p>
          <button onClick={reset} className="nb-btn-ghost !text-xs">↺ Reintentar</button>
        </div>
      )}
    </div>
  );
}
