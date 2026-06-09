// Verificación end-to-end contra el contrato YA DESPLEGADO en la red local.
// Reproduce el flujo que ejecuta el frontend: emitir, verificar, consultar
// historial, revocar y leer eventos con queryFilter.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Lee la dirección desplegada desde el .env del frontend (no la hardcodea)
function leerAddress() {
  const envPath = path.resolve(__dirname, "..", "..", ".env");
  const contenido = fs.readFileSync(envPath, "utf8");
  const m = contenido.match(/^VITE_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})/m);
  if (!m) throw new Error("No se encontró VITE_CONTRACT_ADDRESS en .env");
  return m[1];
}

const ADDRESS = leerAddress();

async function main() {
  const [owner, emisor, estudiante] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AcademicCertificates", ADDRESS);

  console.log("Contrato en:", await contract.getAddress());
  console.log("Owner on-chain:", await contract.owner());

  // RF5: autorizar emisor
  await (await contract.ordenarEmisor(emisor.address, true)).wait();
  console.log("Emisor autorizado?:", await contract.emisoresAutorizados(emisor.address));

  // RF2: emitir
  const hash = hre.ethers.id("e2e-doc-" + emisor.address);
  await (await contract.connect(emisor).emitirCertificado(hash, "UV-DER-2026-0001", "Ana Lopez", "Derecho", estudiante.address)).wait();

  // Verificar
  const cert = await contract.verificarCertificado(hash);
  console.log("Verificado ->", cert.nombreEstudiante, "/", cert.carrera, "/ estado:", cert.estado.toString());

  // consultarHistorial (RF4 / tarea 1)
  const h = await contract.consultarHistorial(hash);
  console.log("Historial -> emisor:", h.emisor, "estado:", h.estado.toString(), "revocacion:", h.fechaRevocacion.toString());

  // RF3: revocar
  await (await contract.connect(emisor).revocarCertificado(hash, "Prueba e2e")).wait();
  const h2 = await contract.consultarHistorial(hash);
  console.log("Tras revocar -> estado:", h2.estado.toString(), "motivo:", h2.motivoRevocacion);

  // RF4: lectura de eventos (lo que hace ExplorerHistorial)
  const emitidos = await contract.queryFilter(contract.filters.LogCertificadoEmitido());
  console.log("Eventos LogCertificadoEmitido leidos:", emitidos.length);

  // §11 NFT: token minteado al estudiante + metadatos on-chain (estado dinamico tras revocar)
  const tokenId = await contract.tokenPorHash(hash);
  const nftOwner = await contract.ownerOf(tokenId);
  const uri = await contract.tokenURI(tokenId);
  const meta = JSON.parse(Buffer.from(uri.split("base64,")[1], "base64").toString("utf8"));
  const estadoMeta = meta.attributes.find((a) => a.trait_type === "Estado").value;
  console.log("NFT -> tokenId:", tokenId.toString(), "owner==estudiante?:", nftOwner === estudiante.address, "estado metadatos:", estadoMeta);

  console.log("\nE2E_OK");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
