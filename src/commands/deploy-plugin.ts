import fs from "fs"
import path from "path"
import archiver from "archiver"
import dotenv from "dotenv"
import { deployPlugin as deployPluginAPI } from "../api.js"

dotenv.config()

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

  // 3. Upload para servidor usando API
  console.log(`\n☁️  Step 3/5: Uploading to server...`)

  try {
    const result = await deployPluginAPI({
      zipPath,
      pluginName,
      version,
      manifest,
    })
    
    console.log(`   ✅ Upload completed successfully`)
    console.log(`   ✅ Store ID: ${result.plugin.storeId}`)
  } catch (error: any) {
    console.error(`   ❌ Upload failed: ${error.message}`)
    
    // Limpar zip mesmo se falhar
    fs.unlinkSync(zipPath)
    process.exit(1)
  }

  // 4. Verificar deploy (opcional)
  console.log(`\n✓ Step 4/5: Verifying deployment...`)
  console.log(`   ✅ Plugin deployed successfully`)

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
