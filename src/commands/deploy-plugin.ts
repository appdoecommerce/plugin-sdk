import fs from "fs"
import path from "path"
import FormData from "form-data"
import archiver from "archiver"
import fetch from "node-fetch"
import dotenv from "dotenv"

dotenv.config()

const PLUGIN_SERVER_URL = process.env.PLUGIN_SERVER_URL || "http://localhost:4000"

export async function deployPlugin(pluginName: string): Promise<void> {
  const cwd = process.cwd()
  const distDir = path.join(cwd, "dist", pluginName)
  const tmpDir = path.join(cwd, ".tmp")

  // Validar se plugin existe
  if (!fs.existsSync(distDir)) {
    console.error(`❌ Error: Plugin "${pluginName}" not found in dist/`)
    console.error(`   Run 'appecom build ${pluginName}' first`)
    process.exit(1)
  }

  console.log(`\n🚀 Deploying plugin: ${pluginName}\n`)

  // 1. Ler manifest para pegar versão
  console.log(`📋 Step 1/5: Reading manifest...`)
  const manifestPath = path.join(distDir, "manifest.json")
  
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: manifest.json not found in dist/${pluginName}`)
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  const version = manifest.version || "1.0.0"
  const pluginFullName = `${pluginName}@${version}`

  console.log(`   ✅ Plugin: ${manifest.name || pluginName}`)
  console.log(`   ✅ Version: ${version}`)
  console.log(`   ✅ Type: ${manifest.type || pluginName}`)

  // 2. Criar zip
  console.log(`\n📦 Step 2/5: Creating deployment package...`)
  
  fs.mkdirSync(tmpDir, { recursive: true })
  const zipPath = path.join(tmpDir, `${pluginName}-${version}.zip`)

  await createZipFile(distDir, zipPath)
  
  const stats = fs.statSync(zipPath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  console.log(`   ✅ Package created: ${sizeMB} MB`)

  // 3. Upload para servidor
  console.log(`\n☁️  Step 3/5: Uploading to server...`)
  console.log(`   📡 Server: ${PLUGIN_SERVER_URL}`)

  try {
    await uploadPlugin(zipPath, pluginName, version, manifest)
    console.log(`   ✅ Upload completed successfully`)
  } catch (error: any) {
    console.error(`   ❌ Upload failed: ${error.message}`)
    
    // Limpar zip mesmo se falhar
    fs.unlinkSync(zipPath)
    process.exit(1)
  }

  // 4. Verificar deploy
  console.log(`\n✓ Step 4/5: Verifying deployment...`)
  
  try {
    const verifyResponse = await fetch(`${PLUGIN_SERVER_URL}/api/plugins/${pluginName}/versions`)
    if (verifyResponse.ok) {
      const data = await verifyResponse.json() as any
      console.log(`   ✅ Available versions: ${data.versions.join(", ")}`)
      console.log(`   ✅ Latest version: ${data.latest}`)
    }
  } catch (error) {
    console.log(`   ⚠️  Could not verify (server might not support versioning)`)
  }

  // 5. Limpar arquivos temporários
  console.log(`\n🧹 Step 5/5: Cleaning up...`)
  fs.unlinkSync(zipPath)
  console.log(`   ✅ Temporary files removed`)

  // Sucesso!
  console.log(`\n✅ Deployment successful!`)
  console.log(`\n📦 Deployed: ${pluginFullName}`)
  console.log(``)
}

/**
 * Cria arquivo zip do plugin
 */
async function createZipFile(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    output.on("close", () => {
      resolve()
    })

    archive.on("error", (err) => {
      reject(err)
    })

    archive.pipe(output)

    // Adicionar todos os arquivos do plugin
    archive.directory(sourceDir, false)

    archive.finalize()
  })
}

/**
 * Faz upload do plugin para o servidor
 */
async function uploadPlugin(
  zipPath: string,
  pluginName: string,
  version: string,
  manifest: any
): Promise<void> {
  const form = new FormData()
  
  form.append("plugin", fs.createReadStream(zipPath))
  form.append("name", pluginName)
  form.append("version", version)
  form.append("manifest", JSON.stringify(manifest))

  const response = await fetch(`${PLUGIN_SERVER_URL}/api/plugins/deploy`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json() as any
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  const result = await response.json() as any
  
  if (!result.success) {
    throw new Error(result.message || "Deploy failed")
  }
}
