const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sparkle", {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke("sparkle:getInfo"),
  install: (opts) => ipcRenderer.invoke("sparkle:install", opts),
  uninstall: () => ipcRenderer.invoke("sparkle:uninstall"),
  onProgress: (cb) => ipcRenderer.on("sparkle:progress", (_e, d) => cb(d)),
});
