---
title: Store vs. estado vs. props
group: Store
order: 30
source: f5a463784d46
---

Há três formas de levar dados até um componente. A maioria dos apps usa as três:

| | [`state`](/docs/core/state) | [`props`](/docs/core/components) | [`store`](/docs/global-store) |
|---|---|---|---|
| **Usado por** | um componente | um pai → o seu filho | o app inteiro |
| **Definido em** | o componente | o template do pai | um arquivo `.js` |
| **Quem pode mudar** | o componente | ninguém (somente leitura) | qualquer um que o importe |
| **Atualizações** | agrupadas | junto com o pai | agrupadas |
| **Vive até** | o componente ser removido | o filho ser removido | o app fechar |

## Qual usar? {#which-one}

- **Comece com `state`.** Se só um componente se importa (um rascunho de texto, uma flag de aberto/fechado), deixe em `state`. Colocar em um store só transforma dados privados em globais.
- **Pai → filho? Use props.** Passe os dados para baixo como uma [prop](/docs/core/components), e passe uma prop de função quando o filho precisar mandar algo de volta para cima.
- **Compartilhado ou de longa duração? Use um store.** Quando dois componentes sem relação precisam dos mesmos dados (a página do carrinho + o badge do carrinho na navbar), ou os dados precisam sobreviver a uma troca de página, use um store. Trocar de página remove uma página e o seu `state`; um store mantém o valor.
- **Está passando uma prop por um componente que não a usa?** Esse é o sinal: mova os dados para um store e importe-o onde for preciso.

## Usando juntos {#using-them-together}

Um componente pode ler um store, calcular valores com funções e passar partes para baixo como props. O filho não precisa saber do store, então continua reutilizável:

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

`Basket` lê `cart` no template, então um `cart.add(...)` vindo de **qualquer** componente o atualiza, e os seus filhos `Row` recebem as novas props automaticamente.
