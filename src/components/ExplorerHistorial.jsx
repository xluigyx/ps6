import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ESTADO_META } from '../config/contract';
import toast from 'react-hot-toast';

// ── Bloque eslabón de la cadena ────────────────────────────
function ChainBlock({ event, isLast }) {
  const fmtDate = ts => ts ? new Date(ts*1000).toLocaleDateString('es-CO', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
  const shortAddr = a => a ? `${a.slice(0,8)}…${a.slice(-4)}` : '—';
  const shortHash = h => h ? `${h.slice(0,12)}…${h.slice(-6)}` : '—';

  const meta = {
    emision:   { icon:'◈', label:'EMITIDO',   color:'text-cyber-cyan',   border:'border-cyber-cyan',   bg:'bg-cyber-cyan/10',   line:'bg-cyber-cyan'   },
    recepcion: { icon:'✓', label:'RECIBIDO',  color:'text-cyber-lime',   border:'border-cyber-lime',   bg:'bg-cyber-lime/10',   line:'bg-cyber-lime'   },
    revocacion:{ icon:'⊘', label:'REVOCADO',  color:'text-cyber-red',    border:'border-cyber-red',    bg:'bg-cyber-red/10',    line:'bg-cyber-red'    },
  }[event.tipo] || { icon:'?', label:'?', color:'text-cyber-muted', border:'border-cyber-dim', bg:'bg-transparent', line:'bg-cyber-dim' };

  return (
    <div className="flex gap-4">
      {/* Eje izquierdo: nodo + línea */}
      <div className="flex flex-col items-center gap-0 flex-shrink-0">
        <div className={`w-10 h-10 border-2 ${meta.border} ${meta.bg} flex items-center justify-center text-lg font-bold ${meta.color}`}
             style={{ boxShadow: `2px 2px 0 currentColor` }}>
          {meta.icon}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 min-h-[40px] ${meta.line} opacity-40`}></div>}
      </div>

      {/* Bloque del evento */}
      <div className={`flex-1 mb-4 border-2 ${meta.border} ${meta.bg} p-4 transition-all duration-200 hover:translate-x-1`}
           style={{ boxShadow: `3px 3px 0 currentColor` }}>

        {/* Header del bloque */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
              {meta.label}
            </span>
            <span className="font-mono text-[10px] text-cyber-muted">·</span>
            <span className="font-mono text-[10px] text-cyber-muted">{fmtDate(event.ts)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-cyber-muted">HASH:</span>
            <span className={`font-mono text-[9px] ${meta.color}`}>{shortHash(event.certId)}</span>
          </div>
        </div>

        {/* Datos del bloque */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          {event.nombre && (
            <div className="flex gap-2">
              <span className="font-mono text-[10px] text-cyber-muted w-16 flex-shrink-0">ALUMNO</span>
              <span className="font-display font-bold text-cyber-text text-sm truncate">{event.nombre}</span>
            </div>
          )}
          {event.carrera && (
            <div className="flex gap-2">
              <span className="font-mono text-[10px] text-cyber-muted w-16 flex-shrink-0">CARRERA</span>
              <span className="font-mono text-xs text-cyber-text truncate">{event.carrera}</span>
            </div>
          )}
          {event.actor && (
            <div className="flex gap-2">
              <span className="font-mono text-[10px] text-cyber-muted w-16 flex-shrink-0">
                {event.tipo === 'emision' ? 'EMISOR' : event.tipo === 'recepcion' ? 'ESTUDIANTE' : 'REVOCÓ'}
              </span>
              <span className={`font-mono text-[10px] ${meta.color}`}>{shortAddr(event.actor)}</span>
            </div>
          )}
          {event.motivo && (
            <div className="flex gap-2 sm:col-span-2">
              <span className="font-mono text-[10px] text-cyber-muted w-16 flex-shrink-0">MOTIVO</span>
              <span className="font-mono text-xs text-cyber-red">{event.motivo}</span>
            </div>
          )}
        </div>

        {/* Hash-link entre bloques (prev_hash simulado) */}
        <div className="mt-2 pt-2 border-t border-cyber-dim/50 flex items-center gap-2">
          <span className="font-mono text-[9px] text-cyber-dim">ID:</span>
          <span className={`font-mono text-[9px] ${meta.color} opacity-70`}>{event.certId}</span>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────
export default function ExplorerHistorial() {
  const { contract, consultarHistorial, revocarCertificado,
          network, account, rolInfo, isConnected, connect } = useWeb3();

  const [eventos,   setEventos]   = useState([]); // lista flat de eventos del timeline
  const [certs,     setCerts]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [pagina,    setPagina]    = useState(0);
  const [filtro,    setFiltro]    = useState('todos');
  const [busqueda,  setBusqueda]  = useState('');
  const [revokeId,  setRevokeId]  = useState('');
  const [revokeMotivo, setRevokeMotivo] = useState('');
  const [revoking,  setRevoking]  = useState(false);
  const POR_PAGINA = 8;
  const explorerUrl = network?.explorer || 'https://sepolia.etherscan.io';

  const cargar = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const desde = pagina * POR_PAGINA;
      const { certificados: cs, total: t } = await consultarHistorial(desde, desde + POR_PAGINA);
      setCerts(cs);
      setTotal(t);

      // Construir lista de eventos para el timeline
      const evs = [];
      cs.forEach(c => {
        evs.push({ tipo:'emision',    certId:c.id, ts:c.tsEmision,    actor:c.emisor,      nombre:c.nombre, carrera:c.carrera });
        if (c.estado === 1 || c.tsRecepcion)  evs.push({ tipo:'recepcion',  certId:c.id, ts:c.tsRecepcion,  actor:c.estudiante   });
        if (c.estado === 2)                    evs.push({ tipo:'revocacion', certId:c.id, ts:c.tsRevocacion, actor:c.emisor, motivo:c.motivo });
      });
      evs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      setEventos(evs);
    } catch (e) {
      toast.error('Error: ' + (e?.reason || e.message));
    } finally {
      setLoading(false);
    }
  }, [contract, pagina, consultarHistorial]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleRevocar = async (id) => {
    if (!revokeMotivo.trim()) { toast.error('Motivo obligatorio'); return; }
    setRevoking(true);
    try {
      await revocarCertificado(id, revokeMotivo);
      toast.success('Certificado revocado');
      setRevokeId(''); setRevokeMotivo('');
      await cargar();
    } catch (e) {
      toast.error(e?.reason || e?.shortMessage || e.message);
    } finally { setRevoking(false); }
  };

  const validos    = certs.filter(c => c.estado === 1).length;
  const pendientes = certs.filter(c => c.estado === 0).length;
  const revocados  = certs.filter(c => c.estado === 2).length;
  const totalPags  = Math.ceil(total / POR_PAGINA);

  const certsFiltrados = certs.filter(c => {
    const ok = filtro === 'todos' || (filtro==='recibidos' && c.estado===1) || (filtro==='pendientes' && c.estado===0) || (filtro==='revocados' && c.estado===2);
    const match = !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.carrera.toLowerCase().includes(busqueda.toLowerCase());
    return ok && match;
  });

  if (!isConnected) return (
    <div className="text-center py-20 animate-fade-in">
      <div className="text-6xl mb-4 animate-bounce-soft">⛓</div>
      <div className="font-display font-black text-2xl text-cyber-text mb-2">Explorer Blockchain</div>
      <p className="font-mono text-sm text-cyber-muted mb-6">Conecta MetaMask para consultar el historial on-chain</p>
      <button onClick={connect} className="nb-btn-cyan">🦊 Conectar MetaMask</button>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Métricas ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'TOTAL',      v:total,     c:'text-cyber-cyan',   b:'border-cyber-cyan'   },
          { label:'RECIBIDOS',  v:validos,   c:'text-cyber-lime',   b:'border-cyber-lime'   },
          { label:'PENDIENTES', v:pendientes,c:'text-cyber-yellow', b:'border-cyber-yellow' },
          { label:'REVOCADOS',  v:revocados, c:'text-cyber-red',    b:'border-cyber-red'    },
        ].map(m => (
          <div key={m.label} className={`border-2 ${m.b} bg-cyber-card p-4 text-center`} style={{ boxShadow:`3px 3px 0 currentColor` }}>
            <div className={`neon-num text-4xl ${m.c}`}>{m.v}</div>
            <div className="font-mono text-[10px] text-cyber-muted mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Timeline blockchain ───────────────────────── */}
        <div className="lg:col-span-3">
          <div className="nb-card-cyan mb-4">
            <div className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-1">CADENA DE EVENTOS INMUTABLES</div>
            <h2 className="font-display font-black text-cyber-cyan text-xl">Timeline On-Chain</h2>
            <p className="font-mono text-[10px] text-cyber-muted mt-1">Cada eslabón representa un evento firmado criptográficamente</p>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-cyber-cyan font-mono text-sm">
                <div className="w-4 h-4 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin"></div>
                Consultando nodos…
              </div>
            </div>
          )}

          {!loading && eventos.length === 0 && (
            <div className="nb-card text-center py-10">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-display font-bold text-cyber-muted">Sin eventos registrados</p>
            </div>
          )}

          {!loading && eventos.map((ev, i) => (
            <ChainBlock key={`${ev.certId}-${ev.tipo}`} event={ev} isLast={i === eventos.length - 1} />
          ))}

          {/* Paginación */}
          {totalPags > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPagina(p => Math.max(0,p-1))} disabled={pagina===0} className="nb-btn-ghost !py-1.5 !px-4">◀</button>
              {Array.from({length:totalPags},(_,i)=>(
                <button key={i} onClick={()=>setPagina(i)}
                  className={`w-8 h-8 border-2 font-mono text-xs transition-all ${pagina===i?'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10':'border-cyber-dim text-cyber-muted'}`}>
                  {i+1}
                </button>
              ))}
              <button onClick={() => setPagina(p => Math.min(totalPags-1,p+1))} disabled={pagina>=totalPags-1} className="nb-btn-ghost !py-1.5 !px-4">▶</button>
            </div>
          )}
        </div>

        {/* ── Panel derecho: tabla + gestión ─────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Filtros */}
          <div className="nb-card">
            <div className="font-mono text-[10px] text-cyber-muted uppercase mb-2">FILTROS</div>
            <div className="flex flex-wrap gap-1 mb-3">
              {[['todos','Todos'],['recibidos','✓ Recibidos'],['pendientes','⏳ Pendientes'],['revocados','⊘ Revocados']].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltro(v)}
                  className={`font-mono text-[10px] px-2.5 py-1.5 border transition-all ${filtro===v?'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10':'border-cyber-dim text-cyber-muted'}`}>
                  {l}
                </button>
              ))}
            </div>
            <input className="nb-input text-xs" placeholder="Buscar nombre o carrera…"
              value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          </div>

          {/* Lista de certificados */}
          <div className="space-y-2">
            {certsFiltrados.map(cert => {
              const meta = { 0:{c:'text-cyber-yellow',b:'border-cyber-yellow',icon:'⏳'}, 1:{c:'text-cyber-lime',b:'border-cyber-lime',icon:'✓'}, 2:{c:'text-cyber-red',b:'border-cyber-red',icon:'⊘'} }[cert.estado];
              const isRevForm = revokeId === cert.id;
              return (
                <div key={cert.id} className={`border-2 ${meta.b} bg-cyber-card p-3 transition-all hover:translate-x-0.5`}
                     style={{ boxShadow:`2px 2px 0 currentColor` }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className={`font-mono text-[9px] font-black uppercase ${meta.c}`}>{meta.icon} {['PENDIENTE','RECIBIDO','REVOCADO'][cert.estado]}</div>
                      <div className="font-display font-bold text-cyber-text text-sm truncate">{cert.nombre}</div>
                      <div className="font-mono text-[10px] text-cyber-muted truncate">{cert.carrera}</div>
                    </div>
                    {rolInfo?.activo && cert.estado !== 2 && !isRevForm && (
                      <button onClick={() => setRevokeId(cert.id)} className="flex-shrink-0 font-mono text-[9px] text-cyber-red border border-cyber-red/30 px-2 py-1 hover:bg-cyber-red/10 transition-all">
                        ⊘ Revocar
                      </button>
                    )}
                  </div>

                  {isRevForm && (
                    <div className="mt-2 space-y-1.5 animate-slide-up">
                      <input className="nb-input !text-xs" placeholder="Motivo de revocación…"
                        value={revokeMotivo} onChange={e=>setRevokeMotivo(e.target.value)} />
                      <div className="flex gap-1.5">
                        <button onClick={() => handleRevocar(cert.id)} disabled={revoking}
                          className="nb-btn-red flex-1 justify-center !text-xs !py-1.5">
                          {revoking ? '…' : '⊘ Confirmar'}
                        </button>
                        <button onClick={()=>{setRevokeId('');setRevokeMotivo('');}} className="nb-btn-ghost !text-xs !py-1.5 !px-3">✕</button>
                      </div>
                    </div>
                  )}

                  <div className={`font-mono text-[9px] ${meta.c} opacity-60 mt-1 truncate`}>{cert.id}</div>
                </div>
              );
            })}
          </div>

          <button onClick={cargar} disabled={loading} className="nb-btn-ghost w-full justify-center !text-xs">
            {loading ? '↺ Cargando…' : '↺ Actualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}
