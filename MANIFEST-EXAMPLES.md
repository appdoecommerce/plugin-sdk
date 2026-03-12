# 🚀 Exemplo Prático: Usando Plugin Manifests

Este documento mostra exemplos reais de como usar os manifestos de plugins no runtime.

## 📦 Cenário 1: Carregar Plugin Isoladamente

### Backend (Node.js/AdonisJS)

```typescript
import fs from 'fs'
import path from 'path'

// Carregar um plugin específico
async function loadPlugin(pluginPath: string) {
  // Ler manifest
  const manifestPath = path.join(pluginPath, 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  
  console.log(`Loading ${manifest.name} v${manifest.version}`)
  
  // Importar módulo server-side
  const serverPath = path.join(pluginPath, manifest.server.replace('./', ''))
  const { render } = await import(serverPath)
  
  return { manifest, render }
}

// Uso
const plugin = await loadPlugin('./dist/instagram-feed')
const html = await plugin.render({ username: '@appdoecommerce', limit: 10 })
console.log(html)
```

---

## 🌐 Cenário 2: Runtime CDN (Browser)

### Carregar plugin dinamicamente no browser

```typescript
// runtime.js
class PluginLoader {
  private baseUrl: string
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  
  async loadPlugin(pluginName: string) {
    // 1. Buscar manifest
    const manifestUrl = `${this.baseUrl}/${pluginName}/manifest.json`
    const manifest = await fetch(manifestUrl).then(r => r.json())
    
    console.log(`📦 Loading ${manifest.name} v${manifest.version}`)
    
    // 2. Carregar CSS
    const styleUrl = `${this.baseUrl}/${pluginName}/${manifest.style.replace('./', '')}`
    const css = await fetch(styleUrl).then(r => r.text())
    this.injectCSS(css, pluginName)
    
    // 3. Carregar módulo client-side
    const clientUrl = `${this.baseUrl}/${pluginName}/${manifest.client.replace('./', '')}`
    const { hydrate } = await import(clientUrl)
    
    return { manifest, hydrate }
  }
  
  private injectCSS(css: string, pluginName: string) {
    const style = document.createElement('style')
    style.id = `plugin-${pluginName}-css`
    style.textContent = css
    document.head.appendChild(style)
  }
}

// Uso
const loader = new PluginLoader('https://cdn.appdoecommerce.com/plugins')
const plugin = await loader.loadPlugin('instagram-feed')

// HTML já foi renderizado pelo servidor
const element = document.querySelector('[data-plugin="instagram-feed"]')
plugin.hydrate(element, { username: '@appdoecommerce', limit: 10 })
```

---

## 📋 Cenário 3: Marketplace - Upload de Plugins

```typescript
// marketplace-api.ts
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

async function uploadPlugin(pluginPath: string, apiKey: string) {
  // 1. Ler manifest
  const manifestPath = path.join(pluginPath, 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  
  console.log(`📤 Uploading ${manifest.name} v${manifest.version}`)
  
  // 2. Criar FormData com todos os arquivos
  const formData = new FormData()
  formData.append('manifest', JSON.stringify(manifest))
  
  // Adicionar cada arquivo listado no manifest
  const files = [
    manifest.server,
    manifest.client,
    manifest.style,
    manifest.schema
  ]
  
  for (const file of files) {
    const filePath = path.join(pluginPath, file.replace('./', ''))
    const fileName = path.basename(file)
    formData.append(fileName, fs.createReadStream(filePath))
  }
  
  // 3. Upload para API
  const response = await fetch('https://marketplace.appdoecommerce.com/api/plugins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  })
  
  if (response.ok) {
    console.log(`✅ Plugin ${manifest.name} uploaded successfully!`)
  } else {
    console.error(`❌ Upload failed:`, await response.text())
  }
}

// Uso
await uploadPlugin('./dist/instagram-feed', process.env.API_KEY!)
```

---

## 🔍 Cenário 4: Validação de Plugins

