const { app, BrowserWindow, ipcMain, shell } = require('electron');
const os = require('os');
const path = require('path');
const express = require('express');
const portfinder = require('portfinder');
const EventEmitter = require('events');
const fs = require('fs');

require("./utils/exec-utils");
require("./utils/rust-utils");
require("./utils/backend-utils");

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
};

const isForceLocal = /*process.argv.includes('--force-local');*/ true;

app.on('ready', () => {
  const localIP = getLocalIPAddress(); 
  const serverApp = express();

  let webBuildPath, assetsPath;

  console.log('forceLocaL?', isForceLocal);

  if (!isForceLocal && fs.existsSync(path.join(app.getPath('userData'), 'frontend', 'web-build'))) {
    webBuildPath = path.join(app.getPath('userData'), 'frontend', 'web-build');
    assetsPath = path.join(app.getPath('userData'), 'frontend', 'assets');
  } else {
    webBuildPath = path.join(__dirname, 'web-build');
    assetsPath = path.join(__dirname, 'assets');
  }

  console.log('APP_DIR', webBuildPath);
  console.log('ASSETS_DIR', assetsPath);

  serverApp.use('/assets', express.static(assetsPath));
  serverApp.use(express.static(webBuildPath));

  portfinder.getPortPromise().then((port) => {
    server = serverApp.listen(port, () => {
      console.log(`Server started at http://${localIP}:${port}`); 

      mainWindow = new BrowserWindow({
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true, 
        },
      });

      mainWindow.maximize();
      mainWindow.loadURL(`http://${localIP}:${port}`);

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

app.disableHardwareAcceleration();

global.mainEmitter = mainEmitter;