// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// §11 (extensión opcional): cada certificado académico se representa además como
// un NFT ERC-721 SOULBOUND con metadatos 100% on-chain.
contract AcademicCertificates is ERC721 {
    using Strings for uint256;

    enum EstadoCertificado { PendienteRecepcion, Recibido, Revocado }

    struct Certificate {
        bytes32 id; // Hash SHA-256 del PDF
        string codigo; // RF1: código legible del certificado (folio institucional)
        string nombreEstudiante;
        string carrera;
        uint256 fechaEmision;
        uint256 fechaRecepcion;
        address emisor;
        address estudiante;
        EstadoCertificado estado;
        uint256 fechaRevocacion;
        string motivoRevocacion;
    }

    address public owner;
    mapping(address => bool) public emisoresAutorizados;
    mapping(bytes32 => Certificate) public certificados;

    // §11 NFT: mapeo bidireccional tokenId <-> hash del certificado y contador incremental
    uint256 private _nextTokenId; // los tokenId arrancan en 1 (0 queda reservado como "inexistente")
    mapping(uint256 => bytes32) public hashPorToken; // tokenId -> hash del certificado
    mapping(bytes32 => uint256) public tokenPorHash; // hash del certificado -> tokenId

    // Eventos para alimentar la reactividad del frontend y demostrar auditabilidad distribuida
    event LogCertificadoEmitido(bytes32 indexed id, string nombreEstudiante, address indexed emisor, address indexed estudiante);
    event LogRecepcionFirmada(bytes32 indexed id, address indexed estudiante, uint256 fechaRecepcion);
    event LogCertificadoRevocado(bytes32 indexed id, string motivo, uint256 fechaRevocacion);
    event LogEmisorModificado(address indexed emisor, bool autorizado);
    event LogNFTMinteado(bytes32 indexed id, address indexed estudiante, uint256 indexed tokenId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el propietario de la DApp puede ejecutar esto");
        _;
    }

    modifier onlyEmisor() {
        require(emisoresAutorizados[msg.sender], "No eres un emisor autorizado (Rector/Director)");
        _;
    }

    constructor() ERC721("Certificado Academico UNIVALLE", "CERTUV") {
        owner = msg.sender;
        emisoresAutorizados[msg.sender] = true; // El desplegador es emisor por defecto
    }

    function ordenarEmisor(address _emisor, bool _autorizado) external onlyOwner {
        emisoresAutorizados[_emisor] = _autorizado;
        emit LogEmisorModificado(_emisor, _autorizado);
    }

    // FASE 1: Registrar Hash y Firmar Emisión (Universidad) + mintear el NFT soulbound
    function emitirCertificado(
        bytes32 _hashPDF,
        string memory _codigo,
        string memory _nombre,
        string memory _carrera,
        address _estudiante
    ) external onlyEmisor {
        require(certificados[_hashPDF].id == bytes32(0), "El hash de este certificado ya esta registrado");
        require(_estudiante != address(0), "Direccion de estudiante invalida");

        certificados[_hashPDF] = Certificate({
            id: _hashPDF,
            codigo: _codigo,
            nombreEstudiante: _nombre,
            carrera: _carrera,
            fechaEmision: block.timestamp,
            fechaRecepcion: 0,
            emisor: msg.sender,
            estudiante: _estudiante,
            estado: EstadoCertificado.PendienteRecepcion,
            fechaRevocacion: 0,
            motivoRevocacion: ""
        });

        emit LogCertificadoEmitido(_hashPDF, _nombre, msg.sender, _estudiante);

        // §11: mintear el NFT al estudiante y enlazar tokenId <-> hash en ambos sentidos
        uint256 tokenId = ++_nextTokenId;
        hashPorToken[tokenId] = _hashPDF;
        tokenPorHash[_hashPDF] = tokenId;
        _safeMint(_estudiante, tokenId);
        emit LogNFTMinteado(_hashPDF, _estudiante, tokenId);
    }

    // FASE 2: Estudiante Firma Recepción (Obligatorio en el diagrama)
    function firmarRecepcion(bytes32 _hashPDF) external {
        Certificate storage cert = certificados[_hashPDF];
        require(cert.id != bytes32(0), "El certificado no existe");
        require(msg.sender == cert.estudiante, "Solo el estudiante asignado puede firmar la recepcion");
        require(cert.estado == EstadoCertificado.PendienteRecepcion, "El certificado no esta listo para firmar o ya fue procesado");

        cert.estado = EstadoCertificado.Recibido;
        cert.fechaRecepcion = block.timestamp;

        emit LogRecepcionFirmada(_hashPDF, msg.sender, block.timestamp);
    }

    // FASE 3: Revocación por error administrativo
    function revocarCertificado(bytes32 _hashPDF, string memory _motivo) external onlyEmisor {
        Certificate storage cert = certificados[_hashPDF];
        require(cert.id != bytes32(0), "El certificado no existe");
        require(cert.estado != EstadoCertificado.Revocado, "El certificado ya se encuentra revocado");

        cert.estado = EstadoCertificado.Revocado;
        cert.fechaRevocacion = block.timestamp;
        cert.motivoRevocacion = _motivo;

        emit LogCertificadoRevocado(_hashPDF, _motivo, block.timestamp);
    }

    // Consulta e inspección pública
    function verificarCertificado(bytes32 _hashPDF) external view returns (Certificate memory) {
        require(certificados[_hashPDF].id != bytes32(0), "Certificado no encontrado en el ledger");
        return certificados[_hashPDF];
    }

    // §4.4 Consultar historial de un certificado: trazabilidad completa del ciclo de vida.
    // Reutiliza el struct Certificate ya almacenado, no duplica datos.
    function consultarHistorial(bytes32 _hashPDF) external view returns (
        uint256 fechaEmision,
        uint256 fechaRecepcion,
        address emisor,
        EstadoCertificado estado,
        uint256 fechaRevocacion,
        string memory motivoRevocacion
    ) {
        Certificate storage cert = certificados[_hashPDF];
        require(cert.id != bytes32(0), "Certificado no encontrado en el ledger");
        return (
            cert.fechaEmision,
            cert.fechaRecepcion,
            cert.emisor,
            cert.estado,
            cert.fechaRevocacion,
            cert.motivoRevocacion
        );
    }

    // ─────────────────────────── §11 NFT ERC-721 ───────────────────────────

    // Texto legible del estado para los metadatos
    function _estadoTexto(EstadoCertificado _estado) internal pure returns (string memory) {
        if (_estado == EstadoCertificado.Revocado) return "Revocado";
        if (_estado == EstadoCertificado.Recibido) return "Vigente";
        return "Pendiente de Recepcion";
    }

    // METADATOS ON-CHAIN: el tokenURI se genera en la cadena (data:application/json;base64),
    // sin IPFS ni servidores externos. Al leer el estado actual del struct, el metadato es
    // DINÁMICO: si el certificado se revoca, el estado del NFT pasa a "Revocado" sin reminteo.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // revierte si el tokenId no existe
        Certificate storage cert = certificados[hashPorToken[tokenId]];

        bytes memory json = abi.encodePacked(
            '{"name":"Certificado Academico #', tokenId.toString(), " - ", cert.nombreEstudiante,
            '","description":"Titulo academico emitido y verificado on-chain por UNIVALLE. NFT soulbound (no transferible).",',
            '"attributes":[',
                '{"trait_type":"Estudiante","value":"', cert.nombreEstudiante, '"},',
                '{"trait_type":"Carrera","value":"', cert.carrera, '"},',
                '{"trait_type":"Universidad","value":"Universidad del Valle (UNIVALLE)"},',
                '{"trait_type":"Fecha de Emision","value":"', cert.fechaEmision.toString(), '"},',
                '{"trait_type":"Codigo","value":"', cert.codigo, '"},',
                '{"trait_type":"Hash","value":"', Strings.toHexString(uint256(cert.id), 32), '"},',
                '{"trait_type":"Estado","value":"', _estadoTexto(cert.estado), '"}',
            "]}"
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    // SOULBOUND: un titulo academico pertenece para siempre al estudiante; no se vende ni
    // se transfiere. Sobreescribimos el hook de transferencia de OZ v5 (_update) para permitir
    // UNICAMENTE el minteo inicial (from == address(0)); cualquier transferencia entre cuentas
    // (from != 0 && to != 0) revierte. Esto materializa la "no transferibilidad" del título.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: el certificado es intransferible");
        return super._update(to, tokenId, auth);
    }
}