```typescript
// validate-plugin.ts
import fs from 'fs'
import path from 'path'

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function validatePlugin(pluginPath: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 1. Verificar se manifest existe
  const manifestPath = path.join(pluginPath, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    errors.push('manifest.json não encontrado')
    return { valid: false, errors, warnings }
  }
  
  // 2. Ler e validar manifest
  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  } catch (e) {
    errors.push('manifest.json inválido (JSON malformado)')
    return { valid: false, errors, warnings }
  }
  
  // 3. Validar campos obrigatórios
  const requiredFields = ['name', 'version', 'server', 'client', 'style', 'schema']
  for (const field of requiredFields) {
    if (!manifest[field]) {
      errors.push(`Campo obrigatório '${field}' ausente no manifest`)
    }
  }
  
  // 4. Verificar se arquivos existem
  const files = [
    { key: 'server', path: manifest.server },
    { key: 'client', path: manifest.client },
    { key: 'style', path: manifest.style },
    { key: 'schema', path: manifest.schema }
  ]
  
  for (const { key, path: filePath } of files) {
    if (!filePath) continue
    
    const fullPath = path.join(pluginPath, filePath.replace('./', ''))
    if (!fs.existsSync(fullPath)) {
      errors.push(`Arquivo '${key}' não encontrado: ${filePath}`)
    } else {
      // Verificar se arquivo não está vazio
      const stats = fs.statSync(fullPath)
      if (stats.size === 0) {
        warnings.push(`Arquivo '${key}' está vazio: ${filePath}`)
      }
    }
  }
  
  // 5. Validar versão
  const versionRegex = /^\d+\.\d+\.\d+$/
  if (!versionRegex.test(manifest.version)) {
    warnings.push(`Versão '${manifest.version}' não segue semver (X.Y.Z)`)
  }
  
  // 6. Verificar se nome do plugin combina com pasta
  const folderName = path.basename(pluginPath)
  if (manifest.name !== folderName) {
    warnings.push(`Nome no manifest '${manifest.name}' diferente da pasta '${folderName}'`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Uso
const result = validatePlugin('./dist/instagram-feed')

if (result.valid) {
  console.log('✅ Plugin válido!')
  if (result.warnings.length > 0) {
    console.warn('⚠️  Avisos:')
    result.warnings.forEach(w => console.warn(`  - ${w}`))
  }
} else {
  console.error('❌ Plugin inválido!')
  result.errors.forEach(e => console.error(`  - ${e}`))
  if (result.warnings.length > 0) {
    console.warn('⚠️  Avisos:')
    result.warnings.forEach(w => console.warn(`  - ${w}`))
  }
}
```

---

## 🔄 Cenário 5: Atualização de Plugins

```typescript
// plugin-updater.ts
import semver from 'semver'

interface InstalledPlugin {
  name: string
  version: string
  path: string
}

async function checkForUpdates(installedPlugins: InstalledPlugin[]) {
  // Fetch latest versions from marketplace
  const latestVersions = await fetch('https://marketplace.appdoecommerce.com/api/plugins/versions')
    .then(r => r.json())
  
  const updates: Array<{ name: string, current: string, latest: string }> = []
  
  for (const plugin of installedPlugins) {
    const latest = latestVersions[plugin.name]
    
    if (latest && semver.gt(latest, plugin.version)) {
      updates.push({
        name: plugin.name,
        current: plugin.version,
        latest: latest
      })
    }
  }
  
  return updates
}

async function updatePlugin(pluginName: string, targetVersion: string) {
  console.log(`🔄 Updating ${pluginName} to ${targetVersion}...`)
  
  // Download new version
  const pluginUrl = `https://marketplace.appdoecommerce.com/api/plugins/${pluginName}/${targetVersion}`
  const response = await fetch(pluginUrl)
  
  if (!response.ok) {
    throw new Error(`Failed to download plugin: ${response.statusText}`)
  }
  
  const pluginData = await response.json()
  
  // Extract files
  const pluginPath = `./dist/${pluginName}`
  fs.writeFileSync(`${pluginPath}/manifest.json`, JSON.stringify(pluginData.manifest, null, 2))
  fs.writeFileSync(`${pluginPath}/server.js`, pluginData.server)
  fs.writeFileSync(`${pluginPath}/client.js`, pluginData.client)
  fs.writeFileSync(`${pluginPath}/style.css`, pluginData.style)
  fs.writeFileSync(`${pluginPath}/schema.json`, JSON.stringify(pluginData.schema, null, 2))
  
  console.log(`✅ Updated ${pluginName} to ${targetVersion}`)
}

// Uso
const installed: InstalledPlugin[] = [
  { name: 'instagram-feed', version: '1.0.0', path: './dist/instagram-feed' },
  { name: 'banner-hero', version: '1.2.0', path: './dist/banner-hero' }
]

const updates = await checkForUpdates(installed)

if (updates.length > 0) {
  console.log('📦 Updates available:')
  updates.forEach(u => {
    console.log(`  - ${u.name}: ${u.current} → ${u.latest}`)
  })
  
  // Atualizar todos
  for (const update of updates) {
    await updatePlugin(update.name, update.latest)
  }
} else {
  console.log('✅ All plugins are up to date!')
}
```

---

## 🎯 Resumo

O `manifest.json` permite:

1. ✅ **Carregamento isolado** - Sem depender do registry global
2. ✅ **Validação** - Verificar integridade do plugin
3. ✅ **Versionamento** - Rastrear e atualizar versões
4. ✅ **Portabilidade** - Copiar apenas a pasta do plugin
5. ✅ **Lazy loading** - Carregar sob demanda no runtime
6. ✅ **Marketplace** - Upload/download de plugins
7. ✅ **CDN** - Distribuição otimizada

**Use o manifest para tornar seus plugins verdadeiramente independentes!**
