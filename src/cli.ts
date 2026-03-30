#!/usr/bin/env node

import { Command } from "commander"
import { makePlugin } from "./commands/make-plugin.js"
import { deletePlugin } from "./commands/plugin-delete.js"
import { prepareEnvironment } from "./commands/prepare.js"
import { buildPlugin } from "./commands/build-plugin.js"
import { watchPlugins } from "./commands/watch.js"
import { previewPlugin } from "./commands/preview.js"
import { generateScheme } from "./commands/scheme-generate.js"
import { getSchemeFromBackend } from "./commands/scheme-get.js"
import { uploadSchemeToBackend } from "./commands/scheme-upload.js"
import { deployPlugin } from "./commands/deploy-plugin.js"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const { version } = require("../package.json")

const program = new Command()

program
  .name("appecom")
  .description("AppDoEcommerce CLI - Plugin development toolkit")
  .version(version)

program
  .command("prepare")
  .description("Prepare the development environment")
  .action(prepareEnvironment)

// Plugin commands
program
  .command("plugin:create <name>")
  .description("Create a new plugin with boilerplate files")
  .option("-n, --name <displayName>", "Custom display name for the app")
  .action((pluginName, options) => {
    makePlugin(pluginName, options.name)
  })

program
  .command("plugin:delete <name>")
  .description("Delete plugin from backend and local filesystem")
  .action(deletePlugin)

program
  .command("plugin:build [plugin-name]")
  .description("Build plugin(s) for production (server.js, client.js, style.css)")
  .option("-f, --force", "Force rebuild without version increment")
  .action((pluginName, options) => {
    buildPlugin(pluginName, { force: options.force })
  })

program
  .command("plugin:preview <plugin-name>")
  .description("Generate and open a preview of the plugin in the browser")
  .option("-w, --watch", "Watch for changes and auto-rebuild")
  .action((pluginName, options) => {
    previewPlugin(pluginName, { watch: options.watch })
  })

program
  .command("plugin:deploy <plugin-name>")
  .description("Deploy plugin to plugin server with versioning")
  .option("-f, --force", "Force deploy the same version without incrementing")
  .action((pluginName, options) => {
    deployPlugin(pluginName, { force: options.force })
  })

// Schema commands
program
  .command("scheme:generate <plugin-name>")
  .description("Generate JSON schema from props.ts for a specific plugin")
  .action(generateScheme)

program
  .command("scheme:download <plugin-name>")
  .description("Download current schema from backend (with panel modifications)")
  .action(getSchemeFromBackend)

program
  .command("scheme:upload <plugin-name>")
  .description("Upload local schema to backend")
  .action(uploadSchemeToBackend)

// Watch command  
program
  .command("watch")
  .description("Watch plugins/ for changes and auto-build")
  .action(watchPlugins)

program.parse()
