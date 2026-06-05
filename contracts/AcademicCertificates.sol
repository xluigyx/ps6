// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AcademicCertificates {
    
    enum EstadoCertificado { PendienteRecepcion, Recibido, Revocado }

    struct Certificate {
        bytes32 id; // Hash SHA-256 del PDF
        string nombreEstudiante;
        string carrera;
        uint256 fechaEmision;
        uint256 fechaRecepcion;
        address emisor;
        address estudiante;
        EstadoCertificado estado;
        string motivoRevocacion;
    }

    address public owner;
    mapping(address => bool) public emisoresAutorizados;
    mapping(bytes32 => Certificate) public certificados;

    // Eventos para alimentar la reactividad del frontend y demostrar auditabilidad distribuida
    event LogCertificadoEmitido(bytes32 indexed id, string nombreEstudiante, address indexed emisor, address indexed estudiante);
    event LogRecepcionFirmada(bytes32 indexed id, address indexed estudiante, uint256 fechaRecepcion);
    event LogCertificadoRevocado(bytes32 indexed id, string motivo, uint256 fechaRevocacion);
    event LogEmisorModificado(address indexed emisor, bool autorizado);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el propietario de la DApp puede ejecutar esto");
        _;
    }

    modifier onlyEmisor() {
        require(emisoresAutorizados[msg.sender], "No eres un emisor autorizado (Rector/Director)");
        _;
    }

    constructor() {
        owner = msg.sender;
        emisoresAutorizados[msg.sender] = true; // El desplegador es emisor por defecto
    }

    function ordenarEmisor(address _emisor, bool _autorizado) external onlyOwner {
        emisoresAutorizados[_emisor] = _autorizado;
        emit LogEmisorModificado(_emisor, _autorizado);
    }

    // FASE 1: Registrar Hash y Firmar Emisión (Universidad)
    function emitirCertificado(
        bytes32 _hashPDF,
        string memory _nombre,
        string memory _carrera,
        address _estudiante
    ) external onlyEmisor {
        require(certificados[_hashPDF].id == bytes32(0), "El hash de este certificado ya esta registrado");
        require(_estudiante != address(0), "Direccion de estudiante invalida");

        certificados[_hashPDF] = Certificate({
            id: _hashPDF,
            nombreEstudiante: _nombre,
            carrera: _carrera,
            fechaEmision: block.timestamp,
            fechaRecepcion: 0,
            emisor: msg.sender,
            estudiante: _estudiante,
            estado: EstadoCertificado.PendienteRecepcion,
            motivoRevocacion: ""
        });

        emit LogCertificadoEmitido(_hashPDF, _nombre, msg.sender, _estudiante);
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
        cert.motivoRevocacion = _motivo;

        emit LogCertificadoRevocado(_hashPDF, _motivo, block.timestamp);
    }

    // Consulta e inspección pública
    function verificarCertificado(bytes32 _hashPDF) external view returns (Certificate memory) {
        require(certificados[_hashPDF].id != bytes32(0), "Certificado no encontrado en el ledger");
        return certificados[_hashPDF];
    }
}
