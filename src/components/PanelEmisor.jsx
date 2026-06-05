import { useRef, useState, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import toast from 'react-hot-toast';

const S = { IDLE:'idle', DRAG:'drag', HASHING:'hashing', READY:'ready', SIGNING:'signing', DONE:'done', ERROR:'error' };

// ── Widget de paso del flujo ───────────────────────────────
function StepFlow({ current }) {
  const steps = [
    { n:'01', label:'Subir PDF',       state: current >= 1 ? 'done' : 'active' },
    { n:'02', label:'Hash SHA-256',    state: current >= 2 ? 'done' : current === 1 ? 'active' : 'inactive' },
    { n:'03', label:'Datos del Cert.', state: current >= 3 ? 'done' : current === 2 ? 'active' : 'inactive' },
    { n:'04', label:'Firmar con MM',   state: current >= 4 ? 'done' : current === 3 ? 'active' : 'inactive' },
    { n:'05', label:'On-Chain ✓',      state: current >= 5 ? 'done' : 'inactive' },
  ];
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${
            s.state === 'done'     ? 'step-done' :
            s.state === 'active'   ? 'step-active' : ''}`}>
            <div className={`w-8 h-8 border-2 flex items-center justify-center text-xs font-mono font-bold ${
              s.state === 'done'   ? 'border-cyber-lime text-cyber-lime bg-cyber-lime/10' :
              s.state === 'active' ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10' :
                                     'border-cyber-dim text-cyber-muted'}`}>
              {s.state === 'done' ? '✓' : s.n}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 ${s.state === 'done' ? 'bg-cyber-lime' : 'bg-cyber-dim'}`}></div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PanelEmisor() {
  const { isConnected, connect, calcularHashPDF, emitirCertificado,
          account, rolInfo, gasPrice, network, chainId } = useWeb3();
  const dropRef  = useRef(null);
  const inputRef = useRef(null);

  const [estado,      setEstado]      = useState(S.IDLE);
  const [archivo,     setArchivo]     = useState(null);
  const [hashChars,   setHashChars]   = useState('');
  const [hashProgress,setHashProgress]= useState(0);
  const [hashFinal,   setHashFinal]   = useState('');
  const [form,        setForm]        = useState({
    nombre: '', carrera: '', universidad: 'Universidad del Valle', estudiante: ''
  });
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const stepNum = { idle:0, drag:0, hashing:1, ready:2, signing:3, done:4, error:0 }[estado] || 0;
  const explorerUrl = network?.explorer || 'https://sepolia.etherscan.io';

  // ── Animación SHA-256 carácter a carácter ───────────────
  const animHash = useCallback(async (real) => {
    const hex = '0123456789abcdef';
    for (let i = 2; i <= real.length; i++) {
      await new Promise(r => setTimeout(r, 14));
      const noise = Array.from({ length: real.length - i }, () => hex[Math.floor(Math.random()*16)]).join('');
      setHashChars(real.slice(0, i) + noise);
      setHashProgress(Math.round(((i - 2) / (real.length - 2)) * 100));
    }
    setHashChars(real);
    setHashProgress(100);
  }, []);

  // ── Procesar archivo ─────────────────────────────────────
  const procesarArchivo = useCallback(async (file) => {
    if (file.type !== 'application/pdf') { toast.error('Solo archivos PDF'); return; }
    setArchivo(file);
    setEstado(S.HASHING);
    setHashProgress(0);
    try {
      const h = await calcularHashPDF(file);
      await animHash(h);
      setHashFinal(h);
      setEstado(S.READY);
    } catch (e) {
      setEstado(S.ERROR);
      setErrorMsg(e.message);
    }
  }, [calcularHashPDF, animHash]);

  const onDrop      = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) procesarArchivo(f); };
  const onDragOver  = (e) => { e.preventDefault(); setEstado(s => s === S.IDLE ? S.DRAG : s); };
  const onDragLeave = ()  => { setEstado(s => s === S.DRAG ? S.IDLE : s); };
  const onFile      = (e) => { const f = e.target.files[0]; if (f) procesarArchivo(f); };

  // ── Emitir on-chain ──────────────────────────────────────
  const handleEmitir = async () => {
    if (!form.nombre || !form.carrera || !form.estudiante) {
      toast.error('Completa todos los campos obligatorios'); return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(form.estudiante)) {
      toast.error('Dirección del estudiante inválida (debe ser 0x…)'); return;
    }
    setEstado(S.SIGNING);
    try {
      const r = await emitirCertificado({
        hashId: hashFinal, nombre: form.nombre,
        carrera: form.carrera, universidad: form.universidad,
        estudiante: form.estudiante,
      });
      setTxHash(r.hash);
      setEstado(S.DONE);
      toast.success('¡Certificado emitido! El estudiante debe firmar la recepción.');
    } catch (e) {
      const msg = e?.reason || e?.shortMessage || e.message || 'Error desconocido';
      setEstado(S.ERROR);
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const reset = () => {
    setEstado(S.IDLE); setArchivo(null); setHashChars(''); setHashFinal('');
    setHashProgress(0); setTxHash(''); setErrorMsg('');
    setForm({ nombre:'', carrera:'', universidad:'Universidad del Valle', estudiante:'' });
    if (inputRef.current) inputRef.current.value = '';
  };

  const dropClass = {
    [S.IDLE]:'drop-idle', [S.DRAG]:'drop-hover', [S.HASHING]:'drop-processing',
    [S.READY]:'drop-done', [S.SIGNING]:'drop-processing', [S.DONE]:'drop-done', [S.ERROR]:'drop-error',
  }[estado];

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">
      <div className="nb-card-cyan p-10 text-center max-w-sm w-full">
        <div className="text-5xl mb-4 animate-bounce-soft">🦊</div>
        <h2 className="font-display font-black text-cyber-cyan text-xl mb-2">PANEL DEL EMISOR</h2>
        <p className="font-mono text-xs text-cyber-muted mb-6">Rector · Director de Carrera</p>
        <p className="text-sm text-cyber-text mb-6">Conecta tu wallet autorizada para emitir certificados académicos.</p>
        <button onClick={connect} className="nb-btn-cyan w-full justify-center">
          Conectar MetaMask →
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 animate-fade-in">

      {/* ── Columna izquierda ─────────────────────────────── */}
      <div className="space-y-4">

        {/* Emisor info */}
        <div className="nb-card-cyan">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-cyber-dim pb-3">
            <span className="text-cyber-cyan font-mono font-bold text-lg">◈</span>
            <span className="font-display font-black text-cyber-cyan text-sm uppercase tracking-wider">Emisor Activo</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {[
              ['WALLET',  account ? `${account.slice(0,10)}…${account.slice(-6)}` : '—', 'text-cyber-cyan'],
              ['ROL',     rolInfo?.activo ? (rolInfo.rol===1?'Rector':'Dir. Carrera') : 'Sin permisos', rolInfo?.activo?'text-cyber-lime':'text-cyber-red'],
              ['NOMBRE',  rolInfo?.nombre || '—', 'text-cyber-text'],
              ['ESTADO',  rolInfo?.activo ? '● AUTORIZADO' : '○ SIN ACCESO', rolInfo?.activo?'text-cyber-lime':'text-cyber-red'],
            ].map(([k,v,c]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-cyber-muted">{k}</span>
                <span className={c}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gas tracker */}
        <div className="nb-card-yellow">
          <div className="flex items-center gap-2 mb-3 border-b-2 border-cyber-dim pb-3">
            <span className="text-xl">⛽</span>
            <span className="font-display font-black text-cyber-yellow text-sm uppercase tracking-wider">Gas Tracker</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-cyber-muted">PRECIO BASE</span>
              <span className="text-cyber-yellow font-bold text-base">{gasPrice || '—'} Gwei</span>
            </div>
            <div className="w-full h-1.5 bg-cyber-dim">
              <div className="h-full bg-cyber-yellow transition-all" style={{ width:`${Math.min((+gasPrice||0)/60*100,100)}%` }}></div>
            </div>
            <div className="flex justify-between"><span className="text-cyber-muted">RED</span><span className="text-cyber-text">{network?.name||'—'}</span></div>
            <div className="flex justify-between"><span className="text-cyber-muted">CHAIN ID</span><span className="text-cyber-purple">{chainId||'—'}</span></div>
          </div>
        </div>

        {/* Flujo de pasos */}
        <div className="nb-card">
          <div className="font-mono text-[10px] text-cyber-muted mb-3 uppercase tracking-wider">PROGRESO DE EMISIÓN</div>
          <StepFlow current={stepNum} />
          <div className="font-mono text-[10px] text-cyber-cyan mt-3 text-center">
            {estado === S.IDLE    && 'Esperando PDF…'}
            {estado === S.HASHING && `Calculando SHA-256… ${hashProgress}%`}
            {estado === S.READY   && 'Hash listo · Completa los datos'}
            {estado === S.SIGNING && 'Esperando firma en MetaMask…'}
            {estado === S.DONE    && '✓ Emitido · Pendiente firma del estudiante'}
            {estado === S.ERROR   && '⚠ Error — reinicia el proceso'}
          </div>
        </div>
      </div>

      {/* ── Columna central: zona de emisión ─────────────── */}
      <div className="xl:col-span-2 space-y-4">
        <div className="nb-card-cyan">

          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-cyber-dim">
            <div>
              <div className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest">FASE 1 DE 2</div>
              <h2 className="font-display font-black text-cyber-cyan text-2xl">Emisión de Certificado</h2>
            </div>
            {estado !== S.IDLE && (
              <button onClick={reset} className="nb-btn-ghost !text-xs !py-1 !px-3">↺ Reset</button>
            )}
          </div>

          {/* Drop Zone */}
          <div
            ref={dropRef}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => [S.IDLE,S.DRAG].includes(estado) && inputRef.current?.click()}
            className={`relative min-h-[180px] flex flex-col items-center justify-center p-8 mb-5
                        cursor-pointer transition-all duration-200 ${dropClass}`}
          >
            <input ref={inputRef} type="file" accept=".pdf" onChange={onFile} className="hidden" />

            {(estado === S.IDLE) && (
              <div className="text-center">
                <div className="text-5xl mb-3 animate-bounce-soft">📄</div>
                <p className="font-display font-bold text-cyber-text text-lg">Arrastra el PDF del Diploma</p>
                <p className="font-mono text-xs text-cyber-muted mt-1">o haz clic · Solo archivos .pdf</p>
              </div>
            )}

            {(estado === S.DRAG) && (
              <div className="text-center animate-pulse">
                <div className="text-5xl mb-2">⬇</div>
                <p className="font-display font-black text-cyber-cyan text-2xl">SUELTA AQUÍ</p>
                <p className="font-mono text-xs text-cyber-cyan/60 mt-1">calculando SHA-256 en cliente</p>
              </div>
            )}

            {(estado === S.HASHING) && (
              <div className="w-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 border-2 border-cyber-yellow/30 border-t-cyber-yellow rounded-full animate-spin flex-shrink-0"></div>
                  <span className="font-mono text-xs text-cyber-yellow font-bold uppercase">Calculando SHA-256 · {hashProgress}%</span>
                </div>
                <div className="w-full bg-cyber-dim h-2 mb-3">
                  <div className="h-full bg-cyber-yellow transition-all duration-75" style={{ width:`${hashProgress}%` }}></div>
                </div>
                <div className="hash-mono cursor-blink text-cyber-yellow/90">
                  {hashChars || '0x...'}
                </div>
                <p className="font-mono text-[10px] text-cyber-muted mt-2">
                  📄 {archivo?.name} · {(archivo?.size/1024).toFixed(1)} KB
                </p>
              </div>
            )}

            {(estado === S.READY) && (
              <div className="w-full animate-slide-up">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-cyber-lime font-bold text-xl">✓</span>
                  <span className="font-mono text-xs text-cyber-lime font-bold uppercase">SHA-256 Verificado · 100%</span>
                </div>
                <div className="relative overflow-hidden hash-mono text-cyber-lime border-cyber-lime bg-cyber-lime/5">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-cyber-lime/10 to-transparent animate-scan-line"></div>
                  </div>
                  <span className="relative">{hashFinal}</span>
                </div>
                <p className="font-mono text-[10px] text-cyber-muted mt-1.5">
                  📄 {archivo?.name} · {(archivo?.size/1024).toFixed(1)} KB
                </p>
              </div>
            )}

            {(estado === S.SIGNING) && (
              <div className="text-center">
                <div className="relative inline-flex mb-3">
                  <div className="w-16 h-16 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🦊</div>
                </div>
                <p className="font-display font-black text-cyber-cyan text-lg">FIRMANDO FASE 1</p>
                <p className="font-mono text-xs text-cyber-muted mt-1">Confirma la transacción en MetaMask…</p>
              </div>
            )}

            {(estado === S.DONE) && (
              <div className="text-center animate-slide-up">
                <div className="text-5xl mb-2">🎉</div>
                <p className="font-display font-black text-cyber-lime text-xl mb-1">FASE 1 COMPLETADA</p>
                <p className="font-mono text-xs text-cyber-muted mb-3">El certificado espera la firma del estudiante</p>
                <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noreferrer"
                   className="hash-mono text-cyber-cyan hover:text-cyber-lime transition-colors block">
                  TX: {txHash}
                </a>
              </div>
            )}

            {(estado === S.ERROR) && (
              <div className="text-center animate-shake">
                <div className="text-4xl mb-2">⚠</div>
                <p className="font-display font-black text-cyber-red text-lg mb-1">ERROR</p>
                <p className="font-mono text-xs text-cyber-red/80 bg-cyber-red/5 border border-cyber-red/30 p-2">{errorMsg}</p>
              </div>
            )}
          </div>

          {/* Formulario de datos */}
          {(estado === S.READY || estado === S.SIGNING) && (
            <div className="space-y-4 animate-slide-up">
              <div className="cyber-hr"></div>
              <div className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-3">DATOS DEL CERTIFICADO</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-cyber-muted mb-1 uppercase">NOMBRE COMPLETO *</label>
                  <input className="nb-input" placeholder="Ana María González Pérez"
                    value={form.nombre} onChange={e => setForm(f=>({...f, nombre:e.target.value}))} />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-cyber-muted mb-1 uppercase">PROGRAMA ACADÉMICO *</label>
                  <input className="nb-input" placeholder="Ingeniería de Sistemas"
                    value={form.carrera} onChange={e => setForm(f=>({...f, carrera:e.target.value}))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-mono text-[10px] text-cyber-muted mb-1 uppercase">INSTITUCIÓN</label>
                  <input className="nb-input" value={form.universidad}
                    onChange={e => setForm(f=>({...f, universidad:e.target.value}))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-mono text-[10px] text-cyber-muted mb-1 uppercase">
                    WALLET DEL ESTUDIANTE * <span className="text-cyber-cyan">(quien firmará la recepción)</span>
                  </label>
                  <input className="nb-input" placeholder="0x742d35Cc6634C0532925a3b8D4C2C0A4..."
                    value={form.estudiante} onChange={e => setForm(f=>({...f, estudiante:e.target.value}))} />
                  <p className="font-mono text-[10px] text-cyber-muted mt-1">
                    ⚠ Esta dirección es la ÚNICA que podrá firmar la Fase 2 del certificado.
                  </p>
                </div>
              </div>

              {/* Hash ID */}
              <div>
                <label className="block font-mono text-[10px] text-cyber-muted mb-1 uppercase">ID DEL CERTIFICADO (SHA-256)</label>
                <div className="hash-mono">{hashFinal}</div>
              </div>

              <button
                onClick={handleEmitir}
                disabled={estado === S.SIGNING || !rolInfo?.activo}
                className={`nb-btn-cyan w-full justify-center text-base py-4 ${!rolInfo?.activo ? 'nb-btn-disabled' : ''}`}
              >
                {estado === S.SIGNING
                  ? <><span className="w-4 h-4 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin inline-block"></span> Procesando…</>
                  : <>◈ FIRMAR FASE 1 · EMITIR EN BLOCKCHAIN</>}
              </button>

              {!rolInfo?.activo && (
                <p className="font-mono text-xs text-cyber-red text-center">
                  ⚠ Tu dirección no tiene permisos de emisión en este contrato.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
