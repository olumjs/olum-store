---
title: Store、State 与 Props 的区别
group: Store
order: 30
source: f5a463784d46
---

把数据传进组件有三种方式。大多数应用三种都会用到：

| | [`state`](/docs/core/state) | [`props`](/docs/core/components) | [`store`](/docs/global-store) |
|---|---|---|---|
| **使用者** | 一个组件 | 父组件 → 它的子组件 | 整个应用 |
| **定义在** | 组件内部 | 父组件的模板中 | 一个 `.js` 文件 |
| **谁能修改** | 组件自己 | 没人能改（只读） | 任何导入它的地方 |
| **更新方式** | 合并更新 | 随父组件更新 | 合并更新 |
| **存在到** | 组件被移除 | 子组件被移除 | 应用关闭 |

## 用哪一个？ {#which-one}

- **从 `state` 开始。** 如果只有一个组件关心某个数据（一段文本草稿、一个展开/收起的标志），就把它放在 `state` 里。放进 store 只会让私有数据变成全局数据。
- **父 → 子？用 props。** 把数据作为 [prop](/docs/core/components) 往下传；当子组件需要往上传东西时，传一个函数 prop。
- **共享的或长期存在的？用 store。** 当两个互不相关的组件需要同一份数据（购物车页面 + 导航栏中的购物车角标），或者数据必须在切换页面后保留时，就用 store。切换页面会移除一个页面及其 `state`；store 会保留它的值。
- **在一个并不使用某个 prop 的组件中转传它？** 这就是信号：把数据移到 store 中，在需要的地方导入它。

## 组合使用 {#using-them-together}

一个组件可以读取 store、用函数计算值，再把其中一部分作为 props 往下传。子组件不需要知道 store 的存在，所以它保持可复用：

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

`Basket` 在模板中读取了 `cart`，所以**任何**组件调用 `cart.add(...)` 都会更新它，它的 `Row` 子组件也会自动拿到新的 props。
