import fs from "fs"
import path from "path"
import { buildTheme } from "./build-theme.js"

export async function createTheme(name: string, displayName?: string): Promise<void> {
  const safeName = name.trim()

  if (!safeName) {
    console.error("❌ Error: Theme name is required")
    process.exit(1)
  }

  const cwd = process.cwd()
  const themeDir = path.join(cwd, "themes", safeName)

  if (fs.existsSync(themeDir)) {
    console.error(`❌ Error: Theme "${safeName}" already exists at themes/${safeName}`)
    process.exit(1)
  }

  const themeDisplayName =
    displayName ||
    safeName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

  console.log(`🎨 Creating theme "${safeName}"...`)

  fs.mkdirSync(themeDir, { recursive: true })

  const propsContent = `export interface Props {
  settings: {
    theme: {
      layoutStyle: "boxed" | "full-width"
      primaryColor: string
      secondaryColor: string
      backgroundColor: string
      textColor: string
    }
  }

  globals: Record<string, unknown>
  pages: Record<string, unknown>
}
`

  const manifestContent = {
    name: themeDisplayName,
    type: safeName,
    version: "1.0.0",
    scheme: "./scheme.json",
    cleanScheme: "./clean-scheme.json",
  }

  fs.writeFileSync(path.join(themeDir, "props.ts"), propsContent)
  fs.writeFileSync(
    path.join(themeDir, "clean-scheme.json"),
    JSON.stringify(
      {
        settings: {},
        globals: {},
        pages: {},
      },
      null,
      2
    )
  )
  fs.writeFileSync(
    path.join(themeDir, "manifest.json"),
    JSON.stringify(manifestContent, null, 2)
  )

  await buildTheme(safeName)

  console.log(`✅ Theme created successfully!`)
  console.log(`📁 Location: themes/${safeName}`)
  console.log(`   • props.ts          - Source of truth for the theme schema`)
  console.log(`   • manifest.json     - Theme metadata`)
  console.log(`   • scheme.json       - Generated panel scheme`)
  console.log(`   • clean-scheme.json - Default clean configuration sent to the store API`)
}
