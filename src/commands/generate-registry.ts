import fs from "fs"
import path from "path"

export interface PluginRegistryEntry {
  server: string
  client: string
  style: string
  schema: string
}

export type PluginRegistry = Record<string, PluginRegistryEntry>

/**
 * Generate the plugin registry file
 * Scans dist/ directory and creates a JSON map of all plugins
 */
export function generatePluginRegistry(cwd: string = process.cwd()): boolean {
  const distDir = path.join(cwd, "dist")

  if (!fs.existsSync(distDir)) {
    console.error("   ⚠️  dist/ directory not found, skipping registry")
    return false
  }

  const registry: PluginRegistry = {}

  // Get all plugin directories in dist/
  const plugins = fs
    .readdirSync(distDir)
    .filter((name) => {
      const pluginPath = path.join(distDir, name)
      const stat = fs.statSync(pluginPath)
      return stat.isDirectory()
    })

  if (plugins.length === 0) {
    console.error("   ⚠️  No plugins found in dist/")
    return false
  }

  // Build registry for each plugin
  for (const pluginName of plugins) {
    const pluginDir = path.join(distDir, pluginName)

    const serverPath = `/dist/${pluginName}/server.js`
    const clientPath = `/dist/${pluginName}/client.js`
    const stylePath = `/dist/${pluginName}/style.css`
    const schemaPath = `/dist/${pluginName}/schema.json`

    // Check if files exist
    const serverExists = fs.existsSync(path.join(cwd, "dist", pluginName, "server.js"))
    const clientExists = fs.existsSync(path.join(cwd, "dist", pluginName, "client.js"))
    const styleExists = fs.existsSync(path.join(cwd, "dist", pluginName, "style.css"))
    const schemaExists = fs.existsSync(path.join(cwd, "dist", pluginName, "schema.json"))

    // Only add to registry if at least server or client exists
    if (serverExists || clientExists) {
      registry[pluginName] = {
        server: serverPath,
        client: clientPath,
        style: stylePath,
        schema: schemaPath,
      }
    }
  }

  // Write registry file
  const registryPath = path.join(distDir, "plugins-registry.json")
  fs.writeFileSync(
    registryPath,
    JSON.stringify(registry, null, 2),
    "utf-8"
  )

  return true
}
