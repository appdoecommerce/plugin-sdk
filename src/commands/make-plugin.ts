import fs from "fs"
import path from "path"
import { buildPlugin } from "./build-plugin.js"
import { createApp } from "../api.js"
import { generateSchemaForPlugin } from "./generate-schemas.js"

export async function makePlugin(name: string, displayName?: string): Promise<void> {
  const safeName = name.trim()

  if (!safeName) {
    console.error("❌ Error: Plugin name is required")
    process.exit(1)
  }

  // Find project root (where plugins/ folder should be)
  const cwd = process.cwd()
  const pluginDir = path.join(cwd, "plugins", safeName)
  const distDir = path.join(cwd, "dist", safeName)

  if (fs.existsSync(pluginDir)) {
    console.error(`❌ Error: Plugin "${safeName}" already exists at plugins/${safeName}`)
    process.exit(1)
  }

  // Use provided display name or capitalize plugin name
  const appName =
    displayName ||
    safeName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

  console.log(`🚀 Creating plugin "${safeName}"...`)
  console.log(`📝 App name: ${appName}\n`)

  try {
    // Step 1: Create plugin files
    console.log(`📁 Creating plugin files...`)
    createPluginFiles(pluginDir, safeName, appName)
    console.log(`✅ Files created\n`)

    // Step 2: Generate schema.json from props.ts
    console.log(`📝 Generating schema from props.ts...`)
    const pluginsDir = path.join(cwd, "plugins")
    const schemaGenerated = await generateSchemaForPlugin(safeName, pluginsDir)
    
    if (!schemaGenerated) {
      throw new Error("Failed to generate schema.json from props.ts")
    }
    console.log(`✅ Schema generated\n`)

    // Step 3: Build plugin
    console.log(`🔨 Building plugin...`)
    await buildPlugin(safeName)
    console.log(`✅ Plugin built\n`)

    // Step 4: Read generated schema
    const schemaPath = path.join(distDir, "schema.json")
    if (!fs.existsSync(schemaPath)) {
      throw new Error("schema.json not found in dist. Build may have failed.")
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"))

    // Step 5: Create app in backend
    console.log(`🌐 Registering app in backend...`)
    const response = await createApp({
      name: appName,
      type: safeName,
      config: schema,
      version: "1.0.0",
    })

    console.log(`✅ App registered successfully!`)
    console.log(`   Service ID: ${response.service.id}\n`)

    // Step 6: Update manifest with serviceId (both source and dist)
    updateManifestWithServiceId(
      pluginDir,
      distDir,
      response.service.id.toString(),
      appName,
      safeName
    )

    console.log(`✅ Plugin created successfully!`)
    console.log(`📁 Location: plugins/${safeName}`)
    console.log(``)
    console.log(`📄 Files created:`)
    console.log(`   • props.ts      - TypeScript interface (schema)`)
    console.log(`   • server.ts     - Server-side render function`)
    console.log(`   • client.ts     - Client-side hydration`)
    console.log(`   • style.scss    - Component styles`)
    console.log(`   • manifest.json - Plugin metadata (with serviceId)`)
    console.log(``)
    console.log(`Next steps:`)
    console.log(`  1. Edit plugins/${safeName}/props.ts to define your props`)
    console.log(`  2. Edit plugins/${safeName}/server.ts to implement SSR`)
    console.log(`  3. Edit plugins/${safeName}/client.ts to add interactivity`)
    console.log(`  4. Edit plugins/${safeName}/style.scss to style your component`)
    console.log(`  5. Run 'appecom build ${safeName}' to compile changes`)
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`)
    console.log(`\n🔄 Rolling back changes...`)

    // Rollback: delete created directories
    if (fs.existsSync(pluginDir)) {
      fs.rmSync(pluginDir, { recursive: true, force: true })
      console.log(`   Deleted: plugins/${safeName}`)
    }

    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true })
      console.log(`   Deleted: dist/${safeName}`)
    }

    console.log(`\n💡 Tip: Make sure your .env file has APPECOM_STOREID and APPECOM_SECRET configured.`)
    console.log(`   Run 'appecom prepare' if you haven't set up your environment yet.`)
    process.exit(1)
  }
}

function createPluginFiles(pluginDir: string, safeName: string, appName: string): void {
  // Create plugin directory
  fs.mkdirSync(pluginDir, { recursive: true })

  // Create props.ts
  const propsContent = `/**
 * Props interface for ${safeName} plugin
 */
export interface Props {
  /**
   * Title of the component
   * 
   * @title Component Title
   * @description The main title displayed in the component
   * @default "Hello World"
   */
  title: string

  /**
   * Enable or disable the component
   * 
   * @title Is Active
   * @description Show or hide the component
   * @default true
   */
  isActive: boolean
}
`

  // Create server.ts
  const serverContent = `import { Props } from "./props"

/**
 * Server-side render function
 * This runs on the backend and returns HTML string
 */
export async function render(props: Props): Promise<string> {
  // You can fetch data from APIs here
  // const data = await fetch('https://api.example.com/data')
  
  if (!props.isActive) {
    return ""
  }

  return \`
    <div class="appecom-${safeName}" data-plugin="${safeName}">
      <div class="${safeName}">
        <h2 class="${safeName}__title">\${props.title}</h2>
        <div class="${safeName}__content">
          <p>This is a placeholder. Edit server.ts to customize the HTML.</p>
        </div>
      </div>
    </div>
  \`
}
`

  // Create client.ts
  const clientContent = `import { Props } from "./props"

/**
 * Client-side hydration function
 * This runs in the browser to add interactivity
 */
export function hydrate(element: HTMLElement, props: Props) {
  console.log('Hydrating ${safeName} with props:', props)

  // Add event listeners and interactivity here
  const title = element.querySelector('.${safeName}__title')
  
  if (title) {
    title.addEventListener('click', () => {
      alert(\`You clicked: \${props.title}\`)
    })
  }

  // Example: Add a dynamic class
  element.classList.add('hydrated')

  // Dispatch custom event after hydration (recommended)
  // This allows external code to listen and interact with the plugin
  const event = new CustomEvent('appecom:plugin:hydrated', {
    detail: { pluginName: '${safeName}', element, props },
    bubbles: true,
    cancelable: false
  })
  element.dispatchEvent(event)
}
`

  // Create style.scss
  const styleContent = `/**
 * CSS Isolation: All styles are automatically prefixed with .appecom-${safeName}
 * This prevents conflicts with other plugins and the host page.
 * 
 * Example: .container becomes .appecom-${safeName} .container
 * 
 * Best Practice: Use BEM naming convention with the plugin name as block
 */

.${safeName} {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;

  &__title {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #007bff;
    }
  }

  &__content {
    color: #666;
    line-height: 1.6;
  }

  &.hydrated {
    border: 2px solid #007bff;
  }
}
`

  // Create manifest.json (initial version without serviceId)
  const manifestContent = {
    name: appName,
    type: safeName,
    version: "1.0.0",
    server: "./server.js",
    client: "./client.js",
    style: "./style.css",
    schema: "./schema.json",
  }

  // Write all files
  fs.writeFileSync(path.join(pluginDir, "props.ts"), propsContent)
  fs.writeFileSync(path.join(pluginDir, "server.ts"), serverContent)
  fs.writeFileSync(path.join(pluginDir, "client.ts"), clientContent)
  fs.writeFileSync(path.join(pluginDir, "style.scss"), styleContent)
  fs.writeFileSync(
    path.join(pluginDir, "manifest.json"),
    JSON.stringify(manifestContent, null, 2)
  )
}

function updateManifestWithServiceId(
  pluginDir: string,
  distDir: string,
  serviceId: string,
  appName: string,
  pluginType: string
): void {
  // Update source manifest (plugins/{name}/manifest.json)
  const sourceManifestPath = path.join(pluginDir, "manifest.json")
  if (fs.existsSync(sourceManifestPath)) {
    const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf-8"))
    sourceManifest.serviceId = serviceId
    sourceManifest.name = appName
    sourceManifest.type = pluginType

    fs.writeFileSync(sourceManifestPath, JSON.stringify(sourceManifest, null, 2))
  }

  // Update dist manifest (dist/{name}/manifest.json)
  const distManifestPath = path.join(distDir, "manifest.json")
  if (!fs.existsSync(distManifestPath)) {
    throw new Error("manifest.json not found in dist after build")
  }

  const distManifest = JSON.parse(fs.readFileSync(distManifestPath, "utf-8"))
  distManifest.serviceId = serviceId
  distManifest.name = appName
  distManifest.type = pluginType

  fs.writeFileSync(distManifestPath, JSON.stringify(distManifest, null, 2))
  console.log(`✅ Manifest updated with service information`)
}
