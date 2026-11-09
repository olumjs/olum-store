---
title: ストア vs ステート vs Props
group: ストア
order: 30
source: f5a463784d46
---

コンポーネントにデータを渡す方法は 3 つあります。ほとんどのアプリでは 3 つすべてを使います：

| | [`state`](/docs/core/state) | [`props`](/docs/core/components) | [`store`](/docs/global-store) |
|---|---|---|---|
| **使う範囲** | 1 つのコンポーネント | 親 → その子 | アプリ全体 |
| **定義する場所** | コンポーネント内 | 親のテンプレート | `.js` ファイル |
| **変更できるのは** | そのコンポーネント | 誰も変更できない（読み取り専用） | インポートした誰でも |
| **更新** | まとめて行われる | 親と一緒に | まとめて行われる |
| **存在する期間** | コンポーネントが削除されるまで | 子が削除されるまで | アプリが閉じるまで |

## どれを使う？ {#which-one}

- **まずは `state` から。** 1 つのコンポーネントしか気にしないデータ（テキストの下書き、開閉フラグなど）なら `state` に置きます。ストアに入れても、プライベートなデータがグローバルになるだけです。
- **親 → 子なら props。** データは [prop](/docs/core/components) として下に渡し、子から何かを返したいときは関数の prop を渡します。
- **共有するデータや長く残るデータならストア。** 関係のない 2 つのコンポーネントが同じデータを必要とする場合（カートページ + ナビバーのカートバッジ）や、ページを移動してもデータを残したい場合はストアを使います。ページを移動するとそのページと `state` は削除されますが、ストアは値を保持します。
- **使わない prop をコンポーネント経由でバケツリレーしていませんか？** それがサインです。データをストアに移し、必要な場所でインポートしましょう。

## 組み合わせて使う {#using-them-together}

コンポーネントはストアを読み、関数で値を計算し、その一部を props として下に渡せます。子はストアのことを知る必要がないので、再利用しやすいままです：

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

`Basket` はテンプレートで `cart` を読んでいるので、**どの**コンポーネントから `cart.add(...)` を呼んでも更新され、子の `Row` も自動的に新しい props を受け取ります。
