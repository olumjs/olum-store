---
title: Global State
group: Reactivity
order: 30
---

Component `state` is private to one instance. To share a value between components you'd otherwise thread it through props (and write it back up the tree). Olum's **store** is the zustand-style alternative: define a store once in a plain module, import it anywhere, and every component that reads it re-renders automatically when it changes.

There are no actions/reducers to register and no setter functions to call — the store is a Proxy you read, assign to, mutate in place, and call methods on directly. Assignment *is* the update.

## `store(init)` — shared state across components

Define a store in any plain `.js` module. The initializer is a **plain object**: data and actions live side by side.

```js title="store.js"
import { store } from "olum";

export const cart = store({
  items: [],
  add(name) { this.items.push(name); }, // action: `this` is the store; deep writes are reactive
  clear() { this.items = []; },
});
```

Use it from any component, at any depth — no props, no event forwarding:

```html title="Shelf.html"
<script>
  import { cart } from "./store";
</script>
<button onclick="cart.add('Rope')">Add Rope</button>
```

```html title="Basket.html"
<script>
  import { cart } from "./store";
</script>
<p>{cart.items.length} items</p>
```

Reading `cart.items` in Basket's template **subscribes** Basket. Clicking Shelf's button writes the store, and Basket re-renders. Shelf never *reads* the store while rendering, so Shelf isn't subscribed and doesn't re-render.

## What the proxy supports

`store(init)` returns a Proxy. Every key on it is your state — there are **no reserved names**, and no `getState`/`setState`/`subscribe` surface to learn:

```js
counter.count;              // read (subscribes if read during render)
counter.count = 5;          // top-level write
counter.user.name = "Bo";   // deep write — reactive
counter.items.push("x");    // in-place array method — reactive
counter.inc();              // action
delete counter.stale;       // delete — reactive
```

Deep mutations (`user.name`, `items.push`, `Set`/`Map` methods) all re-render subscribers — see [Deep Reactivity](/docs/deep-reactivity).

## The subscription model

- **Reading in a template subscribes** the component to the store. Reading elsewhere (actions, event handlers, `mounted`, a component's script body, module top level) does **not** subscribe.
- **Subscription is per component, not per state key.** A component that reads *anything* from a store re-renders on *any* write to it. Split unrelated concerns into separate stores when you want components to update independently.
- **Writes are batched.** Several mutations in one tick (e.g. an action setting three keys) trigger a single re-render per subscribed component.
- **No cleanup needed.** A component that stops reading a value, or leaves the page, simply stops updating.

:::tip[The mental model]
Treat the store like a plain object. Read what you need in the template, mutate it wherever you like — in an action, an event handler, another component — and let the store figure out who re-renders.
:::

:::note
Because tracking is per-instance and store-wide, keep a store focused on state that changes together. Unrelated concerns (say, a theme toggle and a large data table) belong in separate stores so a change to one doesn't re-render readers of the other.
:::

## Related

- [Deep Reactivity](/docs/deep-reactivity) — how nested objects, arrays, and collections react, plus the semantics and gotchas.
- [scope()](/docs/scope) — the escape hatch for reaching one specific mounted component.
