import fs from "fs"
import path from "path"
import { getScheme } from "../api.js"

/**
 * Get current scheme from backend and save locally
 */
export async function getSchemeFromBackend(pluginName: string): Promise<void> {
  const cwd = process.cwd()
  const pluginDir = path.join(cwd, "plugins", pluginName)
  const manifestPath = path.join(pluginDir, "manifest.json")

  if (!fs.existsSync(pluginDir)) {
    console.error(`❌ Error: Plugin "${pluginName}" not found in plugins/`)
    process.exit(1)
  }

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: manifest.json not found for plugin "${pluginName}"`)
    console.error(`   Run 'appecom make:plugin ${pluginName}' first`)
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))

  if (!manifest.serviceId) {
    console.error(`❌ Error: Plugin "${pluginName}" is not registered in backend`)
    console.error(`   manifest.json is missing serviceId`)
    console.error(`   Run 'appecom make:plugin' to create and register a new plugin`)
    process.exit(1)
  }

  console.log(`🌐 Fetching scheme from backend...`)
  console.log(`   Service ID: ${manifest.serviceId}`)

  try {
    const response = await getScheme(manifest.serviceId)
    const scheme = typeof response.scheme === "string" 
      ? JSON.parse(response.scheme) 
      : response.scheme

    // Save to plugins/{name}/schema.json
    const schemaPath = path.join(pluginDir, "schema.json")
    fs.writeFileSync(schemaPath, JSON.stringify(scheme, null, 2))

    console.log(`✅ Schema downloaded successfully!`)
    console.log(`   Saved to: plugins/${pluginName}/schema.json`)

    // Also copy to dist if exists
    const distDir = path.join(cwd, "dist", pluginName)
    if (fs.existsSync(distDir)) {
      const distSchemaPath = path.join(distDir, "schema.json")
      fs.copyFileSync(schemaPath, distSchemaPath)
      console.log(`   Copied to: dist/${pluginName}/schema.json`)
    }

    console.log(`\n💡 Tip: Run 'appecom build ${pluginName}' to rebuild with new schema`)
  } catch (error: any) {
    console.error(`\n❌ Error fetching scheme: ${error.message}`)
    process.exit(1)
  }
}
