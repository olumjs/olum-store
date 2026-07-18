// ============================================================================
// OlumJS store test suite — a sibling to the core runtime suites. Covers
// src/store.js: the deep reactive store the Olum runtime wires up per app.
//
// store.js is `export default function createStore(self){...}` and its flush
// path reaches for BARE globals (`document`, `JSON`, `Promise`) rather than
// `window.`-prefixed ones. So — like the router suite — we eval the source
// *inside* a jsdom window (runScripts: "outside-only"), which gives those bare
// references the right binding. Each load() gets a fresh window (fresh document)
// so a mounted component in one test can't leak into another.
//
// Updates flush on the microtask queue, so checks are async: mutate, `await
// tick()`, then assert what the store emitted.
//
// Run:  node tests/store.test.js   (or: npm test)
// ============================================================================

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

let passed = 0;
let failed = 0;

// ── Output styling (shared look with the other suites) ────────────────────────
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s) => paint("32", s);
const red = (s) => paint("31", s);
const dim = (s) => paint("2", s);
const bold = (s) => paint("1", s);
const yellow = (s) => paint("33", s);
const cyan = (s) => paint("36", s);
const PASS_ICON = green("✔");
const FAIL_ICON = red("✖");

// ── Loader ────────────────────────────────────────────────────────────────────
// Evaluate store.js inside a fresh jsdom window and hand back the createStore
// factory it default-exports (rebound to a window global so the realm can reach
// it). `document` inside flush() then resolves to this window's document.
const STORE_SRC = fs.readFileSync(path.join(__dirname, "../src/store.js"), "utf8");
function load() {
  const dom = new JSDOM("<!doctype html><body></body>", { url: "http://localhost/", runScripts: "outside-only" });
  dom.window.eval(STORE_SRC.replace(/^\s*export\s+default\s+/m, "window.__createStore = "));
  return { window: dom.window, document: dom.window.document, createStore: dom.window.__createStore };
}

// Updates are scheduled on the microtask queue (Promise.resolve().then(flush)).
// A macrotask turn drains those, so awaiting a 0ms timeout guarantees any
// pending flush has run before we assert.
const tick = () => new Promise((r) => setTimeout(r, 0));

// Build a store plus a mock Olum `self`, and helpers to mount subscribers and
// simulate a component reading state during its render.
//
//   self.app.store[key]  — the live component registry flush() prunes against.
//   self.__renderingKey  — the component currently rendering; reads subscribe it.
//   self.$emit           — spied; each re-render request lands in `emitted`.
//   self.mkHash          — stubbed hash used in the emitted payload.
function setup() {
  const { window, document, createStore } = load();
  const emitted = [];
  const self = {
    app: { store: {} },
    __renderingKey: null,
    $emit: (name, payload) => emitted.push({ name, payload }),
    mkHash: (s) => "h:" + s,
  };
  const store = createStore(self);

  // Build state INSIDE the jsdom realm. store.js's wrap() gates on realm-bound
  // identities — `val instanceof Map/Set` and `proto === Object.prototype` — so
  // nested objects, Maps, and Sets must be this realm's natives to be made
  // reactive (arrays are fine either way; Array.isArray is cross-realm). In a
  // real app the store and its state share one realm; here we bridge it with eval.
  const mk = (expr) => window.eval("(" + expr + ")");

  // Register a mounted component: a DOM node carrying the data-olum meta flush()
  // reads, attached to the body so `document.body.contains(el)` holds true.
  function mount(key, compId) {
    const el = document.createElement("div");
    el.setAttribute("data-olum", JSON.stringify({ compName: key, compId: compId == null ? 1 : compId }));
    document.body.appendChild(el);
    self.app.store[key] = { el };
    return el;
  }

  // Run `readFn` as if `key`'s component were rendering, so its reads subscribe.
  function render(key, readFn) {
    self.__renderingKey = key;
    try {
      readFn();
    } finally {
      self.__renderingKey = null;
    }
  }

  // Mount a component AND have it read `readFn` during render — the common combo.
  function subscribe(key, readFn) {
    mount(key);
    render(key, readFn);
  }

  const names = () => emitted.map((e) => e.payload.compName);

  return { window, document, self, store, emitted, mount, render, subscribe, names, mk };
}

// ── Section / check plumbing (mirrors the other suites; async-aware) ──────────
let currentSection = "(no section)";
const failedSections = [];

function recordFail(name) {
  failed++;
  failedSections.push({ section: currentSection, name });
}

async function check(name, fn) {
  let ok = false;
  let detail = "";
  try {
    ok = await fn();
  } catch (e) {
    detail = " (" + e.message + ")";
  }
  if (ok) {
    passed++;
    console.log("  " + PASS_ICON + " " + name);
  } else {
    recordFail(name);
    console.log("  " + FAIL_ICON + " " + red(name) + dim(detail));
    console.log("      " + dim("↳ in " + currentSection));
  }
}

