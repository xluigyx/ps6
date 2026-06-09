export const CONTRACT_ABI = [
  // ───────────────────────── Funciones de escritura ─────────────────────────
  {
    "inputs": [
      { "name": "_hashPDF", "type": "bytes32" },
      { "name": "_codigo", "type": "string" },
      { "name": "_nombre", "type": "string" },
      { "name": "_carrera", "type": "string" },
      { "name": "_estudiante", "type": "address" }
    ],
    "name": "emitirCertificado",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_hashPDF", "type": "bytes32" }
    ],
    "name": "firmarRecepcion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_hashPDF", "type": "bytes32" },
      { "name": "_motivo", "type": "string" }
    ],
    "name": "revocarCertificado",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_emisor", "type": "address" },
      { "name": "_autorizado", "type": "bool" }
    ],
    "name": "ordenarEmisor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ───────────────────────── Funciones de lectura ─────────────────────────
  {
    "inputs": [
      { "name": "_hashPDF", "type": "bytes32" }
    ],
    "name": "verificarCertificado",
    "outputs": [
      {
        "components": [
          { "name": "id", "type": "bytes32" },
          { "name": "codigo", "type": "string" },
          { "name": "nombreEstudiante", "type": "string" },
          { "name": "carrera", "type": "string" },
          { "name": "fechaEmision", "type": "uint256" },
          { "name": "fechaRecepcion", "type": "uint256" },
          { "name": "emisor", "type": "address" },
          { "name": "estudiante", "type": "address" },
          { "name": "estado", "type": "uint8" },
          { "name": "fechaRevocacion", "type": "uint256" },
          { "name": "motivoRevocacion", "type": "string" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_hashPDF", "type": "bytes32" }
    ],
    "name": "consultarHistorial",
    "outputs": [
      { "name": "fechaEmision", "type": "uint256" },
      { "name": "fechaRecepcion", "type": "uint256" },
      { "name": "emisor", "type": "address" },
      { "name": "estado", "type": "uint8" },
      { "name": "fechaRevocacion", "type": "uint256" },
      { "name": "motivoRevocacion", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "address" }],
    "name": "emisoresAutorizados",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // ───────────────────────── NFT ERC-721 (§11) ─────────────────────────
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "bytes32" }],
    "name": "tokenPorHash",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "uint256" }],
    "name": "hashPorToken",
    "outputs": [{ "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  // ───────────────────────────────── Eventos ─────────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "id", "type": "bytes32" },
      { "indexed": false, "name": "nombreEstudiante", "type": "string" },
      { "indexed": true, "name": "emisor", "type": "address" },
      { "indexed": true, "name": "estudiante", "type": "address" }
    ],
    "name": "LogCertificadoEmitido",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "id", "type": "bytes32" },
      { "indexed": true, "name": "estudiante", "type": "address" },
      { "indexed": false, "name": "fechaRecepcion", "type": "uint256" }
    ],
    "name": "LogRecepcionFirmada",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "id", "type": "bytes32" },
      { "indexed": false, "name": "motivo", "type": "string" },
      { "indexed": false, "name": "fechaRevocacion", "type": "uint256" }
    ],
    "name": "LogCertificadoRevocado",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "emisor", "type": "address" },
      { "indexed": false, "name": "autorizado", "type": "bool" }
    ],
    "name": "LogEmisorModificado",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "id", "type": "bytes32" },
      { "indexed": true, "name": "estudiante", "type": "address" },
      { "indexed": true, "name": "tokenId", "type": "uint256" }
    ],
    "name": "LogNFTMinteado",
    "type": "event"
  }
];

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
