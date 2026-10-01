# @break_happy/create-dual-electron

Create a secure Electron Forge desktop shell that pairs with a DualVite renderer.

```bash
pnpm dlx @break_happy/create-dual-electron my-desktop-app
```

The generated application loads a Vite URL during development and the DualVite `dist-filelocal/` output when running or packaging locally. It contains only Electron main-process, preload, packaging, and renderer-copy infrastructure—no business UI.
