---
title: グローバルストア
group: ストア
order: 10
source: c40c543a0104
---

コンポーネントの [`state`](/docs/core/state) はそのコンポーネントだけのもので、コンポーネントが削除されると消えます。**多くのコンポーネントで共有する**データ（カート、ログイン中のユーザー、設定）には**ストア**を使います。`.js` ファイルで一度作成し、どこからでもインポートすれば、それを表示しているすべてのコンポーネントが変更時に更新されます。

:::note[パッケージ]
`store` は `olum-store` パッケージで提供されます（スターターテンプレートにはすでに入っています）：

```bash
npm i olum-store
```

`olum` が読み込んでくれるので、設定は不要です。パッケージを削除すると `store()` の呼び出しは `"store is unavailable"` を投げますが、それ以外はすべてそのまま動きます。
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

データと、それを変更する関数（**アクション**）は同じオブジェクトに置きます。アクションは `this` でデータにアクセスします。

あるコンポーネントがストアを変更し：

```html title="Shelf.html"
<script>
  import { cart } from "./store";

  const products = ["Compass", "Canteen", "Rope"];
</script>

<for each="product of products">
  <button onclick="cart.add(product)">Add {product}</button>
</for>
```

……まったく別のコンポーネントがそれを表示します。props なしで、常に同期しています：

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

設定は不要です。コンポーネントは**テンプレートでストアを読む**だけでそのストアを購読します。ストアが変わると、それらのコンポーネントが更新されます。ストアを変更するだけで表示しないコンポーネントは更新されません。

:::tip
ストアはただの `.js` ファイル（ルートになるのは `page.html` ファイルだけ）なので、都合の良い場所に置きましょう。使うページの隣でも、アプリ全体のストアなら `utils/` の中でも構いません。
:::

## アクション {#actions}

アクションはアロー関数ではなく**メソッド**（`add() {}`）として書きます。アロー関数では正しい `this` が得られません：

```js
export const cart = store({
  items: [],
  add(item) { this.items.push(item); },     // ✓ method: `this` is the store
  clear: () => (this.items = []),           // ✗ arrow: `this` is NOT the store
});
```

コンポーネントから直接ストアを変更することもできます（`cart.items = []`）。アクションは、ロジックをデータの近くに置いておくための便利な方法にすぎません。

## 知っておくと良いこと {#good-to-know}

- `store()` は `state` と同じく**プレーンなオブジェクト**（`{ ... }`）を受け取ります。クラスのインスタンスは使えません。
- 巨大なストアを 1 つ作るのではなく、**トピックごとにストアを 1 つ**作りましょう：`cart.js`、`session.js`、`settings.js`。コンポーネントは必要なものだけをインポートします。
- 更新の仕組み：[ストアのリアクティビティとバッチ処理](/docs/store-reactivity)。ストアを使うべきとき：[ストア vs ステート vs Props](/docs/store-vs-state)。