function section(title) {
  currentSection = title;
  console.log("\n" + bold(cyan(title)));
}

async function main() {
  console.log("\n" + bold("🧪 OlumJS store fixtures") + "\n========================");

  // ── §1 factory & basic reactivity ──────────────────────────────────────────
  section("§1 factory & basic reactivity");

  await check("createStore(self) returns a store factory", () => {
    const { store } = setup();
    return typeof store === "function";
  });

  await check("the factory copies initial state onto the reactive object", () => {
    const { store } = setup();
    const s = store({ count: 0, name: "olum" });
    return s.count === 0 && s.name === "olum";
  });

  await check("writing then reading a property round-trips", () => {
    const { store } = setup();
    const s = store({ count: 0 });
    s.count = 5;
    return s.count === 5;
  });

  await check("a store created with no initial state is an empty reactive object", () => {
    const { store } = setup();
    const s = store();
    s.added = true;
    return s.added === true;
  });

  // ── §2 dependency tracking ──────────────────────────────────────────────────
  section("§2 dependency tracking");

  await check("a read during render subscribes the component", async () => {
    const { store, subscribe, names } = setup();
    const s = store({ count: 0 });
    subscribe("A", () => s.count);
    s.count = 1;
    await tick();
    return names().join(",") === "A";
  });

  await check("a read OUTSIDE render does not subscribe anyone", async () => {
    const { store, mount, emitted } = setup();
    const s = store({ count: 0 });
    mount("A"); // mounted, but never read during render
    s.count; // read with no __renderingKey set
    s.count = 1;
    await tick();
    return emitted.length === 0;
  });

  await check("the re-render request carries the expected event + payload", async () => {
    const { store, subscribe, emitted, self } = setup();
    const s = store({ count: 0 });
    subscribe("A", () => s.count);
    s.count = 1;
    await tick();
    const ev = emitted[0];
    return (
      ev.name === "updateOlumComp" &&
      ev.payload.compName === "A" &&
      ev.payload.compId === 1 &&
      ev.payload.hash === self.mkHash("A" + 1)
    );
  });

  await check("tracking is store-level: any reader is notified on any change", async () => {
    // The store keeps ONE subscriber set — reading any property subscribes the
    // component to the whole store, so a change anywhere re-renders every reader.
    const { store, subscribe, names } = setup();
    const s = store({ a: 1, b: 1 });
    subscribe("ReadsA", () => s.a);
    subscribe("ReadsB", () => s.b);
    s.a = 2; // ReadsB never read `a`, but store-level tracking notifies it too
    await tick();
    return names().sort().join(",") === "ReadsA,ReadsB";
  });

  // ── §3 batching & change detection ──────────────────────────────────────────
  section("§3 batching & change detection");

  await check("multiple writes in one tick coalesce into a single re-render", async () => {
    const { store, subscribe, emitted } = setup();
    const s = store({ count: 0 });
    subscribe("A", () => s.count);
    s.count = 1;
    s.count = 2;
    s.count = 3;
    await tick();
    return emitted.length === 1 && s.count === 3;
  });

  await check("assigning the same value notifies nobody", async () => {
    const { store, subscribe, emitted } = setup();
    const s = store({ count: 7 });
    subscribe("A", () => s.count);
    s.count = 7; // unchanged
    await tick();
    return emitted.length === 0;
  });

  await check("deleting a property triggers a re-render", async () => {
    const { store, subscribe, emitted } = setup();
    const s = store({ count: 1 });
    subscribe("A", () => s.count);
    delete s.count;
    await tick();
    return emitted.length === 1;
  });

  await check("deleting an absent property is a no-op", async () => {
    const { store, subscribe, emitted } = setup();
    const s = store({ count: 1 });
    subscribe("A", () => s.count);
    delete s.missing;
    await tick();
    return emitted.length === 0;
  });

  // ── §4 deep reactivity ──────────────────────────────────────────────────────
  section("§4 deep reactivity");

  await check("mutating a nested object re-renders its readers", async () => {
    const { store, subscribe, emitted, mk } = setup();
    const s = store(mk('{ user: { name: "Ada" } }'));
    subscribe("A", () => s.user.name);
    s.user.name = "Grace";
    await tick();
    return emitted.length === 1 && s.user.name === "Grace";
  });

  await check("pushing to a nested array re-renders its readers", async () => {
    const { store, subscribe, emitted } = setup();
    const s = store({ todos: ["a"] });
    subscribe("A", () => s.todos.length);
    s.todos.push("b");
    await tick();
    return emitted.length === 1 && s.todos.length === 2;
  });

  await check("an action mutates through `this` (the proxy) and re-renders readers", async () => {
    // Called as s.add(...), `this` is the proxy — so this.items.push() lands in
    // the array trap and notifies, exactly as the docs' actions describe.
    const { store, subscribe, emitted, mk } = setup();
    const s = store(mk("{ items: [], add(n){ this.items.push(n); } }"));
    subscribe("A", () => s.items.length);
    s.add("x");
    await tick();
    return emitted.length === 1 && s.items.length === 1 && s.items[0] === "x";
  });

  // ── §5 identity & unwrapping ────────────────────────────────────────────────
  section("§5 identity & unwrapping");

  await check("a nested object has stable reactive identity across reads", () => {
    const { store, mk } = setup();
    const s = store(mk('{ user: { name: "Ada" } }'));
    return s.user === s.user;
  });

  await check("assigning a reactive value back in does not double-wrap it", () => {
    const { store, mk } = setup();
    const s = store(mk('{ user: { name: "Ada" } }'));
    s.selected = s.user; // stores the raw underneath, re-wraps to the same proxy
    return s.selected === s.user;
  });

  await check("non-plain values (class instances) pass through unproxied", () => {
    const { store } = setup();
    class Foo {
      constructor() {
        this.x = 1;
      }
    }
    const f = new Foo();
    const s = store({ f });
    return s.f === f;
  });

  // ── §6 collections (Map / Set) ──────────────────────────────────────────────
  section("§6 collections (Map / Set)");

  await check("Set.add re-renders readers and mutates the set", async () => {
    const { store, subscribe, emitted, mk } = setup();
    const s = store(mk("{ seen: new Set() }"));
    subscribe("A", () => s.seen.size);
    s.seen.add(42);
    await tick();
    return emitted.length === 1 && s.seen.has(42);
  });

  await check("Map.set re-renders readers and stores the value", async () => {
    const { store, subscribe, emitted, mk } = setup();
    const s = store(mk("{ byId: new Map() }"));
    subscribe("A", () => s.byId.size);
    s.byId.set("k", "v");
    await tick();
    return emitted.length === 1 && s.byId.get("k") === "v";
  });

  await check("Map.get returns a reactive value you can mutate reactively", async () => {
    const { store, render, mount, emitted, mk } = setup();
    const s = store(mk("{ byId: new Map() }"));
    s.byId.set("k", mk("{ n: 1 }"));
    mount("A");
    render("A", () => s.byId.get("k").n);
    s.byId.get("k").n = 2;
    await tick();
    return emitted.length === 1 && s.byId.get("k").n === 2;
  });

  await check("reading .size does not schedule a re-render", async () => {
    const { store, subscribe, emitted, mk } = setup();
    const s = store(mk("{ seen: new Set([1]) }"));
    subscribe("A", () => s.seen.size);
    await tick();
    return emitted.length === 0;
  });

  // ── §7 subscriber lifecycle ─────────────────────────────────────────────────
  section("§7 subscriber lifecycle");

  await check("a component removed from the DOM is not re-rendered", async () => {
    const { store, mount, render, document, emitted } = setup();
    const s = store({ count: 0 });
    const el = mount("A");
    render("A", () => s.count);
    document.body.removeChild(el); // component unmounts
    s.count = 1;
    await tick();
    return emitted.length === 0;
  });

  await check("a nested child is skipped when its parent also re-renders", async () => {
    // Keys are hierarchical ("Parent>Child"); flush() drops a child whose parent
    // is already in the batch, since re-rendering the parent covers it.
    const { store, mount, render, names } = setup();
    const s = store({ count: 0 });
    mount("P");
    mount("P>C");
    render("P", () => s.count);
    render("P>C", () => s.count);
    s.count = 1;
    await tick();
    return names().join(",") === "P";
  });

  // ── Summary (mirrors the other suites) ──────────────────────────────────────
  console.log("\n========================");
  const summary = `${passed} passed, ${failed} failed`;
  console.log((failed ? red(bold(summary)) : green(bold(summary))) + "\n");

  if (failed) {
    const bySection = {};
    failedSections.forEach(({ section, name }) => {
      (bySection[section] = bySection[section] || []).push(name);
    });
    console.log(bold("Failed in:"));
    Object.keys(bySection).forEach((sec) => {
      console.log("  " + red(sec));
      bySection[sec].forEach((name) => console.log("    " + dim("• " + name)));
    });
    console.log("");
  }

  // Guard against a whole section silently disappearing. Bump when you add/remove tests.
  const EXPECTED_CHECKS = 24;
  const total = passed + failed;
  if (total !== EXPECTED_CHECKS) {
    console.log(yellow(`⚠ ran ${total} checks but expected ${EXPECTED_CHECKS} — did a test get dropped?`) + "\n");
    process.exit(1);
  }

  process.exit(failed ? 1 : 0);
}

main();
