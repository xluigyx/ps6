/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, NETWORKS } from '../config/contract';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const web3 = useWeb3Internal();
  return <Web3Context.Provider value={web3}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 debe usarse dentro de <Web3Provider>');
  return ctx;
}

function useWeb3Internal() {
  const [provider,    setProvider]    = useState(null);
  const [signer,      setSigner]      = useState(null);
  const [contract,    setContract]    = useState(null);
  const [account,     setAccount]     = useState(null);
  const [chainId,     setChainId]     = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [network,     setNetwork]     = useState(null);
  const [rolInfo,     setRolInfo]     = useState(null);
  const [isOwner,     setIsOwner]     = useState(false);
  const [gasPrice,    setGasPrice]    = useState(null);

  // ── Auto-reconexión ──────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accounts) => { if (accounts.length === 0) disconnect(); };
    const onChain    = ()          => window.location.reload();
    window.ethereum.on('accountsChanged', onAccounts);
    window.ethereum.on('chainChanged',    onChain);
    window.ethereum.request({ method: 'eth_accounts' }).then(a => { if (a.length > 0) connect(); });
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts);
      window.ethereum.removeListener('chainChanged',    onChain);
    };
  }, []);

  useEffect(() => { if (contract && account) loadRolInfo(); }, [contract, account]);

  // ── Gas ticker ───────────────────────────────────────────
  useEffect(() => {
    if (!provider) return;
    const fetch = async () => {
      try {
        const f = await provider.getFeeData();
        setGasPrice(parseFloat(ethers.formatUnits(f.gasPrice || 0n, 'gwei')).toFixed(1));
      } catch {}
    };
    fetch();
    const t = setInterval(fetch, 15000);
    return () => clearInterval(t);
  }, [provider]);

  // ── Conectar MetaMask ────────────────────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) { alert('MetaMask no instalado'); return; }
    setIsLoading(true);
    try {
      const _prov    = new ethers.BrowserProvider(window.ethereum);
      await _prov.send('eth_requestAccounts', []);
      const _signer  = await _prov.getSigner();
      const _net     = await _prov.getNetwork();
      const _account = await _signer.getAddress();
      const _chainId = Number(_net.chainId);
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _signer);

      setProvider(_prov); setSigner(_signer); setContract(_contract);
      setAccount(_account); setChainId(_chainId);
      setNetwork(NETWORKS[_chainId] || { name: `Chain ${_chainId}`, symbol: 'ETH' });
      setIsConnected(true);
    } catch (e) { console.error(e); }
    finally     { setIsLoading(false); }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null); setSigner(null); setContract(null);
    setAccount(null);  setChainId(null); setIsConnected(false);
    setNetwork(null);  setRolInfo(null); setIsOwner(false);
  }, []);

  const loadRolInfo = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const o = await contract.owner();
      setIsOwner(o.toLowerCase() === account.toLowerCase());
      const d = await contract.consultarEmisor(account);
      setRolInfo({ rol: Number(d.rol), nombre: d.nombre, activo: d.activo });
    } catch {}
  }, [contract, account]);

  // ── Utilidades criptográficas ────────────────────────────
  const calcularHashPDF = useCallback(async (file) => {
    const buf  = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return '0x' + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  }, []);

  // ── Funciones del contrato ───────────────────────────────

  /** Fase 1 — Emisor registra el certificado */
  const emitirCertificado = useCallback(async ({ hashId, nombre, carrera, universidad, estudiante }) => {
    if (!contract) throw new Error('Sin contrato');
    const tx = await contract.emitirCertificado(hashId, nombre, carrera, universidad, estudiante);
    return await tx.wait();
  }, [contract]);

  /** Fase 2 — Estudiante firma su recepción */
  const firmarRecepcion = useCallback(async (hashId) => {
    if (!contract) throw new Error('Sin contrato');
    const tx = await contract.firmarRecepcion(hashId);
    return await tx.wait();
  }, [contract]);

  /** Verificar por hash */
  const verificarCertificado = useCallback(async (hashId) => {
    if (!contract) throw new Error('Sin contrato');
    const [cert, existe] = await contract.verificarCertificado(hashId);
    return { cert, existe };
  }, [contract]);

  /** Revocar */
  const revocarCertificado = useCallback(async (hashId, motivo) => {
    if (!contract) throw new Error('Sin contrato');
    const tx = await contract.revocarCertificado(hashId, motivo);
    return await tx.wait();
  }, [contract]);

  /** Historial global paginado con detalles */
  const consultarHistorial = useCallback(async (desde = 0, hasta = 20) => {
    if (!contract) throw new Error('Sin contrato');
    const [ids, total] = await contract.consultarHistorial(desde, hasta);
    const detalles = await Promise.all(ids.map(async (id) => {
      const [cert] = await contract.verificarCertificado(id);
      return mapCert(id, cert);
    }));
    return { certificados: detalles, total: Number(total) };
  }, [contract]);

  /** Certificados de un estudiante */
  const consultarPorEstudiante = useCallback(async (addr) => {
    if (!contract) throw new Error('Sin contrato');
    const ids = await contract.consultarPorEstudiante(addr);
    const detalles = await Promise.all(ids.map(async (id) => {
      const [cert] = await contract.verificarCertificado(id);
      return mapCert(id, cert);
    }));
    return detalles;
  }, [contract]);

  /** Autorizar emisor */
  const autorizarEmisor = useCallback(async (address, rol, nombre) => {
    if (!contract) throw new Error('Sin contrato');
    return await (await contract.autorizarEmisor(address, rol, nombre)).wait();
  }, [contract]);

  return {
    provider, signer, contract, account, chainId,
    isConnected, isLoading, network, rolInfo, isOwner, gasPrice,
    connect, disconnect, loadRolInfo,
    calcularHashPDF,
    emitirCertificado,
    firmarRecepcion,
    verificarCertificado,
    revocarCertificado,
    consultarHistorial,
    consultarPorEstudiante,
    autorizarEmisor,
  };
}

// ── Helper: convierte tupla del contrato a objeto plano ───
function mapCert(id, cert) {
  return {
    id,
    nombre:       cert.nombreEstudiante,
    carrera:      cert.carrera,
    universidad:  cert.universidad,
    emisor:       cert.emisor,
    estudiante:   cert.estudiante,
    estado:       Number(cert.estado),
    tsEmision:    Number(cert.timestampEmision),
    tsRecepcion:  Number(cert.timestampRecepcion),
    tsRevocacion: Number(cert.timestampRevocacion),
    motivo:       cert.motivoRevocacion,
  };
}
