require("@nomicfoundation/hardhat-toolbox");
// Carga las credenciales desde hardhat/.env (NO se commitea). Nunca se imprimen.
require("dotenv").config({ path: __dirname + "/.env" });

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // OpenZeppelin v5.6 usa el opcode mcopy (Cancun). Sepolia (post-Dencun) y el
      // nodo local de Hardhat lo soportan.
      evmVersion: "cancun",
      // El tokenURI on-chain arma un JSON grande; viaIR evita "stack too deep".
      viaIR: true,
    },
  },
  networks: {
    // Nodo local persistente levantado con `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Testnet pública Ethereum Sepolia
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  // Verificación en Etherscan (formato V2: una sola apiKey multichain)
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
