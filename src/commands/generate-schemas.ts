import fs from "fs"
import path from "path"
import * as TJS from "typescript-json-schema"

// Helper function to generate schema for a single plugin
export async function generateSchemaForPlugin(
  pluginName: string,
  pluginsDir: string
): Promise<boolean> {
  const pluginPath = path.join(pluginsDir, pluginName)
  const propsFile = path.join(pluginPath, "props.ts")

  if (!fs.existsSync(propsFile)) {
    return false
  }

  const settings: TJS.PartialArgs = {
    required: true,
    noExtraProps: true,
  }

  const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
  }

  try {
    const program = TJS.getProgramFromFiles([propsFile], compilerOptions)
    const schema = TJS.generateSchema(program, "Props", settings)

    if (!schema) {
      return false
    }

    const schemaPath = path.join(pluginPath, "schema.json")
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2))
    return true
  } catch (error) {
    console.error(`   Failed to generate schema: ${error}`)
    return false
  }
}

export async function generateSchemas(pluginName?: string): Promise<void> {
  const cwd = process.cwd()
  const pluginsDir = path.join(cwd, "plugins")

  if (!fs.existsSync(pluginsDir)) {
    console.error("❌ Error: plugins/ directory not found")
    console.log("Make sure you're running this command from the project root")
    process.exit(1)
  }

  let plugins: string[]

  // Se um plugin específico foi fornecido, usar apenas ele
  if (pluginName) {
    const pluginPath = path.join(pluginsDir, pluginName)
    
    if (!fs.existsSync(pluginPath)) {
      console.error(`❌ Error: Plugin "${pluginName}" not found in plugins/`)
      process.exit(1)
    }

    plugins = [pluginName]
  } else {
    // Caso contrário, pegar todos os plugins
    plugins = fs.readdirSync(pluginsDir).filter((name) => {
      const stat = fs.statSync(path.join(pluginsDir, name))
      return stat.isDirectory()
    })
  }

  let generatedCount = 0

  for (const plugin of plugins) {
    console.log(`📝 Generating schema: ${plugin}`)

    const success = await generateSchemaForPlugin(plugin, pluginsDir)

    if (!success) {
      if (pluginName) {
        console.error(`❌ Error: Could not generate schema for ${plugin}`)
        process.exit(1)
      }
      console.log(`⚠️  Warning: Could not generate schema for ${plugin}`)
      continue
    }

    generatedCount++
  }

  console.log(`✅ Generated ${generatedCount} schema(s) successfully!`)
}
