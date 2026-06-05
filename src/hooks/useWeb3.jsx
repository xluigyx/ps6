import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";

export const useWeb3 = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mantenemos el nombre original "connect" que tus componentes ya están usando
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask no está instalado. Por favor, instálalo para continuar.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // CORRECCIÓN V6: Se utiliza BrowserProvider en lugar de Web3Provider
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Solicitar acceso a las cuentas
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // CORRECCIÓN V6: getSigner() es asíncrono y devuelve una Promesa
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Inicializar el contrato con el signer de v6
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      setAccount(address);
      setContract(contractInstance);
    } catch (err) {
      console.error("Error al conectar a Web3:", err);
      setError(err.message || "Error al conectar con MetaMask");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setContract(null);
    setError(null);
  }, []);

  // Escuchar cambios de cuenta o red en MetaMask
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          // Si cambia la cuenta, volvemos a conectar para actualizar el signer
          connect();
        } else {
          disconnect();
        }
      };

      const handleChainChanged = () => {
        // Recargar la página es la recomendación oficial de MetaMask al cambiar de red
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [connect, disconnect]);

  return { account, contract, error, loading, connect, disconnect };
};