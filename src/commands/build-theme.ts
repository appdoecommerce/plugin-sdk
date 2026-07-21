import fs from "fs"
import path from "path"
import { generateSchemasForTheme } from "./generate-schemas.js"
import { generateThemeManifest, getWorkspaceVersion } from "../utils/generate-manifest.js"

export async function buildTheme(themeName: string): Promise<void> {
  const safeName = themeName.trim()
  const cwd = process.cwd()
  const themesDir = path.join(cwd, "themes")

  if (!safeName) {
    console.error("❌ Error: Theme name is required")
    process.exit(1)
  }

  if (!fs.existsSync(themesDir)) {
    console.error("❌ Error: themes/ directory not found")
    console.error("   Create a theme first with 'appecom theme:create <name>'")
    process.exit(1)
  }

  const themeDir = path.join(themesDir, safeName)

  if (!fs.existsSync(themeDir)) {
    console.error(`❌ Error: Theme "${safeName}" not found`)
    process.exit(1)
  }

  const distDir = path.join(cwd, "dist", "themes", safeName)
  fs.mkdirSync(distDir, { recursive: true })

  console.log(`🎨 Building theme "${safeName}"...`)

  const schemaGenerated = await generateSchemasForTheme(safeName, themesDir)

  if (!schemaGenerated) {
    console.error(`❌ Error: Could not generate schemes for ${safeName}`)
    process.exit(1)
  }

  const propsPath = path.join(themeDir, "props.ts")
  const schemePath = path.join(themeDir, "scheme.json")
  const cleanSchemePath = path.join(themeDir, "clean-scheme.json")

  if (fs.existsSync(propsPath)) {
    fs.copyFileSync(propsPath, path.join(distDir, "props.ts"))
  }

  fs.copyFileSync(schemePath, path.join(distDir, "scheme.json"))
  fs.copyFileSync(cleanSchemePath, path.join(distDir, "clean-scheme.json"))

  const version = getWorkspaceVersion(cwd)
  const manifestGenerated = generateThemeManifest(safeName, distDir, cwd, version)

  if (!manifestGenerated) {
    console.error(`❌ Error: Could not generate manifest for ${safeName}`)
    process.exit(1)
  }

  console.log(`✅ Theme built successfully!`)
  console.log(`📦 Output: dist/themes/${safeName}`)
}
