# Changelog - Plugin System

## [1.2.0] - 2026-03-29

### ✨ Added

#### Plugin SDK
- **Flag `--force` no comando `plugin:deploy`** - Permite sobrescrever versão existente
  - Útil durante desenvolvimento para não precisar incrementar versão a cada teste
  - Uso: `appecom plugin:deploy <plugin> --force` ou `-f`
  - Quando usado, remove e sobrescreve a versão existente no servidor
  - Atualiza histórico de versões automaticamente

#### Plugin Server
- **Suporte a force deploy** - Aceita parâmetro `force` no endpoint `/api/plugins/deploy`
  - Quando `force=true`, permite sobrescrever versão existente
  - Remove versão anterior antes de extrair nova
  - Atualiza `versions.json` removendo entradas duplicadas

### 📝 Changed

#### Comandos renomeados (nomenclatura consistente)
- `appecom build` → `appecom plugin:build`
- `appecom preview` → `appecom plugin:preview`
- `appecom scheme:get` → `appecom scheme:download`
- `appecom deploy` → `appecom plugin:deploy`

#### Documentação
- README.md atualizado com informações sobre `--force`
- Exemplos de workflow para desenvolvimento vs produção
- Tabela de comandos reorganizada por categoria

---

## [1.1.0] - 2026-03-13

### ✨ Added

#### Plugin SDK
- **`appecom plugin:deploy <plugin>`** - Novo comando para deploy de plugins com versionamento
  - Cria pacote zip automaticamente
  - Lê versão do manifest.json
  - Upload para plugin-server com progress
  - Limpeza automática de arquivos temporários
  
- **Dependências adicionadas:**
  - `archiver` - Para criação de arquivos zip
  - `form-data` - Para upload multipart
  - `node-fetch` - Para requisições HTTP

- **Variável de ambiente:**
  - `PLUGIN_SERVER_URL` - URL do plugin-server para deploy

#### Plugin Server
- **`POST /api/plugins/deploy`** - Endpoint para receber deploys
  - Aceita arquivo zip via multipart/form-data
  - Extrai para `plugins/<name>/<version>/`
  - Cria symlink `latest` apontando para versão mais recente
  - Registra histórico em `versions.json`
  - Validação de versão duplicada

- **`GET /api/plugins/:name/versions`** - Lista versões disponíveis
  - Retorna array de versões
  - Indica qual é a `latest`
  - Mostra histórico completo de deploys

- **Versionamento automático:**
  - Estrutura: `plugins/<name>/<version>/`
  - Symlink `latest` → versão mais recente
  - Histórico em `versions.json`
  - Suporte a rollback

- **Dependências adicionadas:**
  - `multer` - Para upload de arquivos
  - `unzipper` - Para extrair arquivos zip

### 🔧 Changed

#### Plugin SDK
- Comando `build` agora preserva `schema.json` do dashboard
  - Não regenera schema automaticamente
  - Use `appecom scheme:generate` para gerar novo schema

#### Plugin Server
- Diretório `.tmp/` adicionado ao `.gitignore`
- Limite de upload: 50MB por arquivo

### 📚 Documentation

- Documentação completa do comando `deploy` no README.md
- Exemplos de uso com versionamento
- Estrutura de diretórios explicada
- Workflow recomendado documentado

### 🐛 Fixed

- Plugin server agora usa imports corretos (fs, createReadStream)
- Preview agora serve via HTTP para evitar problemas de CORS

---

## [1.0.0] - 2026-03-10

### Initial Release

- Plugin SDK com comandos básicos
- Plugin Server microservice
- Sistema de SSR + Hydration
- CSS Isolation automático
- JSON Schema generation
