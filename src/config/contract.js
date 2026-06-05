export const CONTRACT_ABI = [
  {
    "inputs": [
      { "name": "_hashPDF", "type": "bytes32" },
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
      { "name": "_hashPDF", "type": "bytes32" }
    ],
    "name": "verificarCertificado",
    "outputs": [
      {
        "components": [
          { "name": "id", "type": "bytes32" },
          { "name": "nombreEstudiante", "type": "string" },
          { "name": "carrera", "type": "string" },
          { "name": "fechaEmision", "type": "uint256" },
          { "name": "fechaRecepcion", "type": "uint256" },
          { "name": "emisor", "type": "address" },
          { "name": "estudiante", "type": "address" },
          { "name": "estado", "type": "uint8" },
          { "name": "motivoRevocacion", "type": "string" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
