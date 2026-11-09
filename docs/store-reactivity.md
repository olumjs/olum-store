---
title: Store Reactivity & Batching
group: Store
order: 20
---

How a store updates your components: which ones update, which changes are tracked, and when the page changes. It follows the same rules as [component state](/docs/core/state).

## Following a store is automatic

A component follows a store by **reading it in its template**:

```html title="Basket.html"
<script>
  import { cart } from "./store";
</script>

<p>{cart.items.length} items</p>  <!-- this read makes Basket follow cart -->
```

- Nothing to clean up: when a component is removed, it stops following on the next store change.
- If a parent and its child both read the same store, only the **parent** updates (which updates the child too), so the work isn't done twice.

## Changes at any depth work

```js
cart.items.push(item);           // ✓ array methods
cart.items[0].qty = 2;           // ✓ any depth
cart.meta.coupon = "SAVE10";     // ✓ nested object
cart.tags.add("gift");           // ✓ Map / Set
```

Other objects (`Date`, DOM elements, class instances) are **not** tracked. After changing one, assign a **new** value to its key.

:::warn
A change that changes nothing is skipped. Assigning the same value, or the **same** object back (`cart.items = cart.items`), does nothing. To force an update, assign a new array or object (`[...arr]`, `map`, `filter`, `slice`, `{ ...obj }`).
:::

## Changes are grouped

All store changes made together are applied in **one** update:

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

Component `state` is grouped the same way, so a store is **not** faster than `state` for big lists. Use a store because data is **shared**, not for speed. See [Store vs State](/docs/store-vs-state).

### Reading the page right after a change

The page updates a moment **after** a store change, in two steps: first the store tells its components, then they update. One `await Promise.resolve()` isn't enough. Do this instead:

```js
import { flushUpdates } from "olum";

cart.add("Rope");
await Promise.resolve();       // the store tells its components
flushUpdates();                // apply their updates now
host.querySelector("li");      // up to date
```

Waiting for a timer (`await new Promise((r) => setTimeout(r))`) also works. You mostly need this in tests: inside a component, the next update already shows the new value.
