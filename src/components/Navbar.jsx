import { useWeb3 } from '../hooks/useWeb3';
import { NETWORKS, ROL_LABELS } from '../config/contract';

// ─── Barra superior de navegación principal ───────────────
export default function Navbar({ activeView, onViewChange }) {
  const { isConnected, account, network, rolInfo, gasPrice, connect, disconnect, isLoading } = useWeb3();

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : null;

  const navItems = [
    { id: 'emisor',     label: 'Panel Emisor',   icon: '◈' },
    { id: 'verificar',  label: 'Verificador',     icon: '⬡' },
    { id: 'historial',  label: 'Explorer',        icon: '⬢' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-cyber-border bg-cyber-bg/95 backdrop-blur-md">
      {/* Ticker superior */}
      <div className="overflow-hidden bg-cyber-cyan/5 border-b border-cyber-cyan/10 py-1 px-0">
        <div className="flex animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
          {[...Array(4)].map((_, i) => (
            <span key={i} className="inline-flex gap-8 mr-8">
              <span className="font-mono text-xs text-cyber-cyan/60">⛓ CERTCHAIN UNIVALLE</span>
              <span className="font-mono text-xs text-cyber-muted">·</span>
              <span className="font-mono text-xs text-cyber-muted">CERTIFICACIÓN ACADÉMICA BLOCKCHAIN</span>
              <span className="font-mono text-xs text-cyber-muted">·</span>
              <span className="font-mono text-xs text-cyber-cyan/60">ETHEREUM · SOLIDITY ^0.8.20</span>
              <span className="font-mono text-xs text-cyber-muted">·</span>
              <span className="font-mono text-xs text-cyber-lime/60">SHA-256 VERIFIED</span>
              <span className="font-mono text-xs text-cyber-muted">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Barra principal */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan text-lg">
            ◈
          </div>
          <div>
            <h1 className="font-display font-bold text-cyber-text text-sm leading-none">CertChain</h1>
            <p className="font-mono text-cyber-cyan text-[10px] leading-none mt-0.5">UNIVALLE · Ethereum</p>
          </div>
        </div>

        {/* Navegación central */}
        <div className="flex gap-1 bg-cyber-surface border border-cyber-border rounded-xl p-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display text-sm font-medium transition-all duration-200 ${
                activeView === item.id
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 shadow-neon-cyan'
                  : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Panel derecho: gas + wallet */}
        <div className="flex items-center gap-3">
          {/* Gas tracker mini */}
          {isConnected && gasPrice && (
            <div className="hidden md:flex items-center gap-2 bg-cyber-surface border border-cyber-border rounded-lg px-3 py-1.5">
              <span className="text-sm">⛽</span>
              <span className="font-mono text-xs text-cyber-yellow">{gasPrice} Gwei</span>
            </div>
          )}

          {/* Red */}
          {isConnected && network && (
            <div className="hidden md:flex items-center gap-2 bg-cyber-surface border border-cyber-border rounded-lg px-3 py-1.5">
              <span className="status-dot online"></span>
              <span className="font-mono text-xs text-cyber-text">{network.name}</span>
            </div>
          )}

          {/* Rol */}
          {isConnected && rolInfo?.activo && (
            <div className="hidden lg:flex items-center gap-2 bg-cyber-lime/10 border border-cyber-lime/30 rounded-lg px-3 py-1.5">
              <span className="font-mono text-xs text-cyber-lime font-semibold">
                {ROL_LABELS[rolInfo.rol] || 'Usuario'}
              </span>
            </div>
          )}

          {/* Wallet button */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="bg-cyber-surface border border-cyber-border rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="status-dot online"></span>
                <span className="font-mono text-xs text-cyber-cyan">{shortAddress}</span>
              </div>
              <button
                onClick={disconnect}
                className="btn-secondary !py-1.5 !px-3 !text-xs"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isLoading}
              className="btn-cyber"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin"></span>
                  Conectando...
                </>
              ) : (
                <>
                  <span>🦊</span>
                  Conectar MetaMask
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
