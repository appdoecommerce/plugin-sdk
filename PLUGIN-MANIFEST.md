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
  "name": "Instagram Feed",
  "type": "instagram-feed",
  "version": "1.0.0",
  "server": "./server.js",
  "client": "./client.js",
  "style": "./style.css",
  "schema": "./schema.json",
  "serviceId": "123"
}
```

### Campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | `string` | Nome de exibição do plugin |
| `type` | `string` | Identificador único do plugin (kebab-case) |
| `version` | `string` | Versão do plugin (semver) |
| `server` | `string` | Caminho relativo para o bundle server-side (ESM) |
| `client` | `string` | Caminho relativo para o bundle client-side (ESM) |
| `style` | `string` | Caminho relativo para o CSS compilado |
| `schema` | `string` | Caminho relativo para o JSON Schema |
| `serviceId` | `string` | ID do serviço no sistema (gerado automaticamente) |

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
  "name": "Instagram Feed",
  "type": "instagram-feed",
  "version": "1.0.0",
  "server": "./server.js",                         ← Paths relativos
  "client": "./client.js",
  "style": "./style.css",
  "schema": "./schema.json",
  "serviceId": "123"
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
├── server.js          ← Bundle SSR (ESM)
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

Cada plugin tem sua própria versão independente:

```json
// plugins/instagram-feed/manifest.json
{
  "name": "Instagram Feed",
  "type": "instagram-feed",
  "version": "2.5.0",  ← Versão específica do plugin
  "serviceId": "123"
}
```

**Quando atualizar a versão:**
- Após mudanças no código (server.ts, client.ts, style.scss)
- Antes de fazer deploy (`appecom deploy <plugin>`)
- Siga [Semantic Versioning](https://semver.org/): MAJOR.MINOR.PATCH

---

## ✅ Quando o Manifest é Gerado?

O `manifest.json` é criado e gerenciado automaticamente:

**Durante criação:**
```bash
appecom plugin:create instagram-feed --name "Instagram Feed"
```
- Cria `plugins/instagram-feed/manifest.json`
- Registra plugin no sistema e obtém `serviceId`
- Atualiza manifest com `serviceId`

**Durante build:**
```bash
appecom build instagram-feed
```
- Copia manifest para `dist/instagram-feed/manifest.json`
- Preserva `serviceId` e `version`
- Plugin fica auto-contido e pronto para distribuir

**⚠️ Editável:** Você pode editar `plugins/{plugin}/manifest.json` manualmente (nome, versão, etc). As mudanças serão copiadas para dist/ no próximo build.

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

## � Leia Mais

- **[README.md](README.md)** - Guia completo do SDK
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Como contribuir
- **[CHANGELOG.md](CHANGELOG.md)** - Histórico de versões
