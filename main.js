const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const process = require('process');
const { isMusl } = require('detect-libc');
const express = require('express');
const portfinder = require('portfinder');
const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');


ipcMain.handle('rust-triple-target', async () => {
  const platform = process.platform;
  const arch = process.arch;

  let target = '';

  if (platform === 'win32') {
    const abi = process.env.RUST_COMPILER_ABI || 'msvc';
    target = `${arch === 'x64' ? 'x86_64' : arch}-pc-windows-${abi}`;
  } else if (platform === 'darwin') {
    target = `${arch === 'x64' ? 'x86_64' : arch}-apple-darwin`;
  } else if (platform === 'linux') {
    const libc = isMusl() ? 'musl' : 'gnu';
    target = `${arch === 'x64' ? 'x86_64' : arch}-unknown-linux-${libc}`;
  } else {
    target = 'unsupported-platform';
  }

  return target;
});

function isCargoInstalled() {
  return new Promise((resolve) => {
    exec('cargo --version', (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

ipcMain.handle('is-cargo-installed', async () => {
  return await isCargoInstalled();
});


function downloadRustup(targetTriple, destinationPath) {
  return new Promise((resolve, reject) => {
    const url = `https://static.rust-lang.org/rustup/dist/${targetTriple}/rustup-init${process.platform === 'win32' ? '.exe' : ''}`;
    const file = fs.createWriteStream(destinationPath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${url} (status code: ${response.statusCode})`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destinationPath, () => reject(err));
    });
  });
}

function installRustup(installerPath) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? `"${installerPath}"` : `sh "${installerPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Installation failed: ${stderr || stdout}`));
      } else {
        resolve(stdout);
      }
    });
  });
};

ipcMain.handle('install-cargo', async (targetTriple) => {
  try {
    const installerPath = path.join(os.tmpdir(), `rustup-init${process.platform === 'win32' ? '.exe' : ''}`);

    await downloadRustup(targetTriple, installerPath);

    if (process.platform !== 'win32') {
      fs.chmodSync(installerPath, '755');
    }

    await installRustup(installerPath);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


let mainWindow;
let server;

app.on('ready', () => {
  const serverApp = express();

  serverApp.use(express.static(path.join(__dirname, 'dist')));

  portfinder.getPortPromise().then((port) => {
    server = serverApp.listen(port, () => {
      console.log(`Server started at http://localhost:${port}`);
      
      mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true, 
        },
      });

      mainWindow.loadURL(`http://localhost:${port}`);
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