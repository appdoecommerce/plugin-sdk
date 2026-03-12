# Contributing to AppDoEcommerce Plugin SDK

Guia para desenvolvedores que querem contribuir com o SDK ou adicionar novos comandos.

## 🏗️ Estrutura do Projeto

```
plugin-sdk/
├── src/
│   ├── cli.ts                      # Entry point - registra comandos
│   ├── api.ts                      # Cliente API para backend
│   ├── commands/                   # Diretório de comandos
│   │   ├── prepare.ts              # Comando: appecom prepare
│   │   ├── make-plugin.ts          # Comando: appecom plugin:create
│   │   ├── plugin-delete.ts        # Comando: appecom plugin:delete
│   │   ├── build-plugin.ts         # Comando: appecom build
│   │   ├── watch.ts                # Comando: appecom watch
│   │   ├── preview.ts              # Comando: appecom preview
│   │   ├── scheme-generate.ts      # Comando: appecom scheme:generate
│   │   ├── scheme-get.ts           # Comando: appecom scheme:get
│   │   └── scheme-upload.ts        # Comando: appecom scheme:upload
│   ├── utils/                      # Utilitários compartilhados
│   │   ├── css-isolation.ts        # Plugin PostCSS para isolamento
│   │   ├── generate-manifest.ts    # Geração de manifest.json
│   │   └── generate-sample-props.ts # Geração de props exemplo
│   └── tsconfig.json               # Config TypeScript do CLI
├── dist/                           # Código compilado (gerado pelo build)
├── package.json
└── README.md
```

## 🚀 Setup de Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/appdoecommerce/plugin-sdk.git
cd plugin-sdk

# Instale dependências
npm install

# Build do projeto
npm run build

# Link globalmente para testes
npm link

# Agora você pode testar com:
appecom --help
```

## ➕ Como Criar um Novo Comando

### Passo 1: Criar o arquivo do comando

Crie um novo arquivo em `src/commands/` com o nome do comando.

**Exemplo:** `src/commands/list-plugins.ts`

```typescript
import fs from "fs"
import path from "path"

export async function listPlugins(): Promise<void> {
  const cwd = process.cwd()
  const pluginsDir = path.join(cwd, "plugins")

  // Validação
  if (!fs.existsSync(pluginsDir)) {
    console.error("❌ Error: plugins/ directory not found")
    process.exit(1)
  }

  // Lógica do comando
  const plugins = fs.readdirSync(pluginsDir).filter(item => {
    const itemPath = path.join(pluginsDir, item)
    return fs.statSync(itemPath).isDirectory()
  })

  if (plugins.length === 0) {
    console.log("📭 No plugins found")
    return
  }

  console.log(`📦 Found ${plugins.length} plugin(s):\n`)
  plugins.forEach(plugin => {
    const hasProps = fs.existsSync(path.join(pluginsDir, plugin, "props.ts"))
    const hasSchema = fs.existsSync(path.join(pluginsDir, plugin, "schema.json"))
    
    const status = hasSchema ? "✅" : hasProps ? "⚠️" : "❌"
    console.log(`  ${status} ${plugin}`)
  })
}
```

### Passo 2: Registrar o comando no CLI

Edite `src/cli.ts` e adicione o novo comando:

```typescript
#!/usr/bin/env node

import { Command } from "commander"
import { makePlugin } from "./commands/make-plugin.js"
import { prepareEnvironment } from "./commands/prepare.js"
import { buildPlugin } from "./commands/build-plugin.js"
import { generateScheme } from "./commands/scheme-generate.js"
import { getSchemeFromBackend } from "./commands/scheme-get.js"
import { uploadSchemeToBackend } from "./commands/scheme-upload.js"
import { listPlugins } from "./commands/list-plugins.js"  // ← Importar

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
  .command("plugin:create <name>")
  .description("Create a new plugin with boilerplate files")
  .option("-n, --name <displayName>", "Custom display name for the app")
  .action((pluginName, options) => {
    makePlugin(pluginName, options.name)
  })

program
  .command("scheme:generate <plugin-name>")
  .description("Generate JSON schema from props.ts for a specific plugin")
  .action(generateScheme)

program
  .command("scheme:get <plugin-name>")
  .description("Download current schema from backend (with panel modifications)")
  .action(getSchemeFromBackend)

program
  .command("scheme:upload <plugin-name>")
  .description("Upload local schema to backend")
  .action(uploadSchemeToBackend)

// ← Adicionar novo comando aqui
program
  .command("list")
  .description("List all available plugins")
  .action(listPlugins)

program.parse()
```

### Passo 3: Build e teste

```bash
# Compilar TypeScript
npm run build

