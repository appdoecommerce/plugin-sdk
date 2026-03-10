import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

export async function makePlugin(name: string): Promise<void> {
  const safeName = name.trim()

  if (!safeName) {
    console.error("❌ Error: Plugin name is required")
    process.exit(1)
  }

  // Find project root (where plugins/ folder should be)
  const cwd = process.cwd()
  const pluginDir = path.join(cwd, "plugins", safeName)

  if (fs.existsSync(pluginDir)) {
    console.error(`❌ Error: Plugin "${safeName}" already exists at plugins/${safeName}`)
    process.exit(1)
  }

  // Create plugin directory
  fs.mkdirSync(pluginDir, { recursive: true })

  // Create index.ts
  const indexContent = `import { Props } from "./props"

export default function ${safeName.replace(/-/g, "_")}Plugin(props: Props) {
  return {
    ...props,
  }
}
`

  // Create props.ts
  const propsContent = `/**
 * Props interface for ${safeName} plugin
 */
export interface Props {
  /**
   * Example property
   * 
   * @title Example Size
   * @description The size of the component
   * @minimum 0
   * @TJS-type integer
   */
  size: number
}
`

  fs.writeFileSync(path.join(pluginDir, "index.ts"), indexContent)
  fs.writeFileSync(path.join(pluginDir, "props.ts"), propsContent)

  console.log(`✅ Plugin created successfully!`)
  console.log(`📁 Location: plugins/${safeName}`)
  console.log(``)
  console.log(`Next steps:`)
  console.log(`  1. Edit plugins/${safeName}/props.ts to define your plugin props`)
  console.log(`  2. Edit plugins/${safeName}/index.ts to implement your plugin logic`)
  console.log(`  3. Run 'appecom schema' to generate the JSON schema`)
}
