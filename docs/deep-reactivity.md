---
title: Deep Reactivity
group: Reactivity
order: 40
---

Reactivity in the store is **deep** — the same as component `state`. Nested plain objects, arrays, `Map`, and `Set` stay reactive all the way down, so in-place mutations at any depth re-render subscribers. You never wrap or annotate anything.

```js
this.items.push("x");              // ✓ triggers
this.user.name = name;             // ✓ triggers
this.tags.add("new");              // ✓ triggers (Set/Map mutators too)
this.items = [...this.items, "x"]; // ✓ reassignment triggers as well
```

- **Stable identity.** A nested value reads back as the same thing every time — `cart.user === cart.user`.
- **`Map` and `Set` are reactive too.** Their mutators (`set`, `add`, `delete`, `clear`) re-render subscribers, and a value read out of a `Map` is itself reactive, so you can read and mutate into it.

## The reactivity boundary

Only values that can safely cross a proxy are wrapped:

- **plain objects** (prototype `Object.prototype` or `null`)
- **arrays**
- **`Map`** and **`Set`**

Everything else — `Date`, DOM nodes, class instances — passes through **raw**. Mutating one of those is **invisible** to the store:

```js
cart.createdAt.setHours(0); // ✗ silent — Date is raw, not proxied
cart.createdAt = newDate;   // ✓ reassign the key instead
```

## Semantics & gotchas

**Unchanged writes are no-ops.** Assigning a value equal (`===`) to the current one re-renders nobody, and deleting a missing key does nothing — assigning the same primitive in a loop won't trigger renders.

**Actions and `this`.** Actions are just function values on the state. Called as `cart.add(...)`, `this` is the store, so both `this.items = ...` and `this.items.push(...)` re-render subscribers. Detaching an action loses `this`:

```js
const add = cart.add; add("x"); // ✗ `this` is no longer the store
cart.add("x");                  // ✓ call through the store
// or write the action as an arrow that closes over the exported proxy:
// add: (name) => cart.items.push(name)
```

**Store reads in event attributes are fine.** Calling actions and reading store values straight from an event attribute — `onclick="cart.add(product)"` — works, including inside `<for>` loops where the loop variable is in scope.

:::warn
**Templates subscribe, factories don't.** `const n = cart.items.length` in a component's script body runs once at factory time (no active render), takes a snapshot, and never updates. Read the store **in the template** (or in an action at call time) for live values.
:::
