---
title: Store global
group: Store
order: 10
source: c40c543a0104
---

O [`state`](/docs/core/state) de um componente pertence só àquele componente e some quando ele é removido. Para dados **compartilhados por muitos componentes** (um carrinho, o usuário logado, configurações), use um **store**: crie-o uma vez em um arquivo `.js`, importe-o em qualquer lugar, e todo componente que o mostra atualiza quando ele muda.

:::note[Pacote]
`store` vem do pacote `olum-store` (já incluído no template inicial):

```bash
npm i olum-store
```

O `olum` carrega ele para você, não há nada para configurar. Se você remover o pacote, chamar `store()` lança `"store is unavailable"`, e todo o resto continua funcionando.
:::

```js title="store.js"
import { store } from "olum";

export const cart = store({
  items: [],
  add(name) {
    this.items.push(name);
  },
  clear() {
    this.items = [];
  },
});
```

Os dados e as funções que os mudam (**actions**) ficam no mesmo objeto. As actions acessam os dados com `this`.

Um componente muda o store:

```html title="Shelf.html"
<script>
  import { cart } from "./store";

  const products = ["Compass", "Canteen", "Rope"];
</script>

<for each="product of products">
  <button onclick="cart.add(product)">Add {product}</button>
</for>
```

…e um componente completamente diferente o mostra, sempre sincronizado, sem props:

```html title="Basket.html"
<script>
  import { cart } from "./store";
</script>

<p>
  <strong>{cart.items.length}</strong>
  {cart.items.length === 1 ? "item" : "items"} in the basket
</p>

<if when="cart.items.length">
  <ul>
    <for each="name of cart.items">
      <li>{name}</li>
    </for>
  </ul>
  <button onclick="cart.clear()">Empty basket</button>
</if>
```

Nenhuma configuração necessária: um componente segue o store só por **lê-lo no template**. Quando o store muda, esses componentes atualizam. Componentes que só mudam o store (e nunca o mostram) não são atualizados.

:::tip
Um store é só um arquivo `.js` (só arquivos `page.html` viram rotas), então coloque-o onde fizer sentido: ao lado das páginas que o usam, ou em `utils/` para stores do app inteiro.
:::

## Actions {#actions}

Escreva actions como **métodos** (`add() {}`), não como arrow functions. Arrow functions não têm o `this` certo:

```js
export const cart = store({
  items: [],
  add(item) { this.items.push(item); },     // ✓ method: `this` is the store
  clear: () => (this.items = []),           // ✗ arrow: `this` is NOT the store
});
```

Você também pode mudar o store diretamente de um componente (`cart.items = []`). Actions são só uma forma prática de manter a lógica perto dos dados.

## Bom saber {#good-to-know}

- `store()` recebe um **objeto simples** (`{ ... }`), como o `state`. Instâncias de classes não são permitidas.
- Crie **um store por assunto** em vez de um store gigante: `cart.js`, `session.js`, `settings.js`. Os componentes importam só o que precisam.
- Como as atualizações funcionam: [Reatividade do store e agrupamento](/docs/store-reactivity). Quando usar um store: [Store vs. estado vs. props](/docs/store-vs-state).
