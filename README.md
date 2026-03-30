# AppDoEcommerce Plugin SDK

🚀 Developer toolkit para criar e gerenciar plugins do AppDoEcommerce.

## 🎯 O que é?

O AppDoEcommerce Plugin SDK (`@appdoecommerce/plugin-sdk`) é uma CLI completa que facilita o desenvolvimento de plugins customizados para a plataforma AppDoEcommerce. Com ele, você pode:

- ⚡ Criar estrutura de plugins com templates otimizados (SSR + Hydration)
- 🔨 Compilar plugins automaticamente (server.js, client.js, style.css)
- 🔄 Gerar JSON Schemas automaticamente a partir de TypeScript
- 🌐 Sincronizar schemas com sistema (upload/download)
- 🛡️ **Isolamento automático de CSS** - sem conflitos entre plugins
- 👀 Watch mode com auto-rebuild e auto-scaffold
- 📋 Registry automático de plugins para runtime
- 📦 Trabalhar com tipagem completa e validação de props
- 🔗 Integração completa com painel administrativo

## 📦 Instalação

### Global (Recomendado)

```bash
npm install -g @appdoecommerce/plugin-sdk
```

### Local no projeto

```bash
npm install --save-dev @appdoecommerce/plugin-sdk
```

## 🚀 Início Rápido

```bash
# 1. Preparar o ambiente
appecom prepare

# 2. Configurar credenciais no .env
# Edite .env e preencha APPECOM_STOREID e APPECOM_SECRET

# 3. Criar seu primeiro plugin (registra automaticamente no sistema)
appecom plugin:create banner-hero --name "Banner Hero"

# 4. Editar os arquivos do plugin
# - plugins/banner-hero/props.ts (definir props - veja PROPS-GUIDE.md)
# - plugins/banner-hero/server.ts (SSR)
# - plugins/banner-hero/client.ts (hydration)
# - plugins/banner-hero/style.scss (CSS)

# 5. Atualizar schema após modificar props.ts
appecom scheme:generate banner-hero
appecom scheme:upload banner-hero

# 6. Preview do plugin no browser
appecom plugin:preview banner-hero

# OU usar preview com watch (recomendado para desenvolvimento)
appecom plugin:preview banner-hero --watch

# 7. Build final (se necessário)
appecom plugin:build
```

**📖 Novo em props?** Leia o [Guia Completo de Props](PROPS-GUIDE.md) para aprender sobre anotações JSDoc, tipos de dados, formatos especiais e boas práticas.

## 📦 Comandos Disponíveis

### Resumo Rápido

| Comando | Descrição |
|---------|-----------|
| `appecom prepare` | Inicializa ambiente (cria .env e plugins/) |
| `appecom plugin:create <name>` | Cria novo plugin e registra no sistema |
| `appecom plugin:delete <name>` | Deleta plugin do sistema e arquivos locais |
| `appecom plugin:build [plugin]` | Compila plugin(s) para produção (use --force para rebuild sem incrementar versão) |
| `appecom plugin:preview <plugin>` | Abre preview no browser |
| `appecom plugin:deploy <plugin>` | Deploy para plugin-server com versionamento (use --force para mesma versão) |
| `appecom scheme:generate <plugin>` | Gera schema.json do props.ts |
| `appecom scheme:download <plugin>` | Baixa schema do sistema |
| `appecom scheme:upload <plugin>` | Envia schema para sistema |
| `appecom watch` | Auto-rebuild ao detectar mudanças |

---

### `appecom prepare`

Prepara o ambiente de desenvolvimento criando a estrutura inicial do projeto.

**Exemplo:**
```bash
appecom prepare
```

**Isso cria:**
- `plugins/` - Diretório para seus plugins
- `.env` - Arquivo de configuração com variáveis de ambiente

**Após executar, edite o arquivo `.env` e preencha:**
- `APPECOM_STOREID` - ID da sua loja
- `APPECOM_SECRET` - Chave secreta da API

### `appecom plugin:create <nome>`

Cria um novo plugin com estrutura completa e registra no sistema.

**Exemplo básico:**
```bash
appecom plugin:create youtube-embed
```

**Com nome customizado:**
```bash
appecom plugin:create youtube-embed --name "YouTube Video Embed"
```

**Opções:**
- `-n, --name <displayName>` - Nome de exibição do app (padrão: capitaliza o nome da pasta)

**O que faz:**
1. ✅ Cria arquivos do plugin localmente
2. ✅ Builda automaticamente (gera schema.json)
3. ✅ Registra o app no sistema via API
4. ✅ Salva serviceId no manifest.json
5. ❌ Se falhar: rollback completo (deleta pastas criadas)

