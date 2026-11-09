---
title: Reatividade do store e agrupamento
group: Store
order: 20
source: d43bf527b7e0
---

Como um store atualiza os seus componentes: quais atualizam, quais mudanças são rastreadas e quando a página muda. Ele segue as mesmas regras do [state de componente](/docs/core/state).

## Seguir um store é automático {#following-a-store-is-automatic}

Um componente segue um store **lendo-o no template**:

```html title="Basket.html"
<script>
  import { cart } from "./store";
</script>

<p>{cart.items.length} items</p>  <!-- this read makes Basket follow cart -->
```

- Não há nada para limpar: quando um componente é removido, ele para de seguir na próxima mudança do store.
- Se um pai e o seu filho leem o mesmo store, só o **pai** atualiza (o que atualiza o filho também), então o trabalho não é feito duas vezes.

## Mudanças em qualquer profundidade funcionam {#changes-at-any-depth-work}

```js
cart.items.push(item);           // ✓ array methods
cart.items[0].qty = 2;           // ✓ any depth
cart.meta.coupon = "SAVE10";     // ✓ nested object
cart.tags.add("gift");           // ✓ Map / Set
```

Outros objetos (`Date`, elementos do DOM, instâncias de classes) **não** são rastreados. Depois de mudar um deles, atribua um valor **novo** à chave dele.

:::warn
Uma mudança que não muda nada é ignorada. Atribuir o mesmo valor, ou o **mesmo** objeto de volta (`cart.items = cart.items`), não faz nada. Para forçar uma atualização, atribua um array ou objeto novo (`[...arr]`, `map`, `filter`, `slice`, `{ ...obj }`).
:::

## As mudanças são agrupadas {#changes-are-grouped}

Todas as mudanças no store feitas juntas são aplicadas em **uma** única atualização:

```js
export const cart = store({
  items: [],
  meta: { coupon: null, lastOrder: null },
  checkout() {
    this.items = [];
    this.meta.coupon = null;
    this.meta.lastOrder = Date.now();
    // three changes, ONE update
  },
});
```

O `state` de componente é agrupado do mesmo jeito, então um store **não** é mais rápido que `state` para listas grandes. Use um store porque os dados são **compartilhados**, não por velocidade. Veja [Store vs. estado vs. props](/docs/store-vs-state).

### Lendo a página logo depois de uma mudança {#reading-the-page-right-after-a-change}

A página atualiza um instante **depois** de uma mudança no store, em dois passos: primeiro o store avisa os seus componentes, depois eles atualizam. Um único `await Promise.resolve()` não basta. Faça assim:

```js
import { flushUpdates } from "olum";

cart.add("Rope");
await Promise.resolve();       // the store tells its components
flushUpdates();                // apply their updates now
host.querySelector("li");      // up to date
```

Esperar um timer (`await new Promise((r) => setTimeout(r))`) também funciona. Você precisa disso principalmente em testes: dentro de um componente, a próxima atualização já mostra o valor novo.
