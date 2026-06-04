import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import toast from 'react-hot-toast';
import { ROL_LABELS } from '../config/contract';

const ESTADO_COLOR = {
  0: { text: 'text-cyber-lime',   bg: 'bg-cyber-lime/10',  border: 'border-cyber-lime/30',  label: 'VÁLIDO',   dot: 'online' },
  1: { text: 'text-cyber-red',    bg: 'bg-cyber-red/10',   border: 'border-cyber-red/30',   label: 'REVOCADO', dot: 'offline' },
};

export default function ExplorerHistorial() {
  const { contract, consultarHistorial, verificarCertificado, revocarCertificado, network, account, rolInfo, isConnected, connect } = useWeb3();
  const [certs,     setCerts]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [pagina,    setPagina]    = useState(0);
  const [filtro,    setFiltro]    = useState('todos');
  const [busqueda,  setBusqueda]  = useState('');
  const [expandido, setExpandido] = useState(null);
  const [revokeId,  setRevokeId]  = useState('');
  const [revokeMotivo, setRevokeMotivo] = useState('');
  const [revoking,  setRevoking]  = useState(false);
  const POR_PAGINA = 10;

  const cargarHistorial = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const desde = pagina * POR_PAGINA;
      const hasta = desde + POR_PAGINA;
      const { certificados, total: t } = await consultarHistorial(desde, hasta);
      setCerts(certificados);
      setTotal(t);
    } catch (err) {
      toast.error('Error cargando historial: ' + (err?.reason || err.message));
    } finally {
      setLoading(false);
    }
  }, [contract, pagina, consultarHistorial]);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  const certsFiltrados = certs.filter(c => {
    const matchFiltro =
      filtro === 'todos'    ? true :
      filtro === 'validos'  ? c.estado === 0 :
      filtro === 'revocados'? c.estado === 1 : true;
    const matchBusqueda = busqueda === '' ||
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.carrera.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.id.includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  const handleRevocar = async (id) => {
    if (!revokeMotivo.trim()) { toast.error('El motivo es obligatorio'); return; }
    setRevoking(true);
    try {
      await revocarCertificado(id, revokeMotivo);
      toast.success('Certificado revocado');
      setRevokeId(''); setRevokeMotivo('');
      await cargarHistorial();
    } catch (err) {
      toast.error('Error: ' + (err?.reason || err?.shortMessage || err.message));
    } finally {
      setRevoking(false);
    }
  };

  const formatDate = (ts) => ts
    ? new Date(ts * 1000).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  const shortHash = (h) => h ? `${h.slice(0,10)}...${h.slice(-6)}` : '—';
  const shortAddr = (a) => a ? `${a.slice(0,8)}...${a.slice(-4)}` : '—';
  const explorerUrl = network?.explorer || 'https://sepolia.etherscan.io';

  const validos   = certs.filter(c => c.estado === 0).length;
  const revocados = certs.filter(c => c.estado === 1).length;
  const totalPaginas = Math.ceil(total / POR_PAGINA);

  if (!isConnected) return (
    <div className="text-center py-20 animate-fade-in">
      <div className="text-6xl mb-4 animate-bounce-soft">⛓</div>
      <h2 className="font-display font-bold text-2xl text-cyber-text mb-2">Explorer Blockchain</h2>
      <p className="font-mono text-sm text-cyber-muted mb-6">Conecta MetaMask para consultar el historial on-chain</p>
      <button onClick={connect} className="btn-cyber">🦊 Conectar MetaMask</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Métricas resumen ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL EMITIDOS',  value: total,    icon: '⬢', color: 'text-cyber-cyan',   border: 'border-cyber-cyan/20' },
          { label: 'VÁLIDOS',         value: validos,  icon: '✓', color: 'text-cyber-lime',   border: 'border-cyber-lime/20' },
          { label: 'REVOCADOS',       value: revocados,icon: '⚠', color: 'text-cyber-red',    border: 'border-cyber-red/20'  },
          { label: 'TASA DE VALIDEZ', value: total > 0 ? `${Math.round((validos/total)*100)}%` : '—', icon: '◈', color: 'text-cyber-yellow', border: 'border-cyber-yellow/20' },
        ].map((m) => (
          <div key={m.label} className={`cyber-card border ${m.border} text-center`}>
            <div className="text-2xl mb-1">{m.icon}</div>
            <div className={`neon-number text-3xl ${m.color}`}>{m.value}</div>
            <div className="font-mono text-[10px] text-cyber-muted mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* ── Controles de filtro ───────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-cyber-surface border border-cyber-border rounded-xl p-1">
          {[
            { id: 'todos',    label: 'Todos' },
            { id: 'validos',  label: '✓ Válidos' },
            { id: 'revocados',label: '⚠ Revocados' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all duration-200 ${
                filtro === f.id
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30'
                  : 'text-cyber-muted hover:text-cyber-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="cyber-input !w-auto flex-1 min-w-[200px]"
          placeholder="Buscar por nombre, carrera o hash..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <button onClick={cargarHistorial} disabled={loading} className="btn-secondary !py-2">
          {loading ? <span className="inline-block w-3 h-3 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin"></span> : '↺'} Actualizar
        </button>
      </div>

      {/* ── Timeline principal ────────────────────────────────── */}
      <div className="space-y-0">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-cyber-cyan">
              <div className="w-5 h-5 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin"></div>
              <span className="font-mono text-sm">Consultando blockchain...</span>
            </div>
          </div>
        )}

        {!loading && certsFiltrados.length === 0 && (
          <div className="cyber-card text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-display font-semibold text-cyber-muted">Sin certificados registrados</p>
            <p className="font-mono text-xs text-cyber-muted/60 mt-1">
              {busqueda ? 'No hay resultados para tu búsqueda' : 'Emite el primer certificado desde el Panel Emisor'}
            </p>
          </div>
        )}

        {!loading && certsFiltrados.map((cert, idx) => {
          const estilo = ESTADO_COLOR[cert.estado] || ESTADO_COLOR[0];
          const isExpanded = expandido === cert.id;
          const isLast = idx === certsFiltrados.length - 1;

          return (
            <div key={cert.id} className="timeline-block relative pl-10 pb-2">
              {/* Línea vertical del timeline */}
              {!isLast && <div className="timeline-connector"></div>}

              {/* Dot del timeline */}
              <div className={`absolute left-0 top-4 w-10 flex items-center justify-center`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                  ${cert.estado === 0
                    ? 'border-cyber-lime bg-cyber-lime/10 text-cyber-lime shadow-neon-lime'
                    : 'border-cyber-red bg-cyber-red/10 text-cyber-red shadow-neon-red'}`}
                >
                  {cert.estado === 0 ? '✓' : '⚠'}
                </div>
              </div>

              {/* Bloque del certificado */}
              <div
                className={`cyber-card cursor-pointer mb-2 border transition-all duration-300
                  ${isExpanded
                    ? `${estilo.border} shadow-${cert.estado === 0 ? 'neon-lime' : 'neon-red'}`
                    : 'border-cyber-border'}`}
                onClick={() => setExpandido(isExpanded ? null : cert.id)}
              >
                {/* Cabecera del bloque */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-mono text-[10px] font-semibold ${estilo.text} ${estilo.bg} ${estilo.border} border rounded px-1.5 py-0.5`}>
                        {cert.estado === 0 ? '● EMITIDO' : '◌ REVOCADO'}
                      </span>
                      <span className="font-mono text-[10px] text-cyber-muted">
                        {formatDate(cert.estado === 1 && cert.tsRevocacion ? cert.tsRevocacion : cert.tsEmision)}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-cyber-text truncate">{cert.nombre}</h3>
                    <p className="font-mono text-xs text-cyber-muted">{cert.carrera} · {cert.universidad}</p>
                  </div>

                  {/* Hash preview — estilo bloque enlazado */}
                  <div className="hidden md:block flex-shrink-0 text-right">
                    <div className="font-mono text-[10px] text-cyber-muted mb-0.5">BLOCK HASH</div>
                    <div className="font-mono text-[10px] text-cyber-cyan/70">{shortHash(cert.id)}</div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <span className="font-mono text-[9px] text-cyber-muted">EMISOR:</span>
                      <span className="font-mono text-[9px] text-cyber-purple">{shortAddr(cert.emisor)}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-cyber-muted text-sm transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : '' }}>
                    ▶
                  </div>
                </div>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-cyber-border animate-slide-up space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <p className="font-mono text-[10px] text-cyber-muted">HASH SHA-256 COMPLETO</p>
                          <div className="hash-display mt-1">{cert.id}</div>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] text-cyber-muted">EMISOR (ADDRESS)</p>
                          <a href={`${explorerUrl}/address/${cert.emisor}`} target="_blank" rel="noreferrer"
                            className="font-mono text-xs text-cyber-purple hover:text-cyber-cyan transition-colors">
                            {cert.emisor}
                          </a>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="font-mono text-[10px] text-cyber-muted">FECHA EMISIÓN</p>
                          <p className="font-mono text-xs text-cyber-yellow">{formatDate(cert.tsEmision)}</p>
                        </div>
                        {cert.estado === 1 && (
                          <>
                            <div>
                              <p className="font-mono text-[10px] text-cyber-muted">FECHA REVOCACIÓN</p>
                              <p className="font-mono text-xs text-cyber-red">{formatDate(cert.tsRevocacion)}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[10px] text-cyber-muted">MOTIVO DE REVOCACIÓN</p>
                              <p className="font-mono text-xs text-cyber-red/80">{cert.motivo || '—'}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Panel de revocación (solo para emisores activos y certs válidos) */}
                    {rolInfo?.activo && cert.estado === 0 && (
                      <div className="border border-cyber-red/20 rounded-lg p-4 bg-cyber-red/5">
                        <h4 className="font-display font-semibold text-cyber-red text-sm mb-3 flex items-center gap-2">
                          <span>⚠</span> Revocar Certificado
                        </h4>
                        {revokeId === cert.id ? (
                          <div className="space-y-2">
                            <input
                              className="cyber-input !border-cyber-red/40 text-xs"
                              placeholder="Motivo de revocación (requerido)..."
                              value={revokeMotivo}
                              onChange={e => setRevokeMotivo(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRevocar(cert.id)}
                                disabled={revoking}
                                className="btn-danger flex-1 justify-center !text-xs !py-2"
                              >
                                {revoking
                                  ? <><span className="inline-block w-3 h-3 border-2 border-cyber-red/30 border-t-cyber-red rounded-full animate-spin"></span> Revocando...</>
                                  : '⚠ Confirmar Revocación'}
                              </button>
                              <button onClick={() => { setRevokeId(''); setRevokeMotivo(''); }} className="btn-secondary !text-xs !py-2 !px-3">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setRevokeId(cert.id); }}
                            className="btn-danger !text-xs !py-1.5"
                          >
                            ⚠ Iniciar Revocación
                          </button>
                        )}
                      </div>
                    )}

                    <a
                      href={`${explorerUrl}/search?q=${cert.id}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 font-mono text-xs text-cyber-cyan hover:text-cyber-lime transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      ↗ Ver en {network?.name || 'Explorador'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Paginación ────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPagina(p => Math.max(0, p - 1))}
            disabled={pagina === 0}
            className="btn-secondary !py-1.5 !px-4"
          >
            ◀ Anterior
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i}
                onClick={() => setPagina(i)}
                className={`w-8 h-8 rounded-lg font-mono text-xs transition-all ${
                  pagina === i
                    ? 'bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan'
                    : 'border border-cyber-border text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
            disabled={pagina >= totalPaginas - 1}
            className="btn-secondary !py-1.5 !px-4"
          >
            Siguiente ▶
          </button>
        </div>
      )}

      <p className="text-center font-mono text-[10px] text-cyber-muted">
        Mostrando {certsFiltrados.length} de {total} certificados · Página {pagina + 1}/{Math.max(1, totalPaginas)}
      </p>
    </div>
  );
}
