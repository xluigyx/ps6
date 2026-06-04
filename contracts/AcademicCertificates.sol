// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  AcademicCertificates
 * @author CertChain UNIVALLE — Práctica 6 Sistemas Distribuidos
 * @notice Contrato para la emisión, verificación y revocación de
 *         certificados académicos registrados en Ethereum.
 *
 * @dev    Patrones aplicados:
 *           - Access Control con mappings (sin dependencia OZ)
 *           - Checks-Effects-Interactions para prevenir reentrancia
 *           - Uso de bytes32 para IDs O(1) en lugar de strings
 *           - Eventos indexados para consultas off-chain eficientes
 *           - Optimización de gas: variables packed en structs
 *           - Custom errors (EIP-838) para menor consumo de gas
 */
contract AcademicCertificates {

    // =========================================================
    //  TIPOS Y ESTRUCTURAS DE DATOS
    // =========================================================

    /**
     * @dev Estado posible de un certificado.
     *      Usar enum en lugar de uint reduce errores lógicos.
     */
    enum EstadoCertificado { Valido, Revocado }

    /**
     * @dev Rol de un emisor autorizado.
     *      Permite distinguir el tipo de autoridad en eventos.
     */
    enum RolEmisor { SinRol, Rector, DirectorCarrera }

    /**
     * @dev Certificado académico registrado on-chain.
     *      Orden de campos optimizado para tight-packing en EVM:
     *        - address (20 bytes) + EstadoCertificado (1 byte) → mismo slot
     *        - timestamps (uint64) empaquetados para reducir slots SSTORE
     */
    struct Certificado {
        bytes32  idCertificado;          // Hash SHA-256 del PDF original
        string   nombreEstudiante;       // Nombre completo del graduado
        string   carrera;                // Programa académico
        string   universidad;            // Institución emisora
        address  emisor;                 // Dirección que firmó la tx (20 bytes)
        EstadoCertificado estado;        // Válido / Revocado          (1 byte)
        uint64   timestampEmision;       // Unix timestamp de emisión   (8 bytes)
        uint64   timestampRevocacion;    // Unix timestamp de revocación(8 bytes)
        string   motivoRevocacion;       // Razón en caso de revocación
    }

    /**
     * @dev Metadata de un emisor autorizado.
     */
    struct DatosEmisor {
        RolEmisor rol;               // Rector o DirectorCarrera
        string    nombre;            // Nombre legible del emisor
        bool      activo;            // Permite desactivar sin borrar historial
        uint64    fechaAutorizacion; // Cuándo fue autorizado
    }

    // =========================================================
    //  VARIABLES DE ESTADO
    // =========================================================

    /// @dev Propietario del contrato (deployer = administrador principal)
    address public immutable owner;

    /**
     * @dev Registro principal: bytes32 (hash SHA-256) → Certificado
     *      Búsqueda O(1) usando el hash como clave directa.
     */
    mapping(bytes32 => Certificado) private certificados;

    /**
     * @dev Control de acceso: address → DatosEmisor
     *      Evita iterar arrays para verificar permisos.
     */
    mapping(address => DatosEmisor) private emisoresAutorizados;

    /**
     * @dev Índice de todos los IDs emitidos para iterar el historial.
     *      Se mantiene separado del mapping para eficiencia.
     */
    bytes32[] private historialIds;

    /**
     * @dev Índice adicional por emisor para consultas filtradas.
     */
    mapping(address => bytes32[]) private certificadosPorEmisor;

    // =========================================================
    //  EVENTOS (Logs Criptográficos para Transparencia y Auditoría)
    // =========================================================

    /**
     * @notice Emitido cuando se registra un nuevo certificado válido.
     * @param  idCertificado    Hash SHA-256 del PDF (indexado para filtrar)
     * @param  emisor           Dirección del emisor autorizado (indexada)
     * @param  nombreEstudiante Nombre del graduado
     * @param  carrera          Programa académico
     * @param  timestamp        Momento exacto de emisión
     */
    event LogCertificadoEmitido(
        bytes32 indexed idCertificado,
        address indexed emisor,
        string          nombreEstudiante,
        string          carrera,
        uint64          timestamp
    );

    /**
     * @notice Emitido cuando un certificado es revocado.
     * @param  idCertificado Hash del certificado revocado (indexado)
     * @param  revokedBy     Dirección del emisor que revocó (indexada)
     * @param  motivo        Razón de la revocación
     * @param  timestamp     Momento de la revocación
     */
    event LogCertificadoRevocado(
        bytes32 indexed idCertificado,
        address indexed revokedBy,
        string          motivo,
        uint64          timestamp
    );

    /**
     * @notice Emitido cuando se autoriza un nuevo emisor.
     * @param  emisor  Dirección autorizada (indexada)
     * @param  rol     Rol asignado (Rector / DirectorCarrera)
     * @param  nombre  Nombre legible del emisor
     * @param  por     Quién realizó la autorización (owner)
     */
    event LogEmisorAutorizado(
        address indexed emisor,
        RolEmisor       rol,
        string          nombre,
        address indexed por
    );

    /**
     * @notice Emitido cuando se revoca el acceso de un emisor.
     * @param  emisor Dirección desautorizada (indexada)
     * @param  por    Quién realizó la desautorización
     */
    event LogEmisorDesautorizado(
        address indexed emisor,
        address indexed por
    );

    // =========================================================
    //  ERRORES PERSONALIZADOS (EIP-838)
    //  Más eficientes en gas que require() con strings (~200 gas menos)
    // =========================================================

    error SoloOwner();
    error SoloEmisorAutorizado();
    error CertificadoYaExiste(bytes32 id);
    error CertificadoNoExiste(bytes32 id);
    error CertificadoYaRevocado(bytes32 id);
    error HashInvalido();
    error NombreVacio();
    error CarreraVacia();
    error MotivoRevocacionVacio();
    error EmisorYaAutorizado(address emisor);
    error EmisorNoExiste(address emisor);
    error DireccionInvalida();

    // =========================================================
    //  MODIFICADORES
    // =========================================================

    /**
     * @dev Solo el owner (deployer) puede ejecutar esta función.
     *      Uso de error personalizado ahorra ~200 gas vs require + string.
     */
    modifier soloOwner() {
        if (msg.sender != owner) revert SoloOwner();
        _;
    }

    /**
     * @dev Solo emisores activos con rol válido pueden emitir/revocar.
     */
    modifier soloEmisorActivo() {
        DatosEmisor storage datos = emisoresAutorizados[msg.sender];
        if (!datos.activo || datos.rol == RolEmisor.SinRol)
            revert SoloEmisorAutorizado();
        _;
    }

    /**
     * @dev Valida que un bytes32 no sea el valor cero (hash vacío).
     */
    modifier hashValido(bytes32 _hash) {
        if (_hash == bytes32(0)) revert HashInvalido();
        _;
    }

    // =========================================================
    //  CONSTRUCTOR
    // =========================================================

    /**
     * @dev El deployer se convierte en owner y es autorizado automáticamente
     *      con rol de Rector para facilitar el arranque del sistema.
     * @param _nombreOwner Nombre legible del rector/admin inicial
     */
    constructor(string memory _nombreOwner) {
        owner = msg.sender;

        // Auto-autorizar al deployer como Rector
        emisoresAutorizados[msg.sender] = DatosEmisor({
            rol:               RolEmisor.Rector,
            nombre:            _nombreOwner,
            activo:            true,
            fechaAutorizacion: uint64(block.timestamp)
        });

        emit LogEmisorAutorizado(
            msg.sender,
            RolEmisor.Rector,
            _nombreOwner,
            msg.sender
        );
    }

    // =========================================================
    //  FUNCIONES DE GESTIÓN DE ROLES
    // =========================================================

    /**
     * @notice Autoriza una nueva dirección como emisor de certificados.
     * @dev    Solo el owner puede autorizar. Emite LogEmisorAutorizado.
     *         Patrón Checks-Effects-Interactions aplicado estrictamente.
     *
     * @param  _emisor  Dirección Ethereum del nuevo emisor
     * @param  _rol     Rol a asignar (Rector=1 / DirectorCarrera=2)
     * @param  _nombre  Nombre legible del emisor (para trazabilidad)
     */
    function autorizarEmisor(
        address   _emisor,
        RolEmisor _rol,
        string calldata _nombre
    ) external soloOwner {
        // CHECKS
        if (_emisor == address(0)) revert DireccionInvalida();
        if (emisoresAutorizados[_emisor].activo)
            revert EmisorYaAutorizado(_emisor);
        if (_rol == RolEmisor.SinRol) revert SoloEmisorAutorizado();

        // EFFECTS
        emisoresAutorizados[_emisor] = DatosEmisor({
            rol:               _rol,
            nombre:            _nombre,
            activo:            true,
            fechaAutorizacion: uint64(block.timestamp)
        });

        // INTERACTIONS (evento = log inmutable en blockchain)
        emit LogEmisorAutorizado(_emisor, _rol, _nombre, msg.sender);
    }

    /**
     * @notice Desautoriza a un emisor, revocando su acceso.
     * @dev    El historial de sus certificados permanece intacto
     *         (principio de inmutabilidad de la blockchain).
     * @param  _emisor Dirección a desautorizar
     */
    function desautorizarEmisor(address _emisor) external soloOwner {
        // CHECKS
        if (!emisoresAutorizados[_emisor].activo)
            revert EmisorNoExiste(_emisor);

        // EFFECTS
        emisoresAutorizados[_emisor].activo = false;

        // INTERACTIONS
        emit LogEmisorDesautorizado(_emisor, msg.sender);
    }

    // =========================================================
    //  FUNCIÓN PRINCIPAL: EMISIÓN
    // =========================================================

    /**
     * @notice Registra un nuevo certificado académico en la blockchain.
     * @dev    El _idCertificado DEBE ser el SHA-256 del PDF calculado
     *         en el cliente (frontend) usando la Web Crypto API.
     *         Esto garantiza la vinculación criptográfica entre el
     *         documento físico y el registro on-chain.
     *
     *         Patrón: Checks → Effects → Interactions
     *         Gas optimization: validaciones primero (revert temprano
     *         ahorra gas a los usuarios que cometan errores).
     *
     * @param  _idCertificado     bytes32 = SHA-256 del PDF (calculado off-chain)
     * @param  _nombreEstudiante  Nombre completo del graduado
     * @param  _carrera           Programa académico
     * @param  _universidad       Nombre de la institución emisora
     */
    function emitirCertificado(
        bytes32 _idCertificado,
        string calldata _nombreEstudiante,
        string calldata _carrera,
        string calldata _universidad
    )
        external
        soloEmisorActivo
        hashValido(_idCertificado)
    {
        // CHECKS — validaciones de negocio
        if (certificados[_idCertificado].emisor != address(0))
            revert CertificadoYaExiste(_idCertificado);
        if (bytes(_nombreEstudiante).length == 0) revert NombreVacio();
        if (bytes(_carrera).length == 0) revert CarreraVacia();

        uint64 _timestamp = uint64(block.timestamp);

        // EFFECTS — escritura al estado (antes de cualquier llamada externa)
        certificados[_idCertificado] = Certificado({
            idCertificado:       _idCertificado,
            nombreEstudiante:    _nombreEstudiante,
            carrera:             _carrera,
            universidad:         _universidad,
            emisor:              msg.sender,
            estado:              EstadoCertificado.Valido,
            timestampEmision:    _timestamp,
            timestampRevocacion: 0,
            motivoRevocacion:    ""
        });

        historialIds.push(_idCertificado);
        certificadosPorEmisor[msg.sender].push(_idCertificado);

        // INTERACTIONS — evento log inmutable en el trie de receipts
        emit LogCertificadoEmitido(
            _idCertificado,
            msg.sender,
            _nombreEstudiante,
            _carrera,
            _timestamp
        );
    }

    // =========================================================
    //  FUNCIÓN: VERIFICACIÓN (view — sin costo de gas off-chain)
    // =========================================================

    /**
     * @notice Verifica el estado de un certificado dado su hash SHA-256.
     * @dev    Función view: no modifica estado, sin costo de gas cuando
     *         es llamada directamente off-chain via eth_call.
     *         Búsqueda O(1) gracias al mapping con bytes32 como clave.
     *
     * @param  _idCertificado Hash SHA-256 del PDF a verificar
     * @return cert           Struct completo del certificado
     * @return existe         true si el certificado está registrado
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

    // =========================================================
    //  FUNCIÓN: REVOCACIÓN
    // =========================================================

    /**
     * @notice Revoca un certificado previamente emitido.
     * @dev    El registro original PERMANECE en blockchain (inmutabilidad);
     *         solo se actualiza el campo de estado y se añade el motivo.
     *         Esto demuestra el concepto de "append-only ledger":
     *         los datos nunca se borran, solo se añade información nueva.
     *
     * @param  _idCertificado Hash del certificado a revocar
     * @param  _motivo        Razón de la revocación (obligatorio, auditoría)
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
            revert CertificadoYaRevocado(_idCertificado);
        if (bytes(_motivo).length == 0) revert MotivoRevocacionVacio();

        uint64 _timestamp = uint64(block.timestamp);

        // EFFECTS
        cert.estado              = EstadoCertificado.Revocado;
        cert.motivoRevocacion    = _motivo;
        cert.timestampRevocacion = _timestamp;

        // INTERACTIONS
        emit LogCertificadoRevocado(
            _idCertificado,
            msg.sender,
            _motivo,
            _timestamp
        );
    }

    // =========================================================
    //  FUNCIÓN: CONSULTA DE HISTORIAL (con paginación)
    // =========================================================

    /**
     * @notice Retorna un rango del historial de IDs emitidos.
     * @dev    La paginación es crítica para evitar out-of-gas en arrays
     *         grandes. El frontend llama verificarCertificado() por cada
     *         ID que necesite detalles completos.
     *
     * @param  _desde  Índice inicial (inclusivo) para paginación
     * @param  _hasta  Índice final (exclusivo) para paginación
     * @return ids     Array de hashes de certificados en el rango dado
     * @return total   Total de certificados emitidos hasta ahora
     */
    function consultarHistorial(uint256 _desde, uint256 _hasta)
        external
        view
        returns (bytes32[] memory ids, uint256 total)
    {
        total = historialIds.length;

        // Retorno vacío si el índice de inicio excede el total
        if (_desde >= total) {
            return (new bytes32[](0), total);
        }

        // Clamping: asegurar que _hasta no exceda el array
        if (_hasta > total) _hasta = total;
        uint256 longitud = _hasta - _desde;

        ids = new bytes32[](longitud);
        for (uint256 i = 0; i < longitud; ) {
            ids[i] = historialIds[_desde + i];
            unchecked { ++i; } // Gas optimization: skip overflow check en bucle seguro
        }
    }

    /**
     * @notice Retorna todos los IDs de certificados emitidos por un emisor.
     * @dev    Útil para el panel del emisor en el frontend.
     * @param  _emisor Dirección del emisor a consultar
     * @return         Array de bytes32 IDs asociados a ese emisor
     */
    function consultarPorEmisor(address _emisor)
        external
        view
        returns (bytes32[] memory)
    {
        return certificadosPorEmisor[_emisor];
    }

    // =========================================================
    //  FUNCIONES DE CONSULTA DE ROLES
    // =========================================================

    /**
     * @notice Consulta los datos completos de un emisor autorizado.
     * @param  _emisor Dirección del emisor
     * @return         DatosEmisor struct con rol, nombre y estado
     */
    function consultarEmisor(address _emisor)
        external
        view
        returns (DatosEmisor memory)
    {
        return emisoresAutorizados[_emisor];
    }

    /**
     * @notice Verifica rápidamente si una dirección es un emisor activo.
     * @param  _emisor Dirección a verificar
     * @return         true si está activo con un rol válido
     */
    function esEmisorActivo(address _emisor)
        external
        view
        returns (bool)
    {
        DatosEmisor storage d = emisoresAutorizados[_emisor];
        return d.activo && d.rol != RolEmisor.SinRol;
    }

    /**
     * @notice Retorna el número total de certificados en el registro.
     * @return Total de certificados emitidos (incluye revocados)
     */
    function totalCertificados() external view returns (uint256) {
        return historialIds.length;
    }
}
