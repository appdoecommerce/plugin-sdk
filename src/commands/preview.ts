import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"
import open from "open"
import { buildPlugin } from "./build-plugin.js"
import { generateSampleProps } from "../utils/generate-sample-props.js"
import chokidar from "chokidar"

export async function previewPlugin(
  pluginName: string,
  options: { watch?: boolean } = {}
): Promise<void> {
  const cwd = process.cwd()
  const pluginDir = path.join(cwd, "plugins", pluginName)
  const distDir = path.join(cwd, "dist", pluginName)

  if (!fs.existsSync(pluginDir)) {
    console.error(`❌ Error: Plugin "${pluginName}" not found`)
    console.error(`   Expected at: plugins/${pluginName}`)
    process.exit(1)
  }

  console.log(`🔍 Previewing ${pluginName}...\n`)

  // Build plugin first
  console.log(`📦 Building plugin...`)
  await buildPlugin(pluginName)

  // Generate and serve preview
  await generatePreview(pluginName, distDir, cwd)

  if (options.watch) {
    console.log(`\n👀 Watching for changes... (Press Ctrl+C to stop)`)
    watchAndRebuild(pluginName, pluginDir, distDir, cwd)
  } else {
    console.log(`\n💡 Tip: Use --watch to auto-rebuild on changes`)
  }
}

async function generatePreview(
  pluginName: string,
  distDir: string,
  cwd: string,
  openBrowser: boolean = true
): Promise<void> {
  // Read schema and generate sample props
  const schemaPath = path.join(distDir, "schema.json")
  let props = {}

  if (fs.existsSync(schemaPath)) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"))
    props = generateSampleProps(schema)
    console.log(`📋 Generated sample props:`, JSON.stringify(props, null, 2))
  } else {
    console.warn(`⚠️  schema.json not found, using empty props`)
  }

  // Execute SSR locally
  console.log(`🎨 Rendering HTML...`)
  const serverPath = path.join(distDir, "server.js")

  if (!fs.existsSync(serverPath)) {
    console.error(`❌ Error: server.js not found in dist/${pluginName}`)
    process.exit(1)
  }

  // Import ESM module (server.js is built as ESM)
  // Add timestamp to bypass Node.js module cache on rebuilds
  const serverUrl = pathToFileURL(serverPath).href + `?t=${Date.now()}`
  const serverModule = await import(serverUrl)
  const { render } = serverModule

  if (!render) {
    console.error(`❌ Error: server.js does not export a 'render' function`)
    process.exit(1)
  }

  let html: string
  try {
    html = await render(props)
  } catch (error: any) {
    console.error(`❌ Error rendering plugin:`, error.message)
    process.exit(1)
  }

  // Generate preview.html (real preview - no decorations)
  const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: ${pluginName}</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  ${html}

  <script type="module">
    import { hydrate } from './client.js'
    
    const props = ${JSON.stringify(props)}
    const pluginElement = document.querySelector('[data-plugin="${pluginName}"]')
    
    if (pluginElement) {
      try {
        hydrate(pluginElement, props)
        console.log('✅ Plugin hydrated successfully')
        console.log('Props used:', props)
      } catch (error) {
        console.error('❌ Hydration error:', error)
      }
    } else {
      console.warn('⚠️  Plugin element not found (missing data-plugin="${pluginName}")')
    }
  </script>
</body>
</html>`

  const previewPath = path.join(distDir, "preview.html")
  fs.writeFileSync(previewPath, previewHtml, "utf-8")

  console.log(`✅ Preview generated: dist/${pluginName}/preview.html`)

  // Open in browser only if requested (first time)
  if (openBrowser) {
    console.log(`🌐 Opening in browser...`)
    await open(previewPath)
  }
}

function watchAndRebuild(
  pluginName: string,
  pluginDir: string,
  distDir: string,
  cwd: string
): void {
  let rebuildTimeout: NodeJS.Timeout | null = null

  const watcher = chokidar.watch(pluginDir, {
    ignored: [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/schema.json", // Ignore auto-generated schema to prevent loop
    ],
    persistent: true,
    ignoreInitial: true,
  })

  watcher.on("change", async (filePath) => {
    const fileName = path.basename(filePath)
    
    // Extra safety check: ignore schema.json changes
    if (fileName === "schema.json") {
      return
    }
    
    console.log(`\n📝 File changed: ${fileName}`)

    // Debounce rebuilds
    if (rebuildTimeout) clearTimeout(rebuildTimeout)

    rebuildTimeout = setTimeout(async () => {
      console.log(`🔨 Rebuilding...`)
      try {
        await buildPlugin(pluginName)
        await generatePreview(pluginName, distDir, cwd, false) // Don't open browser on rebuild
        console.log(`✅ Preview updated!`)
        console.log(`👀 Watching for changes...`)
      } catch (error: any) {
        console.error(`❌ Rebuild failed:`, error.message)
      }
    }, 500)
  })

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log(`\n\n👋 Stopping preview...`)
    watcher.close()
    process.exit(0)
  })
}
