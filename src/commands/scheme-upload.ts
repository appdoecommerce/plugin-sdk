import fs from "fs"
import path from "path"
import { updateScheme } from "../api.js"

/**
 * Upload local scheme to backend
 */
export async function uploadSchemeToBackend(pluginName: string): Promise<void> {
  const cwd = process.cwd()
  const pluginDir = path.join(cwd, "plugins", pluginName)
  const manifestPath = path.join(pluginDir, "manifest.json")
  const schemaPath = path.join(pluginDir, "schema.json")

  if (!fs.existsSync(pluginDir)) {
    console.error(`❌ Error: Plugin "${pluginName}" not found in plugins/`)
    process.exit(1)
  }

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: manifest.json not found for plugin "${pluginName}"`)
    console.error(`   Run 'appecom make:plugin ${pluginName}' first`)
    process.exit(1)
  }

  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Error: schema.json not found for plugin "${pluginName}"`)
    console.error(`   Run 'appecom scheme:generate ${pluginName}' first`)
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))

  if (!manifest.serviceId) {
    console.error(`❌ Error: Plugin "${pluginName}" is not registered in backend`)
    console.error(`   manifest.json is missing serviceId`)
    console.error(`   Run 'appecom make:plugin' to create and register a new plugin`)
    process.exit(1)
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"))
  const config = mergeManifestRuntimeMetadata(schema, manifest)

  console.log(`🌐 Uploading scheme to backend...`)
  console.log(`   Service ID: ${manifest.serviceId}`)

  try {
    await updateScheme(manifest.serviceId, config)

    console.log(`✅ Schema uploaded successfully!`)
    console.log(`   Plugin: ${pluginName}`)
    console.log(`   Service ID: ${manifest.serviceId}`)
    console.log(`\n💡 Schema is now updated in the backend panel`)
  } catch (error: any) {
    console.error(`\n❌ Error uploading scheme: ${error.message}`)
    process.exit(1)
  }
}

function mergeManifestRuntimeMetadata(
  schema: Record<string, any>,
  manifest: Record<string, any>
): Record<string, any> {
  const config = { ...schema }

  if (
    manifest.platformPlacements &&
    typeof manifest.platformPlacements === "object" &&
    !Array.isArray(manifest.platformPlacements)
  ) {
    config.platformPlacements = manifest.platformPlacements
  }

  return config
}