**Arquivos criados em `plugins/youtube-embed/`:**
- `props.ts` - Interface TypeScript (schema)
- `server.ts` - Função SSR (render)
- `client.ts` - Função hydration (interatividade)
- `style.scss` - Estilos CSS
- `manifest.json` - Metadados do plugin (com serviceId do sistema)

**⚠️ Requisitos:**
- `.env` configurado com `APPECOM_STOREID` e `APPECOM_SECRET`
- Plugin com mesmo `type` não pode existir para a mesma integração

### `appecom plugin:delete <nome>`

Deleta plugin do sistema e remove arquivos locais.

**Exemplo:**
```bash
appecom plugin:delete youtube-embed
```

**O que faz:**
1. ✅ Lê `serviceId` do `manifest.json`
2. ✅ Deleta app do sistema via API
3. ✅ Remove pasta `plugins/{nome}/`
4. ✅ Remove pasta `dist/{nome}/`
5. ❌ Se falhar: mantém arquivos locais (segurança)

**⚠️ Atenção:**
- **Ação irreversível** - deleta permanentemente do sistema
- Requer `serviceId` no manifest.json
- Se falhar no sistema, arquivos locais NÃO são deletados
- Para deletar apenas arquivos locais, remova as pastas manualmente

**⚠️ Requisitos:**
- Plugin registrado no sistema (com `serviceId` no manifest.json)
- Credenciais válidas no `.env`

### `appecom plugin:build [plugin-name]`

Compila plugins para produção.

**Compilar todos os plugins:**
```bash
appecom plugin:build
```

**Compilar um plugin específico:**
```bash
appecom plugin:build banner-hero
```

**Forçar rebuild sem incrementar versão:**
```bash
appecom plugin:build banner-hero --force
```

**Opções:**
- `-f, --force` - Força o rebuild (útil para desenvolvimento e iteração rápida)

**Output gerado em `dist/{plugin-name}/`:**
- `server.js` - Bundle ESM (para Node.js sistema)
- `client.js` - Bundle ESM (para browser)
- `style.css` - CSS compilado **com isolamento automático** (prefix `.appecom-{plugin}`)
- `schema.json` - JSON Schema auto-gerado
- `manifest.json` - Metadados do plugin (torna o plugin auto-contido)
- `props.ts` - Interface TypeScript (referência)

**Além disso, gera:**
- `dist/plugins-registry.json` - Mapa de todos os plugins disponíveis

📖 **Leia mais**: [PLUGIN-MANIFEST.md](PLUGIN-MANIFEST.md)

### `appecom watch`

Inicia watch mode para desenvolvimento com auto-rebuild.

**Exemplo:**
```bash
appecom watch
```

**Features:**
- 👀 Monitora mudanças em `plugins/`
- 🔨 Auto-rebuild quando arquivos mudam (debounce 500ms)
- ✨ Auto-scaffold quando cria pasta vazia
- 📋 Atualiza schema.json quando props.ts muda
- 📦 Atualiza plugins-registry.json automaticamente

### `appecom plugin:preview <plugin-name>`

Gera preview do plugin e abre no browser.

**Exemplo:**
```bash
appecom plugin:preview banner-hero
```

**Com watch mode:**
```bash
appecom plugin:preview banner-hero --watch
```

**O que faz:**
1. ✅ Build do plugin (se necessário)
2. ✅ Gera props de exemplo do `schema.json`
3. ✅ Executa SSR localmente (Node.js)
4. ✅ Gera `preview.html` com HTML + CSS + hydration
5. ✅ Abre preview no browser automaticamente
6. ✅ Com `--watch`: Auto-rebuild ao salvar arquivos

**Output**: `dist/{plugin-name}/preview.html`

### `appecom scheme:generate <plugin-name>`

Gera `schema.json` a partir da interface TypeScript em `props.ts`.

**Exemplo:**
```bash
appecom scheme:generate banner-hero
```

**O que faz:**
1. ✅ Lê `plugins/{plugin}/props.ts`
2. ✅ Gera `plugins/{plugin}/schema.json`
3. ✅ Copia para `dist/{plugin}/schema.json` (se dist existir)

**Quando usar:**
- Após modificar `props.ts` e querer atualizar o schema
- Antes de fazer upload para o sistema

### `appecom scheme:download <plugin-name>`

Baixa o schema atual do sistema (com modificações feitas no painel).

**Exemplo:**
```bash
appecom scheme:download banner-hero
```

**O que faz:**
1. ✅ Busca schema do sistema via API (usando `serviceId` do manifest)
2. ✅ Salva em `plugins/{plugin}/schema.json`
3. ✅ Copia para `dist/{plugin}/schema.json` (se dist existir)

