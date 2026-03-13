# Changelog - Plugin System

## [1.1.0] - 2026-03-13

### ✨ Added

#### Plugin SDK
- **`appecom deploy <plugin>`** - Novo comando para deploy de plugins com versionamento
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
