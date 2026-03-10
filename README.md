# AppDoEcommerce Plugin SDK

🚀 Developer toolkit para criar e gerenciar plugins do AppDoEcommerce.

## 🎯 O que é?

O AppDoEcommerce Plugin SDK (`@appdoecommerce/plugin-sdk`) é uma CLI completa que facilita o desenvolvimento de plugins customizados para a plataforma AppDoEcommerce. Com ele, você pode:

- ⚡ Criar estrutura de plugins com templates otimizados
- 🔄 Gerar JSON Schemas automaticamente a partir de TypeScript
- 🛠️ Preparar ambiente de desenvolvimento rapidamente
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
# Edite APPECOM_STOREID e APPECOM_SECRET

# 3. Criar seu primeiro plugin
appecom make:plugin hero-banner

# 4. Gerar o schema JSON
appecom schema
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

Cria um novo plugin com estrutura completa.

**Exemplo:**
```bash
appecom make:plugin youtube-embed
```

**Isso cria:**
- `plugins/youtube-embed/` - Pasta do plugin
- `plugins/youtube-embed/index.ts` - Arquivo principal do plugin
- `plugins/youtube-embed/props.ts` - Interface de propriedades com JSDoc annotations

**Próximos passos após criar o plugin:**
1. Edite `props.ts` para definir as propriedades do seu plugin
2. Edite `index.ts` para implementar a lógica do plugin
3. Execute `appecom schema` para gerar o JSON Schema

### `appecom schema [plugin-name]`

Gera automaticamente `schema.json` para todos os plugins ou para um plugin específico baseado nas interfaces TypeScript em `props.ts`.

**Gerar schemas de todos os plugins:**
```bash
appecom schema
```

**Gerar schema de um plugin específico:**
```bash
appecom schema instagram-feed
```

Esse comando:
- Procura por todos os plugins em `plugins/` (ou apenas o plugin especificado)
- Lê o arquivo `props.ts` de cada plugin
- Gera `schema.json` baseado nas anotações JSDoc da interface `Props`

## 🛠️ Desenvolvimento

### Estrutura de um Plugin

```
meu-projeto/
├── .env                    # Credenciais (gerado por prepare)
├── plugins/
│   └── hero-banner/
│       ├── index.ts        # Lógica do plugin
│       ├── props.ts        # Interface TypeScript
│       └── schema.json     # Schema JSON (auto-gerado)
└── package.json
```

### Exemplo de props.ts

```typescript
export interface Props {
  /**
   * Título do banner
   * @title Título
   * @description Texto principal exibido no banner
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
   * @TJS-type integer
   */
  height: number
}
```

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