**Quando usar:**
- Após modificar props no painel administrativo
- Para sincronizar schema do sistema com o local

**⚠️ Requisitos:**
- Plugin registrado no sistema (com `serviceId` no manifest.json)

### `appecom scheme:upload <plugin-name>`

Envia o schema local para o sistema.

**Exemplo:**
```bash
appecom scheme:upload banner-hero
```

**O que faz:**
1. ✅ Lê `plugins/{plugin}/schema.json`
2. ✅ Envia para sistema via API (usando `serviceId` do manifest)
3. ✅ Atualiza schema no painel administrativo

**Quando usar:**
- Após gerar novo schema com `scheme:generate`
- Para sincronizar alterações locais com o sistema

**⚠️ Requisitos:**
- Plugin registrado no sistema (com `serviceId` no manifest.json)
- `schema.json` existente no plugin

**💡 Workflow completo:**
```bash
# 1. Editar props.ts
# 2. Gerar novo schema
appecom scheme:generate my-plugin

# 3. Enviar para sistema
appecom scheme:upload my-plugin

# 4. Ou, baixar schema modificado no painel
appecom scheme:download my-plugin
```

---

### `appecom plugin:deploy <plugin-name>`

**🆕 Deploy de plugin para servidor com versionamento**

Faz deploy do plugin para o plugin-server com controle automático de versão.

**Exemplo:**
```bash
appecom plugin:deploy reviews
```

**Forçar deploy da mesma versão:**
```bash
appecom plugin:deploy reviews --force
```

**Opções:**
- `-f, --force` - Força o deploy da mesma versão sem incrementar (sobrescreve a versão existente)

**O que faz:**
1. ✅ Lê `version` do `manifest.json`
2. ✅ Cria pacote zip do plugin (dist/)
3. ✅ Faz upload para plugin-server
4. ✅ Servidor extrai para `plugins/<name>/<version>/`
5. ✅ Atualiza symlink `latest` → nova versão
6. ✅ Registra deploy em histórico
7. ✅ Remove arquivo zip local

**Exemplo de saída:**
```
🚀 Deploying plugin: reviews

📋 Step 1/5: Reading manifest...
   ✅ Plugin: Reviews
   ✅ Version: 1.0.0
   ✅ Type: reviews

📦 Step 2/5: Creating deployment package...
   ✅ Package created: 0.15 MB

☁️  Step 3/5: Uploading to server...
   📡 Server: http://localhost:4000
   ✅ Upload completed successfully

✓ Step 4/5: Verifying deployment...
   ✅ Available versions: 1.0.0
   ✅ Latest version: 1.0.0

🧹 Step 5/5: Cleaning up...
   ✅ Temporary files removed

✅ Deployment successful!

📦 Deployed: reviews@1.0.0
```

**Versionamento:**
```
plugins/
├── reviews/
│   ├── 1.0.0/           # Deploy 1
│   ├── 1.0.1/           # Deploy 2
│   ├── 1.1.0/           # Deploy 3
│   ├── latest/          # Symlink → 1.1.0
│   └── versions.json    # Histórico
```

**⚠️ Requisitos:**
- Plugin já buildado (`appecom plugin:build <plugin-name>`)
- Plugin-server rodando
- `PLUGIN_SERVER_URL` configurado no `.env`

**⚠️ Notas:**
- Não pode fazer deploy da mesma versão duas vezes (use `--force` para sobrescrever)
- Com `--force`: permite fazer deploy da mesma versão sem incrementar
- Sem `--force`: atualize `version` no `manifest.json` para novo deploy
- Versões antigas são mantidas para rollback

**Workflow recomendado:**
```bash
# 1. Editar plugin
# 2. Atualizar version no manifest.json (ou use --force)
# 3. Build
appecom plugin:build reviews

# 4. Deploy
appecom plugin:deploy reviews

# 4b. Ou forçar deploy da mesma versão (desenvolvimento)
appecom plugin:deploy reviews --force

# 5. Verificar versões no servidor
curl http://localhost:4000/api/plugins/reviews/versions
```

---

### Estrutura de um Plugin

