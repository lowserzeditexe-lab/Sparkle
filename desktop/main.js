const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const installer = require("./installer");

function payloadDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "payload")
    : path.join(__dirname, "resources", "payload");
}

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 960,
    height: 720,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: "#0b0918",
    title: "Sparkle",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.SPARKLE_DEV_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, "build", "index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("sparkle:getInfo", () => ({
    isDesktop: true,
    plugin: installer.readPluginMeta(payloadDir()),
  }));

  ipcMain.handle("sparkle:detect", () => installer.detect());

  ipcMain.handle("sparkle:install", async (event, opts) => {
    const send = (d) => { if (win && !win.isDestroyed()) win.webContents.send("sparkle:progress", d); };
    return installer.install(opts || {}, payloadDir(), send);
  });

  ipcMain.handle("sparkle:uninstall", async () => installer.uninstall());

  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
