const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Raíz del proyecto frontend (un nivel arriba de /hardhat)
const ROOT = path.resolve(__dirname, "..", "..");
const ENV_FILE = path.join(ROOT, ".env");
const CONFIG_FILE = path.join(ROOT, "src", "config", "contract.js");

// Persiste la dirección desplegada en el .env (override que lee Vite)
function persistirEnv(address) {
  const linea = `VITE_CONTRACT_ADDRESS=${address}`;
  let contenido = "";
  if (fs.existsSync(ENV_FILE)) {
    contenido = fs.readFileSync(ENV_FILE, "utf8");
    if (/^VITE_CONTRACT_ADDRESS=.*$/m.test(contenido)) {
      contenido = contenido.replace(/^VITE_CONTRACT_ADDRESS=.*$/m, linea);
    } else {
      contenido = contenido.trimEnd() + "\n" + linea + "\n";
    }
  } else {
    contenido =
      "# ─── CertChain UNIVALLE — Entorno local ───────────\n" +
      "# Dirección del contrato AcademicCertificates desplegado en el nodo Hardhat local\n" +
      linea + "\n";
  }
  fs.writeFileSync(ENV_FILE, contenido);
  console.log("Dirección persistida en .env");
}

// Reemplaza el fallback 0x000...0 (o cualquier dirección previa) en contract.js
function persistirConfig(address) {
  if (!fs.existsSync(CONFIG_FILE)) return;
  let contenido = fs.readFileSync(CONFIG_FILE, "utf8");
  contenido = contenido.replace(
    /(import\.meta\.env\.VITE_CONTRACT_ADDRESS \|\| ')0x[a-fA-F0-9]{40}(')/,
    `$1${address}$2`
  );
  fs.writeFileSync(CONFIG_FILE, contenido);
  console.log("Dirección fallback persistida en src/config/contract.js");
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("AcademicCertificates");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("AcademicCertificates desplegado en:", address);

  // Persistir para que el frontend opere contra esta red sin pasos manuales
  persistirEnv(address);
  persistirConfig(address);

  // Marca fácil de parsear para scripts de arranque
  console.log("DEPLOYED_ADDRESS=" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
