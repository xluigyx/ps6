import React, { useState, useEffect, useCallback } from "react";
import { CONTRACT_ADDRESS } from "../config/contract";

const DIRECCION_NULA = "0x0000000000000000000000000000000000000000";

// 0 = PendienteRecepcion, 1 = Recibido, 2 = Revocado
const ESTADOS = {
  0: { label: "Pendiente", clase: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  1: { label: "Vigente", clase: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  2: { label: "Revocado", clase: "bg-red-500/10 text-red-400 border-red-500/30" },
};

const formatearFecha = (timestamp) => {
  if (!timestamp || Number(timestamp) === 0) return "—";
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().replace("T", " ").split(".")[0] + " UTC";
};

const acortar = (addr) => (addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "—");

export default function ExplorerHistorial({ contract }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandido, setExpandido] = useState(null);

  const cargarHistorial = useCallback(async () => {
    if (!contract) {
      setError("Conecta tu wallet para leer el ledger.");
      return;
    }
    if (CONTRACT_ADDRESS === DIRECCION_NULA) {
      setError("El contrato no está desplegado (dirección 0x000...0). Despliega y configura la dirección real.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // RF4: lectura real de eventos directamente del contrato
      const emitidos = await contract.queryFilter(contract.filters.LogCertificadoEmitido());

      const filas = await Promise.all(
        emitidos.map(async (ev) => {
          const id = ev.args.id;
          let hist = null;
          try {
            // Reutilizamos consultarHistorial() (tarea 1) para el estado/fechas actuales
            hist = await contract.consultarHistorial(id);
          } catch (e) {
            console.error("consultarHistorial falló para", id, e);
          }
          return {
            id,
            nombreEstudiante: ev.args.nombreEstudiante,
            emisor: ev.args.emisor,
            estudiante: ev.args.estudiante,
            blockNumber: ev.blockNumber,
            txHash: ev.transactionHash,
            fechaEmision: hist ? hist.fechaEmision : 0n,
            fechaRecepcion: hist ? hist.fechaRecepcion : 0n,
            estado: hist ? Number(hist.estado) : 0,
            fechaRevocacion: hist ? hist.fechaRevocacion : 0n,
            motivoRevocacion: hist ? hist.motivoRevocacion : "",
          };
        })
      );

      // Más recientes primero
      filas.sort((a, b) => b.blockNumber - a.blockNumber);
      setRows(filas);
    } catch (err) {
      console.error(err);
      setError("No se pudieron leer los eventos del contrato. Verifica la red y la dirección del contrato.");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  return (
    <div className="max-w-6xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-white uppercase tracking-wider">Explorador Público del Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">RF4 · Auditoría en vivo de todas las emisiones leídas on-chain vía eventos del contrato</p>
        </div>
        <button
          onClick={cargarHistorial}
          disabled={loading}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold uppercase text-xs tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(6,182,212,0.15)] disabled:opacity-50"
        >
          {loading ? "Sincronizando..." : "↻ Actualizar"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-mono mb-6">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">Leyendo bloques de la cadena...</div>
        ) : rows.length === 0 && !error ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            Aún no hay certificados emitidos en este contrato.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10 bg-slate-950/30">
                  <th className="px-4 py-3 font-mono">Estudiante</th>
                  <th className="px-4 py-3 font-mono">Emisor</th>
                  <th className="px-4 py-3 font-mono">Fecha Emisión</th>
                  <th className="px-4 py-3 font-mono">Estado</th>
                  <th className="px-4 py-3 font-mono">Revocación</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {rows.map((r) => {
                  const estadoInfo = ESTADOS[r.estado] || ESTADOS[0];
                  const abierto = expandido === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setExpandido(abierto ? null : r.id)}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-slate-200 font-medium">{r.nombreEstudiante}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">{acortar(r.estudiante)}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{acortar(r.emisor)}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{formatearFecha(r.fechaEmision)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${estadoInfo.clase}`}>
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {r.estado === 2 ? (
                            <span className="text-red-400">{formatearFecha(r.fechaRevocacion)}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>

                      {abierto && (
                        <tr className="bg-slate-950/40 border-b border-white/5">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                              <div>
                                <span className="text-slate-500 uppercase block mb-1">Hash / ID del certificado</span>
                                <span className="text-cyan-400 break-all">{r.id}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 uppercase block mb-1">Fecha de recepción (firma alumno)</span>
                                <span className="text-slate-300">{formatearFecha(r.fechaRecepcion)}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 uppercase block mb-1">Emisor (dirección completa)</span>
                                <span className="text-slate-300 break-all">{r.emisor}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 uppercase block mb-1">Estudiante (dirección completa)</span>
                                <span className="text-slate-300 break-all">{r.estudiante}</span>
                              </div>
                              {r.estado === 2 && (
                                <div className="md:col-span-2 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                  <span className="text-red-500 uppercase block mb-1">Motivo de la revocación on-chain</span>
                                  <span className="text-slate-300">{r.motivoRevocacion || "—"}</span>
                                </div>
                              )}
                              <div className="md:col-span-2">
                                <span className="text-slate-500 uppercase block mb-1">Tx de emisión</span>
                                <span className="text-slate-400 break-all">{r.txHash} · bloque #{r.blockNumber}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <p className="text-[10px] text-slate-500 font-mono mt-3 text-center">
          {rows.length} certificado(s) en el ledger · clic en una fila para ver el historial completo (consultarHistorial)
        </p>
      )}
    </div>
  );
}
