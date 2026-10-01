# __APP_NAME__

DualElectron is an Electron Forge shell for a DualVite renderer. The renderer project is configured in `dual-electron.config.cjs`.

## Development

Start the DualVite application first, then launch Electron:

```bash
pnpm install
pnpm start
```

`pnpm start` loads `rendererDevUrl` from `dual-electron.config.cjs`. Override it for a one-off run with `ELECTRON_RENDERER_URL`.

## Local-file mode

```bash
pnpm build:renderer
pnpm copy:renderer
pnpm start:filelocal
```

This loads `resources/renderer/index.html` with hash routing. `pnpm package` and `pnpm make` build and copy the renderer automatically.

## Security boundary

The renderer has `contextIsolation`, sandboxing, and disabled Node integration. Add a new capability through a narrow IPC handler in `src/main.ts` and explicitly expose it from `src/preload.ts`; do not expose `ipcRenderer` directly.
