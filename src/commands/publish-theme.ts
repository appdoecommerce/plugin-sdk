import fs from "fs"
import path from "path"
import {
  createTheme as createThemeInBackend,
  updateThemeSchemeVersion,
} from "../api.js"
import { buildTheme } from "./build-theme.js"

type ThemeManifest = {
  themeId?: string
  name: string
  type: string
  version: string
  scheme: string
  cleanScheme: string
}

function updateManifestWithThemeId(themeDir: string, distDir: string, themeId: string) {
  const manifestPaths = [
    path.join(themeDir, "manifest.json"),
    path.join(distDir, "manifest.json"),
  ]

  for (const manifestPath of manifestPaths) {
    if (!fs.existsSync(manifestPath)) continue

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as ThemeManifest
    manifest.themeId = themeId
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")
  }
}

export async function publishTheme(themeName: string): Promise<void> {
  const safeName = themeName.trim()
  const cwd = process.cwd()
  const themeDir = path.join(cwd, "themes", safeName)
  const distDir = path.join(cwd, "dist", "themes", safeName)

  if (!safeName) {
    console.error("❌ Error: Theme name is required")
    process.exit(1)
  }

  if (!fs.existsSync(themeDir)) {
    console.error(`❌ Error: Theme "${safeName}" not found in themes/`)
    process.exit(1)
  }

  await buildTheme(safeName)

  const manifestPath = path.join(distDir, "manifest.json")
  const schemePath = path.join(distDir, "scheme.json")
  const cleanSchemePath = path.join(distDir, "clean-scheme.json")

  if (!fs.existsSync(manifestPath) || !fs.existsSync(schemePath) || !fs.existsSync(cleanSchemePath)) {
    console.error("❌ Error: Theme build output is incomplete")
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as ThemeManifest
  const scheme = JSON.parse(fs.readFileSync(schemePath, "utf-8"))
  const cleanScheme = JSON.parse(fs.readFileSync(cleanSchemePath, "utf-8"))

  if (!manifest.name || !manifest.type || !manifest.version) {
    console.error("❌ Error: manifest.json must include name, type, and version")
    process.exit(1)
  }

  console.log(`🌐 Publishing theme to dashboard...`)
  console.log(`   Theme: ${manifest.name}`)
  console.log(`   Type: ${manifest.type}`)
  console.log(`   Version: ${manifest.version}`)

  try {
    const createResponse = await createThemeInBackend({
      name: manifest.name,
      type: manifest.type,
    })

    await updateThemeSchemeVersion(createResponse.theme.id, manifest.version, {
      manifest,
      scheme,
      cleanScheme,
    })

    updateManifestWithThemeId(themeDir, distDir, String(createResponse.theme.id))

    console.log(`✅ Theme published successfully!`)
    console.log(`   Theme ID: ${createResponse.theme.id}`)
    console.log(`   Latest version: ${manifest.version}`)
  } catch (error: any) {
    console.error(`❌ Error publishing theme: ${error.message}`)
    process.exit(1)
  }
}
