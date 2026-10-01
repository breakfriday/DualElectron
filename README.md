# @break_happy/create-dual-electron

DualElectron 是一个基于 Electron Forge 的 TypeScript 桌面端脚手架。

它在 Forge 的构建、打包能力之上，内置安全的 Preload Bridge 和通用 IPC 服务，并通过明确的开发 URL 与本地文件产物约定和 DualVite 协作。DualVite 负责 React Renderer，DualElectron 负责 Main Process、IPC 与桌面打包，让两端可以安全、独立地开发和交互。

```bash
pnpm dlx @break_happy/create-dual-electron my-desktop-app
```

生成的应用在开发模式加载 DualVite 的 Vite URL；在本地文件模式和生产打包时，加载 DualVite 的 `dist-filelocal/` 产物。
