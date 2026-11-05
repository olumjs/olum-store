<p align="center"><img width="100" src="https://github.com/olumjs.png" alt="Olum logo"></p>
<p align="center">
 <a href="https://www.npmjs.com/package/olum-store" target="_blank"><img src="https://img.shields.io/npm/v/olum-store" alt="npm"></a>
 <img src="https://img.shields.io/npm/dm/olum-store" alt="npm">
 <img src="https://img.shields.io/npm/l/olum-store" alt="npm">
</p>

# olum-store
A reactive store for olumjs


## Contributing
Thanks for wanting to help make olum-store better! 💙 Bug fixes, new features, and docs improvements are all welcome.

### The branch rule (important)
olum-store uses **one branch per version** (`v0.1.0`, `v0.1.1`, ...). Each new version branch is created from the previous one, so the **latest version branch always contains everything**.

> ✅ Always base your work on the **latest** version branch (currently **`v0.1.1`**).
> ❌ Never base it on an older one like `v0.1.0` — your PR will be missing recent changes and will conflict.

Not sure which one is the latest? Check the branch list on GitHub (or run `git branch -r`) and pick the highest version number.

### Step by step
1. **Fork** the repo and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/olum-store.git
   cd olum-store
   ```
2. **Check out the latest version branch** (replace `v0.1.1` with the newest one):
   ```bash
   git fetch origin
   git checkout v0.1.1
   ```
3. **Create your own branch from it** — a copy of the latest version with your changes on top:
   ```bash
   git checkout -b feat/my-awesome-feature
   # or: git checkout -b fix/describe-the-bug
   ```
4. **Install and build:**
   ```bash
   npm install
   npm run build
   ```
5. **Make your change.** Source lives in `src/`, built with gulp. Keep the change focused: one feature or fix per PR.
6. **Run the tests** and add or update them in `tests/` when behavior changes:
   ```bash
   npm test
   ```
7. **Update the docs** (see below).
8. **Commit** using a clear message, following the existing style:
   ```
   feat: add global store
   fix: keep store reactive after reset
   ```
9. **Push** your branch to your fork:
   ```bash
   git push origin feat/my-awesome-feature
   ```
10. **Open a Pull Request** against the **latest version branch** (e.g. `v0.1.1`) — *not* an older version. Describe what changed, why, and include a small example if it's user-facing.

### Docs are part of the change
The documentation in [`docs/`](./docs) must match the code. If your PR changes behavior, adds a feature, or fixes something users could trip over, update the relevant page(s) in the same PR. A brand-new topic gets its own `docs/<topic>.md` page, linked from `docs/README.md`.

No docs change needed? Just say so in the PR description (e.g. internal refactor).

### PR checklist
- [ ] Branched from the **latest** version branch (not an older one)
- [ ] PR targets the latest version branch
- [ ] `npm run build` works
- [ ] `npm test` passes
- [ ] Docs in `docs/` updated where needed
- [ ] One focused change, clear commit messages

Questions or unsure about an idea? Ask in [Discord](https://discord.gg/2zK7tb2Cg9) before you start — we're happy to help.

## Community
- [X](https://x.com/olumjs)
- [Bluesky](https://bsky.app/profile/olumjs.bsky.social)
- [Discord](https://discord.gg/2zK7tb2Cg9)

## Contact
- General: [hello@olumjs.top](mailto:hello@olumjs.top)
- Security: [security@olumjs.top](mailto:security@olumjs.top) — please report vulnerabilities here privately rather than opening a public issue
