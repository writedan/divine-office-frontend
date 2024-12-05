const { shell, ipcMain } = require("electron");

ipcMain.handle('open-link', (_event, url) => {
  shell.openExternal(url);
})