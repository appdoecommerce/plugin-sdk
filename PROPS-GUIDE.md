# Guia de Props para Desenvolvedores

Este guia documenta como criar e configurar props para plugins do App do E-commerce.

## Índice

- [Conceitos Básicos](#conceitos-básicos)
- [Anotações JSDoc](#anotações-jsdoc)
- [Tipos de Dados](#tipos-de-dados)
- [Formatos Especiais](#formatos-especiais)
- [Estruturas Complexas](#estruturas-complexas)
- [Validações](#validações)
- [Valores Padrão](#valores-padrão)
- [Exemplos Práticos](#exemplos-práticos)

---

## Conceitos Básicos

As props de um plugin são definidas no arquivo `props.ts` usando interfaces TypeScript. Essas interfaces são convertidas automaticamente em JSON Schema para validação e geração de formulários.

### Estrutura Básica

```typescript
/**
 * Props interface for meu-plugin plugin
 */
export interface Props {
  /**
   * Enable or disable the component
   * 
   * @title Ativar Componente
   * @description Mostrar ou ocultar o componente na página
   * @default true
   */
  ativar: boolean
}
```

### Arquitetura

```
props.ts (TypeScript Interface)
    ↓
schema.json (JSON Schema)
    ↓
Formulário de Configuração
```

---

## Anotações JSDoc

As anotações JSDoc são usadas para adicionar metadados às propriedades das props. Todas as anotações devem estar dentro do comentário JSDoc acima da propriedade.

### Anotações Obrigatórias

#### `@title`
Define o título exibido no formulário de configuração.

```typescript
/**
 * @title Nome do Produto
 */
nome: string
```

#### `@description`
Descreve o propósito da propriedade (aparece como hint/tooltip).

```typescript
/**
 * @title Cor do Fundo
 * @description Cor de fundo do componente
 */
corDoFundo: string
```

### Anotações Opcionais

#### `@default`
Define o valor padrão da propriedade.

```typescript
/**
 * @title Título
 * @default "Meu Título"
 */
titulo: string

/**
 * @title Quantidade
 * @default 5
 */
quantidade: number

/**
 * @title Ativo
 * @default true
 */
ativo: boolean
```

#### `@format`
Especifica um formato especial para o campo (ver [Formatos Especiais](#formatos-especiais)).

```typescript
/**
 * @title Cor Principal
 * @format color
 */
cor: string

/**
 * @title Data de Início
 * @format date
 */
data: string

/**
 * @title Imagem do Banner
 * @format imagepicker
 */
imagem: string
```

#### `@minimum` / `@maximum`
Define valores mínimos e máximos para números.

```typescript
/**
 * @title Nota
 * @minimum 0
 * @maximum 5
 */
nota: number

/**
 * @title Idade
 * @minimum 18
 */
idade: number
```

#### `@TJS-type`
Força um tipo específico no JSON Schema (útil para inteiros).

```typescript
/**
 * @title Quantidade de Itens
 * @TJS-type integer
 * @minimum 1
 * @default 3
 */
quantidade: number
```

---

## Tipos de Dados

### String

```typescript
/**
 * @title Nome
 * @description Nome do usuário
 * @default "João Silva"
 */
nome: string
```

### Number

```typescript
/**
 * @title Preço
 * @description Preço do produto em reais
 * @default 99.90
 */
preco: number

/**
 * @title Quantidade
 * @TJS-type integer
 * @minimum 1
 * @default 1
 */
quantidade: number
```

### Boolean

```typescript
/**
 * @title Exibir Título
 * @description Mostrar ou ocultar o título
 * @default true
 */
exibirTitulo: boolean
```

### Enum (Opções Fixas)

```typescript
/**
 * @title Tamanho
 * @description Tamanho do componente
 * @default "medium"
 */
tamanho: "small" | "medium" | "large"

/**
 * @title Posição
 * @description Posição de inserção no DOM
 * @default "beforeend"
 */
posicao: "beforebegin" | "afterbegin" | "beforeend" | "afterend"
```

### Array

```typescript
/**
 * @title Tags
 * @description Lista de tags
 */
tags: string[]

/**
 * @title Produtos
 * @description Lista de produtos
 */
produtos: Product[] // Onde Product é uma interface definida
```

### Object (Interface Aninhada)

```typescript
export interface ColorConfig {
  /**
   * @title Cor do Texto
   * @format color
   * @default "#000000"
   */
  texto: string

  /**
   * @title Cor do Fundo
   * @format color
   * @default "#ffffff"
   */
  fundo: string
}

export interface Props {
  /**
   * @title Configurações de Cores
   * @description Define as cores do componente
   */
  cores: ColorConfig
}
```

---

## Formatos Especiais

### Color Picker (`@format color`)

Exibe um seletor de cores visual.

```typescript
/**
 * @title Cor Principal
 * @description Cor primária do componente
 * @format color
 * @default "#007bff"
 */
corPrincipal: string
```

### Date Picker (`@format date`)

Exibe um seletor de data.

```typescript
/**
 * @title Data de Publicação
 * @description Data de publicação do conteúdo
 * @format date
 */
dataPublicacao: string
```

### Image Picker (`@format imagepicker`)

Exibe um seletor de imagens com upload.

```typescript
/**
 * @title Imagem de Fundo
 * @description Imagem de fundo do banner
 * @format imagepicker
 */
imagemFundo: string
```

---

## Estruturas Complexas

### Objetos Aninhados

Use interfaces separadas para organizar configurações complexas.

```typescript
export interface InsertionConfig {
  /**
   * @title Seletor CSS
   * @description Classe ou ID do elemento alvo
   * @default ".product-details"
   */
  seletor: string

  /**
   * @title Posição
   * @description Posição relativa ao elemento
   * @default "beforeend"
   */
  posicao: "beforebegin" | "afterbegin" | "beforeend" | "afterend"
}

export interface Props {
  /**
   * @title Configuração de Inserção
   * @description Define onde o plugin será inserido
   */
  insercao: InsertionConfig
}
```

### Arrays de Objetos

Ideal para listas dinâmicas de itens.

```typescript
export interface Tab {
  /**
   * @title Nome da Aba
   * @description Título exibido na aba
   */
  nome: string

  /**
   * @title Conteúdo
   * @description Conteúdo HTML da aba
   */
  conteudo: string
}

export interface Props {
  /**
   * @title Abas
   * @description Lista de abas do componente
   */
  abas: Tab[]
}
```

### Arrays Aninhados

```typescript
export interface Product {
  /**
   * @title Nome do Produto
   */
  nome: string

  /**
   * @title Abas
   * @description Abas específicas deste produto
   */
  abas: Tab[]
}

export interface Props {
  /**
   * @title Produtos
   * @description Lista de produtos com suas abas
   */
  produtos: Product[]
}
```

---

## Validações

### Valores Mínimos e Máximos

```typescript
/**
 * @title Avaliação
 * @description Nota de 1 a 5 estrelas
 * @TJS-type integer
 * @minimum 1
 * @maximum 5
 * @default 5
 */
avaliacao: number
```

### Propriedades Opcionais

Use `?` para tornar uma propriedade opcional.

```typescript
export interface Props {
  /**
   * @title Título (Obrigatório)
   */
  titulo: string

  /**
   * @title Subtítulo (Opcional)
   */
  subtitulo?: string
}
```

### Enums para Validação

```typescript
/**
 * @title Modo de Exibição
 * @description Como o conteúdo será exibido
 * @default "grid"
 */
modo: "grid" | "list" | "carousel"
```

---

## Valores Padrão

### Valores Primitivos

```typescript
/**
 * @title Ativo
 * @default true
 */
ativo: boolean

/**
 * @title Título
 * @default "Meu Título"
 */
titulo: string

/**
 * @title Quantidade
 * @default 10
 */
quantidade: number
```

### Valores Padrão em Objetos

Defina valores padrão nas propriedades individuais:

```typescript
export interface ColorConfig {
  /**
   * @title Cor do Texto
   * @format color
   * @default "#333333"
   */
  corTexto: string

  /**
   * @title Cor do Fundo
   * @format color
   * @default "#ffffff"
   */
  corFundo: string
}
```

### Valores Padrão em Arrays (via Schema)

Para arrays, os valores padrão devem ser definidos no `schema.json`:

```json
{
  "properties": {
    "produtos": {
      "type": "array",
      "items": { "$ref": "#/definitions/Product" },
      "default": [
        {
          "nome": "Produto Exemplo",
          "preco": 99.90
        }
      ]
    }
  }
}
```

---

## Exemplos Práticos

### Exemplo 1: Plugin de Banner Simples

```typescript
export interface Props {
  /**
   * @title Ativar Banner
   * @description Exibir ou ocultar o banner
   * @default true
   */
  ativo: boolean

  /**
   * @title Título
   * @description Título do banner
   * @default "Bem-vindo!"
   */
  titulo: string

  /**
   * @title Imagem de Fundo
   * @description Imagem de fundo do banner
   * @format imagepicker
   */
  imagemFundo: string

  /**
   * @title Cor do Texto
   * @description Cor do texto do banner
   * @format color
   * @default "#ffffff"
   */
  corTexto: string
}
```

### Exemplo 2: Plugin de Avaliações

```typescript
export interface Review {
  /**
   * @title Autor
   * @description Nome do autor da avaliação
   */
  autor: string

  /**
   * @title Nota
   * @description Nota de 1 a 5 estrelas
   * @TJS-type integer
   * @minimum 1
   * @maximum 5
   * @default 5
   */
  nota: number

  /**
   * @title Comentário
   * @description Texto da avaliação
   */
  comentario: string

  /**
   * @title Foto (Opcional)
   * @description Foto do autor
   * @format imagepicker
   */
  foto?: string

  /**
   * @title Data
   * @description Data da avaliação
   * @format date
   */
  data?: string
}

export interface Props {
  /**
   * @title Título
   * @description Título da seção
   * @default "Avaliações dos Clientes"
   */
  titulo: string

  /**
   * @title Modo de Exibição
   * @description Como exibir as avaliações
   * @default "carousel"
   */
  modo: "carousel" | "grid" | "list"

  /**
   * @title Cor de Destaque
   * @description Cor das estrelas e destaques
   * @format color
   * @default "#ffd700"
   */
  corDestaque: string

  /**
   * @title Avaliações
   * @description Lista de avaliações
   */
  avaliacoes: Review[]
}
```

### Exemplo 3: Plugin com Configurações Avançadas

```typescript
export interface InsertionConfig {
  /**
   * @title Seletor CSS
   * @description Elemento onde o plugin será inserido
   * @default ".product-container"
   */
  seletor: string

  /**
   * @title Posição
   * @description Posição relativa ao elemento
   * @default "beforeend"
   */
  posicao: "beforebegin" | "afterbegin" | "beforeend" | "afterend"
}

export interface ColorPalette {
  /**
   * @title Cor Primária
   * @format color
   * @default "#007bff"
   */
  primaria: string

  /**
   * @title Cor Secundária
   * @format color
   * @default "#6c757d"
   */
  secundaria: string

  /**
   * @title Cor de Sucesso
   * @format color
   * @default "#28a745"
   */
  sucesso: string
}

export interface Tab {
  /**
   * @title Título
   */
  titulo: string

  /**
   * @title Ícone (Opcional)
   * @description URL do ícone
   * @format imagepicker
   */
  icone?: string

  /**
   * @title Conteúdo
   * @description Conteúdo HTML
   */
  conteudo: string
}

export interface Product {
  /**
   * @title URL do Produto
   * @description Pathname da página (/produto-x)
   * @default "/produto"
   */
  url: string

  /**
   * @title Abas
   * @description Abas específicas deste produto
   */
  abas: Tab[]
}

export interface Props {
  /**
   * @title Ativar
   * @default true
   */
  ativo: boolean

  /**
   * @title Inserção
   * @description Configuração de inserção no DOM
   */
  insercao: InsertionConfig

  /**
   * @title Cores
   * @description Paleta de cores
   */
  cores: ColorPalette

  /**
   * @title Produtos
   * @description Lista de produtos com abas
   */
  produtos: Product[]

  /**
   * @title Exibir Ícones
   * @description Mostrar ícones nas abas
   * @default true
   */
  exibirIcones: boolean

  /**
   * @title Duração da Animação
   * @description Duração em milissegundos
   * @TJS-type integer
   * @minimum 0
   * @maximum 5000
   * @default 300
   */
  duracaoAnimacao: number
}
```

---

## Boas Práticas

### 1. Nomenclatura
- Use nomes descritivos em **camelCase**
- Prefira português para propriedades visíveis ao usuário
- Use inglês apenas se for convenção do projeto

### 2. Organização
- Agrupe propriedades relacionadas em interfaces separadas
- Use interfaces aninhadas para configurações complexas
- Mantenha a interface `Props` principal simples e legível

### 3. Documentação
- Sempre inclua `@title` e `@description`
- Use `@default` sempre que possível
- Seja específico nas descrições

### 4. Validações
- Use `@minimum` e `@maximum` para números
- Use enums para valores fixos
- Marque como opcional (`?`) apenas quando realmente opcional

### 5. Valores Padrão Sensatos
- Defina valores padrão que funcionem "out of the box"
- Use valores neutros para cores
- Forneça exemplos úteis nos arrays

---

## Geração de Schema

Após definir as props em `props.ts`, execute:

```bash
appecom schema:generate
```

Ou faça o build do plugin (que gera o schema automaticamente):

```bash
appecom plugin:build nome-do-plugin
```

O arquivo `schema.json` será gerado automaticamente a partir das anotações JSDoc.

---

## Troubleshooting

### Schema não está sendo gerado corretamente

1. Verifique se todas as anotações JSDoc estão corretas
2. Certifique-se de que a interface `Props` está exportada
3. Execute `appecom schema:generate` manualmente

### Valores padrão não aparecem

1. Verifique a sintaxe do `@default`
2. Para objetos complexos, defina padrões nas propriedades individuais
3. Para arrays, considere adicionar manualmente no `schema.json`

### Formato especial não funciona

1. Verifique se o `@format` está escrito corretamente
2. Formatos suportados: `color`, `date`, `imagepicker`
3. O tipo da propriedade deve ser `string`

---

## Referência Rápida

| Anotação | Uso | Exemplo |
|----------|-----|---------|
| `@title` | Título no formulário | `@title Nome do Produto` |
| `@description` | Descrição/hint | `@description Cor de fundo do banner` |
| `@default` | Valor padrão | `@default "#ffffff"` |
| `@format color` | Color picker | `@format color` |
| `@format date` | Date picker | `@format date` |
| `@format imagepicker` | Image picker | `@format imagepicker` |
| `@minimum` | Valor mínimo | `@minimum 0` |
| `@maximum` | Valor máximo | `@maximum 100` |
| `@TJS-type integer` | Forçar inteiro | `@TJS-type integer` |

### Tipos TypeScript

| Tipo | Schema JSON | Uso |
|------|-------------|-----|
| `string` | `"type": "string"` | Textos |
| `number` | `"type": "number"` | Decimais |
| `number` + `@TJS-type integer` | `"type": "integer"` | Inteiros |
| `boolean` | `"type": "boolean"` | Sim/Não |
| `"a" \| "b"` | `"enum": ["a", "b"]` | Opções fixas |
| `Type[]` | `"type": "array"` | Listas |
| `Interface` | `"$ref": "#/definitions/..."` | Objetos aninhados |

---

## Conclusão

Este guia cobre os principais aspectos da definição de props para plugins. Para exemplos completos, consulte os plugins existentes:

- `plugins/reviews/props.ts` - Exemplo com arrays e configurações
- `plugins/product-tabs/props.ts` - Exemplo com objetos aninhados complexos
- `plugins/youtube-embed/props.ts` - Exemplo simples

Para mais informações, consulte o [README.md](README.md) principal.
