// ABI del contrato AcademicCertificates.sol
// Generado para: Solidity ^0.8.20
export const CONTRACT_ABI = [
  // Constructor
  {
    "inputs": [{ "internalType": "string", "name": "_nombreOwner", "type": "string" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  // Eventos
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "name": "idCertificado",    "type": "bytes32" },
      { "indexed": true,  "name": "emisor",           "type": "address" },
      { "indexed": false, "name": "nombreEstudiante", "type": "string"  },
      { "indexed": false, "name": "carrera",          "type": "string"  },
      { "indexed": false, "name": "timestamp",        "type": "uint64"  }
    ],
    "name": "LogCertificadoEmitido",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "name": "idCertificado", "type": "bytes32" },
      { "indexed": true,  "name": "revokedBy",     "type": "address" },
      { "indexed": false, "name": "motivo",        "type": "string"  },
      { "indexed": false, "name": "timestamp",     "type": "uint64"  }
    ],
    "name": "LogCertificadoRevocado",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "name": "emisor", "type": "address" },
      { "indexed": false, "name": "rol",    "type": "uint8"   },
      { "indexed": false, "name": "nombre", "type": "string"  },
      { "indexed": true,  "name": "por",    "type": "address" }
    ],
    "name": "LogEmisorAutorizado",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "emisor", "type": "address" },
      { "indexed": true, "name": "por",    "type": "address" }
    ],
    "name": "LogEmisorDesautorizado",
    "type": "event"
  },
  // Funciones de escritura
  {
    "inputs": [
      { "name": "_idCertificado",    "type": "bytes32" },
      { "name": "_nombreEstudiante", "type": "string"  },
      { "name": "_carrera",          "type": "string"  },
      { "name": "_universidad",      "type": "string"  }
    ],
    "name": "emitirCertificado",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_idCertificado", "type": "bytes32" },
      { "name": "_motivo",        "type": "string"  }
    ],
    "name": "revocarCertificado",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_emisor", "type": "address" },
      { "name": "_rol",    "type": "uint8"   },
      { "name": "_nombre", "type": "string"  }
    ],
    "name": "autorizarEmisor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_emisor", "type": "address" }],
    "name": "desautorizarEmisor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Funciones de lectura (view)
  {
    "inputs": [{ "name": "_idCertificado", "type": "bytes32" }],
    "name": "verificarCertificado",
    "outputs": [
      {
        "components": [
          { "name": "idCertificado",       "type": "bytes32" },
          { "name": "nombreEstudiante",    "type": "string"  },
          { "name": "carrera",             "type": "string"  },
          { "name": "universidad",         "type": "string"  },
          { "name": "emisor",              "type": "address" },
          { "name": "estado",              "type": "uint8"   },
          { "name": "timestampEmision",    "type": "uint64"  },
          { "name": "timestampRevocacion", "type": "uint64"  },
          { "name": "motivoRevocacion",    "type": "string"  }
        ],
        "name": "cert",
        "type": "tuple"
      },
      { "name": "existe", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_desde", "type": "uint256" },
      { "name": "_hasta", "type": "uint256" }
    ],
    "name": "consultarHistorial",
    "outputs": [
      { "name": "ids",   "type": "bytes32[]" },
      { "name": "total", "type": "uint256"   }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_emisor", "type": "address" }],
    "name": "consultarPorEmisor",
    "outputs": [{ "name": "", "type": "bytes32[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_emisor", "type": "address" }],
    "name": "consultarEmisor",
    "outputs": [
      {
        "components": [
          { "name": "rol",               "type": "uint8"   },
          { "name": "nombre",            "type": "string"  },
          { "name": "activo",            "type": "bool"    },
          { "name": "fechaAutorizacion", "type": "uint64"  }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_emisor", "type": "address" }],
    "name": "esEmisorActivo",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCertificados",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ─── Configuración de red ──────────────────────────────────
// Reemplaza CONTRACT_ADDRESS con la dirección real tras el deploy
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

export const NETWORKS = {
  // Sepolia Testnet (recomendado para desarrollo)
  11155111: {
    name:       'Sepolia Testnet',
    symbol:     'ETH',
    explorer:   'https://sepolia.etherscan.io',
    rpcUrl:     'https://rpc.sepolia.org',
    color:      '#CFB2FF',
  },
  // Hardhat local
  31337: {
    name:     'Hardhat Local',
    symbol:   'ETH',
    explorer: 'http://localhost:8545',
    rpcUrl:   'http://127.0.0.1:8545',
    color:    '#FFE600',
  },
  // Ethereum Mainnet
  1: {
    name:     'Ethereum Mainnet',
    symbol:   'ETH',
    explorer: 'https://etherscan.io',
    rpcUrl:   'https://cloudflare-eth.com',
    color:    '#627EEA',
  },
};

// ─── Roles ─────────────────────────────────────────────────
export const ROL_LABELS = {
  0: 'Sin Rol',
  1: 'Rector',
  2: 'Director de Carrera',
};

// ─── Estado del certificado ────────────────────────────────
export const ESTADO_LABELS = {
  0: 'Válido',
  1: 'Revocado',
};
