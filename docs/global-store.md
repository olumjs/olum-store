---
title: Global Store
group: Store
order: 10
---

A component's [`state`](/docs/core/state) belongs to that component only, and is gone when it's removed. For data **shared by many components** (a cart, the logged-in user, settings), use a **store**: create it once in a `.js` file, import it anywhere, and every component that shows it updates when it changes.

:::note[Package]
`store` comes from the `olum-store` package (already in the starter template):

```bash
npm i olum-store
```

`olum` loads it for you, nothing to set up. If you remove the package, calling `store()` throws `"store is unavailable"`, and everything else keeps working.
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

The data and the functions that change it (**actions**) live in the same object. Actions reach the data with `this`.

One component changes the store:

```html title="Shelf.html"
<script>
  import { cart } from "./store";

  const products = ["Compass", "Canteen", "Rope"];
</script>

<for each="product of products">
  <button onclick="cart.add(product)">Add {product}</button>
</for>
```

…and a completely different component shows it, always in sync, with no props:

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

No setup needed: a component follows the store just by **reading it in its template**. When the store changes, those components update. Components that only change the store (and never show it) are not updated.

:::tip
A store is just a `.js` file (only `page.html` files become routes), so put it wherever makes sense: next to the pages that use it, or in `utils/` for app-wide stores.
:::

## Actions

Write actions as **methods** (`add() {}`), not arrow functions. Arrow functions don't have the right `this`:

```js
export const cart = store({
  items: [],
  add(item) { this.items.push(item); },     // ✓ method: `this` is the store
  clear: () => (this.items = []),           // ✗ arrow: `this` is NOT the store
});
```

You can also change the store directly from a component (`cart.items = []`). Actions are just a nice way to keep the logic next to the data.

## Good to know

- `store()` takes a **plain object** (`{ ... }`), like `state`. Class instances aren't allowed.
- Make **one store per topic** instead of one giant store: `cart.js`, `session.js`, `settings.js`. Components import only what they need.
- How updates work: [Store Reactivity](/docs/store-reactivity). When to use a store: [Store vs State vs Props](/docs/store-vs-state).
