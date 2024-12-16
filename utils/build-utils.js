const { app, ipcMain } = require('electron');
const { execFile, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const { logMessage } = require("./message-utils");
const fs = require('fs');
const fsExtra = require('fs-extra');
const asar = require('asar');

function getRustPath() {
    if (os.platform() === 'win32') {
        return process.env.USERPROFILE + '\\.cargo\\bin';
    } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
        return path.join(os.homedir(), '.cargo', 'bin'); 
    }
    return ''; 
}

ipcMain.handle('start-backend', async (event) => {
  try {
    const targetDir = path.join(app.getPath('userData'), 'backend');

    logMessage("start-backend", "Identified path", targetDir);
    
    const env = { ...process.env, PATH: `${getRustPath()}:${process.env.PATH}` };
    const cargoProcess = spawn('cargo', ['run', '--release'], { 
      cwd: targetDir,
      env: env 
    });

    app.on('before-quit', () => {
      if (cargoProcess) {
        console.log("erminating cargo process...", cargoProcess.kill('SIGTERM'));
      }
    });

    let output = '';
    let url = null;

    cargoProcess.stdout.on('data', (data) => {
      logMessage("start-backend", data.toString());
      output += data.toString();
      const match = output.match(/https?:\/\/[^\s]+/);
      if (match && !url) {
        url = match[0];
        logMessage("start-backend", "Identified backend URL", url);
        event.sender.send('cargo-url', { url });
      }
    });

    cargoProcess.stderr.on('data', (data) => {
      output += data.toString();
      logMessage("start-backend", data.toString());
    });

    cargoProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Cargo process exited with code ${code}`);
        event.sender.send('cargo-err', code);
      }
    });

    return { success: true, message: 'Cargo process running in the background.' };

  } catch (error) {
    console.error(error);
    logMessage("start-backend", error);
    return { success: false, error: error.message };
  }
});

function isRunningInAsar() {
    return app.getAppPath().includes(".asar");
}

function cloneModule(mod) {
    const appPath = app.getAppPath();
    const sourcePath = path.resolve(path.join(appPath, 'node_modules', mod));
    const destPath = path.resolve(path.join(appPath, '..', 'resources', 'node_modules', mod));

    logMessage('npm-package-project', 'Are we in ASAR?', isRunningInAsar());
    
    try {
        if (isRunningInAsar()) {
            const tempDir = path.join(appPath, '..', 'resources', 'temp');
            fs.mkdirSync(tempDir, { recursive: true });

            asar.extractAll(appPath, tempDir);
            const extractedModulePath = path.join(tempDir, 'node_modules', mod);

            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            copySync(extractedModulePath, destPath);
        } else {
            fs.accessSync(sourcePath, fs.constants.F_OK);
            fs.mkdirSync(destPath, { recursive: true });
            copySync(sourcePath, destPath);
        }

        return destPath;
    } catch (err) {
        console.error(`Error cloning module: ${err.message}`);
        throw err;
    }
}

function copySync(source, destination) {
    logMessage('npm-package-project', 'Cloning', source, 'to', destination);
    const stats = fs.statSync(source);

    if (stats.isDirectory()) {
        fs.mkdirSync(destination, { recursive: true });

        const files = fs.readdirSync(source);
        files.forEach((file) => {
            const currentSource = path.join(source, file);
            const currentDestination = path.join(destination, file);
            copySync(currentSource, currentDestination);
        });
    } else if (stats.isFile()) {
        fs.copyFileSync(source, destination);
    }
}


ipcMain.handle('npm-package-project', async (event, projectPath) => {
    try {
        projectPath = path.join(app.getPath('userData'), projectPath);

        const nodeBinaryPath = path.join(app.getAppPath(), 'node_modules', 'node', 'bin', 'node');
        logMessage('npm-package-project', 'Using node from:', nodeBinaryPath);

        logMessage('npm-package-project', 'Cloning npm binaries');
        const npmBinaryPath = path.join(cloneModule('npm'), 'bin', 'npm-cli.js');
        logMessage('npm-package-project', 'Using npm from: ', npmBinaryPath);

        const execProcess = (binary, args, cwd) => {
            return new Promise((resolve, reject) => {
                const child = execFile(binary, args, {
                    cwd,
                    env: process.env,
                });

                let output = '';

                child.stdout.on('data', (data) => {
                    const message = data.toString();
                    output += message;
                    logMessage("npm-package-project", message);
                });

                child.stderr.on('data', (data) => {
                    const message = data.toString();
                    output += message;
                    logMessage("npm-package-project", message);
                });

                child.on('close', (code) => {
                    if (code !== 0) {
                        reject({ success: false, error: `Process exited with code ${code}` });
                    } else {
                        resolve({ success: true });
                    }
                });

                child.on('error', (error) => {
                    reject({ success: false, error: error.message });
                });
            });
        };

        logMessage("npm-package-project", "Starting npm install...");
        const installResult = await execProcess(nodeBinaryPath, [npmBinaryPath, 'install', '--loglevel', 'verbose'], projectPath);
        if (!installResult.success) {
            throw new Error(`npm install failed: ${installResult.error}`);
        }

        logMessage("npm-package-project", "Starting npm run package...");
        const packageResult = await execProcess(nodeBinaryPath, [npmBinaryPath, 'run', 'simple-package'], projectPath);
        if (!packageResult.success) {
            throw new Error(`npm run package failed: ${packageResult.error}`);
        }

        logMessage("npm-package-project", "Running separateAssets.js...");
        const separateAssetsPath = path.join(projectPath, 'separateAssets.js');
        const separateAssetsResult = await execProcess(nodeBinaryPath, [separateAssetsPath], projectPath);
        if (!separateAssetsResult.success) {
            throw new Error(`Running separateAssets.js failed: ${separateAssetsResult.error}`);
        }

        return {
            success: true,
            message: 'Project successfully installed, packaged, and assets separated',
        };
    } catch (error) {
        console.error(error);
        logMessage("npm-package-project", "Process failed:", JSON.stringify(error, null, 2));
        return {
            success: false,
            error: error.message || error,
        };
    }
});
