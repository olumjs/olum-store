---
title: ストアのリアクティビティとバッチ処理
group: ストア
order: 20
source: d43bf527b7e0
---

ストアがコンポーネントをどう更新するか：どのコンポーネントが更新されるか、どの変更が追跡されるか、ページがいつ変わるかを説明します。ルールは[コンポーネントのステート](/docs/core/state)と同じです。

## ストアの購読は自動 {#following-a-store-is-automatic}

コンポーネントは**テンプレートでストアを読む**ことで、そのストアを購読します：

```html title="Basket.html"
<script>
  import { cart } from "./store";
</script>

<p>{cart.items.length} items</p>  <!-- this read makes Basket follow cart -->
```

- 後片付けは不要です。コンポーネントが削除されると、次のストアの変更時に購読をやめます。
- 親と子が同じストアを読んでいる場合、更新されるのは**親だけ**です（親の更新によって子も更新されます）。同じ処理が二重に行われることはありません。

## どの深さの変更も効く {#changes-at-any-depth-work}

```js
cart.items.push(item);           // ✓ array methods
cart.items[0].qty = 2;           // ✓ any depth
cart.meta.coupon = "SAVE10";     // ✓ nested object
cart.tags.add("gift");           // ✓ Map / Set
```

それ以外のオブジェクト（`Date`、DOM 要素、クラスのインスタンス）は追跡**されません**。それらを変更した後は、そのキーに**新しい**値を代入してください。

:::warn
何も変わらない変更はスキップされます。同じ値を代入したり、**同じ**オブジェクトを代入し直したり（`cart.items = cart.items`）しても何も起きません。強制的に更新するには、新しい配列やオブジェクトを代入します（`[...arr]`、`map`、`filter`、`slice`、`{ ...obj }`）。
:::

## 変更はまとめられる {#changes-are-grouped}

まとめて行ったストアの変更は、すべて**1 回**の更新で反映されます：

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

コンポーネントの `state` も同じようにまとめられるので、大きなリストでもストアが `state` より速いということは**ありません**。ストアを使う理由はデータを**共有**するためであって、速度のためではありません。[ストア vs ステート vs Props](/docs/store-vs-state)を参照してください。

### 変更直後にページを読み取る {#reading-the-page-right-after-a-change}

ページはストアの変更の少し**後**に、2 段階で更新されます。まずストアがコンポーネントに知らせ、次にコンポーネントが更新されます。`await Promise.resolve()` 1 回では足りません。代わりに次のようにします：

```js
import { flushUpdates } from "olum";

cart.add("Rope");
await Promise.resolve();       // the store tells its components
flushUpdates();                // apply their updates now
host.querySelector("li");      // up to date
```

タイマーを待つ方法（`await new Promise((r) => setTimeout(r))`）でも構いません。これが必要になるのは主にテストの中です。コンポーネント内では、次の更新ですでに新しい値が表示されています。
