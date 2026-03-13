# 🧪 Exemplo de CSS Isolation

## ❌ Sem Isolamento (Classes genéricas causariam conflitos)

```scss
// plugins/test-isolation/style.scss
.container {
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.button {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #667eea;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
}
```

**Problema**: Se outro plugin ou a página hospedeira usar `.container`, `.button` ou `.title`, haverá **conflitos de CSS**! 💥

---

## ✅ Com Isolamento Automático (Prefix aplicado no build)

```css
/* dist/test-isolation/style.css */
.appecom-test-isolation .container {
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.appecom-test-isolation .button {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #667eea;
}

.appecom-test-isolation .title {
  font-size: 2.5rem;
  font-weight: bold;
}
```

**Solução**: Todas as regras recebem o prefix `.appecom-test-isolation` automaticamente! ✨

---

## 🎯 Como Funciona no HTML

### ⚠️ Estrutura HTML Obrigatória

O HTML **precisa ter 2 divs**:

1. **Wrapper externo**: `.appecom-{plugin}` (isolamento CSS)
2. **Container interno**: `.{plugin}` (seus estilos)

### ✅ Server-side (server.ts) - CORRETO

```typescript
export async function render(props: Props): Promise<string> {
  return `
    <div class="appecom-test-isolation" data-plugin="test-isolation">
      <div class="test-isolation">  
        <h1 class="test-isolation__title">${props.title}</h1>
        <button class="test-isolation__button">Click me</button>
      </div>
    </div>
  `
}
```

**Estrutura**:
```
<div class="appecom-test-isolation">  ← Wrapper de isolamento
  <div class="test-isolation">        ← Container do plugin
    <h1 class="test-isolation__title">  ← Elementos BEM
```

### ❌ ERRADO (vai quebrar o CSS):

```typescript
// ❌ Sem wrapper .appecom-{plugin}
return `
  <div class="test-isolation">  
    <h1 class="test-isolation__title">${props.title}</h1>
  </div>
`
```

### CSS Aplicado

Com a estrutura correta:

```css
/* ✅ FUNCIONA - CSS encontra o wrapper */
.appecom-test-isolation .test-isolation { }           /* Wrapper → Container */
.appecom-test-isolation .test-isolation__title { }    /* Wrapper → Elemento */
.appecom-test-isolation .button { }                   /* Wrapper → Classe genérica */
```

**Por que funciona?**
- CSS procura por `.appecom-test-isolation` (wrapper externo) ✅
- Dentro dele, busca `.test-isolation`, `.button`, etc. ✅
- Isolamento completo sem conflitos! ✅

---

## 🎨 Comparação: Classes Genéricas vs BEM

### 1️⃣ Classes Genéricas (Funciona, mas não recomendado)

```scss
.container { }    // → .appecom-test-isolation .container
.button { }       // → .appecom-test-isolation .button
.title { }        // → .appecom-test-isolation .title
```

✅ **Isolado**: Sim, funciona  
⚠️ **Problema**: Genérico demais, pode confundir no DevTools

---

### 2️⃣ BEM com Nome do Plugin (✨ Recomendado)

```scss
.test-isolation {                        // → .appecom-test-isolation .test-isolation
  &__wrapper {                           // → .appecom-test-isolation .test-isolation__wrapper
    max-width: 800px;
  }
  
  &__content {                           // → .appecom-test-isolation .test-isolation__content
    padding: 1rem;
  }
  
  &.hydrated {                           // → .appecom-test-isolation .test-isolation.hydrated
    border: 3px solid gold;
  }
}
```

✅ **Isolado**: Sim  
✅ **Legível**: Sim, fácil de debugar  
✅ **Auto-documentado**: Nome do plugin visível  
✅ **Namespace duplo**: `.appecom-{plugin} .{plugin}__element`

---

## 🔍 Verificação no DevTools

### Plugin A: `banner-hero`
```css
.appecom-banner-hero .banner-hero__title { color: blue; }
```

### Plugin B: `test-isolation`
```css
.appecom-test-isolation .title { color: red; }
```

### Página Hospedeira:
```css
.title { color: green; }
```

**Resultado**:
- Título do Plugin A: 🔵 Azul
- Título do Plugin B: 🔴 Vermelho
- Título da Página: 🟢 Verde

✅ **Sem conflitos!** Cada um mantém seu estilo.

---

## 📊 Estatísticas do Build

### Arquivo Original
```
plugins/test-isolation/style.scss: 1.2 KB
```

### Arquivo Compilado
```
dist/test-isolation/style.css: 0.8 KB (comprimido + prefixado)
```

**Overhead do prefix**: ~5-10% (aceitável para garantir isolamento)

---

## 🚀 Próximos Passos

1. **Use BEM** para nomear suas classes
2. **Sempre adicione wrapper** `.appecom-{plugin-name}` no HTML
3. **Confie no build** - o prefix é automático
4. **Consulte [README.md](README.md)** para mais detalhes sobre desenvolvimento de plugins
