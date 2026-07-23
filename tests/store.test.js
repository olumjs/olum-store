const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

let passed = 0;
let failed = 0;

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

const STORE_SRC = fs.readFileSync(
  path.join(__dirname, "../src/store.js"),
  "utf8",
);
function load(init) {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "http://localhost/",
  });
  global.document = dom.window.document;
  const createStore = new Function(
    STORE_SRC.replace(/^\s*export\s+default\s+/m, "return "),
  )();
  const emits = [];
  const self = {
    app: { store: {} },
    __renderingKey: null,
    $emit: (name, payload) => emits.push({ name, payload }),
    mkHash: (s) => "hash(" + s + ")",
  };
  const store = createStore(self)(init);
  const mountComp = (key, compId) => {
    compId = compId || "id-" + key;
    const el = dom.window.document.createElement("div");
    el.setAttribute(
      "data-olum",
      JSON.stringify({ compName: key, compId: compId }),
    );
    dom.window.document.body.appendChild(el);
    self.app.store[key] = { el };
    return el;
  };
  const readAs = (key, fn) => {
    self.__renderingKey = key;
    try {
      return fn();
    } finally {
      self.__renderingKey = null;
    }
  };
  const tick = () => new Promise((r) => setTimeout(r, 0));
  return {
    document: dom.window.document,
    self,
    store,
    emits,
    mountComp,
    readAs,
    tick,
  };
}

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