```
meu-projeto/
├── .env                    # Credenciais (gerado por prepare)
├── plugins/
│   └── hero-banner/
│       ├── props.ts        # Interface TypeScript (schema)
│       ├── server.ts       # SSR - Renderização no sistema
│       ├── client.ts       # Hydration - Interatividade no browser
│       ├── style.scss      # Estilos CSS (com isolamento automático)
│       ├── manifest.json   # Metadados (editável, com serviceId)
│       └── schema.json     # JSON Schema (gerado automaticamente)
├── dist/
│   ├── plugins-registry.json  # Registry de todos os plugins
│   └── hero-banner/
│       ├── manifest.json   # Metadados (copiado do source)
│       ├── server.js       # Bundle ESM (Node.js)
│       ├── client.js       # Bundle ESM (Browser)
│       ├── style.css       # CSS isolado com prefix
│       ├── schema.json     # JSON Schema
│       ├── preview.html    # Preview standalone (gerado por preview)
│       └── props.ts        # Interface TypeScript
└── package.json
```

### Arquitetura: SSR + Hydration

Os plugins usam uma arquitetura híbrida para melhor performance:

#### 1️⃣ Server-side Rendering (server.ts)

Roda no **sistema (Node.js)** e retorna HTML string:

```typescript
import { Props } from "./props"

export async function render(props: Props): Promise<string> {
  // Pode fazer fetch de APIs, acessar banco, etc.
  const data = await fetch('https://api.example.com/data')
  
  return `
    <div class="appecom-hero-banner" data-plugin="hero-banner">
      <div class="hero-banner">
        <h1 class="hero-banner__title">${props.title}</h1>
        <img src="${props.imageUrl}" alt="${props.title}" />
      </div>
    </div>
  `
}
```

**⚠️ Estrutura obrigatória**:
- **Wrapper externo**: `<div class="appecom-{plugin}">` (isolamento CSS)
- **Container interno**: `<div class="{plugin}">` (seus estilos)

#### 2️⃣ Client-side Hydration (client.ts)

Roda no **browser** e adiciona interatividade:

```typescript
import { Props } from "./props"

export function hydrate(element: HTMLElement, props: Props) {
  // element = <div class="appecom-hero-banner">
  
  // Buscar elementos dentro do plugin
  const title = element.querySelector('.hero-banner__title')
  const img = element.querySelector('img')
  
  // Adicionar event listeners
  img?.addEventListener('click', () => {
    alert(`Clicked: ${props.title}`)
  })
  
  // Adicionar animações, interatividade, etc.

  // Dispatch custom event after hydration (ALTAMENTE RECOMENDADO)
  const event = new CustomEvent('appecom:plugin:hydrated', {
    detail: { pluginName: 'hero-banner', element, props },
    bubbles: true,
    cancelable: false
  })
  element.dispatchEvent(event)
}
```

**Notas importantes:**
- O `element` passado é o wrapper `.appecom-{plugin}`, use `querySelector` para acessar elementos internos
- **⚠️ ALTAMENTE RECOMENDADO**: Sempre dispare o evento `appecom:plugin:hydrated` no final do `hydrate()`
- Este evento permite que código externo escute e interaja com o plugin após a hidratação
- O evento inclui `pluginName`, `element` e `props` no `detail`

**Exemplo de uso externo:**
```typescript
// Escutar quando qualquer plugin é hidratado
document.addEventListener('appecom:plugin:hydrated', (e: CustomEvent) => {
  const { pluginName, element, props } = e.detail
  console.log(`Plugin ${pluginName} hydrated!`, element, props)
  
  // Fazer algo específico com o plugin
  if (pluginName === 'hero-banner') {
    // Adicionar analytics, modificar comportamento, etc.
  }
})
```

### 🛡️ CSS Isolation (Isolamento Automático)

Todos os estilos recebem **prefix automático** para evitar conflitos:

**Você escreve (`style.scss`):**
```scss
.container {
  padding: 2rem;
}

.button {
  background: blue;
}
```

**O build gera (`style.css`):**
```css
.appecom-hero-banner .container {
  padding: 2rem;
}

.appecom-hero-banner .button {
  background: blue;
}
```

✅ **Sem conflitos!** Cada plugin tem seu namespace isolado.

📖 **Leia mais**: [EXAMPLE-CSS-ISOLATION.md](EXAMPLE-CSS-ISOLATION.md)

### Exemplo de props.ts

```typescript
export interface Props {
  /**
   * Título do banner
   * @title Título
   * @description Texto principal exibido no banner
   * @default "Bem-vindo"
   */
  title: string

  /**
   * URL da imagem
   * @title Imagem
   * @format uri
   */
  imageUrl: string

  /**
   * Altura do banner
   * @title Altura
   * @minimum 100
   * @maximum 800
   * @default 400
   * @TJS-type integer
   */
  height: number
  
  /**
   * Mostrar ou esconder o banner
   * @title Ativo
   * @description Controla a visibilidade do banner
   * @default true
   */
  isActive: boolean
}
```

### 📋 Plugins Registry

