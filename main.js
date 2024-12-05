const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const process = require('process');
const { isMusl } = require('detect-libc');
const express = require('express');
const portfinder = require('portfinder');
const { exec, execSync, spawn } = require('child_process');
const fs = require('fs');
const https = require('https');
const simpleGit = require('simple-git');
const ts = require("typescript");
const { build } = require("vite");
const git = simpleGit();

const divineOfficeDir = path.join(os.homedir(), 'divine-office');
const repoURL = 'https://github.com/writedan/divine-office';

async function cloneOrPullRepo() {
  try {
    // Check if the directory exists
    const isRepo = await git.checkIsRepo(divineOfficeDir);
    
    if (isRepo) {
      console.log('Repository exists. Pulling the latest changes...');
      await git.cwd(divineOfficeDir);
      await git.pull('origin', 'main');
    } else {
      console.log('Repository does not exist. Cloning...');
      await git.clone(repoURL, divineOfficeDir);
    }

    console.log('Repository is up to date.');
  } catch (err) {
    console.error('Error during git clone or pull:', err);
  }
}

async function runCargoAndCapturePort() {
  try {
    // Change to the divine-office directory
    const cargoProcess = spawn('cargo', ['run', '--release'], { cwd: divineOfficeDir });
    
    let port = null;
    
    // Capture stdout to extract the port number
    cargoProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);

      // Assuming the port number is printed in the format "Listening on port <port>"
      const portMatch = output.match(/Listening on port (\d+)/);
      if (portMatch) {
        port = portMatch[1];
        console.log(`Captured port: ${port}`);
      }
    });

    // Capture stderr
    cargoProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    // Handle process exit
    cargoProcess.on('close', (code) => {
      if (code === 0 && port) {
        console.log(`Cargo finished successfully. Port: ${port}`);
        return port;
      } else {
        console.error('Cargo process failed or no port found.');
        return null;
      }
    });
  } catch (err) {
    console.error('Error running cargo:', err);
    return null;
  }
}

async function setupAndRun() {
  // Step 1: Clone or pull the repository
  await cloneOrPullRepo();

  // Step 2: Run cargo and capture the port number
  const port = await runCargoAndCapturePort();

  if (port) {
    console.log(`Application is running on port: ${port}`);
    return port;
  } else {
    console.error('Failed to retrieve the port number.');
    return null;
  }
}


function logMessage(...args) {
  console.log(...args);
  mainWindow.webContents.send('log-message', args.join(' '));
}

async function setupAndBuildProject() {
    const git = simpleGit();
    const repoURL = 'https://github.com/writedan/divine-office-frontend';

    try {
        // Check if the current directory is already a Git repository
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            logMessage("Initializing new Git repository...");
            await git.init(); // Initialize as a Git repository
            await git.addRemote('origin', repoURL); // Set the remote repository
            logMessage(`Repository initialized and linked to ${repoURL}.`);
        } else {
            logMessage("Directory is already a Git repository.");
        }

        // Run the build process
        logMessage("Starting the build process...");
        await buildProject();

        return { success: true };
    } catch (err) {
        logMessage("Error during setup or build:", err);
        return { success: false, error: err };
    }
};

ipcMain.handle('build-frontend', async () => {
  return await setupAndBuildProject();
});

ipcMain.handle('reboot-app', () => {
    logMessage("Rebooting the application...");
    app.relaunch(); 
    app.quit();
});

function buildTypeScript() {
    const configPath = ts.findConfigFile(
        "./",
        ts.sys.fileExists,
        "tsconfig.json"
    );
    if (!configPath) {
        throw new Error("Could not find tsconfig.json");
    }

    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedCommandLine = ts.parseJsonConfigFileContent(
        config.config,
        ts.sys,
        "./"
    );

    const program = ts.createProgram({
        rootNames: parsedCommandLine.fileNames,
        options: parsedCommandLine.options,
    });

    const emitResult = program.emit();
    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        logMessage(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    });

    if (emitResult.emitSkipped) {
        throw new Error("TypeScript compilation failed.");
    }

    logMessage("TypeScript build completed successfully.");
}

async function buildVite() {
    try {
        await build(); // This assumes your `vite.config.js` is in the root directory.
        logMessage("Vite build completed successfully.");
    } catch (err) {
        logMessage("Vite build failed:", err);
        throw err;
    }
}

async function buildProject() {
    try {
        logMessage("Building TypeScript...");
        buildTypeScript();

        logMessage("Building Vite...");
        await buildVite();

        logMessage("Build process completed successfully.");
    } catch (err) {
        logMessage("Build process failed:", err);
    }
}

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
    console.log('Saving', url, 'to', destinationPath);
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
    const command = `${installerPath}`;
    const args = ['-y'];
    const installer = spawn(command, args);

    installer.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      mainWindow.webContents.send('install-log', data.toString());
    });

    installer.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      mainWindow.webContents.send('install-log', data.toString());
    });

    installer.on('close', (code) => {
      if (code === 0) {
        resolve('Installation completed successfully.');
      } else {
        reject(new Error(`Installation failed with exit code ${code}.`));
      }
    });
  });
}


const makeAppleExecutable = (filePath) => {
  execSync(`xattr -d com.apple.quarantine ${filePath}`);
  fs.chmodSync(filePath, 0o755);
  return { success: true };
};

ipcMain.handle('install-cargo', async (event, targetTriple) => {
  try {
    const installerPath = path.join(os.tmpdir(), `rustup-init${process.platform === 'win32' ? '.exe' : ''}`);

    await downloadRustup(targetTriple, installerPath);

    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(installerPath, 0o755);
      } catch (err) {
        return { success: false, error: `Failed to set executable permissions: ${err.message}` };
      }
    }

    await installRustup(installerPath);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
});


let mainWindow;
let server;

app.on('ready', () => {
  const SERVER_PORT = setupAndRun();
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

app.disableHardwareAcceleration();