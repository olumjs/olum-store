---
title: Store vs State vs Props
group: Store
order: 30
---

There are three ways to get data into a component. Most apps use all three:

| | [`state`](/docs/core/state) | [`props`](/docs/core/components) | [`store`](/docs/global-store) |
|---|---|---|---|
| **Used by** | one component | a parent → its child | the whole app |
| **Defined in** | the component | the parent's template | a `.js` file |
| **Who can change it** | the component | nobody (read-only) | anyone who imports it |
| **Updates** | grouped | with the parent | grouped |
| **Lives until** | the component is removed | the child is removed | the app closes |

## Which one?

- **Start with `state`.** If only one component cares (a text draft, an open/closed flag), keep it in `state`. Putting it in a store just makes private data global.
- **Parent → child? Use props.** Pass data down as a [prop](/docs/core/components), and pass a function prop when the child needs to send something back up.
- **Shared or long-lived? Use a store.** When two unrelated components need the same data (cart page + cart badge in the navbar), or data must survive a page change, use a store. Changing pages removes a page and its `state`; a store keeps its value.
- **Passing a prop through a component that doesn't use it?** That's the sign: move the data to a store and import it where it's needed.

## Using them together

A component can read a store, compute values with functions, and pass parts down as props. The child doesn't need to know about the store, so it stays reusable:

```html title="Basket.html"
<script>
  import { cart } from "./store";
  import Row from "./Row";

  const state = { filter: "" };  // only this component cares: state
  const visible = () => cart.items.filter((i) => i.includes(state.filter));
</script>

<input value="{state.filter}" oninput="(e) => state.filter = e.target.value" />
<for each="item of visible()">
  <Row label="{item}" />
</for>
```

`Basket` reads `cart` in its template, so a `cart.add(...)` from **any** component updates it, and its `Row` children get the new props automatically.
