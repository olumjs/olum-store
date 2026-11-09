---
title: Store vs. estado vs. props
group: Store
order: 30
source: f5a463784d46
---

Hay tres formas de llevar datos a un componente. La mayoría de las apps usan las tres:

| | [`state`](/docs/core/state) | [`props`](/docs/core/components) | [`store`](/docs/global-store) |
|---|---|---|---|
| **Lo usa** | un componente | un padre → su hijo | toda la app |
| **Se define en** | el componente | la plantilla del padre | un archivo `.js` |
| **Quién puede cambiarlo** | el componente | nadie (solo lectura) | cualquiera que lo importe |
| **Actualizaciones** | agrupadas | junto con el padre | agrupadas |
| **Vive hasta que** | se elimina el componente | se elimina el hijo | se cierra la app |

## ¿Cuál uso? {#which-one}

- **Empieza con `state`.** Si solo le importa a un componente (un borrador de texto, un indicador de abierto/cerrado), déjalo en `state`. Meterlo en un store solo convierte datos privados en globales.
- **¿Padre → hijo? Usa props.** Pasa los datos hacia abajo como una [prop](/docs/core/components), y pasa una prop de función cuando el hijo necesite enviar algo hacia arriba.
- **¿Compartido o de larga duración? Usa un store.** Cuando dos componentes sin relación necesitan los mismos datos (la página del carrito + el contador del carrito en la barra de navegación), o los datos deben sobrevivir a un cambio de página, usa un store. Cambiar de página elimina una página y su `state`; un store conserva su valor.
- **¿Estás pasando una prop a través de un componente que no la usa?** Esa es la señal: mueve los datos a un store e impórtalo donde haga falta.

## Usarlos juntos {#using-them-together}

Un componente puede leer un store, calcular valores con funciones y pasar partes hacia abajo como props. El hijo no necesita saber nada del store, así que sigue siendo reutilizable:

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

`Basket` lee `cart` en su plantilla, así que un `cart.add(...)` desde **cualquier** componente lo actualiza, y sus hijos `Row` reciben las nuevas props automáticamente.
