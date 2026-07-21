import fs from "fs"
import path from "path"

export interface PluginManifest {
  serviceId?: string
  name: string
  type?: string
  version: string
  server: string
  client: string
  style: string
  schema: string
}

export interface ThemeManifest {
  themeId?: string
  name: string
  type: string
  version: string
  scheme: string
  cleanScheme: string
}

/**
 * Generate manifest.json for a single plugin
 * Copies from source if exists, otherwise creates new
 */
export function generatePluginManifest(
  pluginName: string,
  distDir: string,
  cwd: string,
  version: string = "1.0.0"
): boolean {
  const sourceManifestPath = path.join(cwd, "plugins", pluginName, "manifest.json")
  const distManifestPath = path.join(distDir, "manifest.json")

  try {
    let manifest: PluginManifest

    // If source manifest exists, copy it (preserves serviceId, etc)
    if (fs.existsSync(sourceManifestPath)) {
      manifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf-8"))
      
      // Ensure required fields are present
      manifest.server = "./server.js"
      manifest.client = "./client.js"
      manifest.style = "./style.css"
      manifest.schema = "./schema.json"
    } else {
      // Create new manifest (for plugins not created via make:plugin)
      manifest = {
        name: pluginName,
        version: version,
        server: "./server.js",
        client: "./client.js",
        style: "./style.css",
        schema: "./schema.json",
      }
    }

    fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error(`   ⚠️  Failed to generate manifest.json:`, error)
    return false
  }
}

export function generateThemeManifest(
  themeName: string,
  distDir: string,
  cwd: string,
  version: string = "1.0.0"
): boolean {
  const sourceManifestPath = path.join(cwd, "themes", themeName, "manifest.json")
  const distManifestPath = path.join(distDir, "manifest.json")

  try {
    let manifest: ThemeManifest

    if (fs.existsSync(sourceManifestPath)) {
      manifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf-8"))
      manifest.type = manifest.type || themeName
      manifest.scheme = "./scheme.json"
      manifest.cleanScheme = "./clean-scheme.json"
    } else {
      manifest = {
        name: themeName,
        type: themeName,
        version,
        scheme: "./scheme.json",
        cleanScheme: "./clean-scheme.json",
      }
    }

    fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error(`   ⚠️  Failed to generate theme manifest.json:`, error)
    return false
  }
}

/**
 * Read version from workspace package.json
 * Falls back to 1.0.0 if not found
 */
export function getWorkspaceVersion(cwd: string): string {
  try {
    const pkgPath = path.join(cwd, "package.json")
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
      return pkg.version || "1.0.0"
    }
  } catch (error) {
    // Ignore errors, use default
  }
  return "1.0.0"
}
