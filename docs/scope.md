---
title: scope()
group: Reactivity
order: 50
---

`scope(name, index = 0)` answers a different question than [`store`](/docs/store). Not *"what state do these components share?"* but *"hand me **that mounted component**, wherever it sits in the tree."* It's the escape hatch for tests, devtools, and the occasional "poke that component from outside" case.

```js
import { scope } from "olum";

const basket = scope("Basket");

basket.el;                 // the component's root element
basket.state.note = "hi";  // live state proxy — writes re-render that component
basket.methods.refresh();  // its top-level functions
basket.props;              // its incoming-props proxy (read-only — props flow one way)
basket.key;                // the resolved runtime instance key, e.g. "page>Basket#0"
```

## Matching a component

Runtime instance keys are **hierarchical paths** — `page>Card#1`, `page>List#0>Item@42` — so the lookup matches the **tail segment** of each key, ignoring the positional `#i` or keyed `@key` suffix.

When several instances of the same component are mounted, `index` picks the occurrence, in store-creation order:

```js
scope("Item", 2); // the third mounted <Item>
```

A name that matches nothing **warns and returns `null`**.

:::tip
Prefer [`store`](/docs/store) for anything two components both care about. `scope` is deliberately a narrow tool — reach for it only when you genuinely need a handle on one specific instance.
:::
