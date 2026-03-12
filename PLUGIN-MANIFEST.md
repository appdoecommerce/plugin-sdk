# 📦 Plugin Manifest

Cada plugin compilado gera automaticamente um `manifest.json` que o torna **auto-contido** e **portável**.

## 🎯 Propósito

O manifest permite que um plugin seja:
- **Carregado isoladamente** sem depender do registry global
- **Portável** - copie apenas a pasta `dist/{plugin}` e funciona
- **Versionado** - rastreie versões independentemente
- **Auto-documentado** - saiba quais arquivos o plugin possui

---

## 📄 Estrutura do Manifest

```json
{
  "name": "instagram-feed",
  "version": "1.0.0",
  "server": "./server.js",
  "client": "./client.js",
  "style": "./style.css",
  "schema": "./schema.json"
}
```

### Campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | `string` | Nome do plugin (igual ao diretório) |
| `version` | `string` | Versão do workspace (`package.json`) ou `1.0.0` |
| `server` | `string` | Caminho relativo para o bundle server-side |
| `client` | `string` | Caminho relativo para o bundle client-side |
| `style` | `string` | Caminho relativo para o CSS compilado |
| `schema` | `string` | Caminho relativo para o JSON Schema |

**Importante**: Todos os caminhos são **relativos** (começam com `./`), não absolutos.

---

## 🔄 Diferença: Manifest vs Registry

### Global Registry (`dist/plugins-registry.json`)
```json
{
  "instagram-feed": {
    "server": "/dist/instagram-feed/server.js",    ← Paths absolutos
    "client": "/dist/instagram-feed/client.js",
    "style": "/dist/instagram-feed/style.css",
    "schema": "/dist/instagram-feed/schema.json"
  }
}
```
**Uso**: Carregar todos os plugins disponíveis de uma vez.

---

### Individual Manifest (`dist/instagram-feed/manifest.json`)
```json
{
  "name": "instagram-feed",
  "version": "1.0.0",
  "server": "./server.js",                         ← Paths relativos
  "client": "./client.js",
  "style": "./style.css",
  "schema": "./schema.json"
}
```
**Uso**: Carregar um plugin específico isoladamente.

---

## 🚀 Casos de Uso

### 1️⃣ Distribuir plugin individual

```bash
# Copie apenas a pasta do plugin
cp -r dist/instagram-feed /path/to/plugins/

# O runtime pode carregar apenas lendo o manifest
const manifest = await fetch('/plugins/instagram-feed/manifest.json')
const { server, client, style } = await manifest.json()
```

---

### 2️⃣ Plugin marketplace

```typescript
// Upload para marketplace
const pluginFolder = 'dist/instagram-feed'
const manifest = JSON.parse(
  fs.readFileSync(`${pluginFolder}/manifest.json`, 'utf-8')
)

console.log(`Uploading ${manifest.name} v${manifest.version}`)
// Upload todos os arquivos listados no manifest
```

---

### 3️⃣ Lazy loading no runtime

```typescript
// Carregar plugin sob demanda
async function loadPlugin(pluginPath: string) {
  const manifestUrl = `${pluginPath}/manifest.json`
  const manifest = await fetch(manifestUrl).then(r => r.json())
  
  // Carregar apenas os arquivos necessários
  const [serverModule, clientModule, css] = await Promise.all([
    import(`${pluginPath}/${manifest.server}`),
    import(`${pluginPath}/${manifest.client}`),
    fetch(`${pluginPath}/${manifest.style}`).then(r => r.text())
  ])
  
  return { manifest, serverModule, clientModule, css }
}

// Uso
const plugin = await loadPlugin('/plugins/instagram-feed')
console.log(`Loaded ${plugin.manifest.name} v${plugin.manifest.version}`)
```

---

### 4️⃣ Validação de integridade

```typescript
// Verificar se plugin está completo
function validatePlugin(pluginPath: string): boolean {
  const manifest = JSON.parse(
    fs.readFileSync(`${pluginPath}/manifest.json`, 'utf-8')
  )
  
  const requiredFiles = [
    manifest.server,
    manifest.client,
    manifest.style,
    manifest.schema
  ]
  
  return requiredFiles.every(file => 
    fs.existsSync(path.join(pluginPath, file))
  )
}

// Uso
if (validatePlugin('dist/instagram-feed')) {
  console.log('✅ Plugin completo!')
} else {
  console.log('❌ Arquivos faltando!')
}
```

---

## 📊 Estrutura Completa de um Plugin

```
dist/instagram-feed/
├── manifest.json      ← Metadados do plugin (auto-contido)
├── server.js          ← Bundle SSR (CommonJS)
├── client.js          ← Bundle hydration (ESM)
├── style.css          ← CSS isolado com prefix
├── schema.json        ← JSON Schema das props
└── props.ts           ← Interface TypeScript (referência)
```

**Plugin completo**:
- Copie a pasta inteira
- Leia o `manifest.json`
- Carregue os arquivos listados
- ✅ Funcionando!

---

## 🔧 Configuração de Versão

### Automático (recomendado)
O manifest usa a versão do `package.json` do workspace:

```json
// package.json
{
  "name": "@appdoecommerce/plugin-sdk",
  "version": "1.2.3"  ← Usada nos manifests
}
```

**Todos os plugins** herdam essa versão: `1.2.3`

---

### Manual (futuro)
No futuro, cada plugin pode ter sua própria versão:

```json
// plugins/instagram-feed/package.json
{
  "version": "2.5.0"  ← Versão específica do plugin
}
```

---

## ✅ Quando o Manifest é Gerado?

O `manifest.json` é gerado **automaticamente** durante o build:

```bash
# Build único
appecom build instagram-feed
# → Gera dist/instagram-feed/manifest.json

# Build geral
appecom build
# → Gera manifest.json para TODOS os plugins

# Watch mode
appecom watch
# → Gera/atualiza manifest.json em cada rebuild
```

**Não precisa fazer nada!** É automático.

---

## 🎯 Resumo

| Aspecto | Global Registry | Individual Manifest |
|---------|----------------|---------------------|
| **Arquivo** | `dist/plugins-registry.json` | `dist/{plugin}/manifest.json` |
| **Paths** | Absolutos (`/dist/...`) | Relativos (`./...`) |
| **Scope** | Todos os plugins | Um plugin específico |
| **Portabilidade** | ❌ Vinculado ao workspace | ✅ Auto-contido |
| **Uso** | Listar plugins disponíveis | Carregar plugin isoladamente |

**Use ambos**:
- Registry → Dashboard, lista de plugins
- Manifest → Runtime, lazy loading, distribuição

---

## 💡 Exemplos Práticos

Quer ver como usar manifests no runtime? Confira exemplos completos em:

📖 **[MANIFEST-EXAMPLES.md](MANIFEST-EXAMPLES.md)**

- Carregar plugin isoladamente (Node.js)
- Runtime CDN (Browser)
- Upload para marketplace
- Validação de plugins
- Sistema de atualizações
