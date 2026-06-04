import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, NETWORKS } from '../config/contract';

// ─── Contexto global de Web3 ──────────────────────────────
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

// ─── Hook interno de Web3 ─────────────────────────────────
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

  // ── Inicializar listeners de MetaMask ───────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnect();
      else { setAccount(accounts[0]); }
    };
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged',    handleChainChanged);

    // Auto-reconectar si ya estaba conectado
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) connect();
    });

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged',    handleChainChanged);
    };
  }, []);

  // ── Cargar info de rol cuando cambia el account ─────────
  useEffect(() => {
    if (contract && account) loadRolInfo();
  }, [contract, account]);

  // ── Conectar MetaMask ────────────────────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask no está instalado. Por favor instala MetaMask para continuar.');
      return;
    }
    setIsLoading(true);
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send('eth_requestAccounts', []);
      const _signer   = await _provider.getSigner();
      const _network  = await _provider.getNetwork();
      const _account  = await _signer.getAddress();
      const _chainId  = Number(_network.chainId);

      const _contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        _signer
      );

      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      setAccount(_account);
      setChainId(_chainId);
      setNetwork(NETWORKS[_chainId] || { name: `Chain ${_chainId}`, symbol: 'ETH' });
      setIsConnected(true);
    } catch (err) {
      console.error('Error al conectar MetaMask:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Desconectar ──────────────────────────────────────────
  const disconnect = useCallback(() => {
    setProvider(null); setSigner(null); setContract(null);
    setAccount(null);  setChainId(null); setIsConnected(false);
    setNetwork(null);  setRolInfo(null); setIsOwner(false);
  }, []);

  // ── Cargar información de rol del usuario ────────────────
  const loadRolInfo = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      const datos = await contract.consultarEmisor(account);
      setRolInfo({
        rol:    Number(datos.rol),
        nombre: datos.nombre,
        activo: datos.activo,
      });
    } catch (err) {
      console.error('Error cargando rol:', err);
    }
  }, [contract, account]);

  // ── Calcular SHA-256 de un File en el cliente ────────────
  const calcularHashPDF = useCallback(async (file) => {
    const buffer   = await file.arrayBuffer();
    const hashBuf  = await crypto.subtle.digest('SHA-256', buffer);
    const hashArr  = Array.from(new Uint8Array(hashBuf));
    const hashHex  = '0x' + hashArr.map(b => b.toString(16).padStart(2,'0')).join('');
    return hashHex; // bytes32-compatible hex string
  }, []);

  // ── Emitir certificado ───────────────────────────────────
  const emitirCertificado = useCallback(async ({ hashId, nombre, carrera, universidad }) => {
    if (!contract) throw new Error('Contrato no conectado');
    const tx = await contract.emitirCertificado(hashId, nombre, carrera, universidad);
    const receipt = await tx.wait();
    return receipt;
  }, [contract]);

  // ── Verificar certificado ────────────────────────────────
  const verificarCertificado = useCallback(async (hashId) => {
    if (!contract) throw new Error('Contrato no conectado');
    const [cert, existe] = await contract.verificarCertificado(hashId);
    return { cert, existe };
  }, [contract]);

  // ── Revocar certificado ──────────────────────────────────
  const revocarCertificado = useCallback(async (hashId, motivo) => {
    if (!contract) throw new Error('Contrato no conectado');
    const tx = await contract.revocarCertificado(hashId, motivo);
    const receipt = await tx.wait();
    return receipt;
  }, [contract]);

  // ── Consultar historial ──────────────────────────────────
  const consultarHistorial = useCallback(async (desde = 0, hasta = 50) => {
    if (!contract) throw new Error('Contrato no conectado');
    const [ids, total] = await contract.consultarHistorial(desde, hasta);
    // Cargar detalles de cada certificado
    const detalles = await Promise.all(
      ids.map(async (id) => {
        const [cert] = await contract.verificarCertificado(id);
        return {
          id,
          nombre:    cert.nombreEstudiante,
          carrera:   cert.carrera,
          universidad: cert.universidad,
          emisor:    cert.emisor,
          estado:    Number(cert.estado),
          tsEmision: Number(cert.timestampEmision),
          tsRevocacion: Number(cert.timestampRevocacion),
          motivo:    cert.motivoRevocacion,
        };
      })
    );
    return { certificados: detalles, total: Number(total) };
  }, [contract]);

  // ── Autorizar emisor ─────────────────────────────────────
  const autorizarEmisor = useCallback(async (address, rol, nombre) => {
    if (!contract) throw new Error('Contrato no conectado');
    const tx = await contract.autorizarEmisor(address, rol, nombre);
    return await tx.wait();
  }, [contract]);

  // ── Obtener precio gas (estimado) ────────────────────────
  const [gasPrice, setGasPrice] = useState(null);
  useEffect(() => {
    if (!provider) return;
    const fetchGas = async () => {
      try {
        const feeData = await provider.getFeeData();
        const gwei = ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
        setGasPrice(parseFloat(gwei).toFixed(1));
      } catch {}
    };
    fetchGas();
    const interval = setInterval(fetchGas, 15000);
    return () => clearInterval(interval);
  }, [provider]);

  return {
    // Estado de conexión
    provider, signer, contract, account, chainId,
    isConnected, isLoading, network, rolInfo, isOwner, gasPrice,
    // Acciones
    connect, disconnect, loadRolInfo,
    // Utilidades blockchain
    calcularHashPDF,
    emitirCertificado,
    verificarCertificado,
    revocarCertificado,
    consultarHistorial,
    autorizarEmisor,
  };
}
