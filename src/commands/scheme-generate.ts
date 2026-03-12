import { generateSchemaForPlugin } from "./generate-schemas.js"
import fs from "fs"
import path from "path"

/**
 * Generate JSON schema for a specific plugin
 */
export async function generateScheme(pluginName: string): Promise<void> {
  const cwd = process.cwd()
  const pluginsDir = path.join(cwd, "plugins")
  const pluginPath = path.join(pluginsDir, pluginName)

  if (!fs.existsSync(pluginsDir)) {
    console.error("❌ Error: plugins/ directory not found")
    console.error("   Run 'appecom prepare' first")
    process.exit(1)
  }

  if (!fs.existsSync(pluginPath)) {
    console.error(`❌ Error: Plugin "${pluginName}" not found in plugins/`)
    process.exit(1)
  }

  console.log(`📝 Generating schema for ${pluginName}...`)

  const success = await generateSchemaForPlugin(pluginName, pluginsDir)

  if (!success) {
    console.error(`❌ Error: Could not generate schema for ${pluginName}`)
    console.error(`   Make sure props.ts exists and is valid TypeScript`)
    process.exit(1)
  }

  // Copy to dist if dist folder exists
  const distSchemaPath = path.join(cwd, "dist", pluginName, "schema.json")
  const sourceSchemaPath = path.join(pluginPath, "schema.json")

  if (fs.existsSync(path.join(cwd, "dist", pluginName))) {
    fs.copyFileSync(sourceSchemaPath, distSchemaPath)
    console.log(`✅ Schema generated and copied to dist/${pluginName}/schema.json`)
  } else {
    console.log(`✅ Schema generated at plugins/${pluginName}/schema.json`)
    console.log(`   Run 'appecom build ${pluginName}' to copy to dist/`)
  }
}
