# AppDoEcommerce Plugin SDK

🚀 Developer toolkit para criar e gerenciar plugins do AppDoEcommerce.

## 🎯 O que é?

O AppDoEcommerce Plugin SDK (`@appdoecommerce/plugin-sdk`) é uma CLI completa que facilita o desenvolvimento de plugins customizados para a plataforma AppDoEcommerce. Com ele, você pode:

- ⚡ Criar estrutura de plugins com templates otimizados (SSR + Hydration)
- 🔨 Compilar plugins automaticamente (server.js, client.js, style.css)
- 🔄 Gerar JSON Schemas automaticamente a partir de TypeScript
- 🛡️ **Isolamento automático de CSS** - sem conflitos entre plugins
- 👀 Watch mode com auto-rebuild e auto-scaffold
- 📋 Registry automático de plugins para runtime
- 📦 Trabalhar com tipagem completa e validação de props

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

# 3. Criar seu primeiro plugin (registra automaticamente no backend)
appecom make:plugin banner-hero --name "Banner Hero"

# 4. Editar os arquivos do plugin
# - plugins/banner-hero/props.ts (schema)
# - plugins/banner-hero/server.ts (SSR)
# - plugins/banner-hero/client.ts (hydration)
# - plugins/banner-hero/style.scss (CSS)

# 5. Preview do plugin no browser
appecom preview banner-hero

# OU usar preview com watch (recomendado para desenvolvimento)
appecom preview banner-hero --watch

# 6. Build final (se necessário)
appecom build
```

## 📦 Comandos Disponíveis

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

### `appecom make:plugin <nome>`

Cria um novo plugin com estrutura completa e registra no backend.

**Exemplo básico:**
```bash
appecom make:plugin youtube-embed
```

**Com nome customizado:**
```bash
appecom make:plugin youtube-embed --name "YouTube Video Embed"
```

**Opções:**
- `-n, --name <displayName>` - Nome de exibição do app (padrão: capitaliza o nome da pasta)

**O que faz:**
1. ✅ Cria arquivos do plugin localmente
2. ✅ Builda automaticamente (gera schema.json)
3. ✅ Registra o app no backend via API
4. ✅ Salva serviceId no manifest.json
5. ❌ Se falhar: rollback completo (deleta pastas criadas)

**Arquivos criados em `plugins/youtube-embed/`:**
- `props.ts` - Interface TypeScript (schema)
- `server.ts` - Função SSR (render)
- `client.ts` - Função hydration (interatividade)
- `style.scss` - Estilos CSS

**⚠️ Requisitos:**
- `.env` configurado com `APPECOM_STOREID` e `APPECOM_SECRET`
- Backend rodando em `http://localhost:3333`
- Plugin com mesmo `type` não pode existir para a mesma integração

### `appecom build [plugin-name]`

Compila plugins para produção.

**Compilar todos os plugins:**
```bash
appecom build
```

**Compilar um plugin específico:**
```bash
appecom build banner-hero
```

**Output gerado em `dist/{plugin-name}/`:**
- `server.js` - Bundle ESM (para Node.js backend)
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

### `appecom preview <plugin-name>`

Gera preview do plugin e abre no browser.

**Exemplo:**
```bash
appecom preview banner-hero
```

**Com watch mode:**
```bash
appecom preview banner-hero --watch
```

**O que faz:**
1. ✅ Build do plugin (se necessário)
2. ✅ Gera props de exemplo do `schema.json`
3. ✅ Executa SSR localmente (Node.js)
4. ✅ Gera `preview.html` com HTML + CSS + hydration
5. ✅ Abre preview no browser automaticamente
6. ✅ Com `--watch`: Auto-rebuild ao salvar arquivos

**Output**: `dist/{plugin-name}/preview.html`

### `appecom schema [plugin-name]`

Gera automaticamente `schema.json` baseado nas interfaces TypeScript em `props.ts`.

**Gerar schemas de todos os plugins:**
```bash
appecom schema
```

**Gerar schema de um plugin específico:**
```bash
appecom schema instagram-feed
```

> **Nota**: O comando `build` já gera schemas automaticamente. Use este comando apenas se precisar regenerar schemas sem fazer build completo.

## 🛠️ Desenvolvimento

### Estrutura de um Plugin

```
meu-projeto/
├── .env                    # Credenciais (gerado por prepare)
├── plugins/
│   └── hero-banner/
│       ├── props.ts        # Interface TypeScript (schema)
│       ├── server.ts       # SSR - Renderização no backend
│       ├── client.ts       # Hydration - Interatividade no browser
│       └── style.scss      # Estilos CSS (com isolamento automático)
├── dist/
│   ├── plugins-registry.json  # Registry de todos os plugins
│   └── hero-banner/
│       ├── manifest.json   # Metadados (torna plugin auto-contido)
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

Roda no **backend (Node.js)** e retorna HTML string:

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
}
```

**Nota**: O `element` passado é o wrapper `.appecom-{plugin}`, use `querySelector` para acessar elementos internos.

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

📖 **Leia mais**: [CSS-ISOLATION.md](CSS-ISOLATION.md) | [EXAMPLE-CSS-ISOLATION.md](EXAMPLE-CSS-ISOLATION.md)

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

Além do registry global, cada plugin gera seu próprio `manifest.json`:

```json
{
  "name": "hero-banner",
  "version": "1.0.0",
  "server": "./server.js",
  "client": "./client.js",
  "style": "./style.css",
  "schema": "./schema.json"
}
```

**Diferença do Registry**:
- **Registry**: Paths absolutos (`/dist/...`) - para listar todos os plugins
- **Manifest**: Paths relativos (`./...`) - para carregar plugin isoladamente

**Benefícios**:
- ✅ Plugin auto-contido (copie apenas a pasta `dist/{plugin}`)
- ✅ Portável (funciona em qualquer lugar)
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