# Testar o comando
appecom list
```

## 📝 Padrões e Convenções

### Nomenclatura de Comandos

- **Simples:** `list`, `init`, `build`
- **Com namespace:** `plugin:create`, `plugin:delete`, `scheme:generate`
- **Com parâmetros:** `<obrigatório>`, `[opcional]`

### Estrutura de Função

```typescript
export async function nomeComando(
  argumento1?: string,
  argumento2?: number
): Promise<void> {
  // 1. Validações
  if (!argumento1) {
    console.error("❌ Error: argumento1 is required")
    process.exit(1)
  }

  // 2. Lógica principal
  console.log("🚀 Starting...")
  
  try {
    // fazer operações
  } catch (error) {
    console.error("❌ Error:", error.message)
    process.exit(1)
  }

  // 3. Mensagem de sucesso
  console.log("✅ Done!")
}
```

### Estilo de Mensagens

Use emojis para feedback visual:

- `🚀` - Começando operação
- `✅` - Sucesso
- `❌` - Erro
- `⚠️` - Aviso
- `📝` - Processando/gerando
- `📁` - Referência a diretório
- `📦` - Referência a pacote/plugin
- `✨` - Finalização com sucesso

### Tratamento de Erros

```typescript
// ❌ Evite
throw new Error("Something went wrong")

// ✅ Prefira
console.error("❌ Error: Something went wrong")
process.exit(1)
```

## 🧪 Comandos com Opções

Comandos podem aceitar flags e opções:

```typescript
program
  .command("build")
  .description("Build all plugins")
  .option("-w, --watch", "Watch mode")
  .option("-p, --production", "Production build")
  .action((options) => buildPlugins(options))

async function buildPlugins(options: {
  watch?: boolean
  production?: boolean
}): Promise<void> {
  if (options.watch) {
    console.log("👀 Watch mode enabled")
  }
  
  if (options.production) {
    console.log("🚀 Production build")
  }
}
```

## 📚 Exemplos de Comandos Úteis

### Comando: Validar Plugin

```typescript
// src/commands/validate.ts
export async function validatePlugin(pluginName: string): Promise<void> {
  const pluginDir = path.join(process.cwd(), "plugins", pluginName)
  
  if (!fs.existsSync(pluginDir)) {
    console.error(`❌ Plugin "${pluginName}" not found`)
    process.exit(1)
  }

  let issues = 0

  // Verificar arquivos obrigatórios
  const requiredFiles = ["index.ts", "props.ts"]
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(pluginDir, file))) {
      console.log(`❌ Missing ${file}`)
      issues++
    }
  }

  // Verificar schema
  if (!fs.existsSync(path.join(pluginDir, "schema.json"))) {
    console.log("⚠️  Missing schema.json - run 'appecom scheme:generate <plugin-name>'")
    issues++
  }

  if (issues === 0) {
    console.log(`✅ Plugin "${pluginName}" is valid!`)
  } else {
    console.log(`\n❌ Found ${issues} issue(s)`)
    process.exit(1)
  }
}
```

### Comando: Watch Mode

```typescript
// src/commands/watch.ts
import chokidar from "chokidar"

export async function watchSchemas(): Promise<void> {
  console.log("👀 Watching for changes...")

  const watcher = chokidar.watch("plugins/**/props.ts", {
    persistent: true,
    ignoreInitial: true
  })

  watcher.on("change", async (filepath) => {
    const pluginName = path.basename(path.dirname(filepath))
    console.log(`📝 Regenerating schema for ${pluginName}...`)
    await generateSchemas(pluginName)
  })
}
```

## 🔧 Debugging

### Modo Dev (sem rebuild)

```bash
# Executar diretamente sem build
npm run dev -- prepare
npm run dev -- plugin:create test
```

### Debug no VS Code

Adicione em `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/cli.ts",
      "args": ["plugin:create", "test"],
      "runtimeArgs": ["--loader", "tsx"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 📦 Antes de Publicar

```bash
# 1. Atualizar versão
npm version patch  # ou minor, major

# 2. Build
npm run build

# 3. Testar pacote localmente
npm pack --dry-run

# 4. Publicar
npm publish --access public
```

## ✅ Checklist para Novos Comandos

- [ ] Arquivo criado em `src/commands/`
- [ ] Função exportada com tipagem TypeScript
- [ ] Comando registrado em `src/cli.ts`
- [ ] Validações de entrada implementadas
- [ ] Mensagens de erro claras
- [ ] Feedback visual com emojis
- [ ] Testado com `npm run dev`
- [ ] Build funciona sem erros
- [ ] Documentado no README.md (se for comando principal)

## 🤝 Pull Requests

Ao submeter um PR:

1. Crie uma branch: `git checkout -b feature/novo-comando`
2. Commit com mensagem clara: `feat: add list command`
3. Teste localmente: `npm run build && appecom <comando>`
4. Atualize documentação se necessário
5. Abra PR descrevendo o que foi adicionado

## 📖 Recursos

- [Commander.js Docs](https://github.com/tj/commander.js)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [typescript-json-schema](https://github.com/YousefED/typescript-json-schema)

---

**Dúvidas?** Abra uma issue em [GitHub Issues](https://github.com/appdoecommerce/plugin-sdk/issues)
