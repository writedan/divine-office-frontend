const { app, BrowserWindow, ipcMain, shell } = require('electron');
const os = require('os');
const path = require('path');
const express = require('express');
const portfinder = require('portfinder');
const EventEmitter = require('events');
const { autoUpdater } = require('electron-updater');

require("./utils/rust-utils");
require("./utils/git-utils");
require("./utils/build-utils");
require("./utils/url-utils");

class MainProcessEmitter extends EventEmitter {}
const mainEmitter = new MainProcessEmitter();

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

  console.log('APP_DIR', __dirname);

  serverApp.use(express.static(path.join(__dirname, 'web-build')));

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

      autoUpdater.checkForUpdatesAndNotify();

      autoUpdater.on('update-available', () => {
          mainWindow.webContents.send('update-available');
      });

      autoUpdater.on('update-downloaded', () => {
          mainWindow.webContents.send('update-downloaded');
      });

      mainEmitter.on('log-message', (stream, ...args) => {
        console.log(`[${stream}]`, args);
        if (mainWindow) {
          mainWindow.webContents.send(stream, args.join(' '));
        }
      });
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

autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
});

ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
});

app.disableHardwareAcceleration();

global.mainEmitter = mainEmitter;