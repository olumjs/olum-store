---
title: 全局 Store
group: Store
order: 10
source: c40c543a0104
---

组件的 [`state`](/docs/core/state) 只属于这个组件，组件被移除时它也随之消失。对于**被多个组件共享**的数据（购物车、已登录的用户、设置），请使用 **store**：在一个 `.js` 文件中创建一次，在任何地方导入，每个显示它的组件都会在它变化时更新。

:::note[包]
`store` 来自 `olum-store` 包（入门模板中已经包含）：

```bash
npm i olum-store
```

`olum` 会帮你加载它，不需要任何设置。如果你移除了这个包，调用 `store()` 会抛出 `"store is unavailable"`，其他一切照常工作。
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

数据和修改数据的函数（**actions**）放在同一个对象中。actions 通过 `this` 访问数据。

一个组件修改 store：

```html title="Shelf.html"
<script>
  import { cart } from "./store";

  const products = ["Compass", "Canteen", "Rope"];
</script>

<for each="product of products">
  <button onclick="cart.add(product)">Add {product}</button>
</for>
```

……而一个完全不同的组件显示它，始终保持同步，无需 props：

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

不需要任何设置：组件只要**在模板中读取** store 就会订阅它。store 变化时，这些组件就会更新。只修改 store（但从不显示它）的组件不会被更新。

:::tip
store 只是一个 `.js` 文件（只有 `page.html` 文件才会成为路由），所以放在哪里合适就放在哪里：放在使用它的页面旁边，或者把全应用的 store 放在 `utils/` 中。
:::

## Actions {#actions}

把 actions 写成**方法**（`add() {}`），而不是箭头函数。箭头函数拿不到正确的 `this`：

```js
export const cart = store({
  items: [],
  add(item) { this.items.push(item); },     // ✓ method: `this` is the store
  clear: () => (this.items = []),           // ✗ arrow: `this` is NOT the store
});
```

你也可以直接在组件中修改 store（`cart.items = []`）。actions 只是让逻辑和数据放在一起的一种好方式。

## 须知 {#good-to-know}

- `store()` 接收一个**普通对象**（`{ ... }`），和 `state` 一样。不允许使用类的实例。
- 按**每个主题一个 store** 来组织，而不是一个巨大的 store：`cart.js`、`session.js`、`settings.js`。组件只导入它需要的那个。
- 更新是如何工作的：[Store 的响应式与批处理](/docs/store-reactivity)。何时使用 store：[Store、State 与 Props 的区别](/docs/store-vs-state)。
