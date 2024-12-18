const { app, ipcMain } = require('electron');
const { execFile, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const { logMessage } = require("./message-utils");
const fs = require('fs');
const fsExtra = require('fs-extra');
const asar = require('asar');
const { getDefaultBinaryPaths } = require("./npm-utils");

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
    const cargoProcess = spawn(path.join(getRustPath(), 'cargo'), ['run', '--release'], { 
      cwd: targetDir,
      env: env 
    });

    app.on('before-quit', () => {
      if (cargoProcess) {
        console.log("Cargo kill success:", cargoProcess.kill('SIGTERM'));
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

// this originally tried to clone modules out of the ASAR archive but we got nowhere
// you MUST declare modules you need to "clone" in packages.json under "build.asarUnpack"
function cloneModule(mod) {
    const appPath = app.getAppPath();
    const sourcePath = path.resolve(path.join(appPath, 'node_modules', mod));
    if (isRunningInAsar()) {
        return path.join(appPath, '..', 'app.asar.unpacked', 'node_modules', mod);
    } else {
        return sourcePath;
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

function execCmd(command, args, cwd) { 
    return new Promise((resolve, reject) => {
        logMessage('npm-package-project', 'Running', command, args.join(' '), 'at', path.resolve(cwd));

        const npmBinary = path.dirname(getDefaultBinaryPaths().npm[0]);
        const nodeBinary = path.dirname(getDefaultBinaryPaths().node[0]);
        const env = { ...process.env, PATH: `${npmBinary}${path.delimiter}${nodeBinary}${path.delimiter}${process.env.PATH}` };

        const exec = spawn(`"${command}"`, args, { shell: true, cwd , env});

        exec.stdout.on('data', (data) => {
            logMessage('npm-package-project', String(data));
        });

        exec.stderr.on('data', (data) => {
            logMessage('npm-package-project', String(data));
        });

        exec.on('error', (err) => {
            reject(new Error(`Spawn process failed: ${err.message}`));
        });

        exec.on('close', (code) => {
            if (code === 0) {
                resolve('Execution completed successfully.');
            } else {
                reject(new Error(`Execution failed with exit code ${code}.`));
            }
        });
    });
}


ipcMain.handle('npm-package-project', async (event, projectPath) => {
    try {
        projectPath = path.join(app.getPath('userData'), projectPath);
        logMessage("npm-package-project", "Starting npm install...");
        const installResult = await execCmd(getDefaultBinaryPaths().npm[0], ['install', '--loglevel', 'verbose'], projectPath);

        logMessage("npm-package-project", "Starting npm run package...");
        const packageResult = await execCmd(getDefaultBinaryPaths().npm[0], ['run', 'simple-package'], projectPath);

        logMessage("npm-package-project", "Running separateAssets.js...");
        const separateAssetsPath = path.join(projectPath, 'separateAssets.js');
        const separateAssetsResult = await execCmd(getDefaultBinaryPaths().node[0], [separateAssetsPath], projectPath);

        return {
            success: true,
            message: 'Project successfully installed, packaged, and assets separated',
        };
    } catch (error) {
        console.error(error);
        logMessage("npm-package-project", "Process failed:", JSON.stringify(error, null, 2));
        return {
            success: false,
            error
        };
    }
});