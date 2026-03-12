# 🛡️ CSS Isolation Guide

Para evitar conflitos de CSS entre plugins e com a página hospedeira, este SDK implementa **isolamento automático de CSS**.

## 🎯 Problema

Quando múltiplos plugins usam classes genéricas, ocorrem conflitos:

```css
/* Plugin A */
.container { background: red; }

/* Plugin B */
.container { background: blue; } /* ❌ Conflito! */
```

## ✅ Solução Implementada: Prefix Automático

Durante o build, **todas as regras CSS são automaticamente prefixadas** com `.appecom-{plugin-name}`.

### Como Funciona

**Você escreve** (`plugins/banner-hero/style.scss`):
```scss
.container {
  padding: 1rem;
  
  .title {
    font-size: 2rem;
  }
}
```

**O build gera** (`dist/banner-hero/style.css`):
```css
.appecom-banner-hero .container {
  padding: 1rem;
}

.appecom-banner-hero .container .title {
  font-size: 2rem;
}
```

### ✨ Benefícios

- ✅ **Automático**: Não requer mudanças no código
- ✅ **Zero configuração**: Funciona out-of-the-box
- ✅ **Sem conflitos**: Cada plugin tem seu namespace
- ✅ **Compatível com Sass**: Usa `&`, aninhamento, etc.

## 📦 Estrutura HTML Obrigatória

Para o CSS isolado funcionar, o HTML precisa ter **2 divs aninhadas**:

```typescript
// server.ts
export async function render(props: Props): Promise<string> {
  return `
    <div class="appecom-{plugin-name}" data-plugin="{plugin-name}">
      <div class="{plugin-name}">
        <!-- Seu conteúdo aqui -->
      </div>
    </div>
  `
}
```

**Explicação**:
1. **Div externa** `.appecom-{plugin-name}`: Wrapper de isolamento (CSS procura por ela)
2. **Div interna** `.{plugin-name}`: Container do plugin (seus estilos)

**Exemplo concreto**:
```html
<div class="appecom-banner-hero" data-plugin="banner-hero">
  <div class="banner-hero">
    <h1 class="banner-hero__title">Título</h1>
    <button class="banner-hero__button">Clique</button>
  </div>
</div>
```

**CSS gerado**:
```css
.appecom-banner-hero .banner-hero { }              /* ✅ Combina! */
.appecom-banner-hero .banner-hero__title { }       /* ✅ Combina! */
.appecom-banner-hero .banner-hero__button { }      /* ✅ Combina! */
```

> **Nota**: Os templates do `appecom make:plugin` já geram essa estrutura automaticamente.

## 📋 Regras Ignoradas

Alguns seletores **não recebem prefix** para evitar quebras:

```css
html { }        /* ✅ Mantido */
body { }        /* ✅ Mantido */
:root { }       /* ✅ Mantido */
* { }           /* ✅ Mantido */
```

## 🎨 Melhores Práticas

### ✅ Recomendado: BEM com nome do plugin

```scss
.banner-hero {
  &__title {
    font-size: 2rem;
  }
  
  &__button {
    padding: 1rem;
    
    &--primary {
      background: blue;
    }
  }
}
```

**Vantagens**:
- Namespace duplo: `.appecom-banner-hero .banner-hero__title`
- Fácil de debugar no DevTools
- Auto-documentado (nome do plugin visível)

### ⚠️ Funciona, mas não recomendado

```scss
.container { /* Funciona, mas genérico demais */
  .title { }
}
```

## 🔧 Métodos Alternativos

### 2️⃣ Shadow DOM (Opcional)

Para **isolamento total** (CSS + JavaScript), use Shadow DOM no `client.ts`:

```typescript
export function hydrate(element: HTMLElement, props: Props) {
  // Criar Shadow Root
  const shadow = element.attachShadow({ mode: 'open' })
  
  // Injetar HTML
  shadow.innerHTML = element.innerHTML
  
  // Injetar CSS isolado
  const style = document.createElement('style')
  style.textContent = `
    .title {
      font-size: 2rem; /* ✅ Totalmente isolado! */
    }
  `
  shadow.appendChild(style)
  
  // Event listeners no shadow DOM
  shadow.querySelector('.title')?.addEventListener('click', () => {})
}
```

**Vantagens**:
- ✅ Isolamento total (CSS não vaza)
- ✅ Não precisa de prefix

**Desvantagens**:
- ❌ Mais complexo
- ⚠️ Pode afetar SEO (conteúdo do shadow não é indexado)
- ⚠️ Estilos globais não entram (ex: fontes)

### 3️⃣ CSS Modules (Não implementado)

CSS Modules geraria hashes únicos, mas requer:
- Mudança na arquitetura
- Build mais complexo
- Client.ts precisaria conhecer os nomes gerados

**Não recomendado** para este projeto.

## 🧪 Testando o Isolamento

### 1. Criar plugin
```bash
appecom make:plugin test-isolation
```

### 2. Editar `plugins/test-isolation/style.scss`
```scss
.generic-class {
  color: red;
}
```

### 3. Build
```bash
appecom build test-isolation
```

### 4. Verificar output
```bash
cat dist/test-isolation/style.css
```

Deve ver:
```css
.appecom-test-isolation .generic-class{color:red}
```

## ❓ FAQ

**P: Posso desabilitar o prefix automático?**  
R: Não. É aplicado sempre para garantir isolamento.

**P: E se eu quiser estilizar elementos globais?**  
R: Use seletores como `html`, `body`, `:root` que não são prefixados.

**P: O prefix aumenta o tamanho do CSS?**  
R: Sim, mas minimamente (~20 bytes por regra). O isolamento compensa.

**P: Funciona com @media queries?**  
R: Sim! O prefix é adicionado dentro das media queries.

## 🔍 Debug

Para ver o CSS sem minificação, edite `src/commands/build-plugin.ts`:

```typescript
const sassResult = compile(stylePath, {
  style: "expanded", // ← Mude de "compressed" para "expanded"
  loadPaths: [pluginDir],
})
```

Rebuild e veja o CSS formatado em `dist/{plugin}/style.css`.
