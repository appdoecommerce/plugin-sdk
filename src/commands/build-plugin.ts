import fs from "fs"
import path from "path"
import { build } from "esbuild"
import { compile } from "sass"
import { generateSchemaForPlugin } from "./generate-schemas.js"
import { generatePluginRegistry } from "./generate-registry.js"
import { processCssIsolation } from "../utils/css-isolation.js"
import { generatePluginManifest, getWorkspaceVersion } from "../utils/generate-manifest.js"

export async function buildPlugin(pluginName?: string): Promise<void> {
  const cwd = process.cwd()
  const pluginsDir = path.join(cwd, "plugins")

  if (!fs.existsSync(pluginsDir)) {
    console.error("❌ Error: plugins/ directory not found")
    console.error("   Run 'appecom prepare' first")
    process.exit(1)
  }

  // Get list of plugins to build
  let pluginsToBuild: string[] = []

  if (pluginName) {
    const pluginDir = path.join(pluginsDir, pluginName)
    if (!fs.existsSync(pluginDir)) {
      console.error(`❌ Error: Plugin "${pluginName}" not found`)
      process.exit(1)
    }
    pluginsToBuild = [pluginName]
  } else {
    // Build all plugins
    pluginsToBuild = fs
      .readdirSync(pluginsDir)
      .filter((name) => {
        const stat = fs.statSync(path.join(pluginsDir, name))
        return stat.isDirectory()
      })
  }

  if (pluginsToBuild.length === 0) {
    console.error("❌ Error: No plugins found to build")
    process.exit(1)
  }

  console.log(`🔨 Building ${pluginsToBuild.length} plugin(s)...\n`)

  for (const plugin of pluginsToBuild) {
    await buildSinglePlugin(plugin, pluginsDir, cwd)
  }

  // Generate plugins registry
  console.log(`\n📝 Generating plugins registry...`)
  const registryGenerated = generatePluginRegistry(cwd)
  
  if (registryGenerated) {
    console.log(`✅ Registry generated: dist/plugins-registry.json`)
  }

  console.log(`\n✅ Build complete!`)
  console.log(`📦 Output: dist/`)
}

async function buildSinglePlugin(
  pluginName: string,
  pluginsDir: string,
  cwd: string
): Promise<void> {
  console.log(`📦 Building ${pluginName}...`)

  const pluginDir = path.join(pluginsDir, pluginName)
  const distDir = path.join(cwd, "dist", pluginName)

  // Create dist directory
  fs.mkdirSync(distDir, { recursive: true })

  const serverPath = path.join(pluginDir, "server.ts")
  const clientPath = path.join(pluginDir, "client.ts")
  const stylePath = path.join(pluginDir, "style.scss")

  let builtFiles: string[] = []

  // Build server.ts (ESM for Node.js)
  if (fs.existsSync(serverPath)) {
    try {
      await build({
        entryPoints: [serverPath],
        bundle: true,
        outfile: path.join(distDir, "server.js"),
        platform: "node",
        format: "esm",
        target: "node18",
        external: ["node:*"],
        minify: false,
      })
      builtFiles.push("server.js")
    } catch (error) {
      console.error(`   ❌ Failed to build server.ts:`, error)
      throw error
    }
  }

  // Build client.ts (ESM for Browser)
  if (fs.existsSync(clientPath)) {
    try {
      await build({
        entryPoints: [clientPath],
        bundle: true,
        outfile: path.join(distDir, "client.js"),
        platform: "browser",
        format: "esm",
        target: "es2020",
        minify: false,
      })
      builtFiles.push("client.js")
    } catch (error) {
      console.error(`   ❌ Failed to build client.ts:`, error)
      throw error
    }
  }

  // Compile style.scss with CSS isolation
  if (fs.existsSync(stylePath)) {
    try {
      // Compile Sass to CSS
      const sassResult = compile(stylePath, {
        style: "compressed",
        loadPaths: [pluginDir],
      })

      // Process CSS with namespace prefix for isolation
      const isolatedCss = await processCssIsolation(
        sassResult.css.toString(),
        pluginName
      )

      fs.writeFileSync(path.join(distDir, "style.css"), isolatedCss)
      builtFiles.push("style.css")
    } catch (error) {
      console.error(`   ❌ Failed to compile style.scss:`, error)
      throw error
    }
  }

  // Copy props.ts for reference
  const propsPath = path.join(pluginDir, "props.ts")
  if (fs.existsSync(propsPath)) {
    fs.copyFileSync(propsPath, path.join(distDir, "props.ts"))
    builtFiles.push("props.ts")
  }

  // Copy schema.json (don't regenerate - preserve dashboard changes)
  const schemaSourcePath = path.join(pluginDir, "schema.json")
  if (fs.existsSync(schemaSourcePath)) {
    const schemaDestPath = path.join(distDir, "schema.json")
    fs.copyFileSync(schemaSourcePath, schemaDestPath)
    builtFiles.push("schema.json")
  }

  // Generate manifest.json (makes plugin self-contained)
  const version = getWorkspaceVersion(cwd)
  const manifestGenerated = generatePluginManifest(pluginName, distDir, cwd, version)
  if (manifestGenerated) {
    builtFiles.push("manifest.json")
  }

  console.log(`   ✅ Built: ${builtFiles.join(", ")}`)
}