(async () => {
  console.log(
    "\n" + bold("🧪 OlumJS store fixtures") + "\n========================",
  );

  section("§1 basic state");

  await check("init values are readable", () => {
    const { store } = load({ count: 1, label: "hi" });
    return store.count === 1 && store.label === "hi";
  });

  await check("no init yields an empty store", () => {
    const { store } = load();
    return typeof store === "object" && Object.keys(store).length === 0;
  });

  await check("sets are reflected on read", () => {
    const { store } = load({ count: 0 });
    store.count = 5;
    store.fresh = "new";
    return store.count === 5 && store.fresh === "new";
  });

  await check(
    "init object is copied — later mutation of it doesn't leak in",
    () => {
      const init = { count: 0 };
      const { store } = load(init);
      init.count = 99;
      return store.count === 0;
    },
  );

  await check("delete removes the key", () => {
    const { store } = load({ gone: 1 });
    delete store.gone;
    return !("gone" in store);
  });

  section("§2 deep wrapping");

  await check("nested objects are readable and writable", () => {
    const { store } = load({ user: { name: "a", address: { city: "x" } } });
    store.user.address.city = "y";
    return store.user.name === "a" && store.user.address.city === "y";
  });

  await check("proxy identity is stable across reads", () => {
    const { store } = load({ user: { name: "a" } });
    return store.user === store.user;
  });

  await check("arrays behave: push, index write, length", () => {
    const { store } = load({ list: [1, 2] });
    store.list.push(3);
    store.list[0] = 9;
    return (
      store.list.length === 3 && store.list[0] === 9 && store.list[2] === 3
    );
  });

  await check("Map works through the proxy: set/get/size", () => {
    const { store } = load({ m: new Map([["a", 1]]) });
    store.m.set("b", 2);
    return (
      store.m.get("a") === 1 && store.m.get("b") === 2 && store.m.size === 2
    );
  });

  await check("Set works through the proxy: add/has/size", () => {
    const { store } = load({ s: new Set([1]) });
    store.s.add(2);
    return store.s.has(1) && store.s.has(2) && store.s.size === 2;
  });

  await check("Map.get on an object value returns the wrapped proxy", () => {
    const { store } = load({ m: new Map([["k", { n: 1 }]]) });
    return store.m.get("k") === store.m.get("k") && store.m.get("k").n === 1;
  });

  await check("non-plain objects (class instances) pass through raw", () => {
    const d = new Date(0);
    const { store } = load({ d: d });
    return store.d === d;
  });

  await check(
    "assigning a wrapped value back stores the raw (no double-wrap)",
    () => {
      const { store } = load({ a: { n: 1 } });
      store.b = store.a;
      return store.b === store.a && store.b.n === 1;
    },
  );

  section("§3 subscription & batched flush");

  await check(
    "render-time read subscribes; a mutation emits updateOlumComp",
    async () => {
      const { store, emits, mountComp, readAs, tick, self } = load({
        count: 0,
      });
      mountComp("App", "c1");
      readAs("App", () => store.count);
      store.count = 1;
      await tick();
      const e = emits[0];
      return (
        emits.length === 1 &&
        e.name === "updateOlumComp" &&
        e.payload.compName === "App" &&
        e.payload.compId === "c1" &&
        e.payload.hash === self.mkHash("App" + "c1")
      );
    },
  );

  await check(
    "multiple mutations in one tick flush as a single emit",
    async () => {
      const { store, emits, mountComp, readAs, tick } = load({ a: 0, b: 0 });
      mountComp("App");
      readAs("App", () => store.a + store.b);
      store.a = 1;
      store.b = 2;
      store.a = 3;
      await tick();
      return emits.length === 1;
    },
  );

  await check("separate ticks flush separately", async () => {
    const { store, emits, mountComp, readAs, tick } = load({ a: 0 });
    mountComp("App");
    readAs("App", () => store.a);
    store.a = 1;
    await tick();
    store.a = 2;
    await tick();
    return emits.length === 2;
  });

  await check("setting the identical value does not notify", async () => {
    const { store, emits, mountComp, readAs, tick } = load({ a: 1 });
    mountComp("App");
    readAs("App", () => store.a);
    store.a = 1;
    await tick();
    return emits.length === 0;
  });

  await check(
    "reads outside render don't subscribe — mutation emits nothing",
    async () => {
      const { store, emits, mountComp, tick } = load({ a: 0 });
      mountComp("App");
      void store.a;
      store.a = 1;
      await tick();
      return emits.length === 0;
    },
  );

  await check("deep mutation notifies the subscriber", async () => {
    const { store, emits, mountComp, readAs, tick } = load({
      user: { name: "a" },
    });
    mountComp("App");
    readAs("App", () => store.user.name);
    store.user.name = "b";
    await tick();
    return emits.length === 1 && emits[0].payload.compName === "App";
  });

  await check("Map.set notifies; Map.get alone does not", async () => {
    const { store, emits, mountComp, readAs, tick } = load({
      m: new Map([["a", 1]]),
    });
    mountComp("App");
    readAs("App", () => store.m.get("a"));
    store.m.get("a");
    await tick();
    const afterRead = emits.length;
    store.m.set("a", 2);
    await tick();
    return afterRead === 0 && emits.length === 1;
  });

  await check("delete notifies; deleting a missing key does not", async () => {
    const { store, emits, mountComp, readAs, tick } = load({ a: 1 });
    mountComp("App");
    readAs("App", () => store.a);
    delete store.nope;
    await tick();
    const afterMiss = emits.length;
    delete store.a;
    await tick();
    return afterMiss === 0 && emits.length === 1;
  });

  await check(
    "a subscriber removed from the DOM is pruned, not re-rendered",
    async () => {
      const { store, emits, mountComp, readAs, tick } = load({ a: 0 });
      const el = mountComp("App");
      readAs("App", () => store.a);
      el.remove();
      store.a = 1;
      await tick();
      return emits.length === 0;
    },
  );

  await check(
    "a descendant subscriber is covered by its live ancestor",
    async () => {
      const { store, emits, mountComp, readAs, tick } = load({ a: 0 });
      mountComp("App");
      mountComp("App>Child#0");
      readAs("App", () => store.a);
      readAs("App>Child#0", () => store.a);
      store.a = 1;
      await tick();

      return emits.length === 1 && emits[0].payload.compName === "App";
    },
  );

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

  const EXPECTED_CHECKS = 23;
  const total = passed + failed;
  if (total !== EXPECTED_CHECKS) {
    console.log(
      yellow(
        `⚠ ran ${total} checks but expected ${EXPECTED_CHECKS} — did a test get dropped?`,
      ) + "\n",
    );
    process.exit(1);
  }

  process.exit(failed ? 1 : 0);
})();
