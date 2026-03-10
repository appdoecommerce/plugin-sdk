#!/usr/bin/env node

import { Command } from "commander"
import { makePlugin } from "./commands/make-plugin.js"
import { generateSchemas } from "./commands/generate-schemas.js"
import { prepareEnvironment } from "./commands/prepare.js"

const program = new Command()

program
  .name("appecom")
  .description("AppDoEcommerce CLI - Plugin development toolkit")
  .version("1.0.0")

program
  .command("prepare")
  .description("Prepare the development environment")
  .action(prepareEnvironment)

program
  .command("make:plugin <name>")
  .description("Create a new plugin with boilerplate files")
  .action(makePlugin)

program
  .command("schema [plugin-name]")
  .description("Generate JSON schemas for all plugins or a specific one")
  .action(generateSchemas)

program.parse()