O build gera automaticamente `dist/plugins-registry.json` que mapeia todos os plugins:

```json
{
  "hero-banner": {
    "server": "/dist/hero-banner/server.js",
    "client": "/dist/hero-banner/client.js",
    "style": "/dist/hero-banner/style.css",
    "schema": "/dist/hero-banner/schema.json"
  },
  "instagram-feed": {
    "server": "/dist/instagram-feed/server.js",
    "client": "/dist/instagram-feed/client.js",
    "style": "/dist/instagram-feed/style.css",
    "schema": "/dist/instagram-feed/schema.json"
  }
}
```

**Uso no runtime**: Carregar plugins dinamicamente baseado no registry.

### 📦 Plugin Manifest (Individual)

Cada plugin possui seu próprio `manifest.json` em **dois locais**:

**Source** (`plugins/{plugin}/manifest.json`):
```json
{
  "serviceId": "123",
  "name": "Hero Banner",
  "type": "hero-banner",
  "version": "1.0.0",
  "server": "./server.js",
  "client": "./client.js",
  "style": "./style.css",
  "schema": "./schema.json"
}
```

**Build** (`dist/{plugin}/manifest.json`):
- Copiado automaticamente do source durante o build
- Preserva `serviceId` e outras customizações

**Diferença do Registry**:
- **Registry**: Paths absolutos (`/dist/...`) - para listar todos os plugins
- **Manifest**: Paths relativos (`./...`) - para carregar plugin isoladamente

**Benefícios**:
- ✅ Plugin auto-contido (copie apenas a pasta `dist/{plugin}`)
- ✅ Editável no source (`plugins/{plugin}/manifest.json`)
- ✅ Sincronizado com sistema (via `serviceId`)
- ✅ Versionado (cada plugin tem sua versão)
- ✅ Lazy loading (carregue sob demanda)

📖 **Leia mais**: [PLUGIN-MANIFEST.md](PLUGIN-MANIFEST.md)

### JSDoc Annotations Suportadas

- `@title` - Nome amigável do campo
- `@description` - Descrição do campo
- `@minimum` / `@maximum` - Valores numéricos mínimo/máximo
- `@format` - Formato (uri, email, date-time, etc)
- `@TJS-type` - Tipo JSON Schema (integer, string, etc)
- `@default` - Valor padrão

## 📚 Documentação Adicional

### Guias Detalhados

- **[Guia de Props](PROPS-GUIDE.md)** 📝 - Documentação completa sobre como criar e configurar props para plugins
  - Anotações JSDoc suportadas (@title, @description, @default, @format, etc.)
  - Tipos de dados (string, number, boolean, enum, arrays, objetos)
  - Formatos especiais (color, date, imagepicker)
  - Estruturas complexas e validações
  - Exemplos práticos e boas práticas

- **[Manifesto de Plugin](PLUGIN-MANIFEST.md)** 📦 - Estrutura e configuração do manifest.json
  - Campos obrigatórios e opcionais
  - Versionamento de plugins
  - Sincronização com sistema

- **[Isolamento de CSS](EXAMPLE-CSS-ISOLATION.md)** 🎨 - Como funciona o isolamento automático de CSS
  - Prefix automático `.appecom-{plugin}`
  - Boas práticas de nomenclatura
  - Evitar conflitos entre plugins

### Exemplos de Plugins

Os seguintes plugins servem como referência:

- **`plugins/reviews/`** - Plugin de avaliações com carousel/grid
  - Arrays de objetos complexos
  - Configurações de cores e layout
  - Integração com cliente

- **`plugins/product-tabs/`** - Plugin de abas por produto
  - Objetos aninhados (InsertionConfig, ColorConfig)
  - Match por URL pathname
  - Accordion vertical com animações

- **`plugins/youtube-embed/`** - Plugin simples de embed
  - Props básicas
  - Exemplo minimalista

## 🤝 Contribuindo

Quer adicionar novos comandos ou melhorar o SDK? Veja o guia completo em [CONTRIBUTING.md](CONTRIBUTING.md).

### Quick Start para Desenvolvedores

```bash
# Clonar o repositório
git clone https://github.com/appdoecommerce/plugin-sdk.git
cd plugin-sdk

# Instalar dependências
npm install

# Build
npm run build

# Testar localmente
npm link
```

Para adicionar um novo comando, consulte o [guia de contribuição](CONTRIBUTING.md#-como-criar-um-novo-comando).

## 🐛 Issues e Suporte

Encontrou um bug ou tem uma sugestão? Abra uma issue em: [GitHub Issues](https://github.com/appdoecommerce/plugin-sdk/issues)

## 📄 Licença

MIT © AppDoEcommerce
