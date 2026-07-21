import fs from "fs"
import path from "path"
import * as TJS from "typescript-json-schema"
import ts from "typescript"

type LoaderType = "oauth" | "action" | "form"

type LoaderFieldMeta = {
  loaderType: LoaderType
  loaderName: string
  requiresConfirmation?: boolean
}

function generateRawSchemaFromPropsFile(propsFile: string): Record<string, any> | null {
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
    return schema ? (schema as Record<string, any>) : null
  } catch (error) {
    console.error(`   Failed to generate schema: ${error}`)
    return null
  }
}

function parseBooleanTag(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === "true") return true
  if (normalized === "false") return false
  return undefined
}

function getJsDocTagMap(node: ts.Node): Record<string, string> {
  const tags = ts.getJSDocTags(node)
  const map: Record<string, string> = {}

  for (const tag of tags) {
    const key = tag.tagName.getText()
    const text = tag.comment ? String(tag.comment).trim() : ""
    map[key] = text
  }

  return map
}

function extractLoaderFieldsFromProps(propsFile: string): Record<string, LoaderFieldMeta> {
  const sourceText = fs.readFileSync(propsFile, "utf-8")
  const sourceFile = ts.createSourceFile(propsFile, sourceText, ts.ScriptTarget.Latest, true)
  const loaderFields: Record<string, LoaderFieldMeta> = {}

  for (const statement of sourceFile.statements) {
    if (!ts.isInterfaceDeclaration(statement) || statement.name.text !== "Props") {
      continue
    }

    for (const member of statement.members) {
      if (!ts.isPropertySignature(member) || !member.name) continue

      const propertyName = ts.isIdentifier(member.name)
        ? member.name.text
        : ts.isStringLiteral(member.name)
          ? member.name.text
          : null

      if (!propertyName) continue

      const tags = getJsDocTagMap(member)
      const loaderName = tags.loaderName
      const loaderType = tags.loaderType as LoaderType | undefined

      if (!loaderName || !loaderType) continue
      if (!["oauth", "action", "form"].includes(loaderType)) continue

      loaderFields[propertyName] = {
        loaderType,
        loaderName,
        requiresConfirmation: parseBooleanTag(tags.requiresConfirmation),
      }
    }
  }

  return loaderFields
}

function applyLoaderFieldsToSchema(schema: Record<string, any>, loaderFields: Record<string, LoaderFieldMeta>): void {
  if (!schema.properties || typeof schema.properties !== "object") {
    schema.properties = {}
  }

  const required = Array.isArray(schema.required) ? schema.required : []

  for (const [propertyKey, meta] of Object.entries(loaderFields)) {
    const existing = schema.properties[propertyKey] && typeof schema.properties[propertyKey] === "object"
      ? schema.properties[propertyKey]
      : {}

    schema.properties[propertyKey] = {
      ...existing,
      type: "loader",
      loaderType: meta.loaderType,
      loaderName: meta.loaderName,
      ...(meta.requiresConfirmation !== undefined
        ? { requiresConfirmation: meta.requiresConfirmation }
        : {}),
    }
  }

  schema.required = required.filter((field: string) => !Object.prototype.hasOwnProperty.call(loaderFields, field))
}

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

  try {
    const schema = generateRawSchemaFromPropsFile(propsFile)

    if (!schema) {
      return false
    }

    const loaderFields = extractLoaderFieldsFromProps(propsFile)
    applyLoaderFieldsToSchema(schema, loaderFields)

    const schemaPath = path.join(pluginPath, "schema.json")
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2))
    return true
  } catch (error) {
    console.error(`   Failed to generate schema: ${error}`)
    return false
  }
}

export async function generateSchemasForTheme(
  themeName: string,
  themesDir: string
): Promise<boolean> {
  const themePath = path.join(themesDir, themeName)
  const propsFile = path.join(themePath, "props.ts")
  const cleanSchemePath = path.join(themePath, "clean-scheme.json")

  if (!fs.existsSync(propsFile)) {
    return false
  }

  const rawSchema = generateRawSchemaFromPropsFile(propsFile)

  if (!rawSchema) {
    return false
  }

  const normalizedScheme = JSON.parse(JSON.stringify(rawSchema))

  fs.writeFileSync(path.join(themePath, "scheme.json"), JSON.stringify(normalizedScheme, null, 2))

  // The clean scheme is the theme's default store configuration. It is authored
  // independently from Props and must never be overwritten by schema generation.
  if (!fs.existsSync(cleanSchemePath)) {
    console.error(`   Missing theme clean scheme: ${cleanSchemePath}`)
    return false
  }

  try {
    const cleanScheme = JSON.parse(fs.readFileSync(cleanSchemePath, "utf-8"))

    if (!cleanScheme || typeof cleanScheme !== "object" || Array.isArray(cleanScheme)) {
      console.error("   Theme clean scheme must be a JSON object")
      return false
    }
  } catch (error) {
    console.error(`   Invalid theme clean scheme: ${error}`)
    return false
  }

  return true
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
