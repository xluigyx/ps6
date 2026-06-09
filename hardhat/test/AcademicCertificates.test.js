const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AcademicCertificates", function () {
  let contract, owner, emisor, estudiante, intruso;

  // Hashes SHA-256/keccak de documentos simulados (bytes32)
  const HASH_DOC = ethers.id("acta-juan-perez-sistemas-2026");
  const HASH_MANIPULADO = ethers.id("acta-juan-perez-sistemas-2026-ALTERADO");

  const CODIGO = "UV-ING-2026-0042";
  const NOMBRE = "Juan Perez";
  const CARRERA = "Ingenieria de Sistemas";

  beforeEach(async function () {
    [owner, emisor, estudiante, intruso] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AcademicCertificates");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    // El owner autoriza a 'emisor' como Rector/Director
    await contract.ordenarEmisor(emisor.address, true);
  });

  it("1. Emisión correcta: emite el evento y guarda los datos en el ledger", async function () {
    await expect(
      contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address)
    )
      .to.emit(contract, "LogCertificadoEmitido")
      .withArgs(HASH_DOC, NOMBRE, emisor.address, estudiante.address);

    const cert = await contract.verificarCertificado(HASH_DOC);
    expect(cert.id).to.equal(HASH_DOC);
    expect(cert.codigo).to.equal(CODIGO); // RF1
    expect(cert.nombreEstudiante).to.equal(NOMBRE);
    expect(cert.carrera).to.equal(CARRERA);
    expect(cert.emisor).to.equal(emisor.address);
    expect(cert.estudiante).to.equal(estudiante.address);
    expect(cert.estado).to.equal(0); // PendienteRecepcion
    expect(cert.fechaEmision).to.be.greaterThan(0);
  });

  it("2. Verificación: un hash existente devuelve el certificado correcto", async function () {
    await contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address);

    const cert = await contract.verificarCertificado(HASH_DOC);
    expect(cert.nombreEstudiante).to.equal(NOMBRE);
    expect(cert.carrera).to.equal(CARRERA);

    // consultarHistorial (§4.4) devuelve la trazabilidad coherente
    const hist = await contract.consultarHistorial(HASH_DOC);
    expect(hist.emisor).to.equal(emisor.address);
    expect(hist.estado).to.equal(0);
    expect(hist.fechaRevocacion).to.equal(0);
    expect(hist.motivoRevocacion).to.equal("");
  });

  it("3. Revocación por emisor autorizado: cambia el estado y guarda el motivo", async function () {
    await contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address);

    const MOTIVO = "Error en los datos del titular";
    await expect(contract.connect(emisor).revocarCertificado(HASH_DOC, MOTIVO))
      .to.emit(contract, "LogCertificadoRevocado");

    const cert = await contract.verificarCertificado(HASH_DOC);
    expect(cert.estado).to.equal(2); // Revocado
    expect(cert.motivoRevocacion).to.equal(MOTIVO);

    const hist = await contract.consultarHistorial(HASH_DOC);
    expect(hist.estado).to.equal(2);
    expect(hist.fechaRevocacion).to.be.greaterThan(0);
    expect(hist.motivoRevocacion).to.equal(MOTIVO);
  });

  it("4. Usuario NO autorizado: revierte tanto al emitir como al revocar", async function () {
    // Emitir desde un intruso (no autorizado) debe revertir
    await expect(
      contract.connect(intruso).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address)
    ).to.be.revertedWith("No eres un emisor autorizado (Rector/Director)");

    // Emitimos legítimamente para luego probar la revocación no autorizada
    await contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address);

    await expect(
      contract.connect(intruso).revocarCertificado(HASH_DOC, "intento ilegitimo")
    ).to.be.revertedWith("No eres un emisor autorizado (Rector/Director)");
  });

  it("5. Manipulación del documento: un hash distinto NO se encuentra / no es válido", async function () {
    await contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address);

    // El hash del documento alterado no existe en el ledger
    await expect(
      contract.verificarCertificado(HASH_MANIPULADO)
    ).to.be.revertedWith("Certificado no encontrado en el ledger");

    await expect(
      contract.consultarHistorial(HASH_MANIPULADO)
    ).to.be.revertedWith("Certificado no encontrado en el ledger");
  });
});
