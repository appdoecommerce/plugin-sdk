import fs from "fs"
import path from "path"
import chokidar from "chokidar"
import { buildPlugin } from "./build-plugin.js"
import { generateSchemaForPlugin } from "./generate-schemas.js"
import { generatePluginRegistry } from "./generate-registry.js"

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Get timestamp for logs
function timestamp(): string {
  const now = new Date()
  return `[${now.toLocaleTimeString()}]`
}

// Scaffold a new plugin
async function scaffoldPlugin(pluginName: string, pluginDir: string): Promise<void> {
  console.log(`${timestamp()} ✨ Scaffolding ${pluginName}...`)

  const propsContent = `/**
 * Props interface for ${pluginName} plugin
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

  const serverContent = `import { Props } from "./props"

/**
 * Server-side render function
 * This runs on the backend and returns HTML string
 */
export async function render(props: Props): Promise<string> {
  if (!props.isActive) {
    return ""
  }

  return \`
    <div class="appecom-${pluginName}" data-plugin="${pluginName}">
      <div class="${pluginName}">
        <h2 class="${pluginName}__title">\${props.title}</h2>
        <div class="${pluginName}__content">
          <p>This is a placeholder. Edit server.ts to customize the HTML.</p>
        </div>
      </div>
    </div>
  \`
}
`

  const clientContent = `import { Props } from "./props"

/**
 * Client-side hydration function
 * This runs in the browser to add interactivity
 */
export function hydrate(element: HTMLElement, props: Props) {
  console.log('Hydrating ${pluginName} with props:', props)

  const title = element.querySelector('.${pluginName}__title')
  
  if (title) {
    title.addEventListener('click', () => {
      alert(\`You clicked: \${props.title}\`)
    })
  }

  element.classList.add('hydrated')
}
`

  const styleContent = `/**
 * CSS Isolation: All styles are automatically prefixed with .appecom-${pluginName}
 * This prevents conflicts with other plugins and the host page.
 * 
 * Example: .container becomes .appecom-${pluginName} .container
 * 
 * Best Practice: Use BEM naming convention with the plugin name as block
 */

.${pluginName} {
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

  fs.writeFileSync(path.join(pluginDir, "props.ts"), propsContent)
  fs.writeFileSync(path.join(pluginDir, "server.ts"), serverContent)
  fs.writeFileSync(path.join(pluginDir, "client.ts"), clientContent)
  fs.writeFileSync(path.join(pluginDir, "style.scss"), styleContent)

  console.log(`${timestamp()} ✅ Created 4 files in ${pluginName}`)
}

// Check if plugin has all required files
function hasAllRequiredFiles(pluginDir: string): boolean {
  const required = ["props.ts", "server.ts", "client.ts", "style.scss"]
  return required.every((file) => fs.existsSync(path.join(pluginDir, file)))
}

// Get plugin name from file path
function getPluginNameFromPath(filePath: string, pluginsDir: string): string | null {
  const relative = path.relative(pluginsDir, filePath)
  const parts = relative.split(path.sep)
  return parts[0] || null
}

export async function watchPlugins(): Promise<void> {
  const cwd = process.cwd()
  const pluginsDir = path.join(cwd, "plugins")

  if (!fs.existsSync(pluginsDir)) {
    console.error("❌ Error: plugins/ directory not found")
    console.error("   Run 'appecom prepare' first")
    process.exit(1)
  }

  console.log(`👀 Watching plugins/...\n`)

  // Initial build of all plugins
  console.log(`${timestamp()} 🔨 Building all existing plugins...`)
  try {
    await buildPlugin()
    console.log(`${timestamp()} ✅ Initial build complete\n`)
  } catch (error) {
    console.error(`${timestamp()} ❌ Initial build failed:`, error)
  }

  // Track pending builds per plugin
  const pendingBuilds = new Map<string, NodeJS.Timeout>()

  // Debounced build function
  const debouncedBuild = (pluginName: string) => {
    // Cancel existing timeout for this plugin
    if (pendingBuilds.has(pluginName)) {
      clearTimeout(pendingBuilds.get(pluginName)!)
    }

    // Schedule new build
    const timeout = setTimeout(async () => {
      const pluginDir = path.join(pluginsDir, pluginName)

      if (!hasAllRequiredFiles(pluginDir)) {
        console.log(
          `${timestamp()} ⏭️  Skipping ${pluginName} (missing required files)`
        )
        return
      }

      console.log(`${timestamp()} 🔨 Building ${pluginName}...`)
      try {
        await buildPlugin(pluginName)
        
        // Regenerate registry after each build
        generatePluginRegistry(cwd)
        
        console.log(`${timestamp()} ✅ Built ${pluginName} successfully`)
      } catch (error: any) {
        console.error(`${timestamp()} ❌ Build failed for ${pluginName}:`)
        console.error(`   ${error.message}`)
      }

      pendingBuilds.delete(pluginName)
    }, 500) // 500ms debounce (increased to avoid multiple builds)

    pendingBuilds.set(pluginName, timeout)
  }

  // Generate schema when props.ts changes
  const handlePropsChange = async (pluginName: string) => {
    console.log(`${timestamp()} 📋 Generating schema for ${pluginName}...`)
    const schemaGenerated = await generateSchemaForPlugin(pluginName, pluginsDir)
    
    if (schemaGenerated) {
      console.log(`${timestamp()} ✅ Schema generated`)
    } else {
      console.log(`${timestamp()} ⚠️  Schema generation failed`)
    }
  }

  // Watch for new directories
  const watcher = chokidar.watch(pluginsDir, {
    ignored: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/*.log",
      "**/.DS_Store",
      "**/schema.json", // Ignore generated schema files
    ],
    persistent: true,
    ignoreInitial: false,
    depth: 2,
  })

  // Track created directories
  const createdDirs = new Set<string>()

  watcher
    .on("addDir", async (dirPath) => {
      // Skip the plugins directory itself
      if (dirPath === pluginsDir) return

      const pluginName = path.basename(dirPath)
      const parentDir = path.dirname(dirPath)

      // Only handle direct children of plugins/
      if (parentDir !== pluginsDir) return

      // Skip if already processed
      if (createdDirs.has(pluginName)) return
      createdDirs.add(pluginName)

      // Wait a bit to see if files are being copied
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Check if directory is empty
      const files = fs.readdirSync(dirPath)
      const hasFiles = files.length > 0

      if (!hasFiles) {
        console.log(`${timestamp()} 📁 New empty folder detected: ${pluginName}`)
        await scaffoldPlugin(pluginName, dirPath)
        debouncedBuild(pluginName)
      } else if (!hasAllRequiredFiles(dirPath)) {
        console.log(
          `${timestamp()} 📁 New folder detected: ${pluginName} (incomplete)`
        )
      } else {
        console.log(`${timestamp()} 📁 New folder detected: ${pluginName}`)
        debouncedBuild(pluginName)
      }
    })
    .on("add", (filePath) => {
      const pluginName = getPluginNameFromPath(filePath, pluginsDir)
      if (!pluginName) return

      const fileName = path.basename(filePath)
      const ext = path.extname(filePath)

      // Only watch relevant files (ignore .json)
      if (![".ts", ".tsx", ".scss", ".css"].includes(ext)) return

      console.log(`${timestamp()} 📝 File added: ${pluginName}/${fileName}`)
      
      // Don't generate schema on 'add', only on 'change'
      // Build will generate schema automatically
      debouncedBuild(pluginName)
    })
    .on("change", async (filePath) => {
      const pluginName = getPluginNameFromPath(filePath, pluginsDir)
      if (!pluginName) return

      const fileName = path.basename(filePath)
      const ext = path.extname(filePath)
      
      // Only watch relevant files (ignore .json)
      if (![".ts", ".tsx", ".scss", ".css"].includes(ext)) return
      
      console.log(`${timestamp()} 📝 File changed: ${pluginName}/${fileName}`)
      
      // Generate schema ONLY when props.ts changes (not on add)
      if (fileName === "props.ts") {
        await handlePropsChange(pluginName)
      }
      
      debouncedBuild(pluginName)
    })
    .on("unlink", (filePath) => {
      const pluginName = getPluginNameFromPath(filePath, pluginsDir)
      if (!pluginName) return

      const fileName = path.basename(filePath)
      console.log(`${timestamp()} 🗑️  File deleted: ${pluginName}/${fileName}`)
    })
    .on("error", (error) => {
      console.error(`❌ Watcher error:`, error)
    })

  console.log(`${timestamp()} ✅ Ready! Watching for changes...`)
  console.log(`   Press Ctrl+C to stop\n`)

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log(`\n\n${timestamp()} 👋 Stopping watcher...`)
    watcher.close()
    process.exit(0)
  })
}
