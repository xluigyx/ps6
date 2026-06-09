const { expect } = require("chai");
const { ethers } = require("hardhat");

// §11 — Extensión NFT ERC-721 soulbound. Estos casos NO tocan los 5 originales.
describe("AcademicCertificates · NFT ERC-721 (soulbound, metadatos on-chain)", function () {
  let contract, owner, emisor, estudiante, otro;

  const HASH_DOC = ethers.id("nft-acta-ana-lopez-derecho-2026");
  const CODIGO = "UV-DER-2026-0007";
  const NOMBRE = "Ana Lopez";
  const CARRERA = "Derecho";

  // Decodifica el data:application/json;base64 que devuelve tokenURI
  function decodeTokenURI(uri) {
    const prefijo = "data:application/json;base64,";
    expect(uri.startsWith(prefijo)).to.equal(true);
    const json = Buffer.from(uri.slice(prefijo.length), "base64").toString("utf8");
    return JSON.parse(json);
  }

  beforeEach(async function () {
    [owner, emisor, estudiante, otro] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AcademicCertificates");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    await contract.ordenarEmisor(emisor.address, true);
  });

  it("Al emitir, mintea un NFT cuyo owner es el estudiante", async function () {
    await expect(
      contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address)
    )
      .to.emit(contract, "LogNFTMinteado")
      .withArgs(HASH_DOC, estudiante.address, 1);

    // tokenId 1 enlazado al hash en ambos sentidos
    expect(await contract.tokenPorHash(HASH_DOC)).to.equal(1);
    expect(await contract.hashPorToken(1)).to.equal(HASH_DOC);

    expect(await contract.ownerOf(1)).to.equal(estudiante.address);
    expect(await contract.balanceOf(estudiante.address)).to.equal(1);

    // Metadatos ERC-721 del contrato
    expect(await contract.name()).to.equal("Certificado Academico UNIVALLE");
    expect(await contract.symbol()).to.equal("CERTUV");
  });

  it("tokenURI devuelve JSON válido con los campos correctos", async function () {
    await contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address);

    const meta = decodeTokenURI(await contract.tokenURI(1));
    expect(meta.name).to.contain(NOMBRE);
    expect(meta.attributes).to.be.an("array");

    const attr = Object.fromEntries(meta.attributes.map((a) => [a.trait_type, a.value]));
    expect(attr["Estudiante"]).to.equal(NOMBRE);
    expect(attr["Carrera"]).to.equal(CARRERA);
    expect(attr["Universidad"]).to.contain("UNIVALLE");
    expect(attr["Codigo"]).to.equal(CODIGO);
    expect(attr["Hash"]).to.equal(HASH_DOC); // 0x + 64 hex
    expect(attr["Estado"]).to.equal("Pendiente de Recepcion");
  });

  it("La transferencia REVIERTE (soulbound)", async function () {
    await contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address);

    await expect(
      contract.connect(estudiante).transferFrom(estudiante.address, otro.address, 1)
    ).to.be.revertedWith("Soulbound: el certificado es intransferible");

    // El owner no cambió tras el intento fallido
    expect(await contract.ownerOf(1)).to.equal(estudiante.address);
  });

  it("Tras revocar, el tokenURI refleja el estado 'Revocado' (metadato dinámico)", async function () {
    await contract.connect(emisor).emitirCertificado(HASH_DOC, CODIGO, NOMBRE, CARRERA, estudiante.address);

    let meta = decodeTokenURI(await contract.tokenURI(1));
    let attr = Object.fromEntries(meta.attributes.map((a) => [a.trait_type, a.value]));
    expect(attr["Estado"]).to.equal("Pendiente de Recepcion");

    await contract.connect(emisor).revocarCertificado(HASH_DOC, "Error administrativo");

    meta = decodeTokenURI(await contract.tokenURI(1));
    attr = Object.fromEntries(meta.attributes.map((a) => [a.trait_type, a.value]));
    expect(attr["Estado"]).to.equal("Revocado"); // sin reminteo: el metadato lee el struct actual
  });
});
