---
title: Store Reactivity & Batching
group: Store
order: 240
---

The store follows the same deep-reactivity rules as [component state](/docs/state), with one deliberate difference in **when** re-renders happen: store writes are batched.

## Subscriptions are automatic

A component subscribes to a store by **reading it while rendering** — an interpolation, a directive expression, anything the template evaluates:

```html title="Basket.html"
<script>
  import { cart } from "./store";
</script>

<p>{cart.items.length} items</p>  <!-- this read subscribes Basket to cart -->
```

There's nothing to clean up: when a subscribed component leaves the DOM, its subscription is dropped on the next store change. And if a parent and its child both read the same store, only the **parent** re-renders — re-rendering it rebuilds the child anyway, so the work isn't done twice.

## Reactivity is deep

Nested plain objects, arrays, `Map` and `Set` are all tracked — mutate them in place and subscribers re-render:

```js
cart.items.push(item);           // ✓ in-place array method
cart.items[0].qty = 2;           // ✓ any depth
cart.meta.coupon = "SAVE10";     // ✓ nested object
cart.tags.add("gift");           // ✓ Map/Set mutators
```

Non-plain objects (`Date`, DOM nodes, class instances) pass through **untracked** — after changing one, assign it back to its key to trigger a re-render.

:::warn
Writes that change nothing are skipped: setting a key to the value it already has (including re-assigning the **same reference**, `cart.items = cart.items`) does not re-render. To force a refresh, assign a fresh object or array (spread, `map`, `filter`, `slice`, …).
:::

## Writes are microtask-batched

Every store write in the current tick is **collected and painted once**, on the next microtask:

```js
export const cart = store({
  items: [],
  checkout() {
    this.items = [];
    this.meta.coupon = null;
    this.meta.lastOrder = Date.now();
    // three writes, ONE re-render
  },
});
```

Component `state` batches the same way — several mutations in a tick, or an in-place `splice` on a big array, all coalesce into a single re-render pass. So the store is **not** faster than `state` for large collections; reach for it because the data is **shared**, not for performance. See [Store vs State](/docs/store-vs-state).

The flip side: the DOM is not updated **immediately** after a write. A store write settles in **two** hops — one microtask coalesces the writes and notifies subscribers, the next runs their re-render. So a single `await Promise.resolve()` is not enough; settle the pending re-renders explicitly instead:

```js
cart.add("Rope");
await Promise.resolve();       // store notifies its subscribers
window.olum.flushUpdates();    // run their pending re-renders NOW
host.querySelector("li");      // fresh
```

Awaiting a macrotask (`await new Promise((r) => setTimeout(r))`) drains both hops too. Either way this is mostly a testing concern — inside a component you never need it, since the next render already sees the new value.
