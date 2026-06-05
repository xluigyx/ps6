// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  AcademicCertificates v2
 * @author CertChain UNIVALLE — Práctica 6 Sistemas Distribuidos
 * @notice Sistema de doble firma criptográfica para certificados académicos.
 *
 * @dev    FLUJO OFICIAL IMPLEMENTADO:
 *           Emisor emite (Fase 1) → PendienteRecepcion
 *           Estudiante firma (Fase 2) → Recibido
 *           Emisor revoca (cualquier fase) → Revocado
 *
 *         Patrones aplicados:
 *           - State Machine explícita con enum de 3 estados
 *           - Double-signature: emisor + estudiante como partes distintas
 *           - Checks-Effects-Interactions (anti-reentrancia)
 *           - Custom Errors EIP-838 (ahorro de gas)
 *           - Eventos indexados para reactividad del frontend
 *           - Mappings O(1) para lookup por hash y por estudiante
 */
contract AcademicCertificates {

    // =========================================================
    //  MÁQUINA DE ESTADOS
    // =========================================================

    /**
     * @dev Representa el ciclo de vida completo de un certificado.
     *
     *   [INICIO]
     *      │
     *      ▼
     *   PendienteRecepcion ──── firmarRecepcion() ──▶ Recibido
     *        │                                            │
     *        └──── revocarCertificado() ──────────────▶ Revocado
     *                                                     ▲
     *                                                     │
     *                                         (también desde Recibido)
     */
    enum EstadoCertificado {
        PendienteRecepcion, // 0 — Emitido por autoridad, espera firma del estudiante
        Recibido,           // 1 — Estudiante confirmó recepción con su wallet
        Revocado            // 2 — Anulado por autoridad (desde cualquier estado)
    }

    /**
     * @dev Rol de un emisor autorizado.
     */
    enum RolEmisor { SinRol, Rector, DirectorCarrera }

    // =========================================================
    //  ESTRUCTURAS DE DATOS
    // =========================================================

    /**
     * @dev Certificado académico con ciclo de vida completo.
     *      Tight-packing: address (20B) + enum (1B) + bool (1B) → mismo slot
     *      uint64 timestamps agrupados → menor consumo de slots SSTORE
     */
    struct Certificado {
        bytes32            idCertificado;       // SHA-256 del PDF original
        string             nombreEstudiante;    // Nombre completo del graduado
        string             carrera;             // Programa académico
        string             universidad;         // Institución emisora
        address            emisor;              // Dirección que emitió (fase 1)
        address            estudiante;          // Wallet del estudiante (firma fase 2)
        EstadoCertificado  estado;              // Máquina de estados
        uint64             timestampEmision;    // Unix ts de emisión
        uint64             timestampRecepcion;  // Unix ts de firma del estudiante
        uint64             timestampRevocacion; // Unix ts de revocación
        string             motivoRevocacion;    // Razón de revocación (si aplica)
    }

    /**
     * @dev Metadata de un emisor autorizado.
     */
    struct DatosEmisor {
        RolEmisor rol;
        string    nombre;
        bool      activo;
        uint64    fechaAutorizacion;
    }

    // =========================================================
    //  VARIABLES DE ESTADO
    // =========================================================

    address public immutable owner;

    /// @dev Registro principal: SHA-256 → Certificado (búsqueda O(1))
    mapping(bytes32 => Certificado) private certificados;

    /// @dev Control de acceso de emisores
    mapping(address => DatosEmisor) private emisoresAutorizados;

    /// @dev Índice global para iterar historial
    bytes32[] private historialIds;

    /// @dev Índice por emisor
    mapping(address => bytes32[]) private certificadosPorEmisor;

    /// @dev Índice por estudiante → permite al Portal del Estudiante
    ///      encontrar sus certificados pendientes de firma
    mapping(address => bytes32[]) private certificadosPorEstudiante;

    // =========================================================
    //  EVENTOS ENRIQUECIDOS (Logs Criptográficos)
    // =========================================================

    /**
     * @notice Fase 1: Emisor registra el certificado.
     * @dev    Indexado por idCertificado y emisor para filtrado eficiente.
     */
    event LogCertificadoEmitido(
        bytes32 indexed idCertificado,
        address indexed emisor,
        address indexed estudiante,
        string          nombreEstudiante,
        string          carrera,
        uint64          timestamp
    );

    /**
     * @notice Fase 2: Estudiante firma su recepción — prueba de No Repudio.
     * @dev    La firma del estudiante es la evidencia criptográfica de aceptación.
     */
    event LogRecepcionFirmada(
        bytes32 indexed idCertificado,
        address indexed estudiante,
        uint64          timestamp
    );

    /**
     * @notice Revocación: anulación desde cualquier estado previo.
     */
    event LogCertificadoRevocado(
        bytes32 indexed idCertificado,
        address indexed revokedBy,
        string          motivo,
        uint64          timestamp
    );

    /**
     * @notice Gestión de roles de emisores.
     */
    event LogEmisorAutorizado(
        address indexed emisor,
        RolEmisor       rol,
        string          nombre,
        address indexed por
    );
    event LogEmisorDesautorizado(
        address indexed emisor,
        address indexed por
    );

    // =========================================================
    //  ERRORES PERSONALIZADOS (EIP-838)
    // =========================================================

    error SoloOwner();
    error SoloEmisorAutorizado();
    error SoloEstudianteAsignado(address esperado, address actual);
    error CertificadoYaExiste(bytes32 id);
    error CertificadoNoExiste(bytes32 id);
    error EstadoInvalido(EstadoCertificado actual, EstadoCertificado requerido);
    error CertificadoRevocado(bytes32 id);
    error HashInvalido();
    error NombreVacio();
    error CarreraVacia();
    error MotivoRevocacionVacio();
    error DireccionInvalida();
    error EmisorYaAutorizado(address emisor);
    error EmisorNoExiste(address emisor);

    // =========================================================
    //  MODIFICADORES
    // =========================================================

    modifier soloOwner() {
        if (msg.sender != owner) revert SoloOwner();
        _;
    }

    modifier soloEmisorActivo() {
        DatosEmisor storage d = emisoresAutorizados[msg.sender];
        if (!d.activo || d.rol == RolEmisor.SinRol)
            revert SoloEmisorAutorizado();
        _;
    }

    modifier hashValido(bytes32 _hash) {
        if (_hash == bytes32(0)) revert HashInvalido();
        _;
    }

    // =========================================================
    //  CONSTRUCTOR
    // =========================================================

    /**
     * @param _nombreOwner Nombre del rector/admin que despliega el contrato.
     */
    constructor(string memory _nombreOwner) {
        owner = msg.sender;
        emisoresAutorizados[msg.sender] = DatosEmisor({
            rol:               RolEmisor.Rector,
            nombre:            _nombreOwner,
            activo:            true,
            fechaAutorizacion: uint64(block.timestamp)
        });
        emit LogEmisorAutorizado(msg.sender, RolEmisor.Rector, _nombreOwner, msg.sender);
    }

    // =========================================================
    //  GESTIÓN DE ROLES
    // =========================================================

    function autorizarEmisor(
        address   _emisor,
        RolEmisor _rol,
        string calldata _nombre
    ) external soloOwner {
        if (_emisor == address(0))              revert DireccionInvalida();
        if (emisoresAutorizados[_emisor].activo) revert EmisorYaAutorizado(_emisor);
        if (_rol == RolEmisor.SinRol)           revert SoloEmisorAutorizado();

        emisoresAutorizados[_emisor] = DatosEmisor({
            rol:               _rol,
            nombre:            _nombre,
            activo:            true,
            fechaAutorizacion: uint64(block.timestamp)
        });
        emit LogEmisorAutorizado(_emisor, _rol, _nombre, msg.sender);
    }

    function desautorizarEmisor(address _emisor) external soloOwner {
        if (!emisoresAutorizados[_emisor].activo) revert EmisorNoExiste(_emisor);
        emisoresAutorizados[_emisor].activo = false;
        emit LogEmisorDesautorizado(_emisor, msg.sender);
    }

    // =========================================================
    //  FASE 1: EMISIÓN (solo Rector / Director de Carrera)
    // =========================================================

    /**
     * @notice Registra un certificado en estado PendienteRecepcion.
     * @dev    La dirección `_estudiante` es quien podrá firmar la recepción
     *         en la Fase 2. El hash SHA-256 es calculado off-chain en el cliente.
     *
     * @param  _idCertificado    SHA-256 del PDF (bytes32)
     * @param  _nombreEstudiante Nombre completo del graduado
     * @param  _carrera          Programa académico
     * @param  _universidad      Nombre de la institución
     * @param  _estudiante       Wallet del estudiante (quien firma fase 2)
     */
    function emitirCertificado(
        bytes32 _idCertificado,
        string calldata _nombreEstudiante,
        string calldata _carrera,
        string calldata _universidad,
        address _estudiante
    )
        external
        soloEmisorActivo
        hashValido(_idCertificado)
    {
        // CHECKS
        if (certificados[_idCertificado].emisor != address(0))
            revert CertificadoYaExiste(_idCertificado);
        if (bytes(_nombreEstudiante).length == 0) revert NombreVacio();
        if (bytes(_carrera).length == 0)          revert CarreraVacia();
        if (_estudiante == address(0))            revert DireccionInvalida();

        uint64 _ts = uint64(block.timestamp);

        // EFFECTS
        certificados[_idCertificado] = Certificado({
            idCertificado:       _idCertificado,
            nombreEstudiante:    _nombreEstudiante,
            carrera:             _carrera,
            universidad:         _universidad,
            emisor:              msg.sender,
            estudiante:          _estudiante,
            estado:              EstadoCertificado.PendienteRecepcion,
            timestampEmision:    _ts,
            timestampRecepcion:  0,
            timestampRevocacion: 0,
            motivoRevocacion:    ""
        });

        historialIds.push(_idCertificado);
        certificadosPorEmisor[msg.sender].push(_idCertificado);
        certificadosPorEstudiante[_estudiante].push(_idCertificado);

        // INTERACTIONS
        emit LogCertificadoEmitido(
            _idCertificado,
            msg.sender,
            _estudiante,
            _nombreEstudiante,
            _carrera,
            _ts
        );
    }

    // =========================================================
    //  FASE 2: FIRMA DE RECEPCIÓN (solo el estudiante asignado)
    // =========================================================

    /**
     * @notice El estudiante confirma haber recibido su certificado.
     * @dev    Esta transacción, firmada con la clave privada del estudiante,
     *         constituye la prueba criptográfica de No Repudio: el estudiante
     *         no puede negar haber aceptado el certificado.
     *
     *         Solo puede ejecutarla la dirección `estudiante` registrada
     *         en el momento de la emisión. Cualquier otra dirección revierte.
     *
     * @param  _idCertificado SHA-256 del PDF del certificado a firmar
     */
    function firmarRecepcion(bytes32 _idCertificado)
        external
        hashValido(_idCertificado)
    {
        // CHECKS
        Certificado storage cert = certificados[_idCertificado];
        if (cert.emisor == address(0))
            revert CertificadoNoExiste(_idCertificado);

        // Solo el estudiante asignado puede firmar
        if (msg.sender != cert.estudiante)
            revert SoloEstudianteAsignado(cert.estudiante, msg.sender);

        // Solo si está PendienteRecepcion
        if (cert.estado != EstadoCertificado.PendienteRecepcion)
            revert EstadoInvalido(cert.estado, EstadoCertificado.PendienteRecepcion);

        uint64 _ts = uint64(block.timestamp);

        // EFFECTS
        cert.estado             = EstadoCertificado.Recibido;
        cert.timestampRecepcion = _ts;

        // INTERACTIONS
        emit LogRecepcionFirmada(_idCertificado, msg.sender, _ts);
    }

    // =========================================================
    //  REVOCACIÓN (emisor autorizado, desde cualquier estado activo)
    // =========================================================

    /**
     * @notice Revoca un certificado, registrando el motivo en la blockchain.
     * @dev    Puede ejecutarse desde estado PendienteRecepcion o Recibido.
     *         El registro original permanece (append-only ledger).
     *
     * @param  _idCertificado SHA-256 del certificado a revocar
     * @param  _motivo        Razón obligatoria para auditoría
     */
    function revocarCertificado(
        bytes32 _idCertificado,
        string calldata _motivo
    )
        external
        soloEmisorActivo
        hashValido(_idCertificado)
    {
        // CHECKS
        Certificado storage cert = certificados[_idCertificado];
        if (cert.emisor == address(0))
            revert CertificadoNoExiste(_idCertificado);
        if (cert.estado == EstadoCertificado.Revocado)
            revert CertificadoRevocado(_idCertificado);
        if (bytes(_motivo).length == 0)
            revert MotivoRevocacionVacio();

        uint64 _ts = uint64(block.timestamp);

        // EFFECTS
        cert.estado              = EstadoCertificado.Revocado;
        cert.motivoRevocacion    = _motivo;
        cert.timestampRevocacion = _ts;

        // INTERACTIONS
        emit LogCertificadoRevocado(_idCertificado, msg.sender, _motivo, _ts);
    }

    // =========================================================
    //  CONSULTAS (view — sin costo de gas off-chain)
    // =========================================================

    /**
     * @notice Verifica un certificado por su hash SHA-256. Búsqueda O(1).
     */
    function verificarCertificado(bytes32 _idCertificado)
        external
        view
        hashValido(_idCertificado)
        returns (Certificado memory cert, bool existe)
    {
        cert   = certificados[_idCertificado];
        existe = (cert.emisor != address(0));
    }

    /**
     * @notice Consulta paginada del historial global.
     */
    function consultarHistorial(uint256 _desde, uint256 _hasta)
        external
        view
        returns (bytes32[] memory ids, uint256 total)
    {
        total = historialIds.length;
        if (_desde >= total) return (new bytes32[](0), total);
        if (_hasta > total)  _hasta = total;
        uint256 n = _hasta - _desde;
        ids = new bytes32[](n);
        for (uint256 i = 0; i < n; ) {
            ids[i] = historialIds[_desde + i];
            unchecked { ++i; }
        }
    }

    /**
     * @notice Todos los certificados de un emisor.
     */
    function consultarPorEmisor(address _emisor)
        external view returns (bytes32[] memory)
    {
        return certificadosPorEmisor[_emisor];
    }

    /**
     * @notice Todos los certificados asignados a un estudiante.
     * @dev    Permite al Portal del Estudiante encontrar sus pendientes.
     */
    function consultarPorEstudiante(address _estudiante)
        external view returns (bytes32[] memory)
    {
        return certificadosPorEstudiante[_estudiante];
    }

    /**
     * @notice Datos de un emisor autorizado.
     */
    function consultarEmisor(address _emisor)
        external view returns (DatosEmisor memory)
    {
        return emisoresAutorizados[_emisor];
    }

    /**
     * @notice Verifica si una dirección es emisor activo.
     */
    function esEmisorActivo(address _emisor)
        external view returns (bool)
    {
        DatosEmisor storage d = emisoresAutorizados[_emisor];
        return d.activo && d.rol != RolEmisor.SinRol;
    }

    /**
     * @notice Total de certificados emitidos.
     */
    function totalCertificados() external view returns (uint256) {
        return historialIds.length;
    }
}
