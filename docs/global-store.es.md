---
title: Store global
group: Store
order: 10
source: c40c543a0104
---

El [`state`](/docs/core/state) de un componente pertenece solo a ese componente y desaparece cuando se elimina. Para datos **compartidos por muchos componentes** (un carrito, el usuario que ha iniciado sesión, los ajustes), usa un **store**: créalo una vez en un archivo `.js`, impórtalo donde quieras, y cada componente que lo muestra se actualiza cuando cambia.

:::note[Paquete]
`store` viene del paquete `olum-store` (ya incluido en la plantilla inicial):

```bash
npm i olum-store
```

`olum` lo carga por ti, no hay nada que configurar. Si quitas el paquete, llamar a `store()` lanza `"store is unavailable"`, y todo lo demás sigue funcionando.
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

Los datos y las funciones que los cambian (**acciones**) viven en el mismo objeto. Las acciones acceden a los datos con `this`.

Un componente cambia el store:

```html title="Shelf.html"
<script>
  import { cart } from "./store";

  const products = ["Compass", "Canteen", "Rope"];
</script>

<for each="product of products">
  <button onclick="cart.add(product)">Add {product}</button>
</for>
```

…y un componente totalmente distinto lo muestra, siempre sincronizado, sin props:

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

No hace falta configurar nada: un componente sigue al store simplemente **leyéndolo en su plantilla**. Cuando el store cambia, esos componentes se actualizan. Los componentes que solo cambian el store (y nunca lo muestran) no se actualizan.

:::tip
Un store es solo un archivo `.js` (solo los archivos `page.html` se convierten en rutas), así que ponlo donde tenga sentido: junto a las páginas que lo usan, o en `utils/` si es un store de toda la app.
:::

## Acciones {#actions}

Escribe las acciones como **métodos** (`add() {}`), no como funciones flecha. Las funciones flecha no tienen el `this` correcto:

```js
export const cart = store({
  items: [],
  add(item) { this.items.push(item); },     // ✓ method: `this` is the store
  clear: () => (this.items = []),           // ✗ arrow: `this` is NOT the store
});
```

También puedes cambiar el store directamente desde un componente (`cart.items = []`). Las acciones son solo una forma cómoda de mantener la lógica junto a los datos.

## Conviene saber {#good-to-know}

- `store()` recibe un **objeto plano** (`{ ... }`), como `state`. No se permiten instancias de clases.
- Crea **un store por tema** en lugar de un store gigante: `cart.js`, `session.js`, `settings.js`. Los componentes importan solo lo que necesitan.
- Cómo funcionan las actualizaciones: [Reactividad del store y agrupación](/docs/store-reactivity). Cuándo usar un store: [Store vs. estado vs. props](/docs/store-vs-state).
