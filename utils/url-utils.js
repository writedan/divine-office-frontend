const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

ipcMain.handle('file-exists', async (_event, uri) => {
  const basePath = app.getPath('userData');
  const fullPath = path.join(basePath, uri);

  try {
    await fs.promises.access(fullPath, fs.constants.F_OK);
    return true; 
  } catch (error) {
    return false; 
  }
});


ipcMain.handle('open-link', (_event, url) => {
  shell.openExternal(url);
});