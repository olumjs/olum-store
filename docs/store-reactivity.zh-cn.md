---
title: Store 的响应式与批处理
group: Store
order: 20
source: d43bf527b7e0
---

store 如何更新你的组件：哪些组件会更新、哪些修改会被追踪、页面何时变化。它遵循和[组件 state](/docs/core/state) 相同的规则。

## 自动订阅 store {#following-a-store-is-automatic}

组件只要**在模板中读取** store，就会订阅它：

```html title="Basket.html"
<script>
  import { cart } from "./store";
</script>

<p>{cart.items.length} items</p>  <!-- this read makes Basket follow cart -->
```

- 无需清理：组件被移除后，会在 store 下一次变化时停止订阅。
- 如果父组件和子组件读取了同一个 store，只有**父组件**会更新（它会顺带更新子组件），所以同样的工作不会做两遍。

## 任意深度的修改都有效 {#changes-at-any-depth-work}

```js
cart.items.push(item);           // ✓ array methods
cart.items[0].qty = 2;           // ✓ any depth
cart.meta.coupon = "SAVE10";     // ✓ nested object
cart.tags.add("gift");           // ✓ Map / Set
```

其他对象（`Date`、DOM 元素、类的实例）**不会**被追踪。修改了这类对象后，请给它的键赋一个**新**值。

:::warn
没有改变任何东西的修改会被跳过。赋相同的值，或者把**同一个**对象赋回去（`cart.items = cart.items`），都不会有任何效果。要强制更新，请赋一个新的数组或对象（`[...arr]`、`map`、`filter`、`slice`、`{ ...obj }`）。
:::

## 修改会被合并 {#changes-are-grouped}

一起进行的所有 store 修改会在**一次**更新中应用：

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

组件的 `state` 也以同样的方式合并，所以对于大列表来说，store **并不**比 `state` 快。使用 store 是因为数据需要**共享**，而不是为了速度。参见 [Store、State 与 Props 的区别](/docs/store-vs-state)。

### 在修改后立即读取页面 {#reading-the-page-right-after-a-change}

页面会在 store 修改**之后**稍晚一点更新，分两步：先由 store 通知它的组件，然后组件再更新。一次 `await Promise.resolve()` 是不够的。请这样做：

```js
import { flushUpdates } from "olum";

cart.add("Rope");
await Promise.resolve();       // the store tells its components
flushUpdates();                // apply their updates now
host.querySelector("li");      // up to date
```

等待一个定时器（`await new Promise((r) => setTimeout(r))`）也可以。你主要在测试中需要这样做：在组件内部，下一次更新就已经会显示新值了。
