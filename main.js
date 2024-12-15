const { app, BrowserWindow, ipcMain, shell } = require('electron');
const os = require('os');
const path = require('path');
const express = require('express');
const portfinder = require('portfinder');
const EventEmitter = require('events');
const fs = require('fs');

require("./utils/rust-utils");
require("./utils/git-utils");
require("./utils/build-utils");
require("./utils/url-utils");

class MainProcessEmitter extends EventEmitter {}
const mainEmitter = new MainProcessEmitter();

let mainWindow;
let server;

// Function to print a tree view
function printTree(dir, depth = 0) {
  // Get the contents of the directory
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    // Print indentation based on depth
    console.log(' '.repeat(depth * 2) + (stats.isDirectory() ? `[DIR] ${item}` : item));

    // If it's a directory, recursively print its contents
    if (stats.isDirectory()) {
      printTree(fullPath, depth + 1);
    }
  });
}

ipcMain.handle('print-tree', (event, dir, depth = 0) => printTree(dir, depth));

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

  let webBuildPath, assetsPath;

  if (fs.existsSync(path.join(app.getPath('userData'), 'frontend', 'web-build'))) {
    webBuildPath = path.join(app.getPath('userData'), 'frontend', 'web-build');
    assetsPath = path.join(app.getPath('userData'), 'frontend', 'assets');
  } else {
    webBuildPath = path.join(__dirname, 'web-build');
    assetsPath = path.join(__dirname, 'assets');
  }

  console.log('APP_DIR', webBuildPath);
  console.log('ASSETS_DIR', assetsPath);

  serverApp.use((req, res, next) => {
    const rawPath = req.url;
    const normalizedPath = path.normalize(req.url);
    const resolvedPath = path.resolve(webBuildPath, rawPath.replace(/^\//, ''));
    
    console.log('Path Resolution:', {
      rawUrl: rawPath,
      normalizedPath,
      resolvedPath,
      webBuildPath,
      exists: fs.existsSync(resolvedPath),
    });
    
    next();
  });

  serverApp.use('/assets', express.static(assetsPath));

  serverApp.use(express.static(webBuildPath));

  serverApp.use((req, res, next) => {
    const requestedPath = path.join(webBuildPath, req.url);
    const assetPath = path.join(assetsPath, req.url.replace('/assets', ''));
    const fileExistsInWebBuild = fs.existsSync(requestedPath);
    const fileExistsInAssets = fs.existsSync(assetPath);

    console.log('404 Debug Info:', {
      url: req.url,
      method: req.method,
      lookingIn: req.url.startsWith('/assets') ? assetsPath : webBuildPath,
      tryingToAccess: req.url.startsWith('/assets') ? assetPath : requestedPath,
      fileExists: fileExistsInWebBuild || fileExistsInAssets,
      isDirectory: (fileExistsInWebBuild || fileExistsInAssets)
        ? fs.statSync(req.url.startsWith('/assets') ? assetPath : requestedPath).isDirectory()
        : false,
      headers: req.headers,
      body: req.body,
    });

    if (!fileExistsInWebBuild && !fileExistsInAssets) {
      res.status(404).json({
        error: 'Not Found',
        message: `Resource not found: ${req.url}`,
        searchedLocation: req.url.startsWith('/assets') ? assetPath : requestedPath,
        fileExists: fileExistsInWebBuild || fileExistsInAssets,
      });
    } else {
      next();
    }
  });

  serverApp.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  });

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