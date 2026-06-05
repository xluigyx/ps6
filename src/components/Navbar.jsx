import { useWeb3 } from '../hooks/useWeb3';
import { ROL_LABELS } from '../config/contract';

export default function Navbar({ activeView, onViewChange }) {
  const { isConnected, account, network, rolInfo, gasPrice, isOwner,
          connect, disconnect, isLoading } = useWeb3();

  const short = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : null;

  const navItems = [
    { id: 'emisor',     icon: '◈', label: 'Emisor'     },
    { id: 'estudiante', icon: '⬡', label: 'Estudiante' },
    { id: 'verificar',  icon: '⬢', label: 'Verificar'  },
    { id: 'historial',  icon: '⛓', label: 'Explorer'   },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-cyber-bg border-b-2 border-cyber-border">

      {/* Ticker superior */}
      <div className="ticker-wrap bg-cyber-surface border-b border-cyber-dim py-1">
        <div className="ticker-inner">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="inline-flex gap-6 mr-6 font-mono text-[10px]">
              <span className="text-cyber-cyan/70">⛓ CERTCHAIN UNIVALLE</span>
              <span className="text-cyber-muted">·</span>
              <span className="text-cyber-muted">ETHEREUM BLOCKCHAIN CERTIFICATION</span>
              <span className="text-cyber-muted">·</span>
              <span className="text-cyber-lime/70">SHA-256 · DOBLE FIRMA CRIPTOGRÁFICA</span>
              <span className="text-cyber-muted">·</span>
              <span className="text-cyber-yellow/70">SOLIDITY ^0.8.20</span>
              <span className="text-cyber-muted">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Barra principal */}
      <div className="flex items-center justify-between px-5 py-3 gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 border-2 border-cyber-cyan flex items-center justify-center
                          text-cyber-cyan text-xl font-bold bg-cyber-cyan/10"
               style={{ boxShadow: '2px 2px 0 #00F5FF' }}>
            ◈
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-bold text-cyber-text text-sm leading-none">CertChain</div>
            <div className="font-mono text-cyber-cyan text-[10px] mt-0.5">UNIVALLE · v2</div>
          </div>
        </div>

        {/* Nav central */}
        <div className="flex gap-1 border-2 border-cyber-border bg-cyber-surface p-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 font-display font-bold text-xs
                         transition-all duration-150 ${
                activeView === item.id
                  ? 'bg-cyber-cyan text-cyber-bg'
                  : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-dim'
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Panel derecho */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {isConnected && gasPrice && (
            <div className="hidden md:flex items-center gap-1.5 border border-cyber-border px-2.5 py-1.5 bg-cyber-surface">
              <span className="text-xs">⛽</span>
              <span className="font-mono text-xs text-cyber-yellow">{gasPrice} Gwei</span>
            </div>
          )}

          {isConnected && network && (
            <div className="hidden lg:flex items-center gap-1.5 border border-cyber-border px-2.5 py-1.5 bg-cyber-surface">
              <span className="dot-online"></span>
              <span className="font-mono text-xs text-cyber-text">{network.name}</span>
            </div>
          )}

          {isConnected && (rolInfo?.activo || isOwner) && (
            <div className="hidden lg:flex items-center gap-1.5 border-2 border-cyber-lime px-2.5 py-1.5 bg-cyber-lime/10"
                 style={{ boxShadow: '2px 2px 0 #39FF14' }}>
              <span className="font-mono text-xs text-cyber-lime font-bold">
                {isOwner ? 'RECTOR' : ROL_LABELS[rolInfo?.rol] || 'EMISOR'}
              </span>
            </div>
          )}

          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="border-2 border-cyber-dim px-3 py-1.5 flex items-center gap-1.5 bg-cyber-surface">
                <span className="dot-online"></span>
                <span className="font-mono text-xs text-cyber-cyan">{short(account)}</span>
              </div>
              <button onClick={disconnect} className="nb-btn-ghost !text-xs !py-1.5 !px-3">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={connect} disabled={isLoading} className="nb-btn-cyan">
              {isLoading
                ? <><span className="w-3 h-3 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin inline-block"></span> Conectando</>
                : <><span>🦊</span> MetaMask</>}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
