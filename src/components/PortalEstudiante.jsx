import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ESTADO_META } from '../config/contract';
import toast from 'react-hot-toast';

// ── Mini-cronómetro de tiempo desde emisión ────────────────
function TimeSince({ ts }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = Math.floor(Date.now()/1000 - ts);
      if (diff < 60)   setLabel(`hace ${diff}s`);
      else if (diff < 3600) setLabel(`hace ${Math.floor(diff/60)}m`);
      else if (diff < 86400) setLabel(`hace ${Math.floor(diff/3600)}h`);
      else setLabel(`hace ${Math.floor(diff/86400)}d`);
    };
    calc();
    const t = setInterval(calc, 5000);
    return () => clearInterval(t);
  }, [ts]);
  return <span>{label}</span>;
}

// ── Tarjeta de certificado pendiente ──────────────────────
function CertPendingCard({ cert, onFirmar, loading }) {
  const fmtDate = ts => ts ? new Date(ts*1000).toLocaleString('es-CO') : '—';
  const shortAddr = a => a ? `${a.slice(0,8)}…${a.slice(-6)}` : '—';

  return (
    <div className="nb-card-yellow animate-slide-up">
      {/* Header urgente */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-cyber-yellow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyber-yellow bg-cyber-yellow/10 flex items-center justify-center text-xl animate-bounce-soft">
            ⏳
          </div>
          <div>
            <div className="font-mono text-[10px] text-cyber-yellow uppercase tracking-widest">ACCIÓN REQUERIDA</div>
            <div className="font-display font-black text-cyber-yellow text-lg leading-tight">
              PENDIENTE DE FIRMA
            </div>
          </div>
        </div>
        <span className="state-pending animate-pulse">⏳ FASE 2</span>
      </div>

      {/* Datos del certificado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div>
            <p className="font-mono text-[10px] text-cyber-muted uppercase">Estudiante</p>
            <p className="font-display font-bold text-cyber-text text-lg">{cert.nombre}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-cyber-muted uppercase">Programa</p>
            <p className="font-mono text-sm text-cyber-yellow">{cert.carrera}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-cyber-muted uppercase">Universidad</p>
            <p className="font-mono text-xs text-cyber-text">{cert.universidad}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <p className="font-mono text-[10px] text-cyber-muted uppercase">Emisor (Rector)</p>
            <p className="font-mono text-xs text-cyber-purple">{shortAddr(cert.emisor)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-cyber-muted uppercase">Fecha de emisión</p>
            <p className="font-mono text-xs text-cyber-text">{fmtDate(cert.tsEmision)}</p>
            <p className="font-mono text-[10px] text-cyber-yellow/60">
              <TimeSince ts={cert.tsEmision} />
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-cyber-muted uppercase">Hash SHA-256</p>
            <p className="font-mono text-[10px] text-cyber-cyan break-all">{cert.id?.slice(0,22)}…</p>
          </div>
        </div>
      </div>

      {/* Hash completo */}
      <div className="mb-4">
        <p className="font-mono text-[10px] text-cyber-muted uppercase mb-1">ID DEL CERTIFICADO</p>
        <div className="hash-mono border-cyber-yellow text-cyber-yellow">{cert.id}</div>
      </div>

      {/* Explicación de la firma */}
      <div className="bg-cyber-yellow/5 border-2 border-cyber-yellow/30 p-3 mb-4">
        <p className="font-mono text-xs text-cyber-yellow/80 leading-relaxed">
          <span className="font-bold">¿Qué significa firmar la recepción?</span><br />
          Al firmar esta transacción con tu wallet, estás proporcionando una prueba criptográfica
          irrefutable de que has recibido tu certificado académico. Esta firma queda registrada
          permanentemente en la blockchain de Ethereum — garantía de <strong>No Repudio</strong>.
        </p>
      </div>

      {/* Botón de firma */}
      <button
        onClick={() => onFirmar(cert.id)}
        disabled={loading}
        className="nb-btn-yellow w-full justify-center py-4 text-base"
        style={{ boxShadow: loading ? 'none' : '4px 4px 0 #FFE600' }}
      >
        {loading ? (
          <><span className="w-5 h-5 border-2 border-cyber-yellow/30 border-t-cyber-yellow rounded-full animate-spin inline-block"></span> Firmando Fase 2…</>
        ) : (
          <>⬡ FIRMAR RECEPCIÓN · FASE 2 DE 2</>
        )}
      </button>
    </div>
  );
}

// ── Tarjeta de certificado ya recibido ────────────────────
function CertRecibidoCard({ cert }) {
  const fmtDate = ts => ts ? new Date(ts*1000).toLocaleString('es-CO') : '—';
  return (
    <div className="holo-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-2 border-cyber-lime bg-cyber-lime/10 flex items-center justify-center text-2xl">
            ✓
          </div>
          <div>
            <div className="font-mono text-[10px] text-cyber-lime uppercase tracking-widest">CERTIFICADO VERIFICADO</div>
            <div className="font-display font-black text-cyber-lime text-2xl">RECIBIDO</div>
          </div>
        </div>
        <span className="state-received">✓ FASE 2/2</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><p className="font-mono text-[10px] text-cyber-muted">ESTUDIANTE</p><p className="font-display font-bold text-cyber-text">{cert.nombre}</p></div>
        <div><p className="font-mono text-[10px] text-cyber-muted">PROGRAMA</p><p className="font-mono text-sm text-cyber-lime">{cert.carrera}</p></div>
        <div><p className="font-mono text-[10px] text-cyber-muted">EMISIÓN</p><p className="font-mono text-xs text-cyber-yellow">{fmtDate(cert.tsEmision)}</p></div>
        <div><p className="font-mono text-[10px] text-cyber-muted">RECEPCIÓN</p><p className="font-mono text-xs text-cyber-lime">{fmtDate(cert.tsRecepcion)}</p></div>
      </div>
      <div className="hash-mono border-cyber-lime text-cyber-lime">{cert.id}</div>
    </div>
  );
}

// ── Tarjeta de certificado revocado ───────────────────────
function CertRevocadoCard({ cert }) {
  return (
    <div className="nb-card-red animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 border-2 border-cyber-red bg-cyber-red/10 flex items-center justify-center text-2xl animate-pulse">⊘</div>
        <div>
          <div className="font-mono text-[10px] text-cyber-red uppercase">CERTIFICADO ANULADO</div>
          <div className="font-display font-black text-cyber-red text-xl animate-glitch glitch-text" data-text="REVOCADO">REVOCADO</div>
        </div>
      </div>
      <p className="font-mono text-xs text-cyber-muted mb-1">MOTIVO:</p>
      <p className="font-mono text-sm text-cyber-red/80 border border-cyber-red/30 bg-cyber-red/5 p-2">{cert.motivo || 'Sin motivo especificado'}</p>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────
export default function PortalEstudiante() {
  const { isConnected, connect, account, contract,
          consultarPorEstudiante, firmarRecepcion, network } = useWeb3();

  const [certs,       setCerts]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [firmando,    setFirmando]    = useState(null); // id siendo firmado
  const [scanDone,    setScanDone]    = useState(false);
  const [scanLog,     setScanLog]     = useState([]);

  const explorerUrl = network?.explorer || 'https://sepolia.etherscan.io';

  // ── Escanear blockchain para certificados del estudiante ─
  const scanBlockchain = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setScanDone(false);
    setScanLog([]);
    const log = [];

    const addLog = (msg) => setScanLog(l => [...l, msg]);

    addLog(`> SCAN_INIT: address=${account.slice(0,10)}…`);
    await new Promise(r => setTimeout(r, 300));
    addLog(`> QUERY: consultarPorEstudiante()`);
    await new Promise(r => setTimeout(r, 400));

    try {
      const results = await consultarPorEstudiante(account);
      addLog(`> FOUND: ${results.length} certificado(s)`);
      await new Promise(r => setTimeout(r, 200));
      results.forEach((c,i) => addLog(`> [${i}] estado=${['PENDIENTE','RECIBIDO','REVOCADO'][c.estado]} hash=${c.id.slice(0,14)}…`));
      setCerts(results);
      setScanDone(true);
    } catch (e) {
      addLog(`> ERROR: ${e.message}`);
      toast.error('Error escaneando blockchain');
    } finally {
      setLoading(false);
    }
  }, [account, consultarPorEstudiante]);

  // ── Auto-scan al conectar ────────────────────────────────
  useEffect(() => { if (isConnected && account) scanBlockchain(); }, [isConnected, account]);

  // ── Firmar recepción (Fase 2) ────────────────────────────
  const handleFirmar = async (hashId) => {
    setFirmando(hashId);
    try {
      const receipt = await firmarRecepcion(hashId);
      toast.success('¡Firma de recepción registrada en blockchain!');
      await scanBlockchain(); // refrescar
    } catch (e) {
      const msg = e?.reason || e?.shortMessage || e.message || 'Error desconocido';
      toast.error('Error al firmar: ' + msg);
    } finally {
      setFirmando(null);
    }
  };

  const pendientes  = certs.filter(c => c.estado === 0);
  const recibidos   = certs.filter(c => c.estado === 1);
  const revocados   = certs.filter(c => c.estado === 2);

  // ── Sin conectar ─────────────────────────────────────────
  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 animate-fade-in">
      <div className="nb-card-yellow p-10 text-center max-w-md w-full">
        <div className="text-6xl mb-4 animate-bounce-soft">🎓</div>
        <div className="font-mono text-[10px] text-cyber-yellow uppercase tracking-widest mb-1">PORTAL DEL ESTUDIANTE</div>
        <h2 className="font-display font-black text-cyber-yellow text-2xl mb-2">FIRMA DE RECEPCIÓN</h2>
        <div className="cyber-hr"></div>
        <p className="font-mono text-xs text-cyber-muted mb-4 text-left">
          Conecta la wallet registrada por tu institución para:
        </p>
        <ul className="text-left font-mono text-xs text-cyber-text space-y-2 mb-6">
          <li className="flex gap-2"><span className="text-cyber-yellow">⬡</span> Ver tus certificados pendientes de firma</li>
          <li className="flex gap-2"><span className="text-cyber-lime">✓</span> Firmar la recepción (Fase 2) en Ethereum</li>
          <li className="flex gap-2"><span className="text-cyber-cyan">◈</span> Obtener prueba criptográfica de No Repudio</li>
        </ul>
        <button onClick={connect} className="nb-btn-yellow w-full justify-center py-3">
          🦊 Conectar Wallet Estudiantil
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header del portal ─────────────────────────────── */}
      <div className="nb-card-yellow">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-mono text-[10px] text-cyber-yellow uppercase tracking-widest">PORTAL DEL ESTUDIANTE · FASE 2 DE 2</div>
            <h1 className="font-display font-black text-cyber-yellow text-3xl">Firma de Recepción</h1>
            <p className="font-mono text-xs text-cyber-muted mt-1">
              Wallet: <span className="text-cyber-cyan">{account}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={scanBlockchain} disabled={loading} className="nb-btn-yellow !text-sm">
              {loading
                ? <><span className="w-3 h-3 border-2 border-cyber-yellow/30 border-t-cyber-yellow rounded-full animate-spin inline-block"></span> Escaneando…</>
                : '↺ Re-escanear blockchain'}
            </button>
          </div>
        </div>

        {/* Métricas */}
        {scanDone && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t-2 border-cyber-dim">
            {[
              { label: 'PENDIENTES', v: pendientes.length, c: 'text-cyber-yellow' },
              { label: 'RECIBIDOS',  v: recibidos.length,  c: 'text-cyber-lime'   },
              { label: 'REVOCADOS',  v: revocados.length,  c: 'text-cyber-red'    },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className={`neon-num text-3xl ${m.c}`}>{m.v}</div>
                <div className="font-mono text-[10px] text-cyber-muted">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Terminal de scan ──────────────────────────────── */}
      {(loading || scanLog.length > 0) && (
        <div className="nb-card bg-cyber-bg border-cyber-dim">
          <div className="font-mono text-[10px] text-cyber-muted uppercase mb-2">BLOCKCHAIN SCANNER · OUTPUT</div>
          <div className="terminal space-y-0.5 min-h-[80px]">
            {scanLog.map((line, i) => (
              <p key={i} className="animate-matrix-in">{line}</p>
            ))}
            {loading && <p className="cursor-blink text-cyber-cyan">&gt; SCANNING</p>}
          </div>
        </div>
      )}

      {/* ── Sin certificados ──────────────────────────────── */}
      {scanDone && certs.length === 0 && (
        <div className="nb-card text-center py-12">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-display font-bold text-cyber-muted text-xl">Sin certificados asignados</p>
          <p className="font-mono text-xs text-cyber-muted/60 mt-2">
            Esta wallet no tiene certificados registrados en el contrato.
            <br />Verifica que la institución usó esta misma dirección.
          </p>
        </div>
      )}

      {/* ── Certificados PENDIENTES ───────────────────────── */}
      {pendientes.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="dot-pending"></div>
            <h2 className="font-display font-black text-cyber-yellow uppercase tracking-wider">
              Acción Requerida — {pendientes.length} Pendiente{pendientes.length>1?'s':''}
            </h2>
          </div>
          <div className="space-y-4">
            {pendientes.map(c => (
              <CertPendingCard key={c.id} cert={c}
                onFirmar={handleFirmar} loading={firmando === c.id} />
            ))}
          </div>
        </div>
      )}

      {/* ── Certificados RECIBIDOS ────────────────────────── */}
      {recibidos.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="dot-online"></div>
            <h2 className="font-display font-black text-cyber-lime uppercase tracking-wider">
              Certificados Recibidos — {recibidos.length}
            </h2>
          </div>
          <div className="space-y-4">
            {recibidos.map(c => <CertRecibidoCard key={c.id} cert={c} />)}
          </div>
        </div>
      )}

      {/* ── Certificados REVOCADOS ────────────────────────── */}
      {revocados.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="dot-offline"></div>
            <h2 className="font-display font-black text-cyber-red uppercase tracking-wider">
              Certificados Revocados — {revocados.length}
            </h2>
          </div>
          <div className="space-y-4">
            {revocados.map(c => <CertRevocadoCard key={c.id} cert={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
