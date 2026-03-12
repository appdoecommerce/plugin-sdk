import fs from "fs"
import path from "path"
import { deleteApp } from "../api.js"

/**
 * Delete plugin from backend and local filesystem
 */
export async function deletePlugin(pluginName: string): Promise<void> {
  const cwd = process.cwd()
  const pluginDir = path.join(cwd, "plugins", pluginName)
  const distDir = path.join(cwd, "dist", pluginName)
  const manifestPath = path.join(pluginDir, "manifest.json")

  // Check if plugin exists
  if (!fs.existsSync(pluginDir)) {
    console.error(`❌ Error: Plugin "${pluginName}" not found in plugins/`)
    process.exit(1)
  }

  // Check if manifest exists
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: manifest.json not found for plugin "${pluginName}"`)
    console.error(`   Cannot delete from backend without serviceId`)
    console.error(`   To delete only local files, manually remove the folder`)
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))

  if (!manifest.serviceId) {
    console.error(`❌ Error: Plugin "${pluginName}" has no serviceId in manifest.json`)
    console.error(`   This plugin may not be registered in the backend`)
    console.error(`   To delete only local files, manually remove the folder`)
    process.exit(1)
  }

  console.log(`🗑️  Deleting plugin "${pluginName}"...`)
  console.log(`   Service ID: ${manifest.serviceId}`)
  console.log(`   Name: ${manifest.name}`)
  console.log(``)

  try {
    // Step 1: Delete from backend
    console.log(`🌐 Deleting from backend...`)
    await deleteApp(manifest.serviceId)
    console.log(`✅ Deleted from backend\n`)

    // Step 2: Delete local source folder
    if (fs.existsSync(pluginDir)) {
      console.log(`🗑️  Deleting plugins/${pluginName}/...`)
      fs.rmSync(pluginDir, { recursive: true, force: true })
      console.log(`✅ Deleted source folder\n`)
    }

    // Step 3: Delete dist folder
    if (fs.existsSync(distDir)) {
      console.log(`🗑️  Deleting dist/${pluginName}/...`)
      fs.rmSync(distDir, { recursive: true, force: true })
      console.log(`✅ Deleted build folder\n`)
    }

    console.log(`✅ Plugin "${pluginName}" deleted successfully!`)
    console.log(`   Removed from backend and local filesystem`)
  } catch (error: any) {
    console.error(`\n❌ Error deleting from backend: ${error.message}`)
    console.log(`\n⚠️  Backend deletion failed. Local files were NOT deleted.`)
    console.log(`   Fix the issue and try again, or delete manually.`)
    process.exit(1)
  }
}
