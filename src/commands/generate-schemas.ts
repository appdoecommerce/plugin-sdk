import fs from "fs"
import path from "path"
import * as TJS from "typescript-json-schema"

export async function generateSchemas(pluginName?: string): Promise<void> {
  const cwd = process.cwd()
  const pluginsDir = path.join(cwd, "plugins")

  if (!fs.existsSync(pluginsDir)) {
    console.error("❌ Error: plugins/ directory not found")
    console.log("Make sure you're running this command from the project root")
    process.exit(1)
  }

  const settings: TJS.PartialArgs = {
    required: true,
    noExtraProps: true,
  }

  const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
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
    plugins = fs.readdirSync(pluginsDir)
  }

  let generatedCount = 0

  for (const plugin of plugins) {
    const pluginPath = path.join(pluginsDir, plugin)
    const propsFile = path.join(pluginPath, "props.ts")

    if (!fs.existsSync(propsFile)) {
      if (pluginName) {
        console.error(`❌ Error: props.ts not found in plugins/${plugin}/`)
        process.exit(1)
      }
      continue
    }

    console.log(`📝 Generating schema: ${plugin}`)

    const program = TJS.getProgramFromFiles([propsFile], compilerOptions)
    const schema = TJS.generateSchema(program, "Props", settings)

    if (!schema) {
      console.log(`⚠️  Warning: Could not generate schema for ${plugin}`)
      continue
    }

    const schemaPath = path.join(pluginPath, "schema.json")
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2))
    generatedCount++
  }

  console.log(`✅ Generated ${generatedCount} schema(s) successfully!`)
}
