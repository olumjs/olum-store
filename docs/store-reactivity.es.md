---
title: Reactividad del store y agrupación
group: Store
order: 20
source: d43bf527b7e0
---

Cómo un store actualiza tus componentes: cuáles se actualizan, qué cambios se detectan y cuándo cambia la página. Sigue las mismas reglas que el [state de un componente](/docs/core/state).

## Seguir un store es automático {#following-a-store-is-automatic}

Un componente sigue a un store **leyéndolo en su plantilla**:

```html title="Basket.html"
<script>
  import { cart } from "./store";
</script>

<p>{cart.items.length} items</p>  <!-- this read makes Basket follow cart -->
```

- No hay nada que limpiar: cuando se elimina un componente, deja de seguir al store en su siguiente cambio.
- Si un padre y su hijo leen el mismo store, solo se actualiza el **padre** (que a su vez actualiza al hijo), así que el trabajo no se hace dos veces.

## Funcionan los cambios a cualquier profundidad {#changes-at-any-depth-work}

```js
cart.items.push(item);           // ✓ array methods
cart.items[0].qty = 2;           // ✓ any depth
cart.meta.coupon = "SAVE10";     // ✓ nested object
cart.tags.add("gift");           // ✓ Map / Set
```

Otros objetos (`Date`, elementos del DOM, instancias de clases) **no** se detectan. Después de cambiar uno, asigna un valor **nuevo** a su clave.

:::warn
Un cambio que no cambia nada se omite. Asignar el mismo valor, o volver a asignar el **mismo** objeto (`cart.items = cart.items`), no hace nada. Para forzar una actualización, asigna un array u objeto nuevo (`[...arr]`, `map`, `filter`, `slice`, `{ ...obj }`).
:::

## Los cambios se agrupan {#changes-are-grouped}

Todos los cambios del store hechos juntos se aplican en **una** sola actualización:

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

El `state` de un componente se agrupa de la misma forma, así que un store **no** es más rápido que `state` para listas grandes. Usa un store porque los datos son **compartidos**, no por velocidad. Consulta [Store vs. estado vs. props](/docs/store-vs-state).

### Leer la página justo después de un cambio {#reading-the-page-right-after-a-change}

La página se actualiza un momento **después** de un cambio en el store, en dos pasos: primero el store avisa a sus componentes y luego estos se actualizan. Un solo `await Promise.resolve()` no basta. Haz esto:

```js
import { flushUpdates } from "olum";

cart.add("Rope");
await Promise.resolve();       // the store tells its components
flushUpdates();                // apply their updates now
host.querySelector("li");      // up to date
```

Esperar a un temporizador (`await new Promise((r) => setTimeout(r))`) también funciona. Normalmente solo lo necesitas en tests: dentro de un componente, la siguiente actualización ya muestra el valor nuevo.
