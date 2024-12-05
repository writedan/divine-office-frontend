const { app, BrowserWindow, ipcMain } = require('electron');
const os = require('os');
const path = require('path');
const express = require('express');
const portfinder = require('portfinder');

let mainWindow;
let server;

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    for (const address of interfaces[interfaceName]) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  
  return 'localhost';
}

app.on('ready', () => {
  const localIP = getLocalIPAddress(); 
  const serverApp = express();

  serverApp.use(express.static(path.join(__dirname, 'dist')));

  portfinder.getPortPromise().then((port) => {
    server = serverApp.listen(port, () => {
      console.log(`Server started at http://${localIP}:${port}`); 

      mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true, 
        },
      });

      mainWindow.loadURL(`http://${localIP}:${port}`);
    });
  }).catch((err) => {
    console.error('Error finding an available port:', err);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.disableHardwareAcceleration();

module.exports = { mainWindow };